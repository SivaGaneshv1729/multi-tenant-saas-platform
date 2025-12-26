# Use Debian-slim instead of Alpine to fix Rollup/Vite compatibility issues
FROM node:20-slim

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# 1. Delete package-lock.json to prevent Windows/Mac lockfile conflicts with Linux
# 2. Install dependencies freshly
RUN rm -f package-lock.json && npm install

# Copy the rest of the code
COPY . .

EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev", "--", "--host"]