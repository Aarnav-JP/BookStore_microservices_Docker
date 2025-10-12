// payment-service/server.js
const express = require('express');
const app = express();
const port = 5002;

app.use(express.json());

// Process payment with 30% failure rate
app.post('/pay', (req, res) => {
    const { amount, orderId } = req.body;
    
    console.log(`💳 Payment request: $${amount} for order ${orderId}`);
    
    // Simulate 30% failure rate
    const random = Math.random();
    const shouldFail = random < 0.3;
    
    // Add some processing delay
    setTimeout(() => {
        if (shouldFail) {
            console.log(`❌ Payment failed (random: ${random.toFixed(2)})`);
            res.status(500).json({
                success: false,
                error: 'Payment processing failed',
                transactionId: null
            });
        } else {
            const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log(`✅ Payment successful: ${transactionId}`);
            res.json({
                success: true,
                transactionId: transactionId,
                amount: amount,
                status: 'completed'
            });
        }
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'payment' });
});

app.listen(port, () => {
    console.log(`💳 Payment Service running on port ${port}`);
    console.log(`⚠️  Configured with 30% failure rate`);
});