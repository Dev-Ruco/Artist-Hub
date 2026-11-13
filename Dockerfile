# Compila a pré-visualização Web da app React Native / Expo.
# A aplicação Android/iOS mantém o mesmo código-fonte em apps/mobile.
FROM node:22-alpine AS web-build
WORKDIR /usr/src/artist-hub
COPY package.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN npm install --no-audit --no-fund
COPY . .
ENV EXPO_NO_TELEMETRY=1
WORKDIR /usr/src/artist-hub/apps/mobile
RUN npx expo export --platform web

FROM nginx:1.27-alpine AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /usr/src/artist-hub/apps/mobile/dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s \
  CMD wget -q -O /dev/null http://127.0.0.1:80/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
