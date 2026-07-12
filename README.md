# 家庭电冰箱留言贴 🧲

一个像冰箱贴一样的家庭留言板：写文字、选便签颜色、传照片、留言可设置自动过期，随时随地手机/电脑访问。

技术栈：Next.js 16 (App Router) + Supabase (数据库 / 账号登录 / 图片存储) + Vercel 部署。

## 一、准备工作（需要你自己动手，Claude 无法代替完成）

### 1. 创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册一个免费账号，新建一个 Project。
2. 项目建好后，进入 **Project Settings → API**，记下：
   - `Project URL`
   - `anon public` key
3. 进入 **Authentication → Providers → Email**，把 **Confirm email** 关闭（因为本应用用「用户名」代替邮箱登录，不需要邮箱验证）。
4. 进入 **SQL Editor**，新建一个查询，把本项目 [`supabase/schema.sql`](supabase/schema.sql) 的全部内容粘贴进去并运行。这会建好数据表、权限规则（RLS）和图片存储桶。

### 2. 配置本地环境变量

复制 `.env.example` 为 `.env.local`，填入：

```
NEXT_PUBLIC_SUPABASE_URL=刚才记下的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=刚才记下的 anon public key
NEXT_PUBLIC_FAMILY_INVITE_CODE=自己起一个只有家人知道的口令，例如 jiayou2026
```

> 注意：邀请码只是防止陌生人随手注册看到留言的「轻量门槛」，不是真正的加密保护——它会出现在浏览器可见的前端代码里。对于家庭内部使用场景这已经足够。

### 3. 本地运行测试

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，用邀请码注册两个测试账号，互相留言、传图片试试看。

### 4. 部署到公网（Vercel）

1. 前往 [vercel.com](https://vercel.com)，用 GitHub 账号登录（免费）。
2. 点击 **Add New → Project**，选择这个仓库导入。
3. 在部署配置的 **Environment Variables** 里，把 `.env.local` 里的三个变量原样填进去。
4. 点击 **Deploy**，等构建完成后即可拿到一个公网网址，手机电脑都能访问。

## 二、项目结构

```
app/
  login/、signup/     登录、注册页面
  board/              留言板主页面
components/
  NoteComposer.tsx    写留言（颜色/图片/过期时间）
  NoteCard.tsx        单张留言贴
  LogoutButton.tsx
lib/
  supabaseClient.ts   浏览器端 Supabase 客户端
  supabaseServer.ts   服务端 Supabase 客户端
supabase/schema.sql   数据库表结构 + 权限规则，需粘贴到 Supabase SQL Editor 执行
proxy.ts              登录态校验（Next.js 16 中 middleware 已更名为 proxy）
```

## 三、后续可选优化（本次未实现）

- 留言到期改为服务器端定时清理（Supabase `pg_cron`），目前是前端按时间过滤显示。
- 多设备实时同步（Supabase Realtime），目前是每次刷新页面才能看到新留言。

## 本地开发命令

```bash
npm run dev    # 本地开发
npm run build  # 生产构建
npm run start  # 生产模式启动
```
