import { importRecipes } from "../src/utils/importRecipes.js";

// Sử dụng: 
//   node scripts/importRecipes.js [đường-dẫn-file-json] [--force] [--update]
// Ví dụ: 
//   node scripts/importRecipes.js data/recipes-vietnam-200.json
//   node scripts/importRecipes.js data/recipes-vietnam-200.json --force  (xóa tất cả và import lại)
//   node scripts/importRecipes.js data/recipes-vietnam-200.json --update (cập nhật các món đã tồn tại)

const args = process.argv.slice(2);
const jsonFilePath = args.find(arg => !arg.startsWith('--')) || "data/recipes-sample.json";
const force = args.includes('--force');
const update = args.includes('--update');

console.log("🚀 Bắt đầu import recipes từ file:", jsonFilePath);
if (force) {
  console.log("⚠️  FORCE MODE: Sẽ xóa tất cả recipes cũ trước khi import!");
}
if (update) {
  console.log("🔄 UPDATE MODE: Sẽ cập nhật các recipes đã tồn tại");
}
console.log("");

importRecipes(jsonFilePath, { force, update }).catch((error) => {
  console.error("❌ Lỗi khi import:", error);
  process.exit(1);
});

