# CallStack - VoIP Calling Platform

A production-ready, Avaya-like VoIP calling platform built with modern web technologies. Supports WebRTC, SIP interoperability, multi-party conferencing, and enterprise-grade features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (or use provided docker-compose)
- Redis
- Git

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/yourorg/callstack.git
cd callstack

# Bootstrap the development environment
./scripts/bootstrap.sh

# Start the web client
cd web/react-client
npm install
npm run dev

# Start the signaling server (new terminal)
cd services/signaling
npm install
npm run dev

# Run tests
npm test
```

### Docker Compose Development

```bash
# Start all services locally
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 📋 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client │    │   SIP Phone     │
│   (React)       │    │   (Flutter)    │    │   (pjsip)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Signaling Server       │
                    │   (Node.js + WebSocket)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Media Server          │
                    │   (mediasoup SFU)         │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      SIP Proxy            │
                    │    (Kamailio)             │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      PSTN Gateway         │
                    │    (SBC/Trunking)         │
                    └───────────────────────────┘
```

## 🏗️ Project Structure

```
callstack/
├── README.md
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── ADRs/               # Architecture Decision Records
│   ├── architecture.md
│   ├── security.md
│   └── release-checklist.md
├── infra/
│   ├── helm/               # Helm charts
│   ├── k8s/                # Kubernetes manifests
│   └── terraform/          # Cloud infrastructure
├── services/
│   ├── signaling/          # WebSocket signaling server
│   ├── auth/               # Authentication service
│   ├── kamailio/           # SIP proxy configuration
│   ├── mediasoup/          # Media server workers
│   ├── coturn/             # TURN/STUN server
│   └── cdr/                # Call Detail Records
├── web/
│   └── react-client/       # WebRTC softphone
├── mobile/
│   └── flutter-client/     # Mobile app (optional)
├── tools/
│   ├── load-tests/         # Performance testing
│   └── scripts/            # Utility scripts
└── tests/
    └── e2e/                # End-to-end tests
```

## 🎯 Features

### Core Functionality
- ✅ WebRTC audio/video calling
- ✅ SIP interoperability
- ✅ Multi-party conferencing (SFU)
- ✅ Call recording
- ✅ Call Detail Records (CDR)
- ✅ User authentication (JWT/OAuth)
- ✅ Real-time signaling

### Enterprise Features
- ✅ High availability deployment
- ✅ Auto-scaling media servers
- ✅ Monitoring & alerting
- ✅ Call quality metrics
- ✅ Billing integration
- ✅ Admin console
- ✅ Security hardening

## 🛠️ Technology Stack

### Frontend
- **Web Client**: React 18 + TypeScript + Tailwind CSS
- **Mobile**: Flutter (optional)
- **State Management**: Zustand + TanStack Query
- **UI Components**: shadcn/ui

### Backend
- **Signaling**: Node.js + Express + Socket.IO
- **Media Server**: mediasoup (SFU)
- **SIP Proxy**: Kamailio
- **TURN/STUN**: coturn
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: NextAuth.js

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **Security**: TLS 1.3, SRTP, STIR/SHAKEN

## 📊 Development Milestones

### Milestone 0 - Planning ✅
- Architecture decisions documented
- Technology stack finalized
- Development environment set up

### Milestone 1 - Core WebRTC MVP (Current)
- [ ] Web softphone with basic calling
- [ ] Signaling server with WebSocket
- [ ] TURN/STUN configuration
- [ ] Basic CDR storage

### Milestone 2 - SIP Integration
- [ ] Kamailio SIP proxy
- [ ] SIP over WebSocket
- [ ] SIP client integration

### Milestone 3 - Media & Conferencing
- [ ] mediasoup SFU deployment
- [ ] Multi-party conferences
- [ ] Call recording

### Milestone 4 - Production Hardening
- [ ] Kubernetes deployment
- [ ] Monitoring & alerting
- [ ] Security hardening
- [ ] Load testing

### Milestone 5 - Billing & Admin
- [ ] Admin console
- [ ] Billing pipeline
- [ ] v1.0 stable release

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Load tests
npm run test:load
```

### Test Coverage
- Unit tests: >80% coverage required
- Integration tests: All API endpoints
- E2E tests: Critical user journeys
- Load tests: Target concurrency scenarios

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Staging
```bash
helm upgrade --install callstack-staging ./infra/helm/callstack \
  --namespace staging \
  --set environment=staging
```

### Production
```bash
helm upgrade --install callstack-prod ./infra/helm/callstack \
  --namespace production \
  --set environment=production \
  --set replicaCount=3
```

## 📈 Monitoring & Observability

### Key Metrics
- Call setup time
- RTP quality (packet loss, jitter)
- Concurrent calls
- API response times
- System resource usage

### Dashboards
- Grafana dashboards for system metrics
- Call quality monitoring
- Business metrics (calls per user, etc.)

## 🔒 Security

### Implemented Security Measures
- TLS 1.3 for all communications
- SRTP for media encryption
- JWT-based authentication
- Rate limiting
- Input validation
- Security headers
- Dependency scanning

### Security Checklist
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency vulnerability scans
- [ ] Secret management
- [ ] Network segmentation
- [ ] Access control

## 📝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes with tests
3. Run linting and tests: `npm run lint && npm test`
4. Submit PR with description
5. Code review and merge

### Commit Message Format
```
type(scope): short-description

feat(signaling): add websocket-based offer/answer exchange
fix(kamailio): reject unauthenticated REGISTER requests
chore(ci): add GitHub Actions CI for unit tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourorg/callstack/issues)
- Discussions: [GitHub Discussions](https://github.com/yourorg/callstack/discussions)

## 🗺️ Roadmap

See [Milestones](https://github.com/yourorg/callstack/milestones) for detailed release planning.

### Upcoming Features
- Video calling enhancements
- Screen sharing
- Call transcription
- Advanced analytics
- Mobile app release
- API v2.0