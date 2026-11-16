# Compila a pré-visualização Web da app React Native / Expo.
# A aplicação Android/iOS mantém o mesmo código-fonte em apps/mobile.
FROM node:22-alpine AS web-build
WORKDIR /usr/src/artist-hub
COPY package.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN npm install --no-audit --no-fund
COPY . .
ENV EXPO_NO_TELEMETRY=1

# Expo incorpora estas variaveis PUBLICAS no bundle Web durante o build.
# No Coolify, activar Available at build time para estes campos.
# Nunca passar service_role, JWT_SECRET ou password PostgreSQL.
ARG EXPO_PUBLIC_SUPABASE_URL=https://supabase.datacenterhub.tech
ARG EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
ENV EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
WORKDIR /usr/src/artist-hub/apps/mobile
RUN npx expo export --platform web

FROM nginx:1.27-alpine AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /usr/src/artist-hub/apps/mobile/dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s \
  CMD wget -q -O /dev/null http://127.0.0.1:80/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
