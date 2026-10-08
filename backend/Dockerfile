# Build stage
FROM node:18-alpine AS builder

# NOTE (fork patch): upstream declared ARG HTTP_PROXY/HTTPS_PROXY/NO_PROXY and then set them
# with Docker's legacy `ENV key value` form spread over three lines. When those build args are
# empty (i.e. no build-time proxy configured), Docker parses the whole instruction as
#   http_proxy="https_proxy no_proxy"
# which is not a parseable URL, and pnpm aborts the build with ERR_PNPM_INVALID_PROXY.
# GitHub-hosted runners and the target VPS both have direct internet access, so this block is
# removed. If a build-time proxy is ever required, use the `=` form instead, e.g.
#   ENV http_proxy=http://host:port https_proxy=http://host:port

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy prebuilt artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY health-check.js ./

# Create user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs && \
    chown -R backend:nodejs /app

USER backend
EXPOSE 3001

# Use a Node.js script for health checks (instead of curl)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node health-check.js

CMD ["node", "dist/server.js"]
