FROM node:24.13.0-alpine AS dependencies
WORKDIR /app/glance-server
RUN npm install --global pnpm@10.30.1
COPY glance-server/package.json glance-server/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:24.13.0-alpine
ENV NODE_ENV=production
WORKDIR /app/glance-server
COPY --from=dependencies --chown=node:node /app/glance-server/node_modules ./node_modules
COPY --chown=node:node glance-server/package.json ./
COPY --chown=node:node glance-server/src ./src
COPY --chown=node:node glance-server/migrations ./migrations
COPY --chown=node:node shared /app/shared
USER node
EXPOSE 3000
CMD ["node", "src/main.ts"]
