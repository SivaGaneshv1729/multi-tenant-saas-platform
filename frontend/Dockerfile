# Use Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port 3000
EXPOSE 3000

# Start Vite in host mode so Docker can map the port
CMD ["npm", "run", "dev", "--", "--host"]