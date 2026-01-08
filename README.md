# 📚 BookStore Microservices with Docker

A production-ready online bookstore application demonstrating **microservices architecture**, **Docker containerization**, and **resilience patterns** including Circuit Breaker implementation. This project simulates real-world e-commerce functionality with intentional failure scenarios to showcase fault-tolerance mechanisms.

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Microservices](https://img.shields.io/badge/Architecture-Microservices-blue)](https://microservices.io/)

---

## 🎯 Project Overview

This project implements a fully containerized bookstore application using **microservices architecture**. It features four independent services that communicate through an API Gateway, with built-in resilience patterns to handle service failures gracefully.

### Key Highlights

- ⚡ **Circuit Breaker Pattern** for fault tolerance
- 🐳 **Docker Compose** orchestration
- 🌐 **API Gateway** for centralized routing
- 🔄 **Service Discovery** using Docker DNS
- 📊 **Traffic Generator** for load testing
- 🎨 **30% Intentional Failure Rate** to demonstrate resilience

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │ :3000
│  (gateway)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬
    ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Catalog │ │ Order  │ │ Payment  │
│:5000   │ │:5001   │ │ :5002    │
└────────┘ └────┬───┘ └──────────┘
                │          ▲
                └──────────┘
              Circuit Breaker
```

### Microservices

| Service | Port | Purpose | Key Features |
|---------|------|---------|--------------|
| **API Gateway** | 3000 | Single entry point for all requests | Routes traffic, service discovery abstraction |
| **Catalog Service** | 5000 (5050 external) | Book inventory management | Returns book details (ID, title, price) |
| **Order Service** | 5001 (5051 external) | Order processing | Calculates costs, implements Circuit Breaker |
| **Payment Service** | 5002 (5052 external) | Payment processing | Simulates payments with 30% failure rate |

---

## 🔌 Circuit Breaker Implementation

The Order Service implements a **Circuit Breaker** when calling the Payment Service to prevent cascading failures.

### States

| State | Description | Behavior |
|-------|-------------|----------|
| **CLOSED** | Normal operation | Requests pass through normally |
| **OPEN** | Too many failures detected | Requests fail immediately with fallback message |
| **HALF-OPEN** | Testing recovery | One request allowed to test if service recovered |

### Configuration

- **Failure Threshold**: 3 consecutive failures
- **Timeout**: 60 seconds
- **Reset Timeout**: 10 seconds (before switching to HALF-OPEN)

### Fallback Response

When the circuit is OPEN:
```json
{
  "success": false,
  "error": "Payment Service temporarily unavailable",
  "circuitBreakerState": {
    "state": "OPEN",
    "failureCount": 3,
    "threshold": 3
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Node.js](https://nodejs.org/) (v18+) - for traffic generator only

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aarnav-JP/BookStore_microservices_Docker.git
   cd bookstore
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

3. **Verify services are running**
   ```bash
   docker ps
   ```

   You should see 4 containers running:
   - `bookstore_gateway`
   - `bookstore_catalog`
   - `bookstore_order`
   - `bookstore_payment`

4. **Test the application**
   ```bash
   curl http://localhost:3000/
   ```

---

## 📖 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. **Get All Books**
```bash
GET /api/books
```

**Response:**
```json
[
  {
    "bookID": 1,
    "title": "The Great Gatsby",
    "price": 15.99
  },
  {
    "bookID": 2,
    "title": "To Kill a Mockingbird",
    "price": 12.50
  }
]
```

#### 2. **Get Book by ID**
```bash
GET /api/books/:id
```

**Example:**
```bash
curl http://localhost:3000/api/books/1
```

**Response:**
```json
{
  "bookID": 1,
  "title": "The Great Gatsby",
  "price": 15.99
}
```

#### 3. **Place an Order**
```bash
POST /api/order
Content-Type: application/json
```

**Request Body:**
```json
{
  "bookID": 1,
  "quantity": 2
}
```

**Success Response:**
```json
{
  "success": true,
  "orderDetails": {
    "book": "The Great Gatsby",
    "quantity": 2,
    "unitPrice": 15.99,
    "totalCost": 31.98
  },
  "payment": {
    "success": true,
    "transactionId": "TXN-1234567890-abc123",
    "amount": 31.98,
    "status": "completed"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"bookID": 1, "quantity": 2}'
```

#### 4. **Check Circuit Breaker Status**
```bash
GET /api/circuit-status
```

**Response:**
```json
{
  "state": "CLOSED",
  "failureCount": 0,
  "threshold": 3
}
```

#### 5. **Health Check**
```bash
GET /health
```

---

## 🧪 Testing with Traffic Generator

The included traffic generator simulates concurrent user requests to test the Circuit Breaker pattern.

### Install Dependencies
```bash
npm install
```

### Run Traffic Generator

**Basic usage (15 requests, 2s delay):**
```bash
npm start
```

**Custom configuration:**
```bash
node traffic-generator.js <num_requests> <delay_ms>
```

**Examples:**
```bash
# Send 50 requests with 1 second delay
node traffic-generator.js 50 1000

# Send 100 requests with 500ms delay
node traffic-generator.js 100 500
```

### Expected Output

```
🚀 Starting Traffic Generator...
   Will send 15 requests with 2000ms delay

📦 Request #1: Ordering 2x Book ID 3
✅ Request #1: SUCCESS - ₹29.50
📦 Request #2: Ordering 1x Book ID 1
❌ Request #2: FAILED - Payment processing failed
📦 Request #3: Ordering 3x Book ID 2
❌ Request #3: FAILED - Payment processing failed
📦 Request #4: Ordering 1x Book ID 5
❌ Request #4: FAILED - Payment processing failed

🔌 Circuit Breaker Status:
   State: OPEN
   Failures: 3/3

⚡ Request #5: CIRCUIT BREAKER OPEN
⚡ Request #6: CIRCUIT BREAKER OPEN
```

---

## 🔍 Service Discovery & Inter-Service Communication

Services communicate using **Docker's internal DNS resolution**. Each service is accessible by its hostname within the `bookstore-network`.

### Example Communications

| From | To | URL |
|------|----|----|
| Order Service | Catalog Service | `http://catalog:5000/books` |
| Order Service | Payment Service | `http://payment:5002/pay` |
| API Gateway | Order Service | `http://order:5001/order` |

### Testing Connectivity

Enter a container and test DNS resolution:
```bash
# Enter the order service container
docker exec -it bookstore_order sh

# Test connectivity to catalog service
ping catalog

# Make HTTP request to catalog
wget -O- http://catalog:5000/books

# Exit container
exit
```

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18 |
| **Framework** | Express.js |
| **Containerization** | Docker, Docker Compose |
| **Architecture** | Microservices |
| **Communication** | REST APIs (HTTP) |
| **Patterns** | Circuit Breaker, API Gateway |
| **Service Discovery** | Docker DNS |
| **Testing** | Custom Traffic Generator |

---

## 📂 Project Structure

```
bookstore/
├── api-gateway/              # API Gateway service
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── catalog-service/          # Catalog microservice
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── order-service/            # Order processing service
│   ├── Dockerfile
│   ├── package.json
│   └── server.js            # Includes Circuit Breaker
├── payment-service/          # Payment processing service
│   ├── Dockerfile
│   ├── package.json
│   └── server.js            # 30% failure simulation
├── docker-compose.yml        # Orchestration configuration
├── traffic-generator.js      # Load testing tool
├── package.json
└── README.md
```

---

## 🎮 Usage Examples

### Scenario 1: Successful Order
```bash
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"bookID": 1, "quantity": 2}'
```

### Scenario 2: View Catalog
```bash
curl http://localhost:3000/api/books
```

### Scenario 3: Test Circuit Breaker
```bash
# Run traffic generator to trigger multiple failures
npm start

# Check circuit breaker status
curl http://localhost:3000/api/circuit-status
```

### Scenario 4: Simulate Payment Service Failure
```bash
# Stop payment service
docker-compose stop payment

# Try to place an order (circuit will open after threshold)
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"bookID": 2, "quantity": 1}'

# Restart payment service
docker-compose start payment
```

---

## 🐛 Troubleshooting

### Services not starting
```bash
# Check logs for all services
docker-compose logs

# Check specific service
docker-compose logs gateway
docker-compose logs order
```

### Reset everything
```bash
# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up --build
```

### Port conflicts
If ports 3000, 5050, 5051, or 5052 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 3000 to any available port
```

---

## 📊 Monitoring & Logs

### View logs in real-time
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order
docker-compose logs -f payment
```

### View last N log lines
```bash
docker-compose logs order | tail -20
docker-compose logs gateway | tail -10
```

---

## 🎓 Learning Objectives

This project demonstrates:

1. **Microservices Architecture**
   - Service decomposition
   - Independent deployment
   - Loose coupling

2. **Containerization**
   - Docker image creation
   - Multi-container orchestration
   - Networking and service discovery

3. **Resilience Patterns**
   - Circuit Breaker implementation
   - Graceful degradation
   - Fault isolation

4. **API Design**
   - RESTful endpoints
   - API Gateway pattern
   - Request routing

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is open source and available for educational purposes.

---

## 👤 Author

**Aarnav JP**

- GitHub: [@Aarnav-JP](https://github.com/Aarnav-JP)
- Repository: [BookStore_microservices_Docker](https://github.com/Aarnav-JP/BookStore_microservices_Docker)

---

## 🔗 Additional Resources

- [Microservices Architecture](https://microservices.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)

---

**Built with ❤️ for learning Cloud Computing and Microservices Architecture**
