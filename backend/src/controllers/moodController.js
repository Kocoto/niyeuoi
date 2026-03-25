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
exports.deleteMood = exports.updateMood = exports.createMood = exports.getMood = exports.getMoods = void 0;
const express_1 = require("express");
const Mood_js_1 = __importStar(require("../models/Mood.js"));
const getMoods = async (req, res) => {
    try {
        const moods = await Mood_js_1.default.find().sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: moods.length,
            data: moods
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi lấy danh sách tâm trạng'
        });
    }
};
exports.getMoods = getMoods;
const getMood = async (req, res) => {
    try {
        const mood = await Mood_js_1.default.findById(req.params.id);
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi tâm trạng'
            });
        }
        res.status(200).json({
            success: true,
            data: mood
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ'
        });
    }
};
exports.getMood = getMood;
const createMood = async (req, res) => {
    try {
        const mood = await Mood_js_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: mood
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
            error: 'Lỗi máy chủ khi tạo bản ghi tâm trạng'
        });
    }
};
exports.createMood = createMood;
const updateMood = async (req, res) => {
    try {
        const mood = await Mood_js_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi tâm trạng'
            });
        }
        res.status(200).json({
            success: true,
            data: mood
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ khi cập nhật'
        });
    }
};
exports.updateMood = updateMood;
const deleteMood = async (req, res) => {
    try {
        const mood = await Mood_js_1.default.findById(req.params.id);
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi tâm trạng'
            });
        }
        await mood.deleteOne();
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
exports.deleteMood = deleteMood;
//# sourceMappingURL=moodController.js.map