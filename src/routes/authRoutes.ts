import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController';
import { loginValidation, registerValidation } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.get('/me', authenticate, getProfile);

export default router;
