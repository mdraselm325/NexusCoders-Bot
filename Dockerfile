FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache \
    chromium \
    ffmpeg \
    python3 \
    build-base \
    gcc \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
