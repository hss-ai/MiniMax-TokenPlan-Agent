# MiniMax Token Plan Agent

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A production-oriented, open-source multimodal web client for MiniMax APIs.
It provides a unified interface for chat, voice, video, image, and music workflows with configurable models and local task management.

中文 | [English](#english)

## 中文

### 项目简介

MiniMax Token Plan Agent 是一个面向开源用户的多模态客户端模板，目标是帮助团队快速搭建并扩展 MiniMax 能力接入层与交互层。

当前版本支持：

- 文本对话（多会话、本地历史管理）
- 语音合成（异步任务创建、轮询、结果播放）
- 视频生成（异步任务创建、轮询、结果预览）
- 图片生成（同步返回、结果展示与下载）
- 音乐生成（纯音乐/带歌词模式）
- 余额查询（查询 Token Plan 各模型周期/周额度与剩余时间）
- 统一配置中心（默认配置 + 文件覆盖）

### 核心特性

- 统一 API 请求层：集中处理超时、错误模型与鉴权头
- 统一异步任务轮询层：减少重复逻辑，支持任务状态更新
- 可扩展状态管理：基于 Zustand 的会话、任务、设置存储
- 安全默认策略：API Key 默认会话级存储，可选持久化
- 内置额度可观测：设置面板内一键查询余额
- 前端工程化：TypeScript strict + ESLint + Next.js App Router

### 技术栈

- Next.js 16
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4

### 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

### 配置说明

配置来源：

- 默认配置：`src/config/appConfig.ts`
- 覆盖配置：`minimax.config.json`

可配置项包括但不限于：

- API Base URL
- 文本/语音/视频/图片/音乐模型默认值与可选项
- 语音与音乐音频参数
- 音色、视频模型、图片比例等选项

### 项目结构

```text
src/
  app/                 # 页面与路由（chat/voice/video/image/music）
  components/          # 通用组件（侧边栏、设置弹窗等）
  config/              # 配置合并与校验逻辑
  lib/                 # API Client 与轮询抽象
  store/               # Zustand 状态管理
doc/
  需求文档.md           # 项目需求与架构文档
```

### 开发命令

```bash
npm run lint
npm run typecheck
npm run build
```

### 安全建议

- 不在仓库中提交真实 API Key、Token、证书等敏感信息
- 默认采用会话级密钥存储，建议在共享设备上保持默认策略
- 生产环境建议引入服务端代理层（BFF）托管密钥并实施限流
- 提交前建议执行敏感信息扫描

### 贡献指南

欢迎通过 Issue/PR 贡献：

1. Fork 仓库并创建功能分支
2. 完成开发并通过 `lint` 与 `typecheck`
3. 提交 PR，说明变更背景、方案与影响范围

### 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

## English

### Overview

MiniMax Token Plan Agent is an open-source multimodal client template designed for teams building on MiniMax APIs.

It currently supports:

- Chat with multi-session history
- Text-to-speech with async task polling
- Video generation with async task polling
- Image generation with in-page preview and download
- Music generation (instrumental / lyric mode)
- Balance lookup for model-level plan remains
- Centralized configuration with file override

### Key Features

- Unified API client for timeout and error normalization
- Shared polling abstraction for async task workflows
- Extendable state management with Zustand
- Security-first default for API key handling
- Built-in quota observability in settings
- Type-safe frontend stack with Next.js + TypeScript

### Tech Stack

- Next.js 16
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4

### Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Configuration

- Default config: `src/config/appConfig.ts`
- Override config: `minimax.config.json`

You can customize API endpoint, model defaults/options, and audio parameters for voice/music.

### Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

### Security Notes

- Never commit real secrets
- Keep session-level key storage as default on shared devices
- For production, use a backend proxy/BFF for key custody and traffic control

### Contributing

Contributions are welcome via Issues and Pull Requests.

Please ensure all checks pass before opening a PR.

### License

Licensed under [MIT](./LICENSE).
