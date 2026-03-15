# ── Development stage ────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]

# ── Production build stage ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production serve stage (nginx) ───────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config to handle React Router (SPA)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /api { proxy_pass http://backend:5000; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
