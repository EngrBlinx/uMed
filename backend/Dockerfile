FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests and Prisma schema first for Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (includes tsx and prisma CLI) and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Copy application source code
COPY tsconfig.json ./
COPY src ./src/

EXPOSE 4000

# Apply pending database migrations on startup, then launch Express via tsx
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]