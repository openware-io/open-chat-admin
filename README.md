# gv-chat-admin

GV Chat 平台 PC 管理后台（Vue 3 + Element Plus + Vite）。

## 功能概览

- 用户 / 会话 / 群组管理
- 客户端版本发布管理（Android / iOS / Windows 下载与更新）
- 开放平台应用管理
- 审计日志查询

## 技术栈

Vue 3 · Element Plus · Pinia · Vue Router · Vite

## 本地开发

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建（含错误文案校验）
npm run preview    # 预览构建产物
```

环境变量模板见 `.env.example`（API 地址等请按部署环境配置，勿提交真实密钥）。

## 目录结构

```
src/          业务源码
docs/         设计文档
scripts/      构建与校验脚本
public/       静态资源
Dockerfile    容器镜像构建
nginx.conf    容器内 Nginx 配置
```

## 许可证

[Apache License 2.0](LICENSE)，由 [openware-io](https://github.com/openware-io) 维护。
