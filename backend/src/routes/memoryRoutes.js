"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const memoryController_js_1 = require("../controllers/memoryController.js");
router
    .route('/')
    .get(memoryController_js_1.getMemories)
    .post(memoryController_js_1.createMemory);
router
    .route('/:id')
    .get(memoryController_js_1.getMemory)
    .put(memoryController_js_1.updateMemory)
    .delete(memoryController_js_1.deleteMemory);
exports.default = router;
//# sourceMappingURL=memoryRoutes.js.map