import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove ALL trailing numbers
function cleanTitle(title) {
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  
  // Pattern 1: Remove trailing space + one or more digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Pattern 2: Remove trailing digits directly attached (no space)
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  return cleaned.trim();
}

async function main() {
  try {
    console.log('🧹 Cleaning recipe titles - Removing trailing numbers...\n');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to database\n');
    
    const recipes = await Recipe.find({}).select('title _id');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Show sample titles first
    console.log('📝 Sample recipe titles (first 30):');
    recipes.slice(0, 30).forEach((recipe, index) => {
      console.log(`  ${index + 1}. "${recipe.title}"`);
    });
    console.log('');
    
    const updates = [];
    
    // Check all recipes
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
      console.log('   No trailing numbers found in any recipe titles.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`\n🔢 Found ${updates.length} recipes with trailing numbers:\n`);
    
    // Show all updates
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

