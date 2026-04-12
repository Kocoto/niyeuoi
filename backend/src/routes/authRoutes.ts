import express from 'express';
import { getCurrentUser, verifyPin } from '../controllers/authController';

const router = express.Router();

router.post('/verify', verifyPin);
router.get('/me', getCurrentUser);

export default router;
