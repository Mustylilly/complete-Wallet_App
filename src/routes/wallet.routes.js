import express from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { transferMoney } from '../controllers/wallet.controller.js';

const router = express.Router();

// Transfer form page
router.get('/auth/transfer',
     ensureAuthenticated, (req, res) => 
        res.render('transfer'));

// Handle transfer
router.post('/transfer'
    , ensureAuthenticated, transferMoney);

export default router;
