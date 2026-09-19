# Build frontend (Vite)
FROM node:22-alpine AS build
WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=2048
# Homolog default: public API URL (override in Dokploy build-arg if needed)
ARG VITE_API_URL=https://lavi-samuel-backend-sbzxln-cdf361-177-7-39-127.sslip.io
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
