# FROM node:20-slim

# ARG NODE_ENV=production
# ENV NODE_ENV $NODE_ENV

# ARG PORT=80
# ENV PORT $PORT
# EXPOSE $PORT 9229 9230

# RUN npm i npm@latest -g

# USER node

# WORKDIR /opt/app

# COPY --chown=node:node package.json package-lock.json* tsconfig.json healthcheck.js ./
# RUN npm ci && npm cache clean --force
# ENV PATH /opt/app/node_modules/.bin:$PATH

# RUN mkdir src
# COPY --chown=node:node ./src ./src

# HEALTHCHECK --interval=10s \
#     CMD node healthcheck.js

# RUN npm run compile

# CMD [ "npm", "run", "prod" ]

FROM public.ecr.aws/lambda/nodejs:20 as builder
RUN npm i npm@latest -g
WORKDIR /opt/app
COPY package.json package-lock.json* tsconfig.json healthcheck.js ./
RUN npm ci && npm cache clean --force
RUN mkdir src
COPY ./src ./src
RUN npm run compile
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:20
ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT 9229 9230
# HEALTHCHECK --interval=10s CMD node healthcheck.js
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /opt/app/dist/* ./
CMD ["node index.js"]
