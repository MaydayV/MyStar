# github收藏夹 (github-favorites)

一个公开可访问、可开源部署到 Vercel 的 GitHub Star 导航网站。

## 特性

- 自动同步当前 GitHub Token 对应账号的 Star 仓库（GitHub Actions 定时）
- 无数据库，数据直接写入 `src/data/repos.json`
- 自动分类（AI / Frontend / Backend / Mobile / DevOps / Data / Tooling / Security / Other）
- 自动生成推荐语（规则生成，无需 LLM API）
- Next.js + Tailwind CSS + Framer Motion 炫酷交互卡片

## 本地开发

```bash
npm install
GITHUB_TOKEN=你的token npm run sync:stars   # 先拉取 star 数据
npm run dev
```

打开 `http://localhost:3000`

## 自动同步

仓库内置 GitHub Actions：`.github/workflows/sync-stars.yml`

- 每 6 小时同步一次
- 手动触发也支持（Actions -> Sync GitHub Stars -> Run workflow）

### 推荐配置

在 GitHub 仓库 Secrets 添加：

- `STAR_SYNC_TOKEN`: GitHub Personal Access Token（建议只给 `public_repo`）

> 注：不配 token 也可运行，但有 API 频率限制。

## 部署到 Vercel

1. 导入本仓库到 Vercel
2. Framework 选择 Next.js（会自动识别）
3. 直接部署

由于数据是提交到仓库文件，所以 Vercel 每次新 commit 会自动重新部署，站点内容自动更新。

## 数据文件

`src/data/repos.json`

同步脚本会写入：

- 基础信息（name/description/url/topics/language）
- 统计信息（stars/forks）
- 分类
- 推荐语
- 同步时间

## License

MIT
