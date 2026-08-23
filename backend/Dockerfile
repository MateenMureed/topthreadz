FROM node:20-slim AS builder

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads logs

EXPOSE 5000

CMD ["node", "dist/index.js"]
