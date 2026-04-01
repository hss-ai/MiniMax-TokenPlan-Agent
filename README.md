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
- 底部状态栏（Token Plan 实时概览，1 分钟自动刷新）
- 统一配置中心（默认配置 + 文件覆盖）

### 核心特性

- 统一 API 请求层：集中处理超时、错误模型与鉴权头
- 统一异步任务轮询层：减少重复逻辑，支持任务状态更新
- 可扩展状态管理：基于 Zustand 的会话、任务、设置存储
- 安全默认策略：API Key 默认会话级存储，可选持久化
- 内置额度可观测：设置面板内一键查询余额
- Token Plan 底栏状态：目录/分支/Usage/倒计时/到期天数
- 前端工程化：TypeScript strict + ESLint + Next.js App Router

### 技术栈

- Next.js 16
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4
- Electron（Windows/macOS 桌面端）
- Capacitor（Android/iOS 移动端）

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

### 跨平台打包与运行

#### 1) 桌面端（Windows / macOS）

```bash
npm install
npm run desktop:dev
```

用于本地开发联调（Next + Electron）。

```bash
npm run desktop:start
```

用于本地静态产物运行（Electron 加载 `out/`）。

```bash
npm run desktop:dist
npm run desktop:dist:win
npm run desktop:dist:mac
```

输出安装包到 `release/` 目录：

- Windows：NSIS 安装包
- macOS：DMG 安装包

#### 2) 移动端（Android / iOS）

首次初始化（会生成原生工程目录）：

```bash
npm install
npx cap add android
npx cap add ios
```

同步前端产物到原生工程：

```bash
npm run mobile:sync
```

直接运行到设备或模拟器：

```bash
npm run mobile:android
npm run mobile:ios
npm run mobile:build:android
npm run mobile:build:ios
```

打开原生 IDE 工程：

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

### CI 自动发布（推荐）

仓库内置 GitHub Actions 工作流：`.github/workflows/release.yml`
当推送 `v*` Tag 时，自动执行：

- Windows：构建 Electron NSIS 安装包（`.exe`）
- macOS：构建 Electron DMG（`.dmg`）
- Android：构建 Debug APK（`.apk`）
- iOS：构建 Simulator App 压缩包（`App-simulator.zip`，非签名 IPA）
- 自动创建/更新 GitHub Release 并上传上述产物

发布命令示例：

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 安全建议

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
- Bottom status bar with Token Plan snapshot (auto refresh every minute)
- Centralized configuration with file override

### Key Features

- Unified API client for timeout and error normalization
- Shared polling abstraction for async task workflows
- Extendable state management with Zustand
- Security-first default for API key handling
- Built-in quota observability in settings
- Bottom status line for dir/branch/usage/countdown/expiry
- Type-safe frontend stack with Next.js + TypeScript

### Tech Stack

- Next.js 16
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4
- Electron (Windows/macOS desktop)
- Capacitor (Android/iOS mobile)

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

### Cross-platform Packaging

#### Desktop (Windows / macOS)

```bash
npm install
npm run desktop:dev
```

Runs development mode with Next + Electron.

```bash
npm run desktop:start
```

Runs Electron with static web assets from `out/`.

```bash
npm run desktop:dist
npm run desktop:dist:win
npm run desktop:dist:mac
```

Build outputs are generated in `release/`:

- Windows: NSIS installer
- macOS: DMG installer

#### Mobile (Android / iOS)

First-time initialization:

```bash
npm install
npx cap add android
npx cap add ios
```

Sync web assets:

```bash
npm run mobile:sync
```

Run on emulator/device:

```bash
npm run mobile:android
npm run mobile:ios
npm run mobile:build:android
npm run mobile:build:ios
```

Open native projects:

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

### CI Release Automation (Recommended)

The repository includes `.github/workflows/release.yml`.
When you push a `v*` tag, the pipeline automatically:

- Builds Windows NSIS installer (`.exe`)
- Builds macOS DMG (`.dmg`)
- Builds Android debug APK (`.apk`)
- Builds iOS simulator app archive (`App-simulator.zip`, not a signed IPA)
- Publishes artifacts to GitHub Release

Example:

```bash
git tag v1.0.0
git push origin v1.0.0
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
