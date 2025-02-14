FROM oven/bun:alpine AS base
WORKDIR /usr/src/app

# copy index.ts
COPY index.ts .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]