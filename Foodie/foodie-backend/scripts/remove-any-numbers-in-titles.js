import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove ANY trailing numbers (more aggressive)
function cleanTitle(title) {
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  const original = cleaned;
  
  // Remove trailing space + one or more digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  // "Cơm tấm sườn nướng 19" -> "Cơm tấm sườn nướng"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Remove trailing digits directly attached (no space)
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  // Remove numbers that are standalone words at the end
  // "Canh chua chay 17" -> "Canh chua chay"
  cleaned = cleaned.replace(/\s+\d{1,4}$/, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function main() {
  try {
    console.log('🧹 Removing trailing numbers from ALL recipe titles...\n');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Get all recipes
    const recipes = await Recipe.find({}).select('title _id');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Find recipes with numbers at the end
    const updates = [];
    for (const recipe of recipes) {
      const original = recipe.title;
      const cleaned = cleanTitle(original);
      
      // Check if there's a trailing number pattern
      const hasTrailingNumber = /\s+\d+$/.test(original) || /\d+$/.test(original);
      
      if (hasTrailingNumber && original !== cleaned) {
        updates.push({
          id: recipe._id,
          original: original,
          cleaned: cleaned
        });
      }
    }
    
    // Also check for any title that contains numbers and might need cleaning
    // This is a more aggressive check
    for (const recipe of recipes) {
      const original = recipe.title;
      const cleaned = cleanTitle(original);
      
      if (original !== cleaned && !updates.find(u => u.id.toString() === recipe._id.toString())) {
        updates.push({
          id: recipe._id,
          original: original,
          cleaned: cleaned
        });
      }
    }
    
    if (updates.length === 0) {
      console.log('✅ All recipe titles are already clean!');
      console.log('   No trailing numbers found in any recipe titles.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🔢 Found ${updates.length} recipes with numbers in titles:\n`);
    updates.forEach((update, index) => {
      console.log(`  ${index + 1}. "${update.original}" -> "${update.cleaned}"`);
    });
    
    console.log(`\n🔄 Updating ${updates.length} recipes in database...\n`);
    
    // Update all recipes
    let updatedCount = 0;
    for (const update of updates) {
      await Recipe.findByIdAndUpdate(
        update.id,
        { title: update.cleaned },
        { new: true }
      );
      updatedCount++;
      console.log(`  ✓ [${updatedCount}/${updates.length}] "${update.original}" -> "${update.cleaned}"`);
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} recipes!`);
    console.log('   All trailing numbers have been removed from recipe titles.');
    
    await mongoose.disconnect();
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

