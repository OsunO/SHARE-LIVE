-- 添加通知表
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'SYSTEM');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    -- 接收者
    "recipientId" TEXT NOT NULL,
    
    -- 触发者（谁触发了这个通知，可能为空如系统通知）
    "actorId" TEXT,
    
    -- 关联内容
    "postId" TEXT,
    "commentId" TEXT,
    
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- 添加外键约束
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" 
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE;
    
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" 
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL;
    
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" 
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE;
    
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" 
    FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE;
