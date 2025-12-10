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
  const original = title;
  
  // Remove trailing numbers with space: "Món ăn 20" -> "Món ăn"
  let cleaned = title.replace(/\s+\d+$/, '').trim();
  
  // Also handle cases where number is directly attached: "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '').trim();
  
  return cleaned;
}

async function main() {
  try {
    console.log('🧹 Starting to remove numbers from recipe titles...\n');
    
    console.log('🔌 Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Find all recipes
    const recipes = await Recipe.find({});
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
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
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🔄 Found ${updates.length} recipes with numbers in titles:\n`);
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
      console.log(`  ✓ Updated: "${update.original}" -> "${update.cleaned}"`);
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

