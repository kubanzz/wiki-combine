# -- DEV DOCKERFILE --
# -- DO NOT USE IN PRODUCTION! --

FROM node:14
LABEL maintainer "requarks.io"

RUN apt-get update && \
  apt-get install -y bash curl git python make g++ nano openssh-server gnupg && \
  mkdir -p /wiki/patches

WORKDIR /wiki

ADD package.json .
ADD ./patches ./patches

RUN npm config set registry https://registry.npm.taobao.org && \
  npm install && \
  npm run postinstall


ENV dockerdev 1
ENV DEVDB postgres

EXPOSE 3000
