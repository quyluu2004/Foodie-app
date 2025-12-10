import express from 'express';
import {
  getHomepageSections,
  saveHomepageSections,
  getHomepageSection,
} from '../controllers/homepage.controller.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Public: Get all homepage sections (for mobile app)
router.get('/sections', getHomepageSections);

// Public: Get single section
router.get('/sections/:id', getHomepageSection);

// Admin only: Save homepage sections
router.post('/sections', auth, adminAuth, saveHomepageSections);

export default router;

