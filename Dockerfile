FROM node:24.22.1-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM dependencies AS tooling
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "migrate"]

FROM tooling AS builder
# Valeurs factices uniquement pour compiler. Aucune connexion DB au build.
ENV PAYLOAD_SECRET=build-only-placeholder-secret-not-for-runtime-00000000 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    NEXT_PUBLIC_SITE_URL=https://hilouw.com
RUN npm run build

FROM node:24.22.1-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p /app/media && chown node:node /app/media
USER node
EXPOSE 3000
CMD ["node", "server.js"]
