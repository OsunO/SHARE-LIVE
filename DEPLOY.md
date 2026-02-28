# SHARE-LIVE 部署指南

## 服务器信息
- 公网 IP: 101.34.245.133
- 项目路径: /opt/share-live

## 快速部署步骤

### 1. 登录服务器
```bash
# 使用微信扫码登录后，执行：
ssh root@101.34.245.133
```

### 2. 部署命令
```bash
cd /opt/share-live

# 拉取最新代码
git pull origin master

# 停止现有容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 执行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 生成 Prisma 客户端
docker-compose exec app npx prisma generate

# 查看日志
docker-compose logs -f app
```

### 3. 验证部署
- 访问 http://101.34.245.133:3000
- 测试注册功能
- 测试忘记密码功能

## 常见问题

### 端口无法访问
检查 Clash 配置：
```bash
cat /etc/clash/config.yaml | grep -A5 "DST-PORT,3000"
```

### 数据库连接失败
```bash
# 重置数据库密码
docker-compose exec db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Gmail,668698';"
```

### 容器启动失败
```bash
# 查看详细日志
docker-compose logs app
```
