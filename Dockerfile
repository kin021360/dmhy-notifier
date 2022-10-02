ARG AppName=dmhy-notifier

FROM node:14-stretch-slim AS built
ARG AppName
WORKDIR /home/$AppName/

# Copy project
COPY ./ ./

RUN yarn install
RUN yarn lint
RUN yarn build

FROM node:14-stretch-slim
ARG AppName
WORKDIR /home/$AppName/

COPY --from=built /home/$AppName/package.json .
COPY --from=built /home/$AppName/yarn.lock .
COPY --from=built /home/$AppName/dist ./dist
RUN yarn install --prod

ARG VERSION=local
ENV VERSION ${VERSION}

# Execute command
CMD yarn start
