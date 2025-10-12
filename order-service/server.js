// order-service/server.js (Updated with better debugging)
const express = require('express');
const axios = require('axios');
const app = express();
const port = 5001;

app.use(express.json());

// Circuit Breaker implementation
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000, resetTimeout = 30000) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.resetTimeout = resetTimeout;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED';
    }

    async call(serviceCall) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit Breaker: HALF_OPEN - Trying one request');
            } else {
                console.log('⚡ Circuit Breaker: OPEN - Request blocked');
                throw new Error('Payment Service temporarily unavailable');
            }
        }

        try {
            const result = await serviceCall();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        console.log('✅ Circuit Breaker: CLOSED - Service working');
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            console.log(`🔥 Circuit Breaker: OPEN - ${this.failureCount} failures reached`);
        }
        
        console.log(`❌ Circuit Breaker: Failure ${this.failureCount}/${this.threshold}`);
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            threshold: this.threshold
        };
    }
}

const paymentCircuitBreaker = new CircuitBreaker(3, 60000, 10000);

// Process order
app.post('/order', async (req, res) => {
    const { bookID, quantity } = req.body;

    console.log(`📦 Received order request: Book ID ${bookID}, Quantity: ${quantity}`);

    if (!bookID || !quantity || quantity <= 0) {
        console.log('❌ Invalid order data');
        return res.status(400).json({ error: 'Invalid order data' });
    }

    try {
        console.log('🔍 Step 1: Getting book details from catalog service...');
        console.log('🌐 Calling: http://catalog:5000/books/' + bookID);
        
        // Get book details from catalog service with timeout
        const bookResponse = await axios.get(`http://catalog:5000/books/${bookID}`, {
            timeout: 5000
        });
        
        const book = bookResponse.data;
        console.log(`📚 Found book: ${book.title} - ${book.price}`);
        
        const totalCost = Math.round(book.price * quantity * 100) / 100; // Round to 2 decimal places
        console.log(`💰 Total cost calculated: ${totalCost}`);

        console.log('🔍 Step 2: Processing payment...');
        
        // Process payment through circuit breaker
        const paymentResult = await paymentCircuitBreaker.call(async () => {
            console.log('💳 Calling payment service...');
            console.log('🌐 Calling: http://payment:5002/pay');
            
            const paymentResponse = await axios.post('http://payment:5002/pay', {
                amount: totalCost,
                orderId: `ORDER-${Date.now()}`
            }, { 
                timeout: 8000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('💳 Payment service responded');
            return paymentResponse.data;
        });

        console.log('✅ Order completed successfully');
        res.json({
            success: true,
            orderDetails: {
                book: book.title,
                quantity: quantity,
                unitPrice: Math.round(book.price * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100
            },
            payment: paymentResult
        });

    } catch (error) {
        console.log(`❌ Order failed at step: ${error.message}`);
        console.log(`🔍 Error details:`, error.code || 'No error code');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🚫 Connection refused - service not reachable');
        }
        if (error.code === 'ETIMEDOUT') {
            console.log('⏰ Request timed out');
        }
        
        if (error.message === 'Payment Service temporarily unavailable') {
            res.status(503).json({ 
                success: false, 
                error: 'Payment Service temporarily unavailable',
                circuitBreakerState: paymentCircuitBreaker.getState()
            });
        } else if (error.response?.status === 404) {
            res.status(404).json({ success: false, error: 'Book not found' });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(500).json({ 
                success: false, 
                error: 'Service connection failed',
                details: `Cannot connect to ${error.config?.url || 'unknown service'}`,
                errorCode: error.code
            });
        } else if (error.code === 'ETIMEDOUT') {
            res.status(500).json({ 
                success: false, 
                error: 'Service timeout',
                details: `Timeout connecting to ${error.config?.url || 'unknown service'}`,
                errorCode: error.code
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Order processing failed',
                details: error.message,
                errorCode: error.code,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
});

// Health check
app.get('/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ status: 'healthy', service: 'order' });
});

// Get circuit breaker status
app.get('/circuit-status', (req, res) => {
    console.log('🔌 Circuit status requested');
    res.json(paymentCircuitBreaker.getState());
});

// Test connectivity on startup
async function testConnectivity() {
    console.log('🔍 Testing service connectivity...');
    
    try {
        console.log('📚 Testing catalog service...');
        const catalogResponse = await axios.get('http://catalog:5000/books', { timeout: 3000 });
        console.log('✅ Catalog service is reachable');
    } catch (error) {
        console.log('❌ Cannot reach catalog service:', error.message);
        console.log('🔍 Error code:', error.code);
    }
    
    try {
        console.log('💳 Testing payment service...');
        const paymentResponse = await axios.get('http://payment:5002/health', { timeout: 3000 });
        console.log('✅ Payment service is reachable');
    } catch (error) {
        console.log('❌ Cannot reach payment service:', error.message);
        console.log('🔍 Error code:', error.code);
    }
}

app.listen(port, () => {
    console.log(`📦 Order Service running on port ${port}`);
    console.log('🔍 Debug mode enabled with detailed logging');
    
    // Test connectivity after a short delay
    setTimeout(testConnectivity, 2000);
});