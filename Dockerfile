FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app

COPY package.json ./

RUN yarn

COPY server.js ./

EXPOSE 10000

CMD ["node", "server.js"]
