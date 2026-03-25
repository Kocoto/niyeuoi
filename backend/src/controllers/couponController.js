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
exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getCoupon = exports.getCoupons = void 0;
const express_1 = require("express");
const Coupon_js_1 = __importStar(require("../models/Coupon.js"));
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon_js_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi lấy danh sách voucher'
        });
    }
};
exports.getCoupons = getCoupons;
const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_js_1.default.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy voucher'
            });
        }
        res.status(200).json({
            success: true,
            data: coupon
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ'
        });
    }
};
exports.getCoupon = getCoupon;
const createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_js_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: coupon
        });
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi tạo voucher'
        });
    }
};
exports.createCoupon = createCoupon;
const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_js_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy voucher'
            });
        }
        res.status(200).json({
            success: true,
            data: coupon
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi cập nhật'
        });
    }
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_js_1.default.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy voucher'
            });
        }
        await coupon.deleteOne();
        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi xóa'
        });
    }
};
exports.deleteCoupon = deleteCoupon;
//# sourceMappingURL=couponController.js.map