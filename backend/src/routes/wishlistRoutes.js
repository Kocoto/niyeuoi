"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wishlistController_js_1 = require("../controllers/wishlistController.js");
const router = express_1.default.Router();
router.route('/')
    .get(wishlistController_js_1.getWishlist)
    .post(wishlistController_js_1.createWishlistItem);
router.route('/:id')
    .get(wishlistController_js_1.getWishlistItem)
    .put(wishlistController_js_1.updateWishlistItem)
    .delete(wishlistController_js_1.deleteWishlistItem);
exports.default = router;
//# sourceMappingURL=wishlistRoutes.js.map