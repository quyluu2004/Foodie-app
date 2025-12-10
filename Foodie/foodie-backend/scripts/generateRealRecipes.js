import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Danh sách món ăn Việt Nam thực tế với nguyên liệu và bước nấu
const vietnameseRecipes = [
  // Món khai vị
  {
    title: "Gỏi cuốn tôm thịt",
    description: "Món khai vị truyền thống Việt Nam với tôm, thịt và rau sống cuốn trong bánh tráng",
    category: "Món khai vị",
    cookTimeMinutes: 30,
    difficulty: "Dễ",
    servings: 4,
    ingredients: [
      "200g tôm tươi",
      "150g thịt ba chỉ",
      "100g bún tươi",
      "50g rau xà lách",
      "50g rau thơm (húng, tía tô)",
      "20 lá bánh tráng",
      "2 củ tỏi",
      "1 quả ớt",
      "3 thìa nước mắm",
      "2 thìa đường",
      "1 thìa chanh"
    ],
    steps: [
      "Luộc tôm trong nước sôi 3-5 phút, bóc vỏ, bỏ đầu",
      "Luộc thịt ba chỉ đến khi chín, thái lát mỏng",
      "Ngâm bánh tráng trong nước ấm 10 giây cho mềm",
      "Trải bánh tráng, xếp rau xà lách, bún, tôm, thịt lên trên",
      "Cuốn chặt lại, cắt đôi",
      "Pha nước mắm chua ngọt: nước mắm + đường + chanh + tỏi ớt băm",
      "Thưởng thức kèm nước mắm pha"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-spring-rolls"
  },
  {
    title: "Nem nướng Nha Trang",
    description: "Nem nướng đặc sản Nha Trang với hương vị đậm đà",
    category: "Món khai vị",
    cookTimeMinutes: 45,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "500g thịt heo xay",
      "100g mỡ heo",
      "2 thìa nước mắm",
      "1 thìa đường",
      "1 thìa tỏi băm",
      "1 thìa hành tím băm",
      "1/2 thìa tiêu",
      "20 que tre",
      "Bánh tráng, rau sống, dưa leo"
    ],
    steps: [
      "Trộn thịt heo xay với mỡ heo cắt hạt lựu",
      "Ướp với nước mắm, đường, tỏi, hành tím, tiêu trong 30 phút",
      "Vo thịt thành viên tròn, xiên vào que tre",
      "Nướng trên than hoa hoặc lò nướng 180°C trong 15-20 phút",
      "Xoay đều để nem chín vàng đều",
      "Ăn kèm bánh tráng, rau sống, dưa leo và nước mắm pha"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  {
    title: "Chả giò",
    description: "Nem rán giòn rụm với nhân thịt heo và rau củ",
    category: "Món khai vị",
    cookTimeMinutes: 40,
    difficulty: "Trung bình",
    servings: 6,
    ingredients: [
      "300g thịt heo xay",
      "100g tôm tươi",
      "50g miến",
      "50g nấm mèo",
      "1 củ cà rốt",
      "1 củ hành tây",
      "2 quả trứng gà",
      "20 lá bánh tráng",
      "Dầu ăn để chiên",
      "Gia vị: nước mắm, tiêu, đường"
    ],
    steps: [
      "Ngâm miến và nấm mèo trong nước ấm, cắt nhỏ",
      "Cà rốt, hành tây bào sợi",
      "Trộn thịt heo, tôm băm, miến, nấm, cà rốt, hành tây",
      "Nêm nếm gia vị, đập trứng vào trộn đều",
      "Cuốn nhân vào bánh tráng, gấp kín",
      "Chiên trong dầu nóng đến khi vàng giòn",
      "Vớt ra để ráo dầu, cắt đôi, ăn kèm nước mắm chua ngọt"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  
  // Món chay
  {
    title: "Đậu phụ sốt cà chua",
    description: "Món chay đơn giản với đậu phụ chiên và sốt cà chua",
    category: "Món chay",
    cookTimeMinutes: 25,
    difficulty: "Dễ",
    servings: 3,
    ingredients: [
      "300g đậu phụ",
      "2 quả cà chua",
      "1 củ hành tây",
      "2 tép tỏi",
      "1 thìa nước tương",
      "1 thìa đường",
      "1/2 thìa muối",
      "Hành lá, rau mùi",
      "Dầu ăn"
    ],
    steps: [
      "Cắt đậu phụ thành miếng vuông, chiên vàng 2 mặt",
      "Cà chua bỏ vỏ, băm nhỏ",
      "Phi thơm tỏi, cho cà chua vào xào",
      "Thêm nước tương, đường, muối, nước lọc",
      "Cho đậu phụ vào, đun nhỏ lửa 10 phút",
      "Nêm nếm lại, thêm hành lá, rau mùi",
      "Dọn ra đĩa, ăn nóng với cơm"
    ],
    image: "https://source.unsplash.com/featured/?tofu-tomato"
  },
  {
    title: "Canh chua chay",
    description: "Canh chua chay thanh mát với đậu hũ và rau củ",
    category: "Món chay",
    cookTimeMinutes: 30,
    difficulty: "Dễ",
    servings: 4,
    ingredients: [
      "200g đậu hũ non",
      "100g giá đỗ",
      "50g cà chua",
      "50g dứa",
      "2 thìa me",
      "1 thìa đường",
      "1 thìa nước tương",
      "Rau om, ngò gai",
      "Ớt, tỏi"
    ],
    steps: [
      "Ngâm me trong nước ấm, lọc lấy nước cốt",
      "Cà chua, dứa cắt miếng vừa ăn",
      "Đun sôi 1 lít nước, cho nước me vào",
      "Thêm đường, nước tương, nêm vừa ăn",
      "Cho cà chua, dứa vào nấu 5 phút",
      "Thêm đậu hũ non, giá đỗ, đun 2 phút",
      "Tắt bếp, thêm rau om, ngò gai, ớt tỏi băm"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  
  // Món nước
  {
    title: "Phở bò",
    description: "Món phở bò truyền thống Việt Nam với nước dùng đậm đà",
    category: "Món nước",
    cookTimeMinutes: 180,
    difficulty: "Khó",
    servings: 4,
    ingredients: [
      "500g bánh phở tươi",
      "300g thịt bò thăn",
      "500g xương bò",
      "1 củ hành tây",
      "1 củ gừng",
      "2 quả hoa hồi",
      "1 thanh quế",
      "Hành lá, ngò gai",
      "Chanh, ớt, giá đỗ",
      "Gia vị: muối, đường, nước mắm"
    ],
    steps: [
      "Rửa sạch xương bò, chần qua nước sôi",
      "Nướng hành tây, gừng đến khi thơm",
      "Đun xương với 3 lít nước, thêm hoa hồi, quế",
      "Hầm nhỏ lửa 2-3 giờ, vớt bọt thường xuyên",
      "Nêm nếm nước dùng với muối, đường, nước mắm",
      "Thái thịt bò mỏng, trần qua nước dùng nóng",
      "Trần bánh phở, xếp thịt bò, hành lá, ngò gai",
      "Chan nước dùng nóng, ăn kèm chanh, ớt, giá đỗ"
    ],
    image: "https://source.unsplash.com/featured/?pho-vietnamese"
  },
  {
    title: "Bún bò Huế",
    description: "Bún bò đặc sản Huế với vị cay nồng đặc trưng",
    category: "Món nước",
    cookTimeMinutes: 120,
    difficulty: "Khó",
    servings: 4,
    ingredients: [
      "500g bún tươi",
      "400g thịt bò",
      "200g giò heo",
      "2 thìa sả băm",
      "2 thìa ớt bột",
      "1 thìa mắm ruốc",
      "1 củ hành tây",
      "Rau sống, chanh, ớt",
      "Gia vị: muối, đường, nước mắm"
    ],
    steps: [
      "Luộc thịt bò và giò heo đến khi mềm, thái lát",
      "Phi thơm sả, thêm ớt bột, mắm ruốc",
      "Cho thịt vào xào, thêm nước luộc thịt",
      "Đun sôi, nêm nếm gia vị vừa ăn",
      "Trần bún, xếp thịt, giò heo lên",
      "Chan nước dùng nóng",
      "Ăn kèm rau sống, chanh, ớt"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  {
    title: "Bún riêu cua",
    description: "Bún riêu cua đồng với nước dùng chua ngọt thanh mát",
    category: "Món nước",
    cookTimeMinutes: 90,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "500g bún tươi",
      "300g cua đồng",
      "200g thịt heo xay",
      "2 quả cà chua",
      "100g đậu hũ chiên",
      "50g hành tây",
      "2 thìa me",
      "Rau sống, chanh",
      "Gia vị: muối, đường, nước mắm"
    ],
    steps: [
      "Giã cua đồng, lọc lấy nước cốt",
      "Trộn nước cua với thịt heo xay, đánh đều",
      "Đun nước cua đến khi nổi riêu",
      "Phi thơm hành, cho cà chua vào xào",
      "Thêm nước me, nước cua, đậu hũ",
      "Nêm nếm gia vị, đun sôi 10 phút",
      "Trần bún, chan nước riêu, ăn kèm rau sống"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  
  // Món chiên
  {
    title: "Cá kho tộ",
    description: "Cá kho tộ miền Nam với nước kho đậm đà",
    category: "Món chiên",
    cookTimeMinutes: 60,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "1kg cá tra hoặc cá basa",
      "100g thịt ba chỉ",
      "3 thìa nước mắm",
      "2 thìa đường",
      "1 củ hành tím",
      "2 tép tỏi",
      "1 quả ớt",
      "Hành lá, tiêu"
    ],
    steps: [
      "Cá cắt khúc, rửa sạch, để ráo",
      "Thịt ba chỉ thái lát mỏng",
      "Ướp cá với nước mắm, đường, hành tỏi băm 30 phút",
      "Xếp thịt ba chỉ dưới đáy nồi đất",
      "Xếp cá lên trên, đổ nước ướp vào",
      "Đun nhỏ lửa 45 phút, thỉnh thoảng lật cá",
      "Khi nước kho sánh, thêm ớt, hành lá, tiêu"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  {
    title: "Thịt kho tàu",
    description: "Thịt heo kho với trứng và nước dừa",
    category: "Món chiên",
    cookTimeMinutes: 90,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "500g thịt ba chỉ",
      "6 quả trứng gà",
      "200ml nước dừa",
      "3 thìa nước mắm",
      "2 thìa đường",
      "1 củ hành tím",
      "2 tép tỏi",
      "Hành lá, tiêu"
    ],
    steps: [
      "Thịt ba chỉ cắt miếng vuông 3cm",
      "Luộc trứng, bóc vỏ",
      "Ướp thịt với nước mắm, đường, hành tỏi băm 30 phút",
      "Cho thịt vào nồi, thêm nước dừa",
      "Đun sôi, hạ nhỏ lửa, kho 60 phút",
      "Thêm trứng vào, kho thêm 15 phút",
      "Nêm nếm lại, thêm hành lá, tiêu"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  
  // Món xào
  {
    title: "Rau muống xào tỏi",
    description: "Rau muống xào tỏi đơn giản nhưng ngon miệng",
    category: "Món xào",
    cookTimeMinutes: 10,
    difficulty: "Dễ",
    servings: 3,
    ingredients: [
      "500g rau muống",
      "4 tép tỏi",
      "2 thìa dầu ăn",
      "1 thìa nước mắm",
      "1/2 thìa đường",
      "1/2 thìa muối"
    ],
    steps: [
      "Rau muống nhặt, rửa sạch, cắt khúc",
      "Tỏi băm nhỏ",
      "Đun nóng dầu, phi thơm tỏi",
      "Cho rau muống vào xào nhanh tay",
      "Thêm nước mắm, đường, muối",
      "Xào đến khi rau vừa chín tới",
      "Tắt bếp, dọn ra đĩa ngay"
    ],
    image: "https://source.unsplash.com/featured/?stir-fry-vegetables"
  },
  {
    title: "Thịt bò xào cần tây",
    description: "Thịt bò xào cần tây giòn ngon",
    category: "Món xào",
    cookTimeMinutes: 20,
    difficulty: "Dễ",
    servings: 3,
    ingredients: [
      "300g thịt bò",
      "200g cần tây",
      "1 củ hành tây",
      "2 tép tỏi",
      "1 thìa dầu hào",
      "1 thìa nước mắm",
      "1/2 thìa đường",
      "Dầu ăn, tiêu"
    ],
    steps: [
      "Thịt bò thái lát mỏng, ướp dầu hào, nước mắm, tiêu",
      "Cần tây cắt khúc, hành tây thái múi cau",
      "Đun nóng dầu, xào thịt bò nhanh tay, vớt ra",
      "Phi thơm tỏi, cho cần tây, hành tây vào xào",
      "Thêm thịt bò vào, nêm nếm lại",
      "Xào nhanh 2 phút, tắt bếp",
      "Dọn ra đĩa, rắc tiêu"
    ],
    image: "https://source.unsplash.com/featured/?beef-stir-fry"
  },
  
  // Món nướng
  {
    title: "Thịt nướng xiên que",
    description: "Thịt heo nướng xiên que thơm lừng",
    category: "Món nướng",
    cookTimeMinutes: 30,
    difficulty: "Dễ",
    servings: 4,
    ingredients: [
      "500g thịt heo ba chỉ",
      "2 thìa nước mắm",
      "1 thìa đường",
      "1 thìa mật ong",
      "2 tép tỏi",
      "1 củ hành tím",
      "1/2 thìa tiêu",
      "20 que tre"
    ],
    steps: [
      "Thịt ba chỉ thái miếng dài, dày 1cm",
      "Ướp với nước mắm, đường, mật ong, tỏi hành băm, tiêu 2 giờ",
      "Xiên thịt vào que tre",
      "Nướng trên than hoa hoặc lò nướng 200°C",
      "Xoay đều, quét nước ướp lên thịt",
      "Nướng 15-20 phút đến khi vàng đều",
      "Ăn kèm bánh tráng, rau sống, nước mắm pha"
    ],
    image: "https://source.unsplash.com/featured/?grilled-meat-skewers"
  },
  {
    title: "Cá nướng giấy bạc",
    description: "Cá nướng trong giấy bạc giữ nguyên hương vị",
    category: "Món nướng",
    cookTimeMinutes: 25,
    difficulty: "Dễ",
    servings: 3,
    ingredients: [
      "1 con cá (500g)",
      "2 thìa nước mắm",
      "1 thìa đường",
      "1 củ sả",
      "2 tép tỏi",
      "1 quả ớt",
      "Hành lá, thì là",
      "Giấy bạc"
    ],
    steps: [
      "Cá làm sạch, khứa vài đường trên thân",
      "Ướp cá với nước mắm, đường, sả tỏi ớt băm 30 phút",
      "Bọc cá trong giấy bạc cùng hành lá, thì là",
      "Nướng trong lò 200°C hoặc than hoa 20 phút",
      "Mở giấy bạc, nướng thêm 5 phút cho da vàng",
      "Dọn ra đĩa, rưới nước ướp lên",
      "Ăn kèm rau sống, nước mắm gừng"
    ],
    image: "https://source.unsplash.com/featured/?grilled-fish"
  },
  
  // Món hấp
  {
    title: "Cá hấp xì dầu",
    description: "Cá hấp xì dầu thanh đạm, giữ nguyên vị ngọt",
    category: "Món hấp",
    cookTimeMinutes: 20,
    difficulty: "Dễ",
    servings: 3,
    ingredients: [
      "1 con cá (500g)",
      "3 thìa xì dầu",
      "1 thìa đường",
      "1 củ gừng",
      "3 tép tỏi",
      "Hành lá, thì là",
      "Dầu mè"
    ],
    steps: [
      "Cá làm sạch, để nguyên con",
      "Gừng, tỏi thái sợi, hành lá cắt khúc",
      "Đặt cá lên đĩa, rải gừng, tỏi lên",
      "Hấp cách thủy 15 phút",
      "Pha xì dầu với đường, dầu mè",
      "Khi cá chín, rưới xì dầu lên",
      "Thêm hành lá, thì là, đun sôi dầu, rưới lên"
    ],
    image: "https://source.unsplash.com/featured/?steamed-fish"
  },
  {
    title: "Thịt heo hấp mắm tôm",
    description: "Thịt heo hấp với mắm tôm đậm đà",
    category: "Món hấp",
    cookTimeMinutes: 40,
    difficulty: "Dễ",
    servings: 4,
    ingredients: [
      "500g thịt heo ba chỉ",
      "2 thìa mắm tôm",
      "1 thìa đường",
      "1 củ sả",
      "2 tép tỏi",
      "1 quả ớt",
      "Hành lá, rau răm"
    ],
    steps: [
      "Thịt ba chỉ cắt miếng vừa ăn",
      "Pha mắm tôm với đường, sả tỏi ớt băm",
      "Ướp thịt với mắm tôm 30 phút",
      "Hấp cách thủy 30 phút",
      "Kiểm tra thịt chín mềm",
      "Thêm hành lá, rau răm",
      "Hấp thêm 2 phút, dọn ra đĩa"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  
  // Món tráng miệng
  {
    title: "Chè đậu xanh",
    description: "Chè đậu xanh thanh mát, giải nhiệt",
    category: "Món tráng miệng",
    cookTimeMinutes: 45,
    difficulty: "Dễ",
    servings: 4,
    ingredients: [
      "200g đậu xanh",
      "100g đường",
      "50g bột sắn dây",
      "1 ống vani",
      "Dừa nạo, đậu phộng rang"
    ],
    steps: [
      "Đậu xanh ngâm 2 giờ, đãi vỏ",
      "Nấu đậu với 1 lít nước đến khi mềm",
      "Thêm đường, khuấy đều",
      "Hòa bột sắn dây với nước lạnh",
      "Đổ từ từ vào nồi chè, khuấy đều",
      "Khi chè sánh, thêm vani",
      "Để nguội, thêm dừa nạo, đậu phộng"
    ],
    image: "https://source.unsplash.com/featured/?sweet-soup"
  },
  {
    title: "Bánh flan",
    description: "Bánh flan mềm mịn, thơm ngon",
    category: "Món tráng miệng",
    cookTimeMinutes: 60,
    difficulty: "Trung bình",
    servings: 6,
    ingredients: [
      "6 quả trứng gà",
      "500ml sữa tươi",
      "100g đường",
      "1 ống vani",
      "Caramel: 50g đường + 2 thìa nước"
    ],
    steps: [
      "Làm caramel: đun đường với nước đến vàng, đổ vào khuôn",
      "Đánh tan trứng, không đánh bông",
      "Đun sữa với đường, để nguội 40°C",
      "Trộn sữa vào trứng, lọc qua rây",
      "Thêm vani, đổ vào khuôn có caramel",
      "Hấp cách thủy 40 phút ở lửa nhỏ",
      "Để nguội, bảo quản lạnh, lật ngược khi ăn"
    ],
    image: "https://source.unsplash.com/featured/?flan-dessert"
  },
  
  // Món ăn vặt
  {
    title: "Bánh tráng nướng",
    description: "Bánh tráng nướng giòn với trứng và hành",
    category: "Món ăn vặt",
    cookTimeMinutes: 5,
    difficulty: "Dễ",
    servings: 2,
    ingredients: [
      "2 lá bánh tráng",
      "2 quả trứng gà",
      "Hành lá, tương ớt",
      "Bơ, ruốc"
    ],
    steps: [
      "Nướng bánh tráng trên than hoa hoặc chảo",
      "Đập trứng lên bánh, dàn đều",
      "Rắc hành lá, ruốc",
      "Nướng đến khi trứng chín",
      "Quét bơ, tương ớt",
      "Cuốn lại, cắt đôi",
      "Thưởng thức nóng"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  },
  {
    title: "Bánh mì chảo",
    description: "Bánh mì nướng với pate, chả lụa và rau",
    category: "Món ăn vặt",
    cookTimeMinutes: 10,
    difficulty: "Dễ",
    servings: 2,
    ingredients: [
      "2 ổ bánh mì",
      "50g pate",
      "100g chả lụa",
      "Dưa leo, rau mùi",
      "Tương ớt, mayonnaise"
    ],
    steps: [
      "Nướng bánh mì giòn",
      "Cắt dọc, quét pate bên trong",
      "Xếp chả lụa, dưa leo, rau mùi",
      "Thêm tương ớt, mayonnaise",
      "Ép nhẹ, cắt đôi",
      "Thưởng thức ngay"
    ],
    image: "https://source.unsplash.com/featured/?banh-mi"
  },
  
  // Món chính
  {
    title: "Cơm tấm sườn nướng",
    description: "Cơm tấm với sườn nướng thơm lừng",
    category: "Món chính",
    cookTimeMinutes: 60,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "500g gạo tấm",
      "1kg sườn heo",
      "3 thìa nước mắm",
      "2 thìa đường",
      "2 thìa mật ong",
      "2 tép tỏi",
      "1 củ hành tím",
      "Chả trứng, bì, đồ chua",
      "Nước mắm pha"
    ],
    steps: [
      "Nấu gạo tấm thành cơm",
      "Sườn cắt miếng, ướp nước mắm, đường, mật ong, tỏi hành 2 giờ",
      "Nướng sườn trên than hoa hoặc lò nướng 200°C",
      "Xoay đều, quét nước ướp, nướng 30 phút",
      "Làm chả trứng, bì, đồ chua",
      "Xếp cơm, sườn, chả trứng, bì, đồ chua",
      "Rưới nước mắm pha, thưởng thức"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-rice"
  },
  {
    title: "Bún chả Hà Nội",
    description: "Bún chả đặc sản Hà Nội với thịt nướng",
    category: "Món chính",
    cookTimeMinutes: 45,
    difficulty: "Trung bình",
    servings: 4,
    ingredients: [
      "500g bún tươi",
      "400g thịt heo ba chỉ",
      "200g thịt heo nạc xay",
      "3 thìa nước mắm",
      "2 thìa đường",
      "1 củ hành tím",
      "2 tép tỏi",
      "Rau sống, tỏi ớt",
      "Nước mắm pha"
    ],
    steps: [
      "Thịt ba chỉ thái miếng, ướp nước mắm, đường, hành tỏi",
      "Thịt xay vo viên, ướp tương tự",
      "Nướng thịt trên than hoa đến vàng",
      "Pha nước mắm: nước mắm + đường + chanh + tỏi ớt",
      "Trần bún, xếp rau sống",
      "Cho thịt nướng vào bát nước mắm",
      "Chấm bún, rau vào nước mắm, thưởng thức"
    ],
    image: "https://source.unsplash.com/featured/?vietnamese-food"
  }
];

// Tạo 200 món từ danh sách mẫu
function generateRecipes() {
  const categories = [
    "Món khai vị", "Món chay", "Món nước", "Món chiên", 
    "Món xào", "Món nướng", "Món hấp", "Món tráng miệng", 
    "Món ăn vặt", "Món chính"
  ];
  
  const recipes = [];
  let recipeIndex = 0;
  
  // Thêm các món mẫu
  recipes.push(...vietnameseRecipes);
  recipeIndex = vietnameseRecipes.length;
  
  // Tạo thêm món để đủ 200
  const categoryCounts = {
    "Món khai vị": 20,
    "Món chay": 20,
    "Món nước": 20,
    "Món chiên": 20,
    "Món xào": 20,
    "Món nướng": 20,
    "Món hấp": 20,
    "Món tráng miệng": 20,
    "Món ăn vặt": 20,
    "Món chính": 20
  };
  
  // Đếm số món hiện có theo category
  const currentCounts = {};
  categories.forEach(cat => currentCounts[cat] = 0);
  recipes.forEach(r => {
    if (currentCounts[r.category] !== undefined) {
      currentCounts[r.category]++;
    }
  });
  
  // Tạo thêm món cho mỗi category
  categories.forEach(category => {
    const needed = categoryCounts[category] - currentCounts[category];
    
    for (let i = 0; i < needed && recipes.length < 200; i++) {
      const baseRecipe = recipes.find(r => r.category === category) || recipes[0];
      const newRecipe = {
        ...baseRecipe,
        title: `${baseRecipe.title} ${i + 1}`,
        description: `${baseRecipe.description} - Phiên bản ${i + 1}`,
        cookTimeMinutes: baseRecipe.cookTimeMinutes + (i * 2),
        servings: baseRecipe.servings + (i % 3),
        ingredients: baseRecipe.ingredients.map(ing => {
          // Thay đổi số lượng một chút
          const match = ing.match(/(\d+)([a-z]+)?\s*(.+)/);
          if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2] || '';
            const item = match[3];
            const newAmount = amount + (i * 5);
            return `${newAmount}${unit} ${item}`;
          }
          return ing;
        })
      };
      recipes.push(newRecipe);
    }
  });
  
  return recipes.slice(0, 200);
}

// Ghi file
const recipes = generateRecipes();
const outputPath = path.join(__dirname, '..', 'data', 'recipes-vietnam-200.json');

fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2), 'utf-8');
console.log(`✅ Đã tạo ${recipes.length} công thức vào ${outputPath}`);
console.log(`📊 Phân loại:`);
const categoryStats = {};
recipes.forEach(r => {
  categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
});
Object.entries(categoryStats).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count} món`);
});

