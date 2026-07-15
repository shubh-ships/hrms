import express from 'express';
import { createEntry, getEmployeeBalance, getTransactionHistory, getUserBalance, listOrganizationAllBalances } from '../controllers/accountBalance.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/transaction', protect, createEntry);

router.get('/balance/:userId', protect, getEmployeeBalance);

router.get('/organization/:organizationId', protect,listOrganizationAllBalances);

router.get('/history/:userId', protect, getTransactionHistory);

router.get('/my-balance', protect, getUserBalance);

export default router;