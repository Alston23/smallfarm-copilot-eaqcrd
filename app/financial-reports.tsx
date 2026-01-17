
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

const FINANCIAL_REPORTS: ReportItem[] = [
  // Income Reports
  {
    id: 'income-summary',
    title: 'Income Summary',
    description: 'Overview of all income sources and revenue streams',
    icon: 'attach-money',
    category: 'Income',
  },
  {
    id: 'sales-by-crop',
    title: 'Sales by Crop',
    description: 'Breakdown of revenue by crop type',
    icon: 'local-florist',
    category: 'Income',
  },
  {
    id: 'sales-by-outlet',
    title: 'Sales by Outlet',
    description: 'Revenue analysis by sales channel (farmers market, CSA, etc.)',
    icon: 'store',
    category: 'Income',
  },
  {
    id: 'customer-revenue',
    title: 'Customer Revenue',
    description: 'Top customers and revenue by customer',
    icon: 'people',
    category: 'Income',
  },
  {
    id: 'seasonal-income',
    title: 'Seasonal Income',
    description: 'Income trends across seasons and months',
    icon: 'calendar-today',
    category: 'Income',
  },
  
  // Expense Reports
  {
    id: 'expense-summary',
    title: 'Expense Summary',
    description: 'Overview of all expenses and spending categories',
    icon: 'receipt',
    category: 'Expenses',
  },
  {
    id: 'expense-by-category',
    title: 'Expenses by Category',
    description: 'Breakdown of spending by category (seeds, labor, equipment, etc.)',
    icon: 'category',
    category: 'Expenses',
  },
  {
    id: 'labor-costs',
    title: 'Labor Costs',
    description: 'Analysis of labor expenses and hourly rates',
    icon: 'work',
    category: 'Expenses',
  },
  {
    id: 'input-costs',
    title: 'Input Costs',
    description: 'Seeds, fertilizer, and other input expenses',
    icon: 'grass',
    category: 'Expenses',
  },
  {
    id: 'equipment-costs',
    title: 'Equipment & Maintenance',
    description: 'Equipment purchases, repairs, and maintenance costs',
    icon: 'build',
    category: 'Expenses',
  },
  {
    id: 'utilities-overhead',
    title: 'Utilities & Overhead',
    description: 'Water, electricity, insurance, and other overhead costs',
    icon: 'home',
    category: 'Expenses',
  },
  
  // Profitability Reports
  {
    id: 'profit-loss',
    title: 'Profit & Loss Statement',
    description: 'Comprehensive P&L statement with income and expenses',
    icon: 'assessment',
    category: 'Profitability',
  },
  {
    id: 'profit-by-crop',
    title: 'Profit by Crop',
    description: 'Net profit analysis for each crop type',
    icon: 'trending-up',
    category: 'Profitability',
  },
  {
    id: 'profit-margins',
    title: 'Profit Margins',
    description: 'Gross and net profit margin analysis',
    icon: 'percent',
    category: 'Profitability',
  },
  {
    id: 'roi-analysis',
    title: 'Return on Investment',
    description: 'ROI for crops, equipment, and infrastructure investments',
    icon: 'show-chart',
    category: 'Profitability',
  },
  {
    id: 'break-even',
    title: 'Break-Even Analysis',
    description: 'Break-even points for crops and overall operations',
    icon: 'balance',
    category: 'Profitability',
  },
  
  // Cash Flow Reports
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    description: 'Cash inflows and outflows over time',
    icon: 'account-balance',
    category: 'Cash Flow',
  },
  {
    id: 'cash-forecast',
    title: 'Cash Flow Forecast',
    description: 'Projected cash flow for upcoming months',
    icon: 'timeline',
    category: 'Cash Flow',
  },
  {
    id: 'accounts-receivable',
    title: 'Accounts Receivable',
    description: 'Outstanding payments and aging report',
    icon: 'payment',
    category: 'Cash Flow',
  },
  {
    id: 'accounts-payable',
    title: 'Accounts Payable',
    description: 'Bills due and payment schedule',
    icon: 'credit-card',
    category: 'Cash Flow',
  },
  
  // Production Reports
  {
    id: 'yield-per-crop',
    title: 'Yield per Crop',
    description: 'Track harvest amounts and yield percentages for each crop',
    icon: 'agriculture',
    category: 'Production',
  },
  {
    id: 'yield-revenue',
    title: 'Yield vs Revenue',
    description: 'Crop yields compared to revenue generated',
    icon: 'agriculture',
    category: 'Production',
  },
  {
    id: 'cost-per-unit',
    title: 'Cost per Unit',
    description: 'Production cost per pound/unit for each crop',
    icon: 'calculate',
    category: 'Production',
  },
  {
    id: 'field-profitability',
    title: 'Field Profitability',
    description: 'Profit analysis by field or growing area',
    icon: 'map',
    category: 'Production',
  },
  
  // Tax & Compliance Reports
  {
    id: 'tax-summary',
    title: 'Tax Summary',
    description: 'Annual tax summary and deductible expenses',
    icon: 'description',
    category: 'Tax & Compliance',
  },
  {
    id: 'quarterly-taxes',
    title: 'Quarterly Tax Estimates',
    description: 'Estimated quarterly tax payments',
    icon: 'event',
    category: 'Tax & Compliance',
  },
  {
    id: 'depreciation',
    title: 'Depreciation Schedule',
    description: 'Asset depreciation for tax purposes',
    icon: 'trending-down',
    category: 'Tax & Compliance',
  },
  {
    id: 'mileage-log',
    title: 'Mileage Log',
    description: 'Vehicle mileage for tax deductions',
    icon: 'directions-car',
    category: 'Tax & Compliance',
  },
  
  // Comparative Reports
  {
    id: 'year-over-year',
    title: 'Year-over-Year Comparison',
    description: 'Compare financial performance across years',
    icon: 'compare-arrows',
    category: 'Comparative',
  },
  {
    id: 'budget-vs-actual',
    title: 'Budget vs Actual',
    description: 'Compare budgeted amounts to actual spending',
    icon: 'fact-check',
    category: 'Comparative',
  },
  {
    id: 'benchmark-report',
    title: 'Industry Benchmarks',
    description: 'Compare your farm to industry averages',
    icon: 'leaderboard',
    category: 'Comparative',
  },
  
  // Custom Reports
  {
    id: 'custom-date-range',
    title: 'Custom Date Range Report',
    description: 'Generate reports for any custom date range',
    icon: 'date-range',
    category: 'Custom',
  },
  {
    id: 'export-data',
    title: 'Export Financial Data',
    description: 'Export data to CSV or PDF for external analysis',
    icon: 'download',
    category: 'Custom',
  },
];

export default function FinancialReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();
  const [exporting, setExporting] = useState(false);

  // Group reports by category
  const categories = Array.from(new Set(FINANCIAL_REPORTS.map(r => r.category)));

  const handleReportPress = (report: ReportItem) => {
    console.log('User tapped report:', report.title);
    
    // Navigate to specific report screens
    if (report.id === 'yield-per-crop') {
      router.push('/yield-chart');
      return;
    }
    
    // Show export options
    Alert.alert(
      report.title,
      'Export this report',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export as CSV', onPress: () => exportReport(report.id, 'csv') },
        { text: 'Export as PDF', onPress: () => exportReport(report.id, 'pdf') },
      ]
    );
  };

  const exportReport = async (reportType: string, format: 'csv' | 'pdf') => {
    console.log(`User exporting ${reportType} as ${format}`);
    setExporting(true);
    
    try {
      // Map report IDs to backend report types
      const reportTypeMap: { [key: string]: string } = {
        'yield-per-crop': 'harvest',
        'expense-summary': 'financial-transactions',
        'income-summary': 'financial-transactions',
        'profit-loss': 'financial-transactions',
        'equipment-costs': 'equipment',
      };

      const backendReportType = reportTypeMap[reportType] || 'inventory';

      // Generate and export the report
      const response = await fetch(`${BACKEND_URL}/api/reports/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: backendReportType,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const { downloadUrl, filename } = await response.json();
      console.log('Report generated:', filename);

      // Download and share the file
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status === 200) {
        console.log('Report downloaded to:', downloadResult.uri);
        
        // Share the file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Success', `Report saved to ${downloadResult.uri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Financial Reports',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Available Reports
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Select a report to view detailed financial insights
            </Text>
          </View>

          {exporting && (
            <View style={[styles.exportingBanner, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={farmGreen} />
              <Text style={[styles.exportingText, { color: colors.text }]}>
                Generating report...
              </Text>
            </View>
          )}

          {categories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: farmGreen }]}>
                {category}
              </Text>
              
              {FINANCIAL_REPORTS.filter(r => r.category === category).map((report, reportIndex) => (
                <TouchableOpacity
                  key={reportIndex}
                  style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleReportPress(report)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: farmGreen + '20' }]}>
                    <IconSymbol
                      ios_icon_name="doc.text.fill"
                      android_material_icon_name={report.icon}
                      size={24}
                      color={farmGreen}
                    />
                  </View>
                  
                  <View style={styles.reportContent}>
                    <Text style={[styles.reportTitle, { color: colors.text }]}>
                      {report.title}
                    </Text>
                    <Text style={[styles.reportDescription, { color: colors.icon }]}>
                      {report.description}
                    </Text>
                  </View>
                  
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              More reports coming soon! Contact support if you need a specific report type.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingLeft: 4,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  exportingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  exportingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
