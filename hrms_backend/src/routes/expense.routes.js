import express from 'express';
import { 
  createExpenseRequest, 
  getUserExpenseRequests, 
  getExpenseRequestById,   
  getAllExpenseRequests, 
  updateExpenseRequestStatus, 
  getExpenseStats, 
  createEmpExpense,
  deleteExpenseRequest
} from '../controllers/expense.controller.js';
import { upload } from '../middlewares/multer.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, upload.array('proofs', 5), createExpenseRequest);
router.post('/createExpense/:employeeId', protect, upload.array('proofs', 5), createEmpExpense);

router.get('/', protect, getUserExpenseRequests);
router.get('/get/:id', protect, getExpenseRequestById);

router.get('/all', protect, getAllExpenseRequests);
router.put('/:id/status', protect, updateExpenseRequestStatus);
router.get('/stats', protect, getExpenseStats);

router.delete('/:id', protect, deleteExpenseRequest);

export default router;