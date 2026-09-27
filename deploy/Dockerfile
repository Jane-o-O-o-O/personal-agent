FROM node:24.15.0-bookworm-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/patch-pi-dependencies.mjs ./scripts/patch-pi-dependencies.mjs
RUN npm ci
COPY tsconfig.json vite.config.ts ./
COPY src ./src
COPY vendor ./vendor
RUN npm run build && npm prune --omit=dev

FROM node:24.15.0-bookworm-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS app
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tini && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/vendor ./vendor
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--import", "tsx", "src/server/index.ts"]

FROM app AS browser
USER root
RUN apt-get update && apt-get install -y --no-install-recommends chromium chromium-sandbox fonts-noto-cjk fonts-liberation && rm -rf /var/lib/apt/lists/*
ENV CHROME_EXECUTABLE=/usr/bin/chromium
USER node
CMD ["node", "--import", "tsx", "src/server/browser/sidecar.ts"]
