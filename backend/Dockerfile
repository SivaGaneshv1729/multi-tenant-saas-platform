# Use lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the fixed backend port
EXPOSE 5000

# Start the server (which includes the auto-seeding script)
CMD ["npm", "start"]