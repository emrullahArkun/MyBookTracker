# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.ssl.conf /etc/nginx/nginx.ssl.conf
COPY docker-entrypoint.d/30-configure-access-mode.sh /docker-entrypoint.d/30-configure-access-mode.sh

RUN chmod +x /docker-entrypoint.d/30-configure-access-mode.sh \
    && mkdir -p /etc/nginx/snippets /etc/nginx/ops

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
