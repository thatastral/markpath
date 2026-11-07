# Markpath: Next.js app with SQLite on a volume. Needs git at runtime (the fixture demo path uses it).
FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app /app
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["npm", "run", "start"]
