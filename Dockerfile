# 使用 Node.js Debian 官方镜像
FROM node:20-slim AS base

# 安装依赖
FROM base AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时内存限制
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS:--"-max-old-space-size=896"}

# 生成 Prisma Client
RUN npm run db:generate

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS="${NODE_OPTIONS}" npm run build

# 生产环境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 OpenSSL (Prisma 需要)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制完整的 Prisma 相关文件
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 确保所有文件权限正确
RUN chown -R nextjs:nodejs ./node_modules/.prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
