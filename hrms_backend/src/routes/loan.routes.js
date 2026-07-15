import express from 'express';
import {
  createLoanRequest,
  getEmployeeLoans,
  getAllLoans,
  updateLoanRequest,
  approveLoan,
  rejectLoan,
  disburseLoan,
  approveAndDisburseLoan
} from '../controllers/loan.controller.js';
import {protect} from '../middlewares/auth.js'


const router = express.Router();

// Employee routes
router.post('/request', protect, createLoanRequest);
router.get('/my-loans', protect, getEmployeeLoans);

// Admin routes
router.get('/', protect, getAllLoans);
router.put('/:id', protect, updateLoanRequest);
router.post('/:id/reject', protect, rejectLoan);
// router.patch('/:id/approve', protect, approveLoan);
// router.post('/:id/disburse', protect, disburseLoan);
router.patch('/:id/approve', protect, approveAndDisburseLoan);



export default router;