FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . ./
RUN npx svelte-kit sync
RUN npm run build
EXPOSE 3000
CMD [ "node", "-r", "dotenv/config", "build" ]
