"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const moodController_js_1 = require("../controllers/moodController.js");
const router = express_1.default.Router();
router.route('/')
    .get(moodController_js_1.getMoods)
    .post(moodController_js_1.createMood);
router.route('/:id')
    .get(moodController_js_1.getMood)
    .put(moodController_js_1.updateMood)
    .delete(moodController_js_1.deleteMood);
exports.default = router;
//# sourceMappingURL=moodRoutes.js.map