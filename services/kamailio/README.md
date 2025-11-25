# Kamailio Service

## Overview
Kamailio SIP proxy server for WebRTC to PSTN integration in the CallStack platform.

## Features
- SIP registration and authentication
- WebRTC to SIP gateway
- NAT traversal support
- RTP proxy integration
- Load balancing and failover
- Call routing and forwarding
- Presence and instant messaging
- TLS encryption support

## Configuration
- Main config: `config/kamailio.cfg`
- Database config: `config/kamctlrc`
- TLS certificates: `config/tls/`

## Environment Variables
- `KAMAILIO_DB_URL`: Database connection URL
- `KAMAILIO_DOMAIN`: SIP domain name
- `KAMAILIO_TLS_CERT`: TLS certificate path
- `KAMAILIO_TLS_KEY`: TLS private key path

## Docker Usage
```bash
# Build image
docker build -t callstack-kamailio .

# Run container
docker run -d \
  --name kamailio \
  -p 5060:5060/udp \
  -p 5060:5060/tcp \
  -p 5061:5061/tcp \
  -p 8080:8080/tcp \
  -v $(pwd)/config:/etc/kamailio \
  -v kamailio_data:/var/lib/kamailio \
  callstack-kamailio
```

## Testing
```bash
# Test SIP registration
sipsak -U -s sip:test@callstack.example.com -p 5060

# Test SIP OPTIONS
sipsak -O -s sip:test@callstack.example.com -p 5060
```

## Integration
- Connects to signaling server for WebRTC clients
- Integrates with RTP proxy for media handling
- Uses PostgreSQL for user authentication and location
- Supports external SIP trunks for PSTN connectivity