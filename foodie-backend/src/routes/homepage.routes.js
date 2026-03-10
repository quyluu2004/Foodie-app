import express from 'express';
import {
  getHomepageSections,
  saveHomepageSections,
  getHomepageSection,
} from '../controllers/homepage.controller.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.js';

const router = express.Router();

// Public: Get all homepage sections (cached 10 phút)
router.get('/sections', cacheResponse(10 * 60 * 1000), getHomepageSections);

// Public: Get single section (cached 5 phút)
router.get('/sections/:id', cacheResponse(5 * 60 * 1000), getHomepageSection);

// Admin only: Save homepage sections
router.post('/sections', auth, adminAuth, saveHomepageSections);

export default router;

