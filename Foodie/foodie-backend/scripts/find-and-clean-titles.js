import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

function cleanTitle(title) {
  if (!title) return title;
  // Remove trailing numbers: "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  return title.replace(/\s+\d+$/, '').trim();
}

async function main() {
  try {
    console.log('🔍 Finding and cleaning recipe titles with trailing numbers...\n');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to database\n');
    
    const recipes = await Recipe.find({}).select('title');
    console.log(`📋 Total recipes: ${recipes.length}\n`);
    
    // Find recipes with numbers at the end
    const recipesWithNumbers = recipes.filter(r => {
      const title = r.title || '';
      // Check if title ends with space + number(s)
      return /\s+\d+$/.test(title);
    });
    
    console.log(`🔢 Found ${recipesWithNumbers.length} recipes with trailing numbers:\n`);
    
    if (recipesWithNumbers.length === 0) {
      console.log('✅ All recipe titles are clean! No numbers found at the end.');
      await mongoose.disconnect();
      return;
    }
    
    // Show first 20
    recipesWithNumbers.slice(0, 20).forEach((recipe, index) => {
      const cleaned = cleanTitle(recipe.title);
      console.log(`  ${index + 1}. "${recipe.title}" -> "${cleaned}"`);
    });
    
    if (recipesWithNumbers.length > 20) {
      console.log(`  ... and ${recipesWithNumbers.length - 20} more\n`);
    }
    
    console.log(`\n🔄 Updating ${recipesWithNumbers.length} recipes...\n`);
    
    let updated = 0;
    for (const recipe of recipesWithNumbers) {
      const cleaned = cleanTitle(recipe.title);
      await Recipe.findByIdAndUpdate(recipe._id, { title: cleaned });
      updated++;
      if (updated % 10 === 0) {
        console.log(`  ✓ Updated ${updated}/${recipesWithNumbers.length}...`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updated} recipes!`);
    await mongoose.disconnect();
    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

