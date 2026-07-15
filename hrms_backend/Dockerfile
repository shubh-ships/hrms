# Stage 1: Install dependencies
FROM node:20-alpine AS deps

WORKDIR /PulseSeal

COPY package*.json ./
RUN npm ci --omit=dev


# Stage 2: Build the application
FROM node:20-alpine

WORKDIR /PulseSeal

RUN addgroup -g 1001 nodegroup && adduser -S nodeuser -u 1001 -G nodegroup

COPY --from=deps /PulseSeal/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

RUN chown -R nodeuser:nodegroup /PulseSeal
USER nodeuser

EXPOSE 8080

CMD ["node", "src/server.js"]
