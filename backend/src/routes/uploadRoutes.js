"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadMiddleware_js_1 = __importDefault(require("../middleware/uploadMiddleware.js"));
const router = express_1.default.Router();
router.post('/', uploadMiddleware_js_1.default.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Không tìm thấy file để upload'
        });
    }
    res.status(200).json({
        success: true,
        data: {
            url: req.file.path,
            public_id: req.file.filename
        }
    });
});
exports.default = router;
//# sourceMappingURL=uploadRoutes.js.map