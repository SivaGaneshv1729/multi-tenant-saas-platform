FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install Netcat for the wait script
RUN apk add --no-cache netcat-openbsd
# Make script executable
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 5000

CMD ["./scripts/entrypoint.sh"]