# syntax=docker/dockerfile:1
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY icon-url-map.json ./
COPY src ./src

ARG APP_VERSION=dev
ARG VCS_REF=unknown
ENV APP_VERSION=$APP_VERSION

LABEL org.opencontainers.image.title="gitlab-jira-webhook" \
      org.opencontainers.image.description="Shows GitLab merge requests as remote links on Jira issues" \
      org.opencontainers.image.source="https://github.com/DracoBlue/gitlab-jira-webhook" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="$APP_VERSION" \
      org.opencontainers.image.revision="$VCS_REF"

# Application files stay owned by root, so the app cannot modify itself.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/" || exit 1

CMD ["node", "src/server.js"]
