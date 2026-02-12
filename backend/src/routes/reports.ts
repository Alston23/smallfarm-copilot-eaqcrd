import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq, gte, lte } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface ExportReportBody {
  reportType: string;
  format: 'csv' | 'pdf';
  dateRange?: { start: string; end: string };
}

interface ReportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}

// Helper function to generate CSV content
function generateCSV(data: any[], headers: string[]): string {
  // Add headers
  const csvLines = [headers.join(',')];

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header.toLowerCase().replace(/_/g, '')];
      // Escape quotes and wrap in quotes if contains comma
      const strValue = String(value || '');
      return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

// Helper function to generate simple PDF (using base64 encoded content)
function generatePDFBase64(title: string, content: string): string {
  // Simple PDF generation - in production would use a proper library like pdfkit
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${content.length + title.length + 100} >>
stream
BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -20 Td
(${content.substring(0, 500)}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000500 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
600
%%EOF`;

  return Buffer.from(pdfContent).toString('base64');
}

// Helper to create signed URL (mock - in production would use actual signed URLs)
function generateSignedUrl(filename: string): { url: string; expiresAt: Date } {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const url = `https://storage.example.com/reports/${filename}?expires=${expiresAt.getTime()}`;
  return { url, expiresAt };
}

export function registerReportRoutes(app: App): void {
  const requireAuth = app.requireAuth();

  // POST /api/reports/export - Generate and export a report
  app.fastify.post<{ Body: ExportReportBody }>(
    '/api/reports/export',
    async (request: FastifyRequest<{ Body: ExportReportBody }>, reply: FastifyReply) => {
      const { reportType, format, dateRange } = request.body;

      app.logger.info({ reportType, format }, 'Generating report export');

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        let csvData: any[] = [];
        let headers: string[] = [];
        let reportContent = '';
        let filename = '';

        // Determine report type and gather data
        switch (reportType) {
          case 'harvest': {
            const harvests = await app.db.query.harvests.findMany({
              where: eq(schema.harvests.userId, session.user.id),
              with: { crop: true, fieldBedCrop: { with: { fieldBed: true } } },
            });

            csvData = harvests.map((h) => ({
              id: h.id,
              crop_name: h.crop.name,
              field_bed: h.fieldBedCrop.fieldBed.name,
              harvest_amount: h.harvestAmount,
              harvest_unit: h.harvestUnit,
              yield_percentage: h.yieldPercentage,
              harvest_date: h.harvestDate.toISOString().split('T')[0],
              notes: h.notes || '',
            }));

            headers = ['ID', 'Crop Name', 'Field Bed', 'Harvest Amount', 'Harvest Unit', 'Yield %', 'Harvest Date', 'Notes'];
            reportContent = `Harvest Report\n\nTotal Harvests: ${harvests.length}\n\n${harvests
              .map((h) => `${h.crop.name} - ${h.harvestAmount} ${h.harvestUnit}`)
              .join('\n')}`;
            filename = `harvest-report-${new Date().toISOString().split('T')[0]}.${format}`;
            break;
          }

          case 'inventory': {
            const items = await app.db.query.inventory.findMany({
              where: eq(schema.inventory.userId, session.user.id),
            });

            csvData = items.map((i) => ({
              id: i.id,
              name: i.name,
              category: i.category,
              subcategory: i.subcategory || '',
              quantity: i.quantity,
              unit: i.unit,
              reorder_level: i.reorderLevel || '',
              notes: i.notes || '',
            }));

            headers = ['ID', 'Name', 'Category', 'Subcategory', 'Quantity', 'Unit', 'Reorder Level', 'Notes'];
            reportContent = `Inventory Report\n\nTotal Items: ${items.length}\n\n${items
              .map((i) => `${i.name} (${i.category}): ${i.quantity} ${i.unit}`)
              .join('\n')}`;
            filename = `inventory-report-${new Date().toISOString().split('T')[0]}.${format}`;
            break;
          }

          case 'financial-transactions': {
            const transactions = await app.db.query.financialTransactions.findMany({
              where: eq(schema.financialTransactions.userId, session.user.id),
              with: { fieldBedCrop: { with: { crop: true } } },
            });

            csvData = transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              description: t.description,
              crop_name: t.fieldBedCrop ? (t.fieldBedCrop as any).crop?.name || 'N/A' : 'N/A',
              transaction_date: t.transactionDate.toISOString().split('T')[0],
            }));

            headers = ['ID', 'Type', 'Amount', 'Description', 'Crop Name', 'Transaction Date'];
            const totalCosts = transactions
              .filter((t) => t.type === 'cost')
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const totalRevenue = transactions
              .filter((t) => t.type === 'revenue')
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            reportContent = `Financial Report\n\nTotal Costs: $${totalCosts.toFixed(2)}\nTotal Revenue: $${totalRevenue.toFixed(2)}\nNet: $${(totalRevenue - totalCosts).toFixed(2)}`;
            filename = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
            break;
          }

          case 'equipment': {
            const equipmentList = await app.db.query.equipment.findMany({
              where: eq(schema.equipment.userId, session.user.id),
            });

            csvData = equipmentList.map((e) => ({
              id: e.id,
              equipment_type: e.equipmentType,
              make: e.make,
              model: e.model,
              hours: e.hours || '',
              last_service: e.lastServiceDate ? e.lastServiceDate.toISOString().split('T')[0] : '',
              next_service: e.nextServiceDate ? e.nextServiceDate.toISOString().split('T')[0] : '',
            }));

            headers = ['ID', 'Equipment Type', 'Make', 'Model', 'Hours', 'Last Service', 'Next Service'];
            reportContent = `Equipment Report\n\nTotal Equipment: ${equipmentList.length}\n\n${equipmentList
              .map((e) => `${e.make} ${e.model} (${e.equipmentType})`)
              .join('\n')}`;
            filename = `equipment-report-${new Date().toISOString().split('T')[0]}.${format}`;
            break;
          }

          case 'schedules': {
            const schedules = await app.db.query.schedules.findMany({
              where: eq(schema.schedules.userId, session.user.id),
              with: { fieldBedCrop: { with: { crop: true, fieldBed: true } } },
            });

            csvData = schedules.map((s) => ({
              id: s.id,
              task_type: s.taskType,
              crop_name: s.fieldBedCrop.crop.name,
              field_bed: s.fieldBedCrop.fieldBed.name,
              due_date: s.dueDate.toISOString().split('T')[0],
              completed: s.completed ? 'Yes' : 'No',
              priority: s.weatherPriority || 'N/A',
            }));

            headers = ['ID', 'Task Type', 'Crop Name', 'Field Bed', 'Due Date', 'Completed', 'Priority'];
            const completed = schedules.filter((s) => s.completed).length;
            reportContent = `Schedule Report\n\nTotal Tasks: ${schedules.length}\nCompleted: ${completed}\nPending: ${schedules.length - completed}`;
            filename = `schedules-report-${new Date().toISOString().split('T')[0]}.${format}`;
            break;
          }

          default:
            app.logger.warn({ reportType }, 'Unknown report type');
            return reply.status(400).send({ error: `Unknown report type: ${reportType}` });
        }

        // Generate content based on format
        let content: string;
        if (format === 'csv') {
          content = generateCSV(csvData, headers);
        } else {
          // For PDF, create base64 encoded content
          content = generatePDFBase64(`${reportType} Report`, reportContent);
        }

        // Generate signed URL
        const { url: downloadUrl, expiresAt } = generateSignedUrl(filename);

        // In production, would save file to storage service here
        app.logger.info(
          { reportType, format, filename },
          'Report export generated successfully'
        );

        const response: ReportResponse = {
          downloadUrl,
          filename,
          expiresAt: expiresAt.toISOString(),
        };

        return response;
      } catch (error) {
        app.logger.error({ err: error, reportType, format }, 'Failed to generate report export');
        throw error;
      }
    }
  );
}
