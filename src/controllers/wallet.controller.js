import e from 'connect-flash';
import pool from '../config/db.js';

// Get dashboard data
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);

    // Get last 10 transactions
    const transactions = await pool.query(
      'SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Calculate balance
    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount
                    WHEN type='expense' THEN -amount
                    ELSE 0 END),0) AS balance
       FROM transactions WHERE user_id=$1`,
      [userId]
    );

    const balance = balanceResult.rows[0].balance || 0;

    res.render('dashboard', { user: user.rows[0], transactions: transactions.rows, balance });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
};

// API to fetch chart data
export const getChartData = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await pool.query(
      `SELECT DATE(created_at) AS date,
              SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE user_id=$1
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      [userId]
    );

    const chartData = {
      dates: data.rows.map(r => r.date.toISOString().split('T')[0]),
      income: data.rows.map(r => parseFloat(r.income)),
      expense: data.rows.map(r => parseFloat(r.expense))
    };

    res.json(chartData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching chart data');
  }
};

// Transfer money to another user
export const transferMoney = async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;
    const senderId = req.user.id;
    const transferAmount = parseFloat(amount);

    if (!recipientEmail || !amount || transferAmount <= 0) {
      return res.status(400).send('Invalid input');
    }

    const sender = await pool.query('SELECT balance FROM users WHERE id=$1', [senderId]);
    if (sender.rows[0].balance < transferAmount) {
      return res.status(400).send('Insufficient funds');
    }

    const recipient = await pool.query('SELECT * FROM users WHERE email=$1', [recipientEmail]);
    if (recipient.rows.length === 0) return res.status(404).send('Recipient not found');

    const recipientId = recipient.rows[0].id;

    // Begin transaction
    await pool.query('BEGIN');

    // Deduct from sender
    await pool.query('UPDATE users SET balance=balance-$1 WHERE id=$2', [transferAmount, senderId]);
    await pool.query(
      'INSERT INTO transactions(user_id,type,amount,recipient_id,description) VALUES($1,$2,$3,$4,$5)',
      [senderId, 'transfer', transferAmount, recipientId, description || 'Sent money']
    );

    // Add to recipient
    await pool.query('UPDATE users SET balance=balance+$1 WHERE id=$2', [transferAmount, recipientId]);
    await pool.query(
      'INSERT INTO transactions(user_id,type,amount,recipient_id,description) VALUES($1,$2,$3,$4,$5)',
      [recipientId, 'income', transferAmount, senderId, description || 'Received money']
    );

    await pool.query('COMMIT');

    // --- SOCKET.IO: Emit events inside the handler ---
    const io = req.app.get('io'); // ✅ Must be here
    io.to(`user_${senderId}`).emit('newTransaction', { type: 'sent', amount: transferAmount, recipientEmail });
    io.to(`user_${recipientId}`).emit('newTransaction', { type: 'received', amount: transferAmount, senderEmail: req.user.email });

    res.redirect('/dashboard');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Error processing transfer');
  }
};


