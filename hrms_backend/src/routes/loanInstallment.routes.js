// routes/installmentRoutes.js
import express from 'express';
import {
  getLoanInstallments,
  markInstallmentPaid,
  getPaymentHistory
} from '../controllers/loanInstallment.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Both admin and employee can access (with proper authorization checks in controller)
router.get('/loan/:loanId',protect, getLoanInstallments);
router.get('/loan/:loanId/history',protect, getPaymentHistory);

// Admin only routes
router.post('/:installmentId/pay', protect, markInstallmentPaid);

export default router;