FROM node:18-alpine

WORKDIR /app

COPY worker/package*.json ./
RUN npm install

COPY shared ./shared
COPY worker ./worker

WORKDIR /app/worker

RUN npm run build

CMD ["npm", "start"]
