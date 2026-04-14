# project-wiki

`project-wiki` 是一个独立开源的 Claude Code skill，用来把**项目资料**整理成可持续维护的知识层，并在此基础上帮助你做：

- 项目解释
- 项目评估
- 方案对比
- 决策支持
- 知识库 / wiki 建设与更新

它的核心不是“让检索看起来更聪明”，而是让**项目知识更稳定、更可信、更可复用**。

它围绕三个核心点设计：

- **LLM Wiki 是骨架** —— 持久、可维护的项目知识页
- **Local RAG 是证据层** —— 检索支撑 wiki，而不是替代 wiki
- **Project Assistance 是产品目标** —— 真正服务项目工作，而不只是搜索

## 安装与调用

这是一个独立 skill 仓库。

### 一键安装（推荐）

在仓库根目录运行：

```bash
node scripts/install.mjs . --dry-run
node scripts/install.mjs . --clean
```

如果你明确知道自己要覆盖同名文件、但不想清空旧目录，可以用：

```bash
node scripts/install.mjs . --force
```

说明：
- `--clean`：推荐用于升级，会先替换目标目录，避免旧文件残留
- `--force`：只覆盖同名文件，不保证清洁升级
- `--dry-run`：先预览将要安装的内容

### 手动安装

最简单的手动方式是把整个仓库目录复制到你的 Claude Code skills 目录中，例如：

```text
~/.claude/skills/project-wiki/
```

> 注意：手动安装时，建议**复制真实文件**，不要使用符号链接、junction 或其他链接方式来代替复制。

最终结构应类似：

```text
~/.claude/skills/project-wiki/
  SKILL.md
  README.md
  LICENSE
  CHANGELOG.md
  RELEASE.md
  PUBLISHING.md
  ROADMAP.md
  contracts/
  references/
  examples/
  scripts/
  evals/
```

在 Claude Code 中，你可以这样触发它：

```text
请用 project-wiki 解释这个项目的核心架构。
```

或者直接使用 slash skill：

```text
/project-wiki 请为这个项目设计一个离线优先的 wiki 结构。
```

默认建议在你的目标项目目录中使用它，让 Claude 能读取当前项目文件作为本地证据。

注意：虽然 skill 声明了 browser 能力，但默认仍然是 **local-first**。除非你明确授权，或确实需要查询公开外部事实，否则不应把私有项目内容发送到在线搜索或外部 API。

## 60 秒自检

安装后可以先运行：

```bash
node scripts/doctor.mjs .
```

或者如果已经安装到 skills 目录中：

```bash
node ~/.claude/skills/project-wiki/scripts/doctor.mjs ~/.claude/skills/project-wiki
```

然后再用下面 4 步快速确认它是否工作正常：

1. 检查目录里是否至少有：
   - `SKILL.md`
   - `contracts/`
   - `references/`
   - `examples/`
   - `scripts/`
   - `evals/`
2. 在 Claude Code 中进入一个真实项目目录。
3. 输入：

```text
请用 project-wiki 解释这个项目。
```

4. 看它是否按 `project-wiki` 的风格回应：
   - 更强调项目知识层，而不是普通搜索
   - 更强调证据、页面、结构、缺口
   - 不会直接退化成泛泛的 repo chat

说明：这个 `doctor` 更偏向**仓库完整性 / 安装文件完整性检查**。它能帮助你确认 skill 文件集是否齐全，但并不能替代真实 prompt 测试。

## 作为平台能力来使用

`project-wiki` 不只是给你在 Claude 对话里使用的 skill。

它也可以被理解成一种**系统能力规范**，用于你未来自己做的平台，例如：
- 讲题平台
- 教学解释系统
- 项目讲解系统
- 本地知识驱动的 explanation engine

在这种场景下，`project-wiki` 定义的不是“用户该怎么说 prompt”，而是：
- 系统如何识别主知识源
- 系统如何决定知识源优先级
- 系统如何按知识源的思路组织讲解
- 系统如何区分例题思路、本地补充说明和一般性补充
- 系统在知识源冲突时应该如何显式裁决

如果你在做讲题平台，这一点尤其重要：
- 例题库可以是主知识源
- 系统讲解时应优先调用例题库
- 系统应尽量沿用例题库的分析顺序、术语和解题节奏
- 如果例题库不足，再补充其他本地资料，最后才补一般知识
- 如果例题库与项目当前实现或项目 docs/wiki 冲突，应显式标记冲突，而不是自动揉成一个答案

更完整的说明见：
- `references/source-priority-guidance.md`
- `references/system-integration-guidance.md`
- `references/knowledge-lifecycle.md`

## 什么时候用

当你想要：
- 快速解释一个项目、模块或架构
- 比较两个技术方案并基于本地证据给出建议
- 评估设计质量、边界、技术债或迁移路径
- 为项目建立或更新 wiki / knowledge base
- 生成 onboarding 总结、ADR 风格结论、模块地图或 troubleshooting 页面

## 什么时候不要用

当你只是：
- 查一个符号、一个文件、一个配置项
- 做一次性摘要，不打算沉淀知识
- 只需要普通搜索，而不需要项目知识结构
- 做外部市场研究，而不是整理项目本地知识

## 它和普通 RAG / Repo Chat 的区别

- **普通 RAG**：重点是“召回答案”
- **Repo Chat**：重点是“随问随答”
- **project-wiki**：重点是“把项目知识沉淀成稳定页面，并让检索服务这些页面”

## 页面标签与 contract key 对照

为了让页面模板、示例和 contracts 使用同一套轻量生命周期词汇，建议按下面的映射理解：

- `Review status` -> `review_status`
- `Last reviewed` -> `last_reviewed`
- `Retention class` -> `retention_class`
- `Confidence basis` -> `confidence_basis`
- `Supersedes` / `Superseded by` -> `supersedes` / `superseded_by`
- `Consolidation status` -> `consolidation_status`
- `Crystallized from` -> `crystallized_from`

这些字段只在它们能改善维护清晰度时使用，不要求每一页都写满。

## 小白三句法

如果你是第一次用，先记住这三句就够了：

### 1) 解释项目
```text
请用 project-wiki 解释这个项目。
```

### 2) 建立或更新 wiki
```text
请用 project-wiki 为这个项目建立或更新 wiki。
```

### 3) 优先按某个知识源来讲
```text
请用 project-wiki 优先根据我的例题库讲解这道题，并按例题思路来讲。
```

## Quick Start

如果你第一次使用 `project-wiki`，可以直接从下面几类请求开始。

### 1) 先理解项目

```text
请用 project-wiki 解释这个项目的核心目标、主要模块、关键依赖关系，并列出最重要的 5 个证据文件。
```

### 2) 理解某个模块

```text
请用 project-wiki 解释 xxx 模块：它负责什么、依赖什么、边界是否清晰，并把已验证事实、推断、待确认项分开写。
```

### 3) 做方案对比

```text
请用 project-wiki 比较方案 A 和方案 B，优先基于当前仓库的本地证据分析适配度，不要只讲通用最佳实践。
```

### 4) 设计项目 wiki

```text
请用 project-wiki 为这个项目设计一个离线优先的 wiki 结构，要求适合个人先维护，也方便团队后续复用。
```

### 5) 安全写入模式

```text
请先给出 wiki 更新计划和目标文件路径，等我确认后再写入具体文档。
```

### 6) 指定知识源优先讲解

```text
我在做一个讲解题目的系统，我有一个例题库。请用 project-wiki 讲解这道题时优先调用例题库里的知识，并尽量按例题的思路来讲。
```

### 7) 更精准的触发方式

```text
请用 project-wiki 优先基于例题库讲解这道题。要求：
1. 先找相关例题
2. 优先复用例题中的分析步骤
3. 不足时再补充一般知识
4. 把例题思路和补充说明区分开
```

## 你会得到什么输出

`project-wiki` 主要输出这些结果：

- **项目解释报告**：解释项目、模块、架构、数据流
- **评估报告**：评估方案、设计、边界、风险、技术债
- **对比矩阵**：结构化比较多个选项
- **决策备忘录**：给出推荐、理由、证据、待验证项
- **wiki 构建/更新计划**：告诉你该先建什么页、怎么补缺口、怎么更新

## 典型使用场景

### 1. 接手旧项目
让它先生成：
- 项目总览
- 架构地图
- 模块索引
- 术语页

### 2. 理解复杂模块
让它围绕某个模块输出：
- 模块职责
- 依赖关系
- 边界判断
- 证据与待确认项

### 3. 技术选型或方案比较
让它基于本地项目证据做：
- trade-off matrix
- 风险说明
- 推荐结论
- 待验证事项

### 4. 新人 onboarding
让它生成：
- 30 分钟上手知识页骨架
- 推荐阅读顺序
- 关键术语与模块入口

### 5. 文档整理与排障沉淀
让它把零散材料整理成：
- troubleshooting 页面
- known issues 页
- decision 记录
- 缺失文档清单

### 6. 讲题 / 教学系统场景
如果你有：
- 例题库
- 讲义
- 题解集
- 自己整理的知识库

那么可以让 `project-wiki`：
- 优先从这些本地知识源里找相关内容
- 优先按这些材料的讲解顺序和术语来讲
- 不足时再补充一般知识
- 区分“例题思路”和“补充说明”

## 自动触发 vs 精准触发

### 自动触发

如果你自然地说：
- `我有一个例题库，讲解时优先用它`
- `先按我的讲义思路来讲`
- `优先根据 docs/wiki 里的内容解释`
- `如果例题里有类似题，优先按例题思路讲`

`project-wiki` 应该把这理解为：
- 你指定了一个主知识源
- 你希望讲解优先用这个知识源
- 你可能还希望沿用这个知识源的讲解方式

### 精准触发

如果你希望更稳定，可以直接明确说：

```text
请用 project-wiki 优先基于例题库讲解这道题，并尽量沿用例题中的分析步骤。
```

或者：

```text
请用 project-wiki，主知识源设为讲义，优先沿用讲义的分析顺序。
```

## 示例 Prompts

```text
请解释这个项目的核心架构，并指出最关键的 5 个文件或页面证据。
```

```text
请比较两种方案，并基于本地项目证据给出推荐，不要只给泛泛最佳实践。
```

```text
请为这个项目设计一个离线优先的 wiki 结构，适合个人先用、团队后续复用。
```

```text
请评估当前模块边界是否合理，并把已验证事实、推断、待确认项分开写。
```

```text
请把当前项目材料整理成新人 30 分钟可上手的知识页骨架。
```

```text
我在做一个讲解题目的系统，我有一个例题库。请用 project-wiki 讲解这道题时优先调用例题库里的知识，并尽量按例题的思路来讲。
```

```text
请用 project-wiki 优先基于讲义讲解这个概念，不足时再补充一般知识，并把两者区分开。
```

## 个人场景怎么用

如果你是一个人维护项目，推荐这样用：

1. 先让它解释项目或模块
2. 再让它做评估 / 对比 / 决策支持
3. 最后把结论沉淀成 wiki 页面或更新计划

推荐先建立这几类页面：
- `overview`
- `module`
- `glossary`
- `troubleshooting`
- `decision`

一句话原则：
> 先把“理解”沉淀成 page，再把 page 变成长期资产。

## 小团队场景怎么用

如果是 2-8 人的小团队，推荐这样用：

- 把它当成“共享解释层”，而不是任务管理系统
- 让同类问题尽量沉淀为稳定页面，而不是反复聊天解释
- 用它先整理事实、证据、方案和风险，再由人做最终拍板
- 用它生成 onboarding 页面和 troubleshooting 页面，减少口头传承成本

project-wiki 支持小团队复用，但 **不** 试图成为：
- Jira / Linear
- 多人实时协作平台
- 企业知识中台

## 核心设计立场

`project-wiki` 是 **wiki-first**。

这意味着：
- 主产品是可维护知识层
- 检索服务于页面创建、页面更新和证据化回答
- 它不会被设计成“问什么都答”的 repo chatbot

## 主文件

### 核心运行文件
- `SKILL.md` — 主 skill
- `references/llm-wiki-core.md` — LLM Wiki 世界观
- `references/local-rag-engineering.md` — 本地检索 / RAG 工程支持
- `references/project-assistant-playbook.md` — 解释 / 评估 / 对比 / 决策模式
- `references/modes-and-safety.md` — local-first 与 online/API-enhanced 边界
- `references/source-priority-guidance.md` — 指定本地知识源优先讲解与讲解风格复用规则
- `references/system-integration-guidance.md` — 作为平台能力规范时的系统使用方式

### 维护与质量文件
- `contracts/*.json` — source policy 与 output contract
- `references/evidence-and-citation.md` — 轻量证据引用规范
- `references/wiki-quality-audit.md` — wiki 质量审计规则
- `references/incremental-update-protocol.md` — 增量更新协议
- `references/knowledge-lifecycle.md` — 轻量知识生命周期词汇与维护语义
- `references/output-quality-standards.md` — 输出质量最低标准
- `references/templates/*.md` — 页面模板
- `examples/*.md` — 高质量使用样例
- `scripts/install.mjs` / `scripts/doctor.mjs` — 安装与自检工具
- `evals/` — 轻量 golden cases 与 rubric
- `ROADMAP.md` — 路线图

## 使用风格

这个 skill 被设计成：
- **personal-first** —— 一个人也能顺手用
- **small-team friendly** —— 结果可被团队复用
- **local-first** —— 不依赖在线服务也能成立
- **evidence-aware** —— 重要结论应能追溯到来源

## License

MIT
