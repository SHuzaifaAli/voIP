# CallStack Signaling Server

WebSocket signaling server for WebRTC peer connections in the CallStack platform.

## Features

- Real-time WebRTC signaling
- JWT authentication
- Redis-based session management
- ICE candidate exchange
- Call state management
- User presence tracking

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

## Socket Events

### Client -> Server

- `call` - Initiate a call with offer
- `answer` - Answer a call with answer
- `ice-candidate` - Exchange ICE candidates
- `end-call` - Terminate active call
- `status-update` - Update user presence status
- `get-user-status` - Get user presence status

### Server -> Client

- `offer` - Incoming call offer
- `answer` - Call answer response
- `ice-candidate` - ICE candidate from peer
- `call-ended` - Call termination notification
- `call-error` - Call-related errors
- `user-status-changed` - User presence updates

## Authentication

All socket connections require a valid JWT token:

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
})
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | JWT signing secret | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `LOG_LEVEL` | Logging level | `info` |

## Development

```bash
# Run with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Deployment

The server is containerized and can be deployed using Docker or Kubernetes. See the main project documentation for deployment instructions.