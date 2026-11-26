FROM node:22-alpine

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy prisma/, prisma.config.ts, tsconfig.json, and src/
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 4000

# Run migrations (or use `npx prisma db push` if you have no prisma/migrations folder)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]