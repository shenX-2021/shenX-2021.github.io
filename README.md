# Siusen 的博客

基于 [Hexo](https://hexo.io/) + [NexT](https://theme-next.js.org/) 主题搭建的技术博客，通过 GitHub Actions 自动构建并发布到 GitHub Pages。

## 技术栈

| 组成 | 选型 |
| --- | --- |
| 博客框架 | Hexo 8 |
| 主题 | NexT 8（Gemini 双栏方案） |
| 本地搜索 | hexo-generator-searchdb |
| 订阅 | hexo-generator-feed（Atom） |
| SEO | hexo-generator-sitemap |
| CI/CD | GitHub Actions + peaceiris/actions-gh-pages |
| 托管 | GitHub Pages |

## 本地开发

需要 Node.js >= 20。

```bash
npm install        # 安装依赖
npm run server     # 本地预览 http://localhost:4000
npm run build      # 生成静态文件到 public/
npm run clean      # 清理缓存
```

写作：

```bash
npx hexo new post "文章标题"    # 新建文章 source/_posts/
npx hexo new draft "草稿标题"   # 新建草稿 source/_drafts/
npx hexo new page "页面标题"    # 新建独立页面
```

草稿预览：`npm run server -- --draft`；草稿发布：`npx hexo publish "草稿标题"`。

## 目录结构

```text
.
├── _config.yml              # 站点配置（标题、URL、插件）
├── _config.next.yml         # NexT 主题配置（按需覆盖默认值）
├── scaffolds/               # 文章/页面/草稿模板
├── source/
│   ├── _posts/              # 文章（Markdown）
│   ├── _drafts/             # 草稿
│   ├── about/index.md       # 关于页
│   ├── categories/index.md  # 分类页
│   ├── tags/index.md        # 标签页
│   └── 404.md               # 404 页
├── .github/workflows/
│   └── deploy.yml           # 自动部署工作流
└── package.json
```

需要定制时优先改 `_config.yml` 与 `_config.next.yml`；`_config.next.yml` 未涉及的配置项全部沿用主题默认值。

## 部署到 GitHub Pages

### 分支策略

`username.github.io` 类型的仓库**只能从默认分支根目录**对外发布，因此采用双分支方案：

| 分支 | 内容 |
| --- | --- |
| `source` | 博客源码（Markdown 与配置），日常在这个分支写作 |
| `main` | `public/` 构建产物，由 GitHub Actions 自动推送，请勿手改 |

> 若仓库名不是 `<用户名>.github.io`（普通项目仓库），把 `.github/workflows/deploy.yml` 中的 `publish_branch` 改为 `gh-pages`，Pages 源选择 `gh-pages` 分支即可。

### 首次配置

1. 在 GitHub 创建仓库 `shenX-2021.github.io`（仓库名必须与用户名一致才会走根路径）
2. **Settings → Pages → Build and deployment → Source**：选择 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`
3. **Settings → Actions → General → Workflow permissions**：选择 `Read and write permissions`
4. 推送源码：

```bash
git remote add origin https://github.com/shenX-2021/shenX-2021.github.io.git
git add .
git commit -m "init: hexo blog with next theme"
git push -u origin source
```

5. **Settings → General → Default branch** 设为 `source`，这样访客 clone 时看到的是源码

推送完成后在 **Actions** 标签页查看工作流运行状态，成功后访问 <https://shenX-2021.github.io> 即可看到博客。

日常更新只需 `git push`，其余全部自动完成。也可以在 Actions 页面手动触发 `Deploy Hexo to GitHub Pages`。

## 待办：改成你自己的信息

- [ ] `_config.yml`：`title` / `subtitle` / `description` / `author` / `url`
- [ ] `_config.next.yml`：`avatar.url`（侧边栏头像）、`social`（社交链接）
- [ ] `source/about/index.md`：自我介绍
- [ ] 删除 `source/_posts/2026-10-31-hello-hexo.md` 示例文章

## 常见问题

**页面样式异常或 404（CSS/JS 加载不到）**
检查 `_config.yml` 的 `url` 与 `root` 是否与真实访问地址匹配。根路径部署应为 `root: /`；子路径部署（如 `https://user.github.io/blog/`）应改为 `root: /blog/`。

**Actions 报 `Permission denied` 或推送失败**
确认 Settings → Actions → Workflow permissions 已切换为 Read and write。

**本地能搜到、线上搜索无结果**
`public/search.xml` 未被误当成静态资源跳过即可；若使用了 `.nojekyll` 相关规则请一并检查。

## 许可

[MIT](./LICENSE)
