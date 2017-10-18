FROM node:boron
LABEL maintainer="Cristtopher Quintana T. <cquintana@axxezo.com>"
LABEL app="PC-SEA-NA"

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
RUN npm i --quiet -g gulp && npm i --quiet

# Bundle app source
COPY . .

# Define ENVs to setup at image build time
ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}
ENV PORT 5002

EXPOSE 5002

# Build app
RUN gulp build && \
    mkdir pc-sea-na-backend && \
    mv dist pc-sea-na-backend && \
    mv node_modules pc-sea-na-backend

# Run app
CMD [ "node", "pc-sea-na-backend/dist/server/" ]
