FROM node:14 as base

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

FROM base as runner

COPY . .
