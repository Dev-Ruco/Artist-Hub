FROM node:22-alpine

WORKDIR /srv
COPY services/call-gateway/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
COPY services/call-gateway/server.mjs ./server.mjs

USER node
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
