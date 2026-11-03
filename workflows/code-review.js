// workflows/code-review.js
// AI 代码审查工作流 —— 基于 Claude Code 团队的「一次改动的生命周期」(FIG A)
//
// 用法：
//   subagent({ workflow: "./workflows/code-review.js", args: { target: "src/api" } })
//   args.target 可选，默认 "本次改动"
//
// 四个阶段：
//   1. PR 前      — AI 自证（跑测试/构建/lint）+ 自审（全新上下文审 diff）
//   2. 每个 PR    — 多角度并行审查（正确性/安全/一致性）
//   3. 验证投票   — 只留真 finding，去噪，按严重度排序
//   4. 风险分级   — 决定人要看到什么程度（0/1/2 人）

const target = args.target || "本次改动";

// ── 阶段 1a：AI 自证 —— 跑命令，贴输出，别说 done ──
const verify = await runs.run("verify", {
  label: "阶段1 自证：跑测试/构建/lint",
  agent: "worker",
  task: [
    "在 " + target + " 上运行测试、构建、lint。",
    "要求：展示实际命令和完整输出，不要只说「完成」或「通过」。",
    "如果失败，贴出失败日志和复现步骤。"
  ].join("\n")
});

// ── 阶段 1b：AI 自审 —— 全新上下文审 diff ──
const selfReview = await runs.run("self-review", {
  label: "阶段1 自审：全新上下文审 diff",
  agent: "reviewer",
  task: [
    "用全新上下文审 " + target + " 的 diff。",
    "做三件事：1) 找 bug 2) 简化 diff 3) 端到端验证。",
    "只报确实成立的问题，给文件+行号当证据。"
  ].join("\n")
});

// ── 阶段 2：多角度并行审查 ──
const findings = await runs.all([
  {
    key: "correctness",
    label: "阶段2 正确性审查",
    agent: "reviewer",
    task: "审 " + target + " 的正确性：逻辑、边界、回归。给文件+行号。"
  },
  {
    key: "security",
    label: "阶段2 安全性审查",
    agent: "reviewer",
    task: "审 " + target + " 的安全性：注入、认证、密钥、权限。给文件+行号。"
  },
  {
    key: "consistency",
    label: "阶段2 一致性审查",
    agent: "reviewer",
    task: "审 " + target + " 的一致性/可维护性：项目约定、命名、重复代码。"
  }
]);

// ── 阶段 3：验证投票 —— 去掉误报和纯风格，按严重度排序 ──
const verdict = await runs.run("verdict", {
  label: "阶段3 验证投票+排序",
  agent: "reviewer",
  task: [
    "对下面三组 finding 做验证：只保留确实成立的，去掉误报和纯风格问题。",
    "按严重度排序，每条标 Important / Nit / Pre-existing。",
    "PR 没引入的老问题标 Pre-existing，不算在作者头上。",
    "",
    "=== 正确性 ===",
    findings[0].output,
    "",
    "=== 安全性 ===",
    findings[1].output,
    "",
    "=== 一致性 ===",
    findings[2].output
  ].join("\n")
});

// ── 阶段 4：风险分级 —— 人该看多少 ──
const risk = await runs.run("risk", {
  label: "阶段4 风险分级建议",
  agent: "reviewer",
  task: [
    "根据下面的 finding，给这次改动定风险档：",
    "- 低（文档/文案/样式/带 flag 的增量）：0 人",
    "- 中（普通产品改动、缓存、自动更新）：1 人",
    "- 高（认证、加密、数据迁移、部署配置、CI 工作流）：2 人",
    "输出：风险档 + 理由 + 建议人看还是直接过。",
    "",
    "findings:",
    verdict.output
  ].join("\n")
});

return {
  verify: verify.output,
  selfReview: selfReview.output,
  findings: findings.map(function (f) { return f.output; }),
  verdict: verdict.output,
  risk: risk.output
};
