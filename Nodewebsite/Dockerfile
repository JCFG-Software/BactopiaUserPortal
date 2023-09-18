FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install mash (apt-get)
RUN apt-get update && apt-get install -y mash

# Install app dependencies
# set memory limit
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV GENERATE_SOURCEMAP=false

COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# expose port and start app
EXPOSE 3000 80 443

# Set SAMPLES_DIR env variable to /work
ENV SAMPLES_DIR=/work

CMD [ "node", "app.js" ]


