import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

app.use('/api/places', placeRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
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
logger.info('Server', 'Đang kết nối MongoDB...', { uri: MONGODB_URI.replace(/:\/\/.*@/, '://***@') });
mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.success('Server', 'Kết nối MongoDB thành công');
        app.listen(PORT, () => {
            logger.success('Server', `Đang chạy trên cổng ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('Server', 'Kết nối MongoDB thất bại', err);
    });
