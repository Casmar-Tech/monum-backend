FROM node:21-slim

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=4000
ENV PORT $PORT
EXPOSE $PORT 9229 9230

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

CMD [ "npm", "run", "prod" ]