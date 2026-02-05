# SHARE LIVE - 生活分享平台

一个基于 Next.js + AI 的生活分享社交平台。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: PostgreSQL + Prisma
- **认证**: NextAuth.js
- **样式**: Tailwind CSS
- **AI**: Moonshot AI (Kimi)
- **部署**: Docker

## 快速开始

### 1. 环境配置

```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

### 2. Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate dev

# 查看日志
docker-compose logs -f app
```

### 3. 本地开发

```bash
# 安装依赖
npm install

# 启动 PostgreSQL
docker-compose up -d db

# 设置环境变量
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sharelive?schema=public"

# 运行迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | ✅ |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | ✅ |
| `NEXTAUTH_URL` | 应用 URL | ✅ |
| `OPENAI_API_KEY` | Moonshot AI API Key | ❌ |

## 功能特性

- ✅ 用户注册/登录
- ✅ 发布动态（文字+图片）
- ✅ AI 图片分析自动标签
- ✅ 点赞/收藏/评论
- ✅ 个人主页
- ✅ Docker 部署

## 项目结构

```
SHARE-LIVE/
├── app/                # Next.js 应用路由
│   ├── api/           # API 路由
│   ├── auth/          # 认证页面
│   ├── post/          # 发布相关
│   ├── page.tsx       # 首页
│   └── layout.tsx     # 根布局
├── components/        # React 组件
├── lib/              # 工具函数
├── prisma/           # 数据库模型
├── public/           # 静态资源
├── Dockerfile        # Docker 构建
└── docker-compose.yml
```

## 许可证

MIT
