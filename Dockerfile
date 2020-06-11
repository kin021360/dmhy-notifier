FROM node:10-stretch
MAINTAINER Nathan Lam

WORKDIR /home/dmhy-notifier/

# Copy project
COPY ./src ./
COPY ./config.js ./
COPY ./package.json ./
COPY ./package-lock.json ./

# Update npm
RUN npm install -g npm@latest

# Install npm modules.
RUN npm install

# Execute command
CMD npm start
