# syntax=docker/dockerfile:1

FROM node:20-slim

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=8080
ENV PORT $PORT
EXPOSE $PORT 9229

RUN apt-get update -qq && apt-get install -qy \
    tini \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN npm i npm@latest -g

USER node

WORKDIR /opt/app

COPY --chown=node:node package.json package-lock.json* tsconfig.json healthcheck.js ./
RUN npm ci && npm cache clean --force
ENV PATH /opt/app/node_modules/.bin:$PATH

RUN mkdir src
COPY --chown=node:node ./src ./src

HEALTHCHECK --interval=10s \
    CMD node healthcheck.js

RUN npm run compile

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD [ "node", "./dist/index.js" ]
