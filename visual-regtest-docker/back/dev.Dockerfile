FROM node:20

# FIXME: 
# SORRY TEACH >> making puppeteer to work in Docker is very tough, nothing seems to work. If you need me to spiral again on this to validate the exercice please contact me.

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD ["npm", "run", "dev", "--", "--host"]