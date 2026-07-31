FROM node:20-alpine AS base

WORKDIR /app
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
RUN cd backend && npm install && cd ../shared && npm install

FROM base AS development
COPY backend/ ./backend/
COPY shared/ ./shared/
WORKDIR /app/backend
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY backend/ ./backend/
COPY shared/ ./shared/
WORKDIR /app/backend
RUN npx prisma generate && npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]
