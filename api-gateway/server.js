// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 3000;

app.use(express.json());

// Add detailed logging
app.use((req, res, next) => {
    console.log(`🌐 Gateway: ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Welcome message
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Online Bookstore API Gateway!',
        endpoints: {
            books: 'GET /api/books - Get all books',
            book: 'GET /api/books/:id - Get specific book',
            order: 'POST /api/order - Place an order',
            circuitStatus: 'GET /api/circuit-status - Check circuit breaker status'
        }
    });
});

// Test connectivity to backend services
app.get('/test-connectivity', async (req, res) => {
    const axios = require('axios');
    const results = {};
    
    try {
        await axios.get('http://catalog:5000/books', { timeout: 3000 });
        results.catalog = 'OK';
    } catch (error) {
        results.catalog = `FAILED: ${error.message}`;
    }
    
    try {
        await axios.get('http://order:5001/health', { timeout: 3000 });
        results.order = 'OK';
    } catch (error) {
        results.order = `FAILED: ${error.message}`;
    }
    
    try {
        await axios.get('http://payment:5002/health', { timeout: 3000 });
        results.payment = 'OK';
    } catch (error) {
        results.payment = `FAILED: ${error.message}`;
    }
    
    res.json(results);
});

// Direct order endpoint (bypass proxy for debugging)
app.post('/api/order-direct', async (req, res) => {
    const axios = require('axios');
    console.log('🎯 Direct order request received:', req.body);
    
    try {
        console.log('📞 Calling order service directly...');
        const response = await axios.post('http://order:5001/order', req.body, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Order service responded successfully');
        res.json(response.data);
    } catch (error) {
        console.log('❌ Direct order call failed:', error.message);
        res.status(500).json({ 
            error: 'Direct order failed', 
            details: error.message,
            code: error.code 
        });
    }
});

// Proxy configuration for catalog service
app.use('/api/books', createProxyMiddleware({
    target: 'http://catalog:5000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/books': '/books'
    },
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🌐 Gateway: Routing ${req.method} ${req.path} -> catalog service`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Gateway: Catalog responded with status ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.log(`❌ Gateway: Catalog service error - ${err.message}`);
        res.status(503).json({ error: 'Catalog service unavailable' });
    }
}));

// Manual order handling instead of proxy
app.post('/api/order', async (req, res) => {
    const axios = require('axios');
    console.log('📦 Gateway: Order request received');
    console.log('📝 Request body:', req.body);
    
    try {
        console.log('🔄 Gateway: Forwarding to order service...');
        const response = await axios.post('http://order:5001/order', req.body, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Gateway: Order service responded successfully');
        res.json(response.data);
    } catch (error) {
        console.log('❌ Gateway: Order failed:', error.message);
        console.log('🔍 Error response:', error.response?.data);
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Order service unavailable', details: error.message }
        );
    }
});

// Keep the proxy for circuit status
app.use('/api/circuit-status', createProxyMiddleware({
    target: 'http://order:5001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/circuit-status': '/circuit-status'
    },
    timeout: 10000,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🌐 Gateway: Routing ${req.method} ${req.path} -> order service`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Gateway: Circuit status responded with status ${proxyRes.statusCode}`);
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'api-gateway' });
});

app.listen(port, () => {
    console.log(`🌐 API Gateway running on port ${port}`);
    console.log(`🔗 Access the bookstore at: http://localhost:${port}`);
    console.log('🔍 Debug logging enabled');
});