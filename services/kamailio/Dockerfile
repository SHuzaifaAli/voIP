FROM kamailio/kamailio:5.7.2-alpine

# Install required modules
RUN apk add --no-cache \
    kamailio-extra-modules \
    kamailio-xml-modules \
    kamailio-ims-modules \
    kamailio-utils-modules \
    kamailio-tls-modules \
    kamailio-websocket-modules \
    kamailio-sqlite-modules \
    kamailio-json-modules \
    kamailio-presence-modules \
    kamailio-xhttp-modules

# Copy configuration files
COPY config/ /etc/kamailio/

# Create log directory
RUN mkdir -p /var/log/kamailio

# Set permissions
RUN chown -R kamailio:kamailio /var/log/kamailio /etc/kamailio

# Expose ports
EXPOSE 5060/udp 5060/tcp 5061/tcp 8080/tcp 8443/tcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD kamcmd ping || exit 1

# Start Kamailio
CMD ["kamailio", "-D", "-E", "-P", "/run/kamailio/kamailio.pid"]