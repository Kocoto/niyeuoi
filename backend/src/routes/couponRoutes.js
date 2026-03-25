"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const couponController_js_1 = require("../controllers/couponController.js");
const router = express_1.default.Router();
router.route('/')
    .get(couponController_js_1.getCoupons)
    .post(couponController_js_1.createCoupon);
router.route('/:id')
    .get(couponController_js_1.getCoupon)
    .put(couponController_js_1.updateCoupon)
    .delete(couponController_js_1.deleteCoupon);
exports.default = router;
//# sourceMappingURL=couponRoutes.js.map