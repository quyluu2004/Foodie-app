import Favorite from "../models/Favorite.js";

export const addFavorite = async (req, res) => {
  try {
    const fav = await Favorite.create({ user: req.user.id, recipe: req.body.recipeId });
    res.status(201).json(fav);
  } catch (err) {
    if (err.code === 11000)
      return res.json({ message: "Công thức đã có trong danh sách yêu thích" });
    res.status(500).json({ error: err.message });
  }
};

export const listFavorites = async (req, res) => {
  const list = await Favorite.find({ user: req.user.id }).populate("recipe");
  res.json(list);
};







