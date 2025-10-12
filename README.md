# BookStore_microservices_Docker

Project Overview
A fully containerized online bookstore application built using microservices architecture. This demo showcases four independent services communicating through an API Gateway, with built-in resilience patterns including Circuit Breaker for handling service failures. The application simulates real-world e-commerce functionality with a 30% intentional failure rate in the Payment Service to demonstrate fault tolerance.

Architecture & Services
Core Microservices
Catalog Service (catalog:5000)

Manages book inventory

Provides book details (ID, title, price)

REST endpoint: GET /books

Order Service (order:5001)

Processes customer orders

Calculates total cost based on book quantity

Integrates with Payment Service

REST endpoint: POST /orders

Payment Service (payment:5002)

Simulates payment processing

Includes 30% failure rate for testing

REST endpoint: POST /process-payment

API Gateway (gateway:8080)

Single entry point for all client requests

Routes traffic to appropriate services

Provides service discovery abstraction

Key Features
🚀 Service Discovery
Services communicate using Docker DNS names

Automatic container name resolution within Docker network

Example: http://catalog:5000/books from Order Service

🔌 Circuit Breaker Pattern
Implemented in Order Service when calling Payment Service

Three states: Closed, Open, Half-Open

Automatic fallback: Returns "Payment Service temporarily unavailable"

Recovery mechanism: Periodically tests if Payment Service is healthy

🐳 Containerization
Individual Dockerfiles for each service

Docker Compose for orchestration

Isolated service environments

Easy scaling and deployment

Technology Stack
Containerization: Docker, Docker Compose

Programming Languages: Python/Node.js (configurable)

Communication: REST APIs, HTTP

Resilience Patterns: Circuit Breaker

Service Discovery: Docker Internal Networking
