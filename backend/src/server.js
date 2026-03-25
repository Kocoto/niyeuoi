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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
const placeRoutes_js_1 = __importDefault(require("./routes/placeRoutes.js"));
const memoryRoutes_js_1 = __importDefault(require("./routes/memoryRoutes.js"));
const wishlistRoutes_js_1 = __importDefault(require("./routes/wishlistRoutes.js"));
const eventRoutes_js_1 = __importDefault(require("./routes/eventRoutes.js"));
const couponRoutes_js_1 = __importDefault(require("./routes/couponRoutes.js"));
const moodRoutes_js_1 = __importDefault(require("./routes/moodRoutes.js"));
const uploadRoutes_js_1 = __importDefault(require("./routes/uploadRoutes.js"));
app.use('/api/places', placeRoutes_js_1.default);
app.use('/api/memories', memoryRoutes_js_1.default);
app.use('/api/wishlist', wishlistRoutes_js_1.default);
app.use('/api/events', eventRoutes_js_1.default);
app.use('/api/coupons', couponRoutes_js_1.default);
app.use('/api/moods', moodRoutes_js_1.default);
app.use('/api/upload', uploadRoutes_js_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.send('Niyeuoi Backend (TypeScript) is running!');
});
// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/niyeuoi';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});
//# sourceMappingURL=server.js.map