import { body } from 'express-validator';

export const createTransactionValidation = [
  body('accountId')
    .isInt({ min: 1 })
    .withMessage('accountId must be a positive integer'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('amount must be greater than zero'),
  body('transactionType')
    .isIn(['DEBIT', 'CREDIT'])
    .withMessage('transactionType must be DEBIT or CREDIT'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('username must be 3-50 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters'),
];
