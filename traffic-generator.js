// traffic-generator.js
const axios = require('axios');

const GATEWAY_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

class TrafficGenerator {
    constructor() {
        this.requestCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.circuitBreakerTriggered = 0;
    }

    async makeRequest(bookID, quantity) {
        this.requestCount++;
        const requestId = this.requestCount;
        
        try {
            console.log(`${colors.blue}📦 Request #${requestId}: Ordering ${quantity}x Book ID ${bookID}${colors.reset}`);
            
            const response = await axios.post(`${GATEWAY_URL}/api/order`, {
                bookID: bookID,
                quantity: quantity
            }, {
                timeout: 30000  // Increased to 30 seconds
            });

            if (response.data.success) {
                this.successCount++;
                const cost = parseFloat(response.data.orderDetails.totalCost).toFixed(2);
                console.log(`${colors.green}✅ Request #${requestId}: SUCCESS - ₹${cost}${colors.reset}`);

            } else {
                this.failureCount++;
                console.log(`${colors.red}❌ Request #${requestId}: FAILED - ${response.data.error}${colors.reset}`);
            }

        } catch (error) {
            this.failureCount++;
            
            if (error.response?.status === 503 && error.response?.data?.error?.includes('temporarily unavailable')) {
                this.circuitBreakerTriggered++;
                console.log(`${colors.yellow}⚡ Request #${requestId}: CIRCUIT BREAKER OPEN${colors.reset}`);
            } else {
                console.log(`${colors.red}❌ Request #${requestId}: ERROR - ${error.message}${colors.reset}`);
            }
        }
    }

    async checkCircuitStatus() {
        try {
            const response = await axios.get(`${GATEWAY_URL}/api/circuit-status`);
            const status = response.data;
            
            console.log(`\n${colors.blue}🔌 Circuit Breaker Status:${colors.reset}`);
            console.log(`   State: ${status.state}`);
            console.log(`   Failures: ${status.failureCount}/${status.threshold}`);
            console.log('');
            
        } catch (error) {
            console.log(`${colors.red}Failed to get circuit status${colors.reset}`);
        }
    }

    printStats() {
        console.log(`\n${colors.blue}📊 Traffic Generator Statistics:${colors.reset}`);
        console.log(`   Total Requests: ${this.requestCount}`);
        console.log(`   Successful: ${colors.green}${this.successCount}${colors.reset}`);
        console.log(`   Failed: ${colors.red}${this.failureCount}${colors.reset}`);
        console.log(`   Circuit Breaker Triggered: ${colors.yellow}${this.circuitBreakerTriggered}${colors.reset}`);
        console.log(`   Success Rate: ${((this.successCount / this.requestCount) * 100).toFixed(1)}%`);
        console.log('');
    }

    async generateTraffic(totalRequests = 20, delayMs = 2000) {
        console.log(`${colors.blue}🚀 Starting Traffic Generator...${colors.reset}`);
        console.log(`   Will send ${totalRequests} requests with ${delayMs}ms delay\n`);

        for (let i = 0; i < totalRequests; i++) {
            const bookID = Math.floor(Math.random() * 5) + 1; // Random book ID 1-5
            const quantity = Math.floor(Math.random() * 3) + 1; // Random quantity 1-3
            
            await this.makeRequest(bookID, quantity);
            
            // Check circuit status every 5 requests
            if (i > 0 && (i + 1) % 5 === 0) {
                await this.checkCircuitStatus();
            }
            
            // Wait before next request
            if (i < totalRequests - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        await this.checkCircuitStatus();
        this.printStats();
    }
}

// Command line usage
async function main() {
    const generator = new TrafficGenerator();
    
    console.log(`${colors.blue}=== Online Bookstore Traffic Generator ===${colors.reset}\n`);
    
    // Check if services are running
    try {
        await axios.get(`${GATEWAY_URL}/health`);
        console.log(`${colors.green}✅ Gateway is running${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}❌ Cannot connect to gateway. Make sure services are running with 'docker-compose up'${colors.reset}`);
        return;
    }

    // Get command line arguments
    const totalRequests = parseInt(process.argv[2]) || 15;
    const delayMs = parseInt(process.argv[3]) || 2000;

    await generator.generateTraffic(totalRequests, delayMs);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Traffic generator stopped${colors.reset}`);
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = TrafficGenerator;