FROM node:14
WORKDIR /test-forest-interactive
COPY package.json .
RUN npm install
COPY . .
CMD npm start