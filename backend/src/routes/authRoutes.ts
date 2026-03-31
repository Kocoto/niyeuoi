import express from 'express';
import { verifyPin } from '../controllers/authController';

const router = express.Router();

router.post('/verify', verifyPin);

export default router;
