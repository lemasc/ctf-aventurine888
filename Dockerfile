FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS development-dependencies-env
COPY package.json pnpm-lock.yaml app/
WORKDIR /app
RUN pnpm install --frozen-lockfile

FROM base AS production-dependencies-env
COPY ./package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile --prod

FROM base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm db migrate && pnpm db-seed
RUN pnpm run build

FROM base
COPY ./package.json pnpm-lock.yaml /app/
COPY .env /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/drizzle/dev.db /app/drizzle/dev.db
WORKDIR /app
CMD ["pnpm", "run", "start"]