FROM node:20-alpine AS base

WORKDIR /app
COPY ../frontend/package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm install
COPY ../frontend/ .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS production
COPY ../frontend/ .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
