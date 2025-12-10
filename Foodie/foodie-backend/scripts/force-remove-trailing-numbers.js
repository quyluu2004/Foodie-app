import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove trailing numbers more aggressively
function cleanTitle(title) {
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  
  // Pattern 1: Remove trailing space + digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Pattern 2: Remove trailing digits directly attached
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  // Pattern 3: Remove numbers that appear to be sequence numbers
  // "Canh chua chay 17" -> "Canh chua chay"
  // "Đậu phụ sốt cà chua 16" -> "Đậu phụ sốt cà chua"
  cleaned = cleaned.replace(/\s+\d{1,3}$/, '');
  
  return cleaned.trim();
}

async function main() {
  try {
    console.log('🧹 Force removing trailing numbers from ALL recipe titles...\n');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Get all recipes
    const recipes = await Recipe.find({}).select('title _id');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Show all titles first
    console.log('📝 All recipe titles:');
    recipes.forEach((recipe, index) => {
      const hasTrailingNumber = /\s+\d+$/.test(recipe.title);
      const marker = hasTrailingNumber ? ' ⚠️ HAS NUMBER' : '';
      console.log(`  ${index + 1}. "${recipe.title}"${marker}`);
    });
    console.log('');
    
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
      console.log('   No trailing numbers found in any recipe titles.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🔢 Found ${updates.length} recipes with trailing numbers:\n`);
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

