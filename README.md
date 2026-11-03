# pi-code-review-workflow

一个给 **pi** 用的 AI 代码审查 **scripted workflow**（不是 skill），基于 Claude Code 团队的「一次改动的生命周期」(FIG A)。

## 是什么

`workflows/code-review.js` 是一个 pi workflow 脚本，用 `runs.run` / `runs.all` 编排 subagent，把「一次改动」拆成四个阶段：

1. **PR 前**：AI 自证（跑测试/构建/lint，贴输出）+ 自审（全新上下文审 diff）
2. **每个 PR**：多角度并行审查（正确性 / 安全性 / 一致性）
3. **验证投票**：只留真 finding，去噪，按严重度排序，标 `Important` / `Nit` / `Pre-existing`
4. **风险分级**：决定人要看到什么程度（低 0 人 / 中 1 人 / 高 2 人）

核心原则：**AI 把 90% 的例行错误挡在前面，人只在风险处出场。**

## 怎么用

在 pi 会话里直接跑（文件路径）：

```js
subagent({ workflow: "./workflows/code-review.js", args: { target: "src/api" } });
```

`args.target` 可选，默认 "本次改动"。

也可以先验证脚本（不启动子 agent）：

```js
subagent({ action: "validate", workflow: "./workflows/code-review.js" });
```

## 工作流长什么样

```
verify (worker)           ── 跑测试/构建/lint，贴输出
self-review (reviewer)    ── 全新上下文审 diff
        │
        ├─ correctness (reviewer) ─┐
        ├─ security    (reviewer) ─┼─ 并行
        └─ consistency (reviewer) ─┘
                    │
             verdict (reviewer)  ── 投票去噪 + 排序
                    │
              risk (reviewer)    ── 风险分级（0/1/2 人）
```

## 四个阶段对应 FIG A

| FIG A 阶段 | 这个工作流 |
| --- | --- |
| BEFORE THE PULL REQUEST | `verify` + `self-review` |
| ON EVERY PULL REQUEST | `correctness` / `security` / `consistency` 并行 |
| ON EVERY PULL REQUEST (risk-based approval) | `verdict` → `risk` |
| AFTER THE MERGE | 人工观察 + 快速回滚（工作流外） |

## 人的精力放哪

- 决定要不要做（方向、品味、范围）
- 高风险代码（认证、加密、数据迁移、部署配置、CI）
- 架构（会被复制的代码）
- 读证据（测试输出、命令结果、finding）
- 对结果负责
- 观察 + 快速回滚

## 参考

- [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/)
- [Addy Osmani 的推文](https://x.com/addyosmani/status/2114604912520921136)

## License

MIT
