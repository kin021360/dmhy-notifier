FROM node:10-stretch
MAINTAINER Nathan Lam

WORKDIR /home/dmhy-notifier/

# Copy project
COPY ./ ./

# Update npm
RUN npm install -g npm@latest

# Install npm modules.
RUN npm install

# Execute command
CMD npm start
