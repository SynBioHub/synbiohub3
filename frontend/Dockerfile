# Install dependencies only when needed
FROM node:14-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json yarn.lock ./

# Install all dependencies (including dev)
RUN yarn install --frozen-lockfile

# Build stage
FROM node:14-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock ./

# Copy source code
COPY . .

# Build
RUN yarn build

# Production dependencies stage
FROM deps AS prod-deps

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Production image, copy all the files and run next
FROM node:14-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3333

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# ENV NEXT_TELEMETRY_DISABLED 1

CMD ["yarn", "start"]
