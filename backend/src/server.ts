import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Cho phép requests không có origin (mobile apps, curl, Postman)
        // và tất cả subdomain của onrender.com
        if (!origin || origin.endsWith('.onrender.com') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            logger.warn('CORS', `Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());

// HTTP request logger
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        logger.http(req.method, req.originalUrl, res.statusCode, Date.now() - start);
    });
    next();
});

// Routes
import placeRoutes from './routes/placeRoutes';
import memoryRoutes from './routes/memoryRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import eventRoutes from './routes/eventRoutes';
import couponRoutes from './routes/couponRoutes';
import moodRoutes from './routes/moodRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import challengeRoutes from './routes/challengeRoutes';
import locationRoutes from './routes/locationRoutes';
import deepTalkRoutes from './routes/deepTalkRoutes';
import * as schedulerService from './services/schedulerService';

app.use('/api/places', placeRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/deeptalk', deepTalkRoutes);

// Basic Route
app.get('/', (_req: Request, res: Response) => {
    res.send('Niyeuoi Backend (TypeScript) is running!');
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting
    if (dbState === 1) {
        res.status(200).json({ status: 'ok', db: 'connected' });
    } else {
        res.status(503).json({ status: 'starting', db: 'connecting' });
    }
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niyeuoi';
// Kiểm tra Cloudinary config
const cloudinaryOk = !!(process.env['CLOUDINARY_CLOUD_NAME'] && process.env['CLOUDINARY_API_KEY'] && process.env['CLOUDINARY_API_SECRET']);
if (cloudinaryOk) {
    logger.success('Cloudinary', `Config hợp lệ (cloud: ${process.env['CLOUDINARY_CLOUD_NAME']})`);
} else {
    logger.warn('Cloudinary', 'Thiếu env vars — upload ảnh sẽ không hoạt động', {
        CLOUDINARY_CLOUD_NAME: !!process.env['CLOUDINARY_CLOUD_NAME'],
        CLOUDINARY_API_KEY: !!process.env['CLOUDINARY_API_KEY'],
        CLOUDINARY_API_SECRET: !!process.env['CLOUDINARY_API_SECRET'],
    });
}

logger.info('Server', 'Đang kết nối MongoDB...', { uri: MONGODB_URI.replace(/:\/\/.*@/, '://***@') });
mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.success('Server', 'Kết nối MongoDB thành công');
        schedulerService.start();
        app.listen(PORT, () => {
            logger.success('Server', `Đang chạy trên cổng ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('Server', 'Kết nối MongoDB thất bại', err);
    });
