"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_js_1 = require("../controllers/eventController.js");
const router = express_1.default.Router();
router.route('/')
    .get(eventController_js_1.getEvents)
    .post(eventController_js_1.createEvent);
router.route('/:id')
    .get(eventController_js_1.getEvent)
    .put(eventController_js_1.updateEvent)
    .delete(eventController_js_1.deleteEvent);
exports.default = router;
//# sourceMappingURL=eventRoutes.js.map