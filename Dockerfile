FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the standard port
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
