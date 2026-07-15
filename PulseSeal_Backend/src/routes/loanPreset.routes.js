// routes/interestPresetRoutes.js
import express from 'express';
import {
  createInterestPreset,
  getInterestPresets,
  updateInterestPreset,
  deleteInterestPreset
} from '../controllers/loanPreset.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createInterestPreset);
router.get('/', protect,getInterestPresets);
router.put('/:id', protect, updateInterestPreset);
router.delete('/:id', protect, deleteInterestPreset);

export default router;