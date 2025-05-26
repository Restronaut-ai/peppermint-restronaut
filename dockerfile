FROM node:lts AS builder

WORKDIR /src

RUN apt-get update && \
    apt-get install -y build-essential python3

COPY apps/api ./api
RUN cd api && yarn install && yarn run build

COPY apps/client ./client
RUN cd client && yarn install && yarn run build

FROM node:lts AS runner

WORKDIR /output

COPY --from=builder /src/api/src apps/api/src
COPY --from=builder /src/api/dist apps/api/dist
COPY --from=builder /src/api/package.json apps/api/package.json
RUN cd apps/api && yarn install --production

COPY --from=builder /src/client/.next/standalone apps/client
COPY --from=builder /src/client/public apps/client/public
COPY --from=builder /src/client/.next/static apps/client/.next/static

RUN npm install -g pm2
COPY ecosystem.config.js .

EXPOSE 3000
CMD ["pm2-runtime", "ecosystem.config.js"]
