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
  if (!title || typeof title !== 'string') return title;
  
  let cleaned = title.trim();
  
  // Remove trailing space + one or more digits
  // "Bún chả Hà Nội 20" -> "Bún chả Hà Nội"
  // "Cơm tấm sườn nướng 19" -> "Cơm tấm sườn nướng"
  cleaned = cleaned.replace(/\s+\d+$/, '');
  
  // Also handle cases where number is directly attached (no space)
  // "Món ăn20" -> "Món ăn"
  cleaned = cleaned.replace(/\d+$/, '');
  
  return cleaned.trim();
}

async function main() {
  try {
    console.log('🧹 Starting to remove numbers from all recipe titles...\n');
    
    console.log('🔌 Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/foodie';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Find all recipes
    const recipes = await Recipe.find({}).select('title _id');
    console.log(`📋 Found ${recipes.length} recipes in database\n`);
    
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
    
    console.log(`🔄 Found ${updates.length} recipes with numbers in titles:\n`);
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
      console.log(`  ✓ Updated: "${update.original}" -> "${update.cleaned}"`);
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} recipes in database`);
    console.log('   All trailing numbers have been removed from recipe titles.');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

