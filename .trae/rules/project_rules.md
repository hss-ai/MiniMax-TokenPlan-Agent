# 项目固定执行规则

当用户提出功能变更并要求发布时，默认执行以下流程，无需额外提醒：

1. 同步更新 `README.md` 与 `doc/需求文档.md`。
2. 执行 `npm run lint`、`npm run typecheck`、`npm run build` 作为发布前校验。
3. 提交并推送到 `main`。
4. 在上一个版本号基础上递增创建并推送新 Tag（`v*`）。
5. 触发 GitHub Actions 发布流水线并跟踪到最终状态。
6. 汇总各 Job 结果与产物列表给用户。
