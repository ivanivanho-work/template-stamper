# Remotion Cloud Run service
FROM node:20-alpine

# Install dependencies needed for Remotion rendering
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ffmpeg

# Set Chromium path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for bundling)
RUN npm ci

# Copy source code
COPY . .

# Expose port for Cloud Run
EXPOSE 8080

# Start HTTP server
CMD ["node", "server.js"]
