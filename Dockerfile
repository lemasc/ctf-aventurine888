FROM node:22-bookworm-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS development-dependencies-env
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
WORKDIR /app
RUN PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile

FROM base AS production-dependencies-env
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
WORKDIR /app
RUN PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --prod

FROM base AS build-env
COPY . /app/
COPY .env.production /app/.env
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm db migrate && pnpm db-seed
RUN pnpm run build

FROM base
# Configure default locale (important for chrome-headless-shell).
ENV LANG=en_US.UTF-8

ENV DBUS_SESSION_BUS_ADDRESS autolaunch:

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
    fonts-kacst fonts-freefont-ttf dbus dbus-x11

COPY ./package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY .env.production /app/.env
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/drizzle/dev.db /app/drizzle/dev.db
WORKDIR /app
RUN pnpm dlx puppeteer browsers install chrome --install-deps
CMD ["pnpm", "run", "start"]