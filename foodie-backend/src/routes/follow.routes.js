import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  toggleFollow,
  checkFollowStatus,
  getFollowing,
  getFollowers,
} from "../controllers/followController.js";

const router = Router();

router.post("/:userId", auth, toggleFollow);
router.get("/:userId/status", auth, checkFollowStatus);
router.get("/following", auth, getFollowing);
router.get("/followers", auth, getFollowers);

export default router;

