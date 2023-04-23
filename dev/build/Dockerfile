# ====================
# --- Build Assets ---
# ====================
FROM node:16-alpine AS assets

# ENV NPM_CONFIG_REGISTRY=https://registry.npm.taobao.org/
RUN apk add yarn g++ make cmake python3 --no-cache

WORKDIR /wiki

COPY ./client ./client
COPY ./dev ./dev
COPY ./package.json ./package.json
COPY ./.babelrc ./.babelrc
COPY ./.eslintignore ./.eslintignore
COPY ./.eslintrc.yml ./.eslintrc.yml

ENV YARN_REGISTRY=https://registry.npm.taobao.org/
# RUN yarn cache clean
# RUN yarn --frozen-lockfile --non-interactive
# RUN yarn build
# RUN rm -rf /wiki/node_modules
# RUN yarn --production --frozen-lockfile --non-interactive

# 第一次构建时将结果保存到临时镜像中
# RUN --mount=type=cache,target=/tmp/yarn-cache \
#     --mount=type=cache,target=/tmp/yarn-build-cache \
#     yarn --frozen-lockfile --non-interactive --cache-folder=/tmp/yarn-cache \
#     && yarn build \
#     && yarn --production --frozen-lockfile --non-interactive --cache-folder=/tmp/yarn-cache \
#     && cp -R /wiki/node_modules /tmp/yarn-build-cache

# 后续构建时使用缓存
RUN --mount=type=cache,target=/tmp/yarn-cache \
    --mount=type=cache,target=/tmp/yarn-build-cache \
    yarn --frozen-lockfile --non-interactive --cache-folder=/tmp/yarn-cache \
    && cp -R /tmp/yarn-build-cache/node_modules /wiki/

# ===============
# --- Release ---
# ===============
FROM node:16-alpine
LABEL maintainer="requarks.io"

RUN apk add bash curl git openssh gnupg sqlite --no-cache && \
    mkdir -p /wiki && \
    mkdir -p /logs && \
    mkdir -p /wiki/data/content && \
    chown -R node:node /wiki /logs

WORKDIR /wiki

COPY --chown=node:node --from=assets /wiki/assets ./assets
COPY --chown=node:node --from=assets /wiki/node_modules ./node_modules
COPY --chown=node:node ./server ./server
COPY --chown=node:node --from=assets /wiki/server/views ./server/views
COPY --chown=node:node ./dev/build/config.yml ./config.yml
COPY --chown=node:node ./package.json ./package.json
COPY --chown=node:node ./LICENSE ./LICENSE

USER node

VOLUME ["/wiki/data/content"]

EXPOSE 3000
EXPOSE 3443

# HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 CMD curl -f http://localhost:3000/healthz

CMD ["node", "server"]
