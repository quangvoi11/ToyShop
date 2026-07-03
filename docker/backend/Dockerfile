FROM node:20-alpine AS base

WORKDIR /app
COPY ../backend/package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm install
COPY ../backend/ .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY ../backend/ .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]
