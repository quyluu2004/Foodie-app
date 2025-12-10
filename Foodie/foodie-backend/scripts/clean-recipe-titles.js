import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Function to clean title - remove trailing numbers
function cleanTitle(title) {
  if (!title) return title;
  // Remove trailing numbers and spaces: "Món ăn 123" -> "Món ăn"
  // Pattern: space(s) followed by one or more digits at the end
  const cleaned = title.replace(/\s+\d+$/, '').trim();
  // Also handle cases like "Món ăn20" (no space before number)
  return cleaned.replace(/\d+$/, '').trim();
}

// Clean JSON file
async function cleanJSONFile() {
  const jsonPath = path.join(__dirname, '../data/recipes-vietnam-200.json');
  
  console.log('📖 Reading JSON file...');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let cleanedCount = 0;
  const cleaned = jsonData.map((recipe, index) => {
    const originalTitle = recipe.title;
    const cleanedTitle = cleanTitle(originalTitle);
    
    if (originalTitle !== cleanedTitle) {
      cleanedCount++;
      console.log(`  ${index + 1}. "${originalTitle}" -> "${cleanedTitle}"`);
    }
    
    return {
      ...recipe,
      title: cleanedTitle
    };
  });
  
  console.log(`\n✅ Cleaned ${cleanedCount} recipe titles`);
  
  // Write back to file
  fs.writeFileSync(jsonPath, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log('💾 JSON file updated successfully!');
  
  return cleanedCount;
}

// Clean database
async function cleanDatabase() {
  try {
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to database');
    
    const recipes = await Recipe.find({});
    console.log(`📋 Found ${recipes.length} recipes in database`);
    
    let updatedCount = 0;
    const updates = [];
    
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
    
    console.log(`\n🔄 Updating ${updates.length} recipes in database...`);
    
    for (const update of updates) {
      await Recipe.findByIdAndUpdate(update.id, { title: update.cleaned });
      console.log(`  ✓ "${update.original}" -> "${update.cleaned}"`);
      updatedCount++;
    }
    
    console.log(`\n✅ Updated ${updatedCount} recipes in database`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🧹 Starting to clean recipe titles...\n');
    
    // Clean JSON file
    const jsonCleaned = await cleanJSONFile();
    
    // Clean database if MONGO_URI is set
    if (process.env.MONGO_URI) {
      const dbCleaned = await cleanDatabase();
      console.log(`\n✨ Summary: Cleaned ${jsonCleaned} titles in JSON, ${dbCleaned} titles in database`);
    } else {
      console.log('\n⚠️  MONGO_URI not set, skipping database update');
      console.log(`✨ Summary: Cleaned ${jsonCleaned} titles in JSON`);
    }
    
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

