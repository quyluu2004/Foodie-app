import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove trailing numbers
function cleanTitle(title) {
  if (!title) return title;
  
  // Pattern 1: Remove trailing space + numbers: "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  let cleaned = title.replace(/\s+\d+$/, '').trim();
  
  // Pattern 2: Remove trailing numbers directly attached: "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '').trim();
  
  return cleaned;
}

async function main() {
  try {
    console.log('🔍 Checking recipes for numbers in titles...\n');
    
    console.log('🔌 Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Find all recipes
    const recipes = await Recipe.find({}).select('title');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
    // Show first 20 recipes to check
    console.log('📝 Sample recipe titles:');
    recipes.slice(0, 20).forEach((recipe, index) => {
      console.log(`  ${index + 1}. "${recipe.title}"`);
    });
    console.log('');
    
    let updatedCount = 0;
    const updates = [];
    
    // Check each recipe
    for (const recipe of recipes) {
      const originalTitle = recipe.title;
      const cleanedTitle = cleanTitle(originalTitle);
      
      if (originalTitle !== cleanedTitle) {
        updates.push({
          id: recipe._id,
          original: originalTitle,
          cleaned: cleanedTitle
        });
      }
    }
    
    if (updates.length === 0) {
      console.log('✅ No recipes found with trailing numbers in titles');
      console.log('   All recipe titles are already clean!');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`\n🔄 Found ${updates.length} recipes with numbers in titles:\n`);
    updates.forEach((update, index) => {
      console.log(`  ${index + 1}. "${update.original}" -> "${update.cleaned}"`);
    });
    
    console.log(`\n🔄 Updating ${updates.length} recipes in database...\n`);
    
    // Update all recipes
    for (const update of updates) {
      await Recipe.findByIdAndUpdate(
        update.id, 
        { title: update.cleaned },
        { new: true }
      );
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} recipes in database`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

