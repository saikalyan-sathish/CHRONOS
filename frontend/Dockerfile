FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm install because --frozen-lockfile equivalent for npm might be tricky if lockfiles aren't fully in sync.
# Better to use npm ci if package-lock.json is committed and correct.
RUN npm install

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the Next.js application in production mode
CMD ["npm", "start"]
