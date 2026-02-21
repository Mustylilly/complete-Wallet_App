import express from 'express';
import { getDashboard, getChartData } from '../controllers/wallet.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', ensureAuthenticated, getDashboard);
router.get('/chart-data', ensureAuthenticated, getChartData);

export default router;
