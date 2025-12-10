import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove trailing numbers
function cleanTitle(title) {
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  
  // Remove trailing space + one or more digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  // "Cơm tấm sườn nướng 19" -> "Cơm tấm sườn nướng"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Remove trailing digits directly attached (no space)
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  return cleaned.trim();
}

async function main() {
  try {
    console.log('🧹 Cleaning ALL recipe titles in database...\n');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Get all recipes
    const recipes = await Recipe.find({});
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Process all recipes
    let updatedCount = 0;
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
      console.log('   No trailing numbers found in any recipe titles.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🔢 Found ${updates.length} recipes with trailing numbers:\n`);
    updates.slice(0, 20).forEach((update, index) => {
      console.log(`  ${index + 1}. "${update.original}" -> "${update.cleaned}"`);
    });
    if (updates.length > 20) {
      console.log(`  ... and ${updates.length - 20} more`);
    }
    
    console.log(`\n🔄 Updating ${updates.length} recipes in database...\n`);
    
    // Update all recipes
    for (const update of updates) {
      await Recipe.findByIdAndUpdate(
        update.id,
        { title: update.cleaned },
        { new: true }
      );
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`  ✓ Updated ${updatedCount}/${updates.length} recipes...`);
      }
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

