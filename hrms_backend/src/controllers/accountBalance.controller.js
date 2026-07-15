import express from 'express';
import { AccountBalance } from '../models/accountBalance.Model.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const router = express.Router();

export const createEntry = asyncHandler(async (req, res) => {
    const {organizationId} = req.user;
    const { userId, amount, operation } = req.body;

    if (!userId || !organizationId || !amount || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, organizationId, amount, operation'
      });
    }

    if (!['credit', 'debit'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Operation must be either "credit" or "debit"'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    let accountBalance = await AccountBalance.findOne({ userId, organizationId });

    if (!accountBalance) {
      accountBalance = new AccountBalance({
        userId,
        organizationId,
        totalAmount: 0,
        history: []
      });
    }

    const transaction = {
      amount,
      operation,
      timestamp: new Date()
    };

    if (operation === 'credit') {
      accountBalance.totalAmount += amount;
    } else {
      accountBalance.totalAmount -= amount;
    }

    accountBalance.history.push(transaction);

    await accountBalance.save();

    res.status(200).json({
      success: true,
      message: `Transaction ${operation} of ${amount} recorded successfully`,
      data: {
        transaction,
        newBalance: accountBalance.totalAmount
      }
    });
});

export const getEmployeeBalance = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { organizationId } = req.user;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const accountBalance = await AccountBalance.findOne({ 
      userId, 
      organizationId 
    }).populate('userId', 'name email');

    if (!accountBalance) {
      return res.status(404).json({
        success: false,
        message: 'Account balance not found for this user and organization'
      });
    }

    res.status(200).json({
      success: true,
      data: accountBalance
    });

  
});

export const listOrganizationAllBalances =  asyncHandler(async (req, res) => {
    const { organizationId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const accountBalances = await AccountBalance.find({ organizationId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AccountBalance.countDocuments({ organizationId });

    res.status(200).json({
      success: true,
      data: accountBalances,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });
});

export const getTransactionHistory = asyncHandler(async (req, res) => {
    const {organizationId} = req.user;
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const accountBalance = await AccountBalance.findOne({ 
      userId, 
      organizationId 
    }).populate('userId', 'name email');

    if (!accountBalance) {
      return res.status(404).json({
        success: false,
        message: 'No transaction history found'
      });
    }

    // Paginate history
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedHistory = accountBalance.history.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        user: accountBalance.userId,
        currentBalance: accountBalance.totalAmount,
        history: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(accountBalance.history.length / limit),
          totalTransactions: accountBalance.history.length
        }
      }
    });
});

export const getUserBalance =  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { organizationId } = req.user;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const accountBalance = await AccountBalance.findOne({ 
      userId, 
      organizationId 
    });

    const balance = accountBalance ? accountBalance.totalAmount : 0;
    const recentTransactions = accountBalance ? 
      accountBalance.history.slice(-5).reverse() : [];

    res.status(200).json({
      success: true,
      data: {
        currentBalance: balance,
        recentTransactions,
        totalTransactions: accountBalance ? accountBalance.history.length : 0
      }
    });
});

export default router;