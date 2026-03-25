"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_js_1 = __importDefault(require("../config/cloudinary.js"));
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_js_1.default,
    params: async (req, file) => {
        return {
            folder: 'niyeuoi',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
        };
    },
});
const upload = (0, multer_1.default)({ storage });
exports.default = upload;
//# sourceMappingURL=uploadMiddleware.js.map