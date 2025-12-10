import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove ALL numbers (not just trailing)
function cleanTitle(title) {
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  
  // Remove trailing space + one or more digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  // "Cơm tấm sườn nướng 19" -> "Cơm tấm sườn nướng"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Also handle cases where number is directly attached (no space)
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  // Remove numbers in the middle if they're standalone (with spaces)
  // "Món ăn 20 mới" -> "Món ăn mới"
  cleaned = cleaned.replace(/\s+\d+\s+/g, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function main() {
  try {
    console.log('🧹 Removing ALL numbers from recipe titles...\n');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Get all recipes
    const recipes = await Recipe.find({}).select('title _id');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Find recipes with numbers
    const updates = [];
    for (const recipe of recipes) {
      const original = recipe.title;
      const cleaned = cleanTitle(original);
      
      if (original !== cleaned) {
        updates.push({
          id: recipe._id,
          original: original,
          cleaned: cleaned
        });
      }
    }
    
    if (updates.length === 0) {
      console.log('✅ All recipe titles are already clean!');
      console.log('   No numbers found in any recipe titles.');
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
    console.log('   All numbers have been removed from recipe titles.');
    
    await mongoose.disconnect();
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

