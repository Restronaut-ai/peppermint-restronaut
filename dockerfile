# Stage 1: Builder
FROM node:lts-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /src

# Copy and build API
COPY apps/api ./api
RUN cd api && yarn install && yarn build

# Copy and build Client
COPY apps/client ./client
RUN cd client && yarn install && yarn build && rm -rf node_modules

# Stage 2: Runner
FROM node:lts-alpine AS runner

WORKDIR /output

# Copy API files
COPY --from=builder /src/api/src apps/api/src
COPY --from=builder /src/api/dist apps/api/dist
COPY --from=builder /src/api/package.json apps/api/package.json

# Install production dependencies
RUN cd apps/api && yarn install --production

# Copy Next.js client build
COPY --from=builder /src/client/.next/standalone apps/client
COPY --from=builder /src/client/public apps/client/public
COPY --from=builder /src/client/.next/static apps/client/.next/static

# Install PM2 globally
RUN npm install -g pm2

# Copy PM2 config
COPY ecosystem.config.js .

EXPOSE 3000
CMD ["pm2-runtime", "ecosystem.config.js"]

