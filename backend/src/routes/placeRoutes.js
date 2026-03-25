"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const placeController_js_1 = require("../controllers/placeController.js");
router
    .route('/')
    .get(placeController_js_1.getPlaces)
    .post(placeController_js_1.createPlace);
router.get('/random', placeController_js_1.getRandomPlace);
router
    .route('/:id')
    .get(placeController_js_1.getPlace)
    .put(placeController_js_1.updatePlace)
    .delete(placeController_js_1.deletePlace);
exports.default = router;
//# sourceMappingURL=placeRoutes.js.map