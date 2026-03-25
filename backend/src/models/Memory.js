"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const memorySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề kỷ niệm là bắt buộc'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Ngày kỷ niệm là bắt buộc'],
        default: Date.now
    },
    content: {
        type: String,
        required: [true, 'Nội dung kỷ niệm là bắt buộc'],
        trim: true
    },
    media: [{
            type: String, // Lưu URL từ Cloudinary
            required: true
        }],
    mood: {
        type: String,
        default: 'Hạnh phúc'
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Memory', memorySchema);
//# sourceMappingURL=Memory.js.map