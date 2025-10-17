# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN pnpm exec prisma generate

# Copy source code
COPY . .

# Build the application
RUN pnpm run build && \
    ls -la /app/dist && \
    echo "Build completed successfully"

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema
COPY prisma ./prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Install dependencies, generate Prisma Client, and verify
RUN pnpm install --frozen-lockfile && \
    pnpm exec prisma generate && \
    ls -la /app && \
    ls -la /app/dist && \
    echo "Setup completed successfully"

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/src/main.js"]
