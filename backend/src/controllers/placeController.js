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
exports.deletePlace = exports.getRandomPlace = exports.updatePlace = exports.createPlace = exports.getPlace = exports.getPlaces = void 0;
const express_1 = require("express");
const Place_js_1 = __importStar(require("../models/Place.js"));
// @desc    Lấy tất cả địa điểm
// @route   GET /api/places
const getPlaces = async (req, res) => {
    try {
        const places = await Place_js_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: places.length,
            data: places
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi lấy danh sách địa điểm'
        });
    }
};
exports.getPlaces = getPlaces;
// @desc    Lấy chi tiết một địa điểm
// @route   GET /api/places/:id
const getPlace = async (req, res) => {
    try {
        const place = await Place_js_1.default.findById(req.params.id);
        if (!place) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy địa điểm'
            });
        }
        res.status(200).json({
            success: true,
            data: place
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ'
        });
    }
};
exports.getPlace = getPlace;
// @desc    Thêm địa điểm mới
// @route   POST /api/places
const createPlace = async (req, res) => {
    try {
        const place = await Place_js_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: place
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
            error: 'Lỗi máy chủ khi tạo địa điểm'
        });
    }
};
exports.createPlace = createPlace;
// @desc    Cập nhật địa điểm
// @route   PUT /api/places/:id
const updatePlace = async (req, res) => {
    try {
        const place = await Place_js_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!place) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy địa điểm'
            });
        }
        res.status(200).json({
            success: true,
            data: place
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi cập nhật'
        });
    }
};
exports.updatePlace = updatePlace;
// @desc    Lấy địa điểm ngẫu nhiên (Trạm Cứu đói)
// @route   GET /api/places/random
const getRandomPlace = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query = { category };
        }
        const count = await Place_js_1.default.countDocuments(query);
        if (count === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy địa điểm nào trong danh sách'
            });
        }
        const random = Math.floor(Math.random() * count);
        const place = await Place_js_1.default.findOne(query).skip(random);
        res.status(200).json({
            success: true,
            data: place
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi lấy địa điểm ngẫu nhiên'
        });
    }
};
exports.getRandomPlace = getRandomPlace;
// @desc    Xóa địa điểm
// @route   DELETE /api/places/:id
const deletePlace = async (req, res) => {
    try {
        const place = await Place_js_1.default.findById(req.params.id);
        if (!place) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy địa điểm'
            });
        }
        await place.deleteOne();
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
exports.deletePlace = deletePlace;
//# sourceMappingURL=placeController.js.map