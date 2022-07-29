FROM node:16

WORKDIR /root
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
RUN yarn

COPY ./src ./src
RUN yarn tsc

FROM node:16
WORKDIR /root
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --prod
COPY --from=0 /root/build .

CMD ["node", "./index.js"]
