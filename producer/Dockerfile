FROM node:18-alpine

WORKDIR /app

COPY producer/package*.json ./
RUN npm install

COPY shared ./shared
COPY producer ./producer

WORKDIR /app/producer

RUN npm run build

CMD ["npm", "start"]
