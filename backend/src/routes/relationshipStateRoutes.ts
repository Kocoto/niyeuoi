import express from 'express';
import { getRelationshipState } from '../controllers/relationshipStateController';

const router = express.Router();

router.route('/').get(getRelationshipState);

export default router;
