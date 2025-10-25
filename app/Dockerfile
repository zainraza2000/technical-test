FROM node:18-alpine

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY shared ./shared
COPY app ./app

WORKDIR /app/app

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
