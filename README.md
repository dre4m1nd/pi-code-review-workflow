# pi-code-review-workflow

pi 用的 AI 代码审查工作流，基于 Claude Code 团队的「一次改动的生命周期」（FIG A）实践。

## 是什么

一套给 pi 的代码审查工作流，把「一次改动」拆成四个阶段，每个阶段明确 **AI 做什么、人做什么**：

1. **提交前**：AI 自证（跑测试/构建/lint，贴输出）+ 自审（找 bug / 简化 diff / 端到端验证）
2. **审查**：AI 审查（多 agent 找 bug + 投票 + 严重度排序）+ 安全扫描 + **风险分级**（人只在风险处出场）
3. **合并**：merge queue 兜底
4. **发布后**：flag + 灰度 + 快速回滚 + 复盘

## 核心原则

- 审查不是"找 bug"，是"按风险匹配检查"
- AI 把 90% 的例行错误挡在前面，人负责"该不该做、风险在哪、出错能不能收住"
- 不怕 AI 漏，怕的是没有快速下架和修复的机制

## 怎么用

把 `SKILL.md` 装到 pi 里：

```bash
pi skills add dre4m1nd/pi-code-review-workflow
```

或者直接看 [SKILL.md](./SKILL.md)。

## 人的精力放哪

方向、高风险代码、架构、读证据、对结果负责、观察+回滚。

## 参考

- [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/)
- [Addy Osmani 的推文](https://x.com/addyosmani/status/2114604912520921136)

## License

MIT
