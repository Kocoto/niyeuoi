import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (_req, file) => {
        return {
            folder: 'niyeuoi',
            public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '_')}`
        };
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP'));
    }
};

const upload = multer({ storage, fileFilter });

export default upload;
