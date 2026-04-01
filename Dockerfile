# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim
WORKDIR /app

# Enable Yarn from Corepack (project uses Yarn 4)
RUN corepack enable

# Copy dependency metadata first for better Docker layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/
RUN yarn install --immutable

ENV NODE_ENV=development
ENV PORT=5173

# Install entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5173
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["yarn", "dev"]

# Copy sources so container also works without bind mount
COPY . .
