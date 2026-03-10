import { Router } from "express";
import {
  setRecipePremium,
  purchasePremiumRecipe,
  checkPurchaseStatus,
  getMyPurchases,
  topUpCoins,
} from "../controllers/premiumController.js";
import { donateToCreator, getMyTransactions, getMyCoins } from "../controllers/donationController.js";
import { auth } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validate.js";

const router = Router();

// Premium Recipe routes
router.put("/recipe/:recipeId/premium", auth, validateObjectId("recipeId"), setRecipePremium);
router.post("/recipe/:recipeId/purchase", auth, validateObjectId("recipeId"), purchasePremiumRecipe);
router.get("/recipe/:recipeId/purchase-status", auth, validateObjectId("recipeId"), checkPurchaseStatus);
router.get("/purchases", auth, getMyPurchases);

// Donation routes
router.post("/donate/:creatorId", auth, validateObjectId("creatorId"), donateToCreator);
router.get("/transactions", auth, getMyTransactions);
router.get("/coins", auth, getMyCoins);

// Top-up routes
router.post("/topup", auth, topUpCoins);

export default router;

