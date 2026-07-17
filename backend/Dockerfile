FROM node:22-alpine AS builder
WORKDIR /app
# Dummy URL satisfies prisma generate at build time — no real DB needed
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
# The Prisma client (src/generated/prisma) is generated, not committed — it must
# be regenerated here or every `@generated/prisma/client` import fails to compile.
RUN npx prisma generate
RUN pnpm build \
    && test -f dist/main.js \
    || (echo 'ERROR: dist/main.js missing after build — check tsconfig.build.json rootDir: src' && exit 1)

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
