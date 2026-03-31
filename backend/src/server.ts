import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niyeuoi';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });
