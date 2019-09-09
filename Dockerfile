FROM node:10.16.3-alpine

RUN mkdir -p /usr/src/app && chown node:node /usr/src/app
USER node

ARG APP_VERSION
WORKDIR /usr/src/app

ENV APP_VERSION $APP_VERSION

ADD ./src /usr/src/app/src
ADD ./package.json /usr/src/app/
ADD ./package-lock.json /usr/src/app/
ADD ./icon-url-map.json /usr/src/app/
RUN npm install
EXPOSE 3000

CMD ["node", "./src/server"]
