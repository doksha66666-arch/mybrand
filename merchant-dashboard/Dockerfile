FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0

RUN npm run build

CMD ["npm", "run", "start"]
