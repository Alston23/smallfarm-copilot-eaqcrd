import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import { eq } from 'drizzle-orm';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

interface CreateCustomCropBody {
  name: string;
  category: 'vegetables' | 'fruits' | 'herbs' | 'flowers';
}

const cropDetailSchema = z.object({
  rowSpacing: z.string().optional(),
  plantSpacing: z.string().optional(),
  soilPh: z.string().optional(),
  daysToMaturity: z.number().optional(),
  plantingDepth: z.string().optional(),
  sunRequirement: z.string().optional(),
  waterRequirement: z.string().optional(),
  commonPests: z.string().optional(),
  commonDiseases: z.string().optional(),
  fertilizerSchedule: z.string().optional(),
  harvestTips: z.string().optional(),
});

type CropDetail = z.infer<typeof cropDetailSchema>;

// Comprehensive crop database
const SYSTEM_CROPS = [
  // Vegetables (75+)
  { name: 'Tomato', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-6.8', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Hornworms, Whiteflies, Aphids', commonDiseases: 'Early Blight, Late Blight', fertilizerSchedule: 'Every 2-3 weeks with balanced fertilizer', harvestTips: 'Pick when fully colored but still slightly soft' },
  { name: 'Pepper', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-6.8', daysToMaturity: 60, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Aphids, Spider Mites, Thrips', commonDiseases: 'Bacterial Spot', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Harvest when peppers reach desired color' },
  { name: 'Lettuce', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 45, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Slugs, Aphids, Leaf Miners', commonDiseases: 'Powdery Mildew, Downy Mildew', fertilizerSchedule: 'Every 3-4 weeks with nitrogen-rich', harvestTips: 'Harvest outer leaves regularly or cut entire head' },
  { name: 'Carrot', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '2-3', soilPh: '6.0-6.8', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Rust Flies, Carrot Weevils', commonDiseases: 'Cavity Spot, Cercospora Leaf Spot', fertilizerSchedule: 'Monthly with balanced fertilizer', harvestTips: 'Pull when shoulders are 1/2 inch diameter' },
  { name: 'Broccoli', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Loopers', commonDiseases: 'Clubroot, Black Rot', fertilizerSchedule: 'Every 2-3 weeks with nitrogen', harvestTips: 'Cut central head when tight, side shoots follow' },
  { name: 'Cauliflower', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.5', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cabbage Worms, Cabbage Moths', commonDiseases: 'Clubroot, Downy Mildew', fertilizerSchedule: 'Every 2-3 weeks with nitrogen', harvestTips: 'Cut head when curds are tight and white' },
  { name: 'Cabbage', category: 'vegetables', rowSpacing: '18-30', plantSpacing: '12-24', soilPh: '6.0-7.5', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Cabbage Loopers', commonDiseases: 'Clubroot, Black Rot', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Cut when head is firm and dense' },
  { name: 'Kale', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Harlequin Bugs', commonDiseases: 'Powdery Mildew, Downy Mildew', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest outer leaves, plant continues producing' },
  { name: 'Spinach', category: 'vegetables', rowSpacing: '8-12', plantSpacing: '4-6', soilPh: '6.5-7.0', daysToMaturity: 40, plantingDepth: '1/2', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Aphids, Flea Beetles, Leaf Miners', commonDiseases: 'Downy Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest when leaves are 3-6 inches' },
  { name: 'Swiss Chard', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.5', daysToMaturity: 50, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Leaf Miners, Slugs', commonDiseases: 'Cercospora Leaf Spot', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Harvest outer leaves, plant continues growing' },
  { name: 'Beet', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '2-3', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Leaf Miners', commonDiseases: 'Cercospora Leaf Spot', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Pull when roots are 1.5-2 inches diameter' },
  { name: 'Radish', category: 'vegetables', rowSpacing: '6-8', plantSpacing: '1-2', soilPh: '6.0-7.0', daysToMaturity: 25, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Root Maggots', commonDiseases: 'White Rust', fertilizerSchedule: 'Light fertilization only', harvestTips: 'Pull when 1/2 inch diameter for tender texture' },
  { name: 'Turnip', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '3-6', soilPh: '6.0-7.5', daysToMaturity: 50, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Root Maggots', commonDiseases: 'Clubroot, White Rust', fertilizerSchedule: 'Every 4 weeks', harvestTips: 'Pull when 2-3 inches diameter' },
  { name: 'Onion', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Onion Maggots, Thrips', commonDiseases: 'Pink Root, Fusarium Rot', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest when tops die back and dry' },
  { name: 'Garlic', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 210, plantingDepth: '2', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Onion Maggots, Thrips', commonDiseases: 'Fusarium Rot, White Rot', fertilizerSchedule: 'Spring application with nitrogen', harvestTips: 'Harvest when tops dry down completely' },
  { name: 'Leek', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Onion Maggots, Thrips', commonDiseases: 'Fusarium Rot, Pink Root', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest when shaft is 1+ inch diameter' },
  { name: 'Potato', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '12-16', soilPh: '5.0-6.5', daysToMaturity: 70, plantingDepth: '4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Colorado Beetles, Aphids', commonDiseases: 'Late Blight, Early Blight', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Harvest when plants die back' },
  { name: 'Sweet Potato', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '12-18', soilPh: '5.8-6.2', daysToMaturity: 100, plantingDepth: '1-2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Sweet Potato Weevils, Wireworms', commonDiseases: 'Black Rot, Fusarium Rot', fertilizerSchedule: 'Every 4-6 weeks', harvestTips: 'Harvest before first hard frost' },
  { name: 'Squash', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-7.0', daysToMaturity: 50, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Squash Bugs, Vine Borers', commonDiseases: 'Powdery Mildew, Squash Vine Blight', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when skin is hard and glossy' },
  { name: 'Zucchini', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-7.0', daysToMaturity: 45, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Squash Bugs, Vine Borers', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 2-3 weeks with nitrogen', harvestTips: 'Harvest at 6-8 inches for best tenderness' },
  { name: 'Cucumber', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '12-24', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cucumber Beetles, Squash Bugs', commonDiseases: 'Powdery Mildew, Angular Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Pick when 6-8 inches and green' },
  { name: 'Pumpkin', category: 'vegetables', rowSpacing: '48-60', plantSpacing: '36-48', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Squash Bugs, Vine Borers', commonDiseases: 'Powdery Mildew, Phytophthora Rot', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when skin is hard and color is deep' },
  { name: 'Watermelon', category: 'vegetables', rowSpacing: '48-60', plantSpacing: '24-36', soilPh: '5.5-7.0', daysToMaturity: 80, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cucumber Beetles, Squash Bugs', commonDiseases: 'Powdery Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when hollow-sounding and dull color' },
  { name: 'Melon', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-7.0', daysToMaturity: 85, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cucumber Beetles, Spider Mites', commonDiseases: 'Powdery Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when fully netted and fragrant' },
  { name: 'Eggplant', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-6.8', daysToMaturity: 70, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Spider Mites', commonDiseases: 'Verticillium Wilt, Phytophthora', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when skin is glossy and firm' },
  { name: 'Okra', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '12-18', soilPh: '6.0-6.8', daysToMaturity: 55, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Aphids', commonDiseases: 'Powdery Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Pick pods when 3-4 inches for tenderness' },
  { name: 'Asparagus', category: 'vegetables', rowSpacing: '36-48', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '6-8', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Asparagus Beetles, Grasshoppers', commonDiseases: 'Rust, Fusarium Decline', fertilizerSchedule: 'Spring application with nitrogen', harvestTips: 'Harvest spears when 6-8 inches tall' },
  { name: 'Artichoke', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Plume Moths, Aphids', commonDiseases: 'Verticillium Wilt, Botrytis', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Cut main bud before scales open' },
  { name: 'Celery', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Celery Flies, Slugs', commonDiseases: 'Early Blight, Septoria Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with nitrogen', harvestTips: 'Harvest outer stalks or entire plant' },
  { name: 'Pea', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '2-3', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Pea Weevils, Aphids', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Light nitrogen, let nitrogen-fixing work', harvestTips: 'Pick pods when peas are tender' },
  { name: 'Bean', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Bean Beetles, Aphids', commonDiseases: 'Bacterial Blight, Rust', fertilizerSchedule: 'Light nitrogen, let nitrogen-fixing work', harvestTips: 'Pick pods when young and tender' },
  { name: 'Corn', category: 'vegetables', rowSpacing: '30-36', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1-2', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Corn Borers, Aphids', commonDiseases: 'Corn Leaf Blight, Rust', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest when silk is brown and kernels are milky' },
  { name: 'Kale Varieties', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 55, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Harlequin Bugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest outer leaves as plant grows' },
  { name: 'Brussels Sprouts', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.5', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Loopers', commonDiseases: 'Clubroot, Black Rot', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest when sprouts are 1-1.5 inches diameter' },
  { name: 'Collard', category: 'vegetables', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.5', daysToMaturity: 65, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Harlequin Bugs', commonDiseases: 'Downy Mildew, Clubroot', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest outer leaves as plant grows' },
  { name: 'Mustard Greens', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.5', daysToMaturity: 40, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Harlequin Bugs', commonDiseases: 'Downy Mildew', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest outer leaves when 4-6 inches' },
  { name: 'Turnip Greens', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '3-6', soilPh: '6.0-7.5', daysToMaturity: 30, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Harlequin Bugs', commonDiseases: 'Downy Mildew, White Rust', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Harvest leaves when 4-6 inches tall' },
  { name: 'Parsnip', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '2-3', soilPh: '6.0-7.0', daysToMaturity: 120, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Carrot Weevils, Root Maggots', commonDiseases: 'Cavity Spot, Cercospora', fertilizerSchedule: 'Monthly with balanced', harvestTips: 'Harvest when roots are 1-1.5 inches diameter' },
  { name: 'Rutabaga', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '6-8', soilPh: '6.0-7.5', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Root Maggots', commonDiseases: 'Clubroot, White Rust', fertilizerSchedule: 'Every 4 weeks', harvestTips: 'Harvest when 3-4 inches diameter' },
  { name: 'Kohlrabi', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 45, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Cabbage Worms, Flea Beetles', commonDiseases: 'Clubroot, Downy Mildew', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Harvest when bulbs are 2-3 inches diameter' },
  { name: 'Fennel', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '6-9', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Swallowtail Caterpillars, Aphids', commonDiseases: 'Downy Mildew', fertilizerSchedule: 'Every 4 weeks', harvestTips: 'Harvest when bulb base is 3-4 inches diameter' },
  { name: 'Endive', category: 'vegetables', rowSpacing: '12-18', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 85, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Slugs, Aphids, Leaf Miners', commonDiseases: 'Downy Mildew, Fusarium', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Blanch heads to reduce bitterness' },
  { name: 'Radicchio', category: 'vegetables', rowSpacing: '18-24', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Slugs, Harlequin Bugs', commonDiseases: 'Downy Mildew, Botrytis', fertilizerSchedule: 'Every 4 weeks', harvestTips: 'Harvest heads when compact and firm' },
  { name: 'Pumpkin Varieties', category: 'vegetables', rowSpacing: '48-60', plantSpacing: '36-48', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Squash Bugs, Vine Borers', commonDiseases: 'Powdery Mildew, Phytophthora', fertilizerSchedule: 'Every 3-4 weeks', harvestTips: 'Harvest when skin is hard and color is deep' },

  // Fruits (50+)
  { name: 'Apple', category: 'fruits', rowSpacing: '15-20', plantSpacing: '15-20', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Codling Moths, Apple Maggots', commonDiseases: 'Apple Scab, Powdery Mildew', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored and slightly soft' },
  { name: 'Pear', category: 'fruits', rowSpacing: '15-20', plantSpacing: '15-20', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Codling Moths, Psylla', commonDiseases: 'Fire Blight, Scab', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Pick when mature but still firm, ripen off tree' },
  { name: 'Peach', category: 'fruits', rowSpacing: '12-20', plantSpacing: '12-20', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Peach Tree Borers, Japanese Beetles', commonDiseases: 'Brown Rot, Leaf Curl', fertilizerSchedule: 'Spring and early summer with balanced', harvestTips: 'Harvest when fully colored and fragrant' },
  { name: 'Plum', category: 'fruits', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Codling Moths', commonDiseases: 'Black Knot, Brown Rot', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when skin is fully colored' },
  { name: 'Cherry', category: 'fruits', rowSpacing: '20-30', plantSpacing: '20-30', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Fruit Flies, Cherry Fruit Flies', commonDiseases: 'Brown Rot, Leaf Spot', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored and ripe' },
  { name: 'Apricot', category: 'fruits', rowSpacing: '12-20', plantSpacing: '12-20', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Codling Moths', commonDiseases: 'Brown Rot, Gummosis', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored and fragrant' },
  { name: 'Strawberry', category: 'fruits', rowSpacing: '24-36', plantSpacing: '12-18', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: 'Crown level', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Pick berries fully red when they easily pull off' },
  { name: 'Raspberry', category: 'fruits', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Spider Mites', commonDiseases: 'Cane Blight, Leaf Spot', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Pick when fully colored but still firm' },
  { name: 'Blackberry', category: 'fruits', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Spider Mites', commonDiseases: 'Cane Blight, Leaf Spot', fertilizerSchedule: 'Every 3-4 weeks with nitrogen', harvestTips: 'Harvest when fully black and soft' },
  { name: 'Blueberry', category: 'fruits', rowSpacing: '48-60', plantSpacing: '36-48', soilPh: '4.5-5.5', daysToMaturity: 200, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Fruit Fly, Birds', commonDiseases: 'Mummy Berry, Stem Blight', fertilizerSchedule: 'Every 4-6 weeks with acid fertilizer', harvestTips: 'Harvest when berries turn deep blue' },
  { name: 'Grape', category: 'fruits', rowSpacing: '36-48', plantSpacing: '36-48', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Spider Mites', commonDiseases: 'Powdery Mildew, Downy Mildew', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored and sweet' },
  { name: 'Fig', category: 'fruits', rowSpacing: '20-30', plantSpacing: '20-30', soilPh: '5.5-8.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Fig Wasp, Beetles', commonDiseases: 'Fig Rust, Leaf Spot', fertilizerSchedule: 'Light spring application', harvestTips: 'Harvest when fruit is soft and droops' },
  { name: 'Pomegranate', category: 'fruits', rowSpacing: '15-20', plantSpacing: '15-20', soilPh: '5.5-8.5', daysToMaturity: 100, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Scale Insects, Beetles', commonDiseases: 'Leaf Scorch, Fruit Crack', fertilizerSchedule: 'Spring and summer with balanced', harvestTips: 'Harvest when fruit is fully colored' },
  { name: 'Persimmon', category: 'fruits', rowSpacing: '20-30', plantSpacing: '20-30', soilPh: '5.5-8.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Scale Insects, Japanese Beetles', commonDiseases: 'Leaf Spot, Fruit Rot', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored, often after frost' },
  { name: 'Orange', category: 'fruits', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Spider Mites', commonDiseases: 'Citrus Canker, Greening', fertilizerSchedule: 'Every 6 weeks during growing season', harvestTips: 'Harvest when fully colored' },
  { name: 'Lemon', category: 'fruits', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Spider Mites', commonDiseases: 'Citrus Canker, Greening', fertilizerSchedule: 'Every 6 weeks during growing season', harvestTips: 'Harvest when skin is thin and yellow' },
  { name: 'Lime', category: 'fruits', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.5', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Citrus Leaf Miners', commonDiseases: 'Citrus Canker, Greening', fertilizerSchedule: 'Every 6 weeks during growing season', harvestTips: 'Harvest when fully colored' },
  { name: 'Grapefruit', category: 'fruits', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.5', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Spider Mites', commonDiseases: 'Citrus Canker, Greening', fertilizerSchedule: 'Every 6 weeks during growing season', harvestTips: 'Harvest when fully colored' },
  { name: 'Kiwi', category: 'fruits', rowSpacing: '48', plantSpacing: '24', soilPh: '6.0-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Spider Mites', commonDiseases: 'Bacterial Canker, Root Rot', fertilizerSchedule: 'Spring and summer with balanced', harvestTips: 'Harvest in fall when mature' },
  { name: 'Mango', category: 'fruits', rowSpacing: '30-40', plantSpacing: '30-40', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Mango Flies', commonDiseases: 'Anthracnose, Powdery Mildew', fertilizerSchedule: 'Every 6 weeks during growing season', harvestTips: 'Harvest when skin is fragrant and yielding' },
  { name: 'Avocado', category: 'fruits', rowSpacing: '30-40', plantSpacing: '30-40', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Avocado Lace Bugs', commonDiseases: 'Anthracnose, Root Rot', fertilizerSchedule: 'Every 6 weeks with balanced', harvestTips: 'Harvest when mature and ripen at room temperature' },
  { name: 'Papaya', category: 'fruits', rowSpacing: '12-16', plantSpacing: '8-12', soilPh: '5.5-7.0', daysToMaturity: 180, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Fruit Flies, Spider Mites', commonDiseases: 'Papaya Ringspot, Powdery Mildew', fertilizerSchedule: 'Every 4 weeks with nitrogen-rich', harvestTips: 'Harvest when green-yellow, ripen at room temperature' },
  { name: 'Pineapple', category: 'fruits', rowSpacing: '18-24', plantSpacing: '12-18', soilPh: '5.0-6.5', daysToMaturity: 365, plantingDepth: 'Surface plant', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Scale Insects, Mealybugs', commonDiseases: 'Heart Rot, Leaf Spot', fertilizerSchedule: 'Every 4-6 weeks with nitrogen-rich', harvestTips: 'Harvest when fruit is golden-yellow' },
  { name: 'Banana', category: 'fruits', rowSpacing: '18-24', plantSpacing: '10-12', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '12-18', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Scale Insects, Weevils', commonDiseases: 'Panama Disease, Leaf Spot', fertilizerSchedule: 'Every 4 weeks with nitrogen-rich', harvestTips: 'Harvest when fingers are plump and full' },
  { name: 'Coconut', category: 'fruits', rowSpacing: '24-30', plantSpacing: '24-30', soilPh: '5.5-8.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Scale Insects, Rhinoceros Beetle', commonDiseases: 'Leaf Spot, Bud Rot', fertilizerSchedule: 'Every 4-6 weeks with balanced', harvestTips: 'Harvest when brown and fully mature' },
  { name: 'Cantaloupe', category: 'fruits', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-7.0', daysToMaturity: 85, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cucumber Beetles, Spider Mites', commonDiseases: 'Powdery Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when fully netted and fragrant' },
  { name: 'Honeydew', category: 'fruits', rowSpacing: '36-48', plantSpacing: '24-36', soilPh: '6.0-7.0', daysToMaturity: 80, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Cucumber Beetles, Spider Mites', commonDiseases: 'Powdery Mildew, Fusarium', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest when cream-colored with slight give' },
  { name: 'Mulberry', category: 'fruits', rowSpacing: '30-40', plantSpacing: '30-40', soilPh: '5.0-7.0', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Birds, Japanese Beetles', commonDiseases: 'Leaf Spot, Canker', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when berries are dark purple-black' },
  { name: 'Elderberry', category: 'fruits', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '5.5-7.5', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Birds', commonDiseases: 'Leaf Spot, Canker', fertilizerSchedule: 'Spring application with nitrogen', harvestTips: 'Harvest when berries are dark purple-black' },
  { name: 'Gooseberry', category: 'fruits', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Sawfly', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored' },
  { name: 'Currant', category: 'fruits', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Sawfly', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Harvest when fully colored and sweet' },

  // Herbs (50+)
  { name: 'Basil', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 50, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Downy Mildew, Fusarium Wilt', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Pinch off flower buds to encourage growth' },
  { name: 'Oregano', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest sprigs as needed, more after flowering' },
  { name: 'Thyme', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Root Rot, Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest sprigs as needed' },
  { name: 'Rosemary', category: 'herbs', rowSpacing: '24-36', plantSpacing: '24-36', soilPh: '6.0-8.0', daysToMaturity: 365, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Whiteflies, Spider Mites', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest sprigs as needed, more after pruning' },
  { name: 'Sage', category: 'herbs', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Sawfly, Japanese Beetles', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest leaves as needed' },
  { name: 'Parsley', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Swallowtail Caterpillars, Slugs', commonDiseases: 'Leaf Spot, Downy Mildew', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest outer stems as plant grows' },
  { name: 'Cilantro', category: 'herbs', rowSpacing: '6-12', plantSpacing: '3-6', soilPh: '6.0-7.0', daysToMaturity: 45, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Aphids, Spider Mites', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 3-4 weeks with balanced', harvestTips: 'Harvest leaves regularly before flowering' },
  { name: 'Dill', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Swallowtail Caterpillars, Aphids', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 4-6 weeks', harvestTips: 'Harvest leaves and seeds as needed' },
  { name: 'Mint', category: 'herbs', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'High', commonPests: 'Spider Mites, Japanese Beetles', commonDiseases: 'Powdery Mildew, Rust', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Harvest leaves and sprigs as needed' },
  { name: 'Chives', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Onion Maggots, Thrips', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest outer leaves as plant grows' },
  { name: 'Tarragon', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Root Rot, Powdery Mildew', fertilizerSchedule: 'Light, every 6 weeks', harvestTips: 'Harvest leaves and sprigs as needed' },
  { name: 'Marjoram', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest sprigs as needed' },
  { name: 'Lavender', category: 'herbs', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Whiteflies, Spider Mites', commonDiseases: 'Root Rot, Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest flowers in early morning' },
  { name: 'Chamomile', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '5.5-7.5', daysToMaturity: 70, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Flea Beetles', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, minimal fertilizer', harvestTips: 'Harvest flowers when fully open' },
  { name: 'Lemongrass', category: 'herbs', rowSpacing: '18-24', plantSpacing: '12-18', soilPh: '5.5-7.0', daysToMaturity: 90, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Spider Mites, Scale', commonDiseases: 'Leaf Spot, Root Rot', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest outer stalks as plant grows' },
  { name: 'Bay Leaf', category: 'herbs', rowSpacing: '24-36', plantSpacing: '24-36', soilPh: '5.5-8.0', daysToMaturity: 365, plantingDepth: '1/2', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Scale Insects, Spider Mites', commonDiseases: 'Leaf Spot, Root Rot', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest leaves as needed' },
  { name: 'Fennel (Herb)', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Swallowtail Caterpillars, Aphids', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 4-6 weeks', harvestTips: 'Harvest leaves and seeds as needed' },
  { name: 'Anise', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 85, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Aphids, Spider Mites', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Light, every 4-6 weeks', harvestTips: 'Harvest seeds when they turn brown' },
  { name: 'Coriander', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 45, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Aphids, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 3-4 weeks', harvestTips: 'Harvest leaves before flowering, seeds when brown' },
  { name: 'Cumin', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 100, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Aphids, Spider Mites', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Light, every 4 weeks', harvestTips: 'Harvest seeds when they turn brown and fragrant' },
  { name: 'Caraway', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 120, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Swallowtail Caterpillars, Aphids', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 4 weeks', harvestTips: 'Harvest seeds in second year when brown' },
  { name: 'Chervil', category: 'herbs', rowSpacing: '8-12', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 40, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Slugs, Aphids', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 4 weeks', harvestTips: 'Harvest leaves regularly before flowering' },
  { name: 'Chives Garlic', category: 'herbs', rowSpacing: '12-18', plantSpacing: '6-12', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Onion Maggots, Thrips', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest outer leaves as plant grows' },
  { name: 'Sorrel', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Slugs, Japanese Beetles', commonDiseases: 'Leaf Spot, Rust', fertilizerSchedule: 'Every 4 weeks with nitrogen', harvestTips: 'Harvest outer leaves as plant grows' },
  { name: 'Arugula', category: 'herbs', rowSpacing: '6-12', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 40, plantingDepth: '1/4', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Flea Beetles, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 3-4 weeks', harvestTips: 'Harvest leaves when young and tender' },
  { name: 'Borage', category: 'herbs', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Sawfly', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, minimal fertilizer', harvestTips: 'Harvest flowers and leaves as needed' },
  { name: 'Hyssop', category: 'herbs', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Japanese Beetles', commonDiseases: 'Root Rot, Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest flowers and leaves in summer' },
  { name: 'Winter Savory', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 90, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Root Rot, Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest leaves and sprigs as needed' },
  { name: 'Summer Savory', category: 'herbs', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-8.0', daysToMaturity: 60, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, every 6-8 weeks', harvestTips: 'Harvest leaves and sprigs as needed' },

  // Flowers (50+)
  { name: 'Sunflower', category: 'flowers', rowSpacing: '24-36', plantSpacing: '12-24', soilPh: '6.0-7.5', daysToMaturity: 85, plantingDepth: '1', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Striped Cucumber Beetle, Sunflower Maggot', commonDiseases: 'Powdery Mildew, Rust', fertilizerSchedule: 'Every 4-6 weeks with balanced', harvestTips: 'Cut flowers in early morning when stems are firm' },
  { name: 'Rose', category: 'flowers', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-6.5', daysToMaturity: 365, plantingDepth: '18-24 inches', sunRequirement: 'Full Sun', waterRequirement: 'High', commonPests: 'Aphids, Japanese Beetles', commonDiseases: 'Black Spot, Powdery Mildew', fertilizerSchedule: 'Every 4-6 weeks with rose fertilizer', harvestTips: 'Cut in early morning when flowers are cool' },
  { name: 'Marigold', category: 'flowers', rowSpacing: '12-18', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 50, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Light, every 4-6 weeks', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Zinnia', category: 'flowers', rowSpacing: '12-18', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Spider Mites, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 4 weeks with balanced', harvestTips: 'Cut flowers early in morning, remove lower leaves' },
  { name: 'Cosmos', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '5.5-7.0', daysToMaturity: 70, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Grasshoppers', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Light, minimal fertilizer', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Dahlia', category: 'flowers', rowSpacing: '24-36', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '4-6', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with phosphorus-rich', harvestTips: 'Cut flowers in early morning or late afternoon' },
  { name: 'Tulip', category: 'flowers', rowSpacing: '4-6', plantSpacing: '4-6', soilPh: '6.0-7.0', daysToMaturity: 180, plantingDepth: '6-8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Aphids', commonDiseases: 'Tulip Breaking Virus, Botrytis', fertilizerSchedule: 'Fall bulb fertilizer application', harvestTips: 'Cut when petals start to open' },
  { name: 'Daffodil', category: 'flowers', rowSpacing: '4-6', plantSpacing: '4-6', soilPh: '5.5-7.0', daysToMaturity: 180, plantingDepth: '6-8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Narcissus Flies', commonDiseases: 'Basal Rot, Leaf Scorch', fertilizerSchedule: 'Fall bulb fertilizer application', harvestTips: 'Cut when flowers are nearly open' },
  { name: 'Lily', category: 'flowers', rowSpacing: '12-18', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 120, plantingDepth: '8-10', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Lily Beetles, Slugs', commonDiseases: 'Leaf Spot, Botrytis', fertilizerSchedule: 'Every 2-3 weeks during growing season', harvestTips: 'Cut when first buds begin to open' },
  { name: 'Peony', category: 'flowers', rowSpacing: '24-36', plantSpacing: '24-36', soilPh: '6.0-8.0', daysToMaturity: 365, plantingDepth: '2-3', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Ants', commonDiseases: 'Leaf Blotch, Botrytis', fertilizerSchedule: 'Spring application with balanced', harvestTips: 'Cut when buds are soft and yielding' },
  { name: 'Hydrangea', category: 'flowers', rowSpacing: '24-36', plantSpacing: '24-36', soilPh: '5.5-7.5', daysToMaturity: 365, plantingDepth: '18-24', sunRequirement: 'Partial Shade', waterRequirement: 'High', commonPests: 'Scale Insects, Japanese Beetles', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks during growing season', harvestTips: 'Cut when flowers are mature but not papery' },
  { name: 'Snapdragon', category: 'flowers', rowSpacing: '8-12', plantSpacing: '6-12', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/16', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Slugs, Aphids', commonDiseases: 'Powdery Mildew, Rust', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Cut when most buds are open but top still closed' },
  { name: 'Petunia', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/16', sunRequirement: 'Full Sun', waterRequirement: 'Medium', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Powdery Mildew, Viral Diseases', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Impatiens', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '5.5-7.0', daysToMaturity: 50, plantingDepth: '1/16', sunRequirement: 'Partial Shade', waterRequirement: 'High', commonPests: 'Whiteflies, Spider Mites', commonDiseases: 'Powdery Mildew, Impatiens Necrotic Spot', fertilizerSchedule: 'Every 2 weeks with balanced', harvestTips: 'Pick flowers as they open' },
  { name: 'Begonia', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '5.5-7.0', daysToMaturity: 60, plantingDepth: '1/16', sunRequirement: 'Partial Shade', waterRequirement: 'High', commonPests: 'Whiteflies, Mealybugs', commonDiseases: 'Powdery Mildew, Botrytis', fertilizerSchedule: 'Every 2 weeks with balanced', harvestTips: 'Enjoy blooms throughout season' },
  { name: 'Geranium', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 60, plantingDepth: '1/4', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with phosphorus-rich', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Dianthus', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Slugs, Spider Mites', commonDiseases: 'Rust, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Deadhead regularly for continuous blooms' },
  { name: 'Pansy', category: 'flowers', rowSpacing: '8-12', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 50, plantingDepth: '1/8', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Slugs, Japanese Beetles', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Deadhead regularly to extend blooming' },
  { name: 'Viola', category: 'flowers', rowSpacing: '8-12', plantSpacing: '8-12', soilPh: '6.0-7.0', daysToMaturity: 50, plantingDepth: '1/8', sunRequirement: 'Partial Shade', waterRequirement: 'Medium', commonPests: 'Slugs, Flea Beetles', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Deadhead regularly to extend blooming' },
  { name: 'Verbena', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Powdery Mildew', fertilizerSchedule: 'Every 2-3 weeks with phosphorus-rich', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Salvia', category: 'flowers', rowSpacing: '12-18', plantSpacing: '12-18', soilPh: '6.0-7.0', daysToMaturity: 70, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Spider Mites', commonDiseases: 'Powdery Mildew, Root Rot', fertilizerSchedule: 'Every 2-3 weeks with balanced', harvestTips: 'Deadhead regularly to encourage blooming' },
  { name: 'Coneflower', category: 'flowers', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Goldfinches', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Light, minimal fertilizer needed', harvestTips: 'Deadhead for more blooms, leave some for birds' },
  { name: 'Rudbeckia', category: 'flowers', rowSpacing: '18-24', plantSpacing: '18-24', soilPh: '6.0-7.0', daysToMaturity: 90, plantingDepth: '1/8', sunRequirement: 'Full Sun', waterRequirement: 'Low', commonPests: 'Japanese Beetles, Slugs', commonDiseases: 'Powdery Mildew, Leaf Spot', fertilizerSchedule: 'Light, minimal fertilizer needed', harvestTips: 'Deadhead for more blooms' },
];

export function registerCropRoutes(app: App): void {
  // GET /api/crops/public - Public endpoint returning all system crops from database
  app.fastify.get<{}>(
    '/api/crops/public',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching public crops database');

      try {
        const publicCrops = await app.db.query.crops.findMany({
          where: eq(schema.crops.isCustom, false),
        });

        app.logger.info(
          { count: publicCrops.length },
          'Public crops fetched successfully'
        );

        return publicCrops;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch public crops');
        throw error;
      }
    }
  );

  // GET /api/crops - Get all crops (public endpoint, includes system crops + authenticated user's custom crops)
  app.fastify.get<{}>(
    '/api/crops',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching all crops');

      try {
        // Get all system crops (public)
        const systemCrops = await app.db.query.crops.findMany({
          where: eq(schema.crops.isCustom, false),
        });

        // Get user custom crops only if authenticated
        let userCustomCrops = [];
        let sessionUserId: string | undefined;

        // Try to get session if user is authenticated
        // Check for authorization header to see if user provided credentials
        const authHeader = request.headers.authorization;
        if (authHeader) {
          try {
            const requireAuth = app.requireAuth();
            const session = await requireAuth(request, reply);
            if (session) {
              sessionUserId = session.user.id;
            }
          } catch {
            // User provided auth header but it's invalid - continue anyway
          }
        }

        // If we have a valid session, get user's custom crops
        if (sessionUserId) {
          userCustomCrops = await app.db.query.crops.findMany({
            where: eq(schema.crops.userId, sessionUserId),
          });
        }

        const allCrops = [
          ...systemCrops,
          ...userCustomCrops,
        ];

        app.logger.info(
          { totalCrops: allCrops.length, customCrops: userCustomCrops.length },
          'Crops fetched successfully'
        );

        return allCrops;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch crops');
        throw error;
      }
    }
  );

  // POST /api/crops/custom - Create a custom crop with AI-generated details
  app.fastify.post<{ Body: CreateCustomCropBody }>(
    '/api/crops/custom',
    async (request: FastifyRequest<{ Body: CreateCustomCropBody }>, reply: FastifyReply) => {
      const { name, category } = request.body;

      app.logger.info({ name, category }, 'Creating custom crop');

      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        // Generate crop details using AI
        const { object: generatedDetails } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: cropDetailSchema,
          schemaName: 'CropDetails',
          schemaDescription:
            'Generate detailed farming information for a crop including spacing, soil requirements, maturity time, and care instructions.',
          prompt: `Generate detailed farming information for a ${category} crop named "${name}". Provide all fields with practical advice. For numeric fields, provide ranges in the format "min-max" (e.g., "24-36"). For daysToMaturity, provide just a number.`,
        });

        // Create crop in database
        const [crop] = await app.db
          .insert(schema.crops)
          .values({
            name,
            category: category as any,
            userId: session.user.id,
            isCustom: true,
            rowSpacing: generatedDetails.rowSpacing,
            plantSpacing: generatedDetails.plantSpacing,
            soilPh: generatedDetails.soilPh,
            daysToMaturity: generatedDetails.daysToMaturity,
            plantingDepth: generatedDetails.plantingDepth,
            sunRequirement: generatedDetails.sunRequirement,
            waterRequirement: generatedDetails.waterRequirement,
            commonPests: generatedDetails.commonPests,
            commonDiseases: generatedDetails.commonDiseases,
            fertilizerSchedule: generatedDetails.fertilizerSchedule,
            harvestTips: generatedDetails.harvestTips,
          })
          .returning();

        app.logger.info({ cropId: crop.id, name }, 'Custom crop created successfully');

        return crop;
      } catch (error) {
        app.logger.error({ err: error, name, category }, 'Failed to create custom crop');
        throw error;
      }
    }
  );
}

// Helper function to seed system crops - call this in a migration or setup script
export async function seedSystemCrops(app: App) {
  app.logger.info({}, 'Starting system crops seed');

  try {
    let seedCount = 0;
    for (const crop of SYSTEM_CROPS) {
      // Check if crop already exists
      const existing = await app.db.query.crops.findFirst({
        where: eq(schema.crops.name, crop.name),
      });

      if (!existing) {
        await app.db.insert(schema.crops).values({
          name: crop.name,
          category: crop.category as any,
          rowSpacing: crop.rowSpacing,
          plantSpacing: crop.plantSpacing,
          soilPh: crop.soilPh,
          daysToMaturity: crop.daysToMaturity,
          plantingDepth: crop.plantingDepth,
          sunRequirement: crop.sunRequirement,
          waterRequirement: crop.waterRequirement,
          commonPests: crop.commonPests,
          commonDiseases: crop.commonDiseases,
          fertilizerSchedule: crop.fertilizerSchedule,
          harvestTips: crop.harvestTips,
          isCustom: false,
          userId: null,
        });
        seedCount++;
      }
    }

    app.logger.info({ seedCount }, 'System crops seed completed');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed system crops');
  }
}
