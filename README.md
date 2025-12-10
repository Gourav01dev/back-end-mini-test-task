# NestJS Backend API with MongoDB

A complete backend API built with NestJS, featuring JWT authentication, product management, Redis caching, background jobs, and real-time WebSocket events.

## Features

- User Registration & Login with JWT Authentication
- CRUD operations for Products
- Redis caching for product listings
- Background jobs using Bull for email notifications
- WebSocket events for real-time product creation notifications
- Real-time dashboard design for live user activity

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/nestjs-api
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

## Running Services

```bash

docker-compose up -d

npm run start:dev
```

## API Endpoints

### Authentication

- POST /auth/register
- POST /auth/login

### Products

- GET /products
- GET /products/:id
- POST /products (protected)
- PUT /products/:id (protected)
- DELETE /products/:id (protected)

## Real-time Dashboard Architecture

1. **WebSocket Connection**: Persistent connection for real-time updates
2. **Redis Pub/Sub**: For scaling across multiple instances
3. **Event Streaming**: Track user activities and emit to connected clients
4. **Metrics Collection**: Store and stream performance metrics

### Dashboard Components:

- Active users count (last 5 minutes)
- Connected clients
- Recent user activities feed
- Product creation notifications
- System performance metrics

### WebSocket Events:

- `dashboardUpdate` - Dashboard metrics update
- `productCreated` - New product notification
- `liveActivity` - User activity stream
- `userActivity` - Track specific user actions

## Testing

### Using the Test Client

Open `test-client.html` in your browser for a complete testing interface. The test client includes:

- **Authentication**: Register and login with form validation
- **Product Management**: Create, update, delete products with click-to-edit functionality
- **Real-time Dashboard**: View active users and connected clients
- **WebSocket Events**: Monitor real-time product creation and activities
- **Background Jobs**: Test email notifications and activity logging


