# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy the rest of the application code
COPY . .

# Build the application
# RUN npm run build  # Skip build for now since it's dev-focused

# Stage 2: Serve the application using a lightweight server
# Use Node for dev or Nginx for production
# For now, let's just use the node dev server
EXPOSE 3000

CMD ["npm", "start"]
