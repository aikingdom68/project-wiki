# project-wiki

> 语言说明：这是中文文档。For the English version, see [README.md](README.md).

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
  README.zh-CN.md
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
- **需要知识库优先回答的 AI SaaS 产品**

在这种场景下，`project-wiki` 定义的不是”用户该怎么说 prompt”，而是：
- 系统如何识别主知识源
- 系统如何决定知识源优先级
- 系统如何按知识源的思路组织讲解
- 系统如何区分例题思路、本地补充说明和一般性补充
- 系统在知识源冲突时应该如何显式裁决
- **检索层如何与知识库对接**（见 `contracts/retrieval-contract.schema.json`）
- **API 响应如何携带结构化引用**（见 `references/evidence-and-citation.md`）
- **离线时系统如何优雅降级**（见 `references/modes-and-safety.md`）
- **如何从零引导知识库冷启动**（见 `references/cold-start-protocol.md`）

如果你在做讲题平台，这一点尤其重要：
- 例题库可以是主知识源
- 系统讲解时应优先调用例题库
- 系统应尽量沿用例题库的分析顺序、术语和解题节奏
- 如果例题库不足，再补充其他本地资料，最后才补一般知识
- 如果例题库与项目当前实现或项目 docs/wiki 冲突，应显式标记冲突，而不是自动揉成一个答案

### SaaS 集成

如果你正在构建 AI SaaS 产品，`project-wiki` 提供了具体的集成契约：

| 契约 | 用途 |
|------|------|
| `contracts/retrieval-contract.schema.json` | 定义检索请求/响应结构：查询、源过滤、检索模式、覆盖度评估、降级信号、快照版本 |
| `contracts/output-contract.schema.json` | 定义按任务类型的结构化输出，包含 API 响应的引用对象 |
| `contracts/source-policy.schema.json` | 定义按租户或按项目的知识源优先级策略 |

关键 SaaS 场景指导：
- **离线降级**：`references/modes-and-safety.md` → “Offline capability boundary for SaaS” 定义了离线可用/受限/不可用的能力边界和降级序列
- **冷启动**：`references/cold-start-protocol.md` 覆盖了从零引导新实例的全流程
- **引用格式**：`references/evidence-and-citation.md` → “API-facing citation format” 定义了前端可渲染的引用对象和行内标记
- **版本快照**：`references/knowledge-lifecycle.md` → “Version snapshots” 支持对历史知识库状态的回溯查询

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
- **查询知识库并获得带引用的回答** —— 证据化回答 + 结构化引用指向源页面
- **构建 AI SaaS 产品** —— 知识库优先回答、离线降级、结构化引用

## 什么时候不要用

当你只是：
- 查一个符号、一个文件、一个配置项
- 做一次性摘要，不打算沉淀知识
- 只需要普通搜索，而不需要项目知识结构
- 做外部市场研究，而不是整理项目本地知识

## 和纯 RAG 到底有什么区别？

这是最常被问到的问题。核心区别不是”谁检索更准”，而是**知识层本身的形态不同**。

### 纯 RAG 的工作方式

```
用户提问 → 搜索原始文档片段 → LLM 用片段生成回答 → 回答消失在对话里
```

每次都从零开始：重新检索、重新拼接、重新生成。知识不累积，上一次回答的理解不会帮助下一次。

### project-wiki 的工作方式

```
原始材料 → 沉淀成结构化 wiki 页面（人可读、可浏览、可引用）
用户提问 → 先查 wiki 页面 → 如有 API 则综合生成 → 如无 API 则直接返回页面内容
```

知识提前整理好了，每次查询不需要从零开始。

### 离线时的对比（这是最关键的区别）

| | 纯 RAG（离线） | project-wiki（离线） |
|---|---|---|
| **能用吗？** | **不能用。** 有 chunks 但没有 LLM 就无法生成回答，等于废了 | **能用。** wiki 页面本身就是完整的、人可读的知识，不依赖 LLM 生成 |
| **用户能看到什么？** | 一堆碎片化的文档片段，或者直接报错”服务不可用” | 结构化的知识页面：项目总览、模块说明、决策记录、术语表、排障指南 |
| **能检索吗？** | 向量检索可能可用，但返回的是原始片段，不是答案 | 可以通过 index.md 目录检索，通过 `[[wikilink]]` 导航关联页面 |
| **能引用吗？** | 不能，引用需要 LLM 组织 | **能。** 每个页面自带证据链接和引用锚点，直接展示 |
| **事实和推断分开吗？** | 不分，LLM 生成时混在一起 | **分。** 页面里已经把”已验证事实”、”综合推断”、”待确认项”分开写好了 |

**一句话：纯 RAG 离线 = 死机。project-wiki 离线 = 降级但可用。**

### 有 API 时的对比

| | 纯 RAG（有 API） | project-wiki（有 API） |
|---|---|---|
| **回答质量** | 取决于当次检索质量，好坏不稳定 | wiki 层已经沉淀了高质量知识，API 做综合和补充，不是从零生成 |
| **知识累积** | 不累积，每次从原始文档重新检索 | 累积：好的回答可以保存回 wiki 页面，下次直接复用 |
| **引用可信度** | 引用指向原始 chunk，用户要自己判断是否相关 | 引用指向结构化 wiki 页面的具体段落，带置信度标签（verified_fact / synthesis / open_question） |
| **覆盖度感知** | 不知道知识库是否覆盖了这个问题，答不上来也会硬答 | 明确告知覆盖度（high/medium/low），不足时显式声明”知识库未覆盖”再降级 |
| **成本** | 每次都要大量 token 做生成 | wiki 层已有的知识可以直接返回，只在需要综合分析时调用 LLM，token 消耗更少 |

### 不需要 API 也能用，这不是缺陷，这是设计

`project-wiki` **不要求必须用 API**。它的核心产出是 **markdown wiki 页面**——有没有 LLM 都可以阅读、检索和使用。

API 是增强层，不是依赖层：

| 模式 | 说明 |
|------|------|
| **纯离线** | 浏览 wiki 页面、按 index 检索、通过 wikilink 导航、查看证据和引用。适合私密环境、断网场景、纯本地部署。 |
| **本地优先 + API 增强** | 先查 wiki 页面，不足时再调 LLM 综合分析。大部分查询不需要 API。 |
| **全在线** | wiki 页面 + LLM 综合 + 外部知识补充。适合需要实时推理和外部验证的场景。 |

### 这个优势只在和 Claude 对话时才有吗？

**不是。** 这是最需要讲清楚的一点。

`project-wiki` 的核心产出是 **一套标准化的 markdown 知识页面 + 配套的 JSON 契约**，不是 Claude 的私有格式。你自己的 AI 产品代码可以直接使用它们：

| 产出物 | Claude 对话时怎么用 | 嵌入你自己的产品时怎么用 |
|--------|---------------------|--------------------------|
| **wiki 页面**（overview/module/decision/glossary/troubleshooting） | Claude 读取页面来回答你的问题 | 你的产品后端直接读取这些 .md 文件，解析后返回给前端 |
| **index.md** | Claude 用它找到相关页面 | 你的产品用它做检索入口——扫 index 找候选页，比全文搜索快 |
| **`[[wikilink]]` 交叉引用** | Claude 用它导航关联知识 | 你的前端渲染为可点击的链接，用户可以自由浏览关联页面 |
| **_backlinks.json** | Claude 用它发现反向引用 | 你的产品用它做"相关推荐"——谁引用了当前页面 |
| **证据三层分离**（verified_fact/synthesis/open_question） | Claude 在回答时分层展示 | 你的前端用不同颜色/标签展示——绿色=已验证，黄色=推断，灰色=待确认 |
| **retrieval-contract.schema.json** | Claude 内部使用 | 你的产品后端直接按这个 schema 实现检索 API |
| **output-contract.schema.json** | Claude 按这个格式输出 | 你的产品按这个 schema 格式化 API 响应 |
| **citation 引用对象** | Claude 在回答中附带引用 | 你的前端渲染为脚注、悬浮提示或高亮跳转 |
| **_snapshots.json** | Claude 可以查历史版本 | 你的产品支持"查看上周的知识库版本"功能 |
| **SCHEMA.md** | Claude 从这里了解 wiki 结构 | 你的产品后端从这里读取 wiki 根路径和命名规则 |

**关键区别：**

- **纯 RAG** 嵌入产品后，离开 LLM 什么都做不了——chunks 是给 LLM 看的，人看不懂
- **project-wiki** 嵌入产品后，wiki 页面本身就是产品内容——人可读、机器可解析、前端可直接渲染

也就是说：
- 用 Claude 对话时，Claude 是读者和综合者
- 嵌入你的产品时，你的代码是读者，LLM 是可选的增强层
- 无论哪种场景，**wiki 页面 + 契约 + 引用格式**都是一样的

### 和其他产品的对比

- **相对 Repo Chat / 代码库问答**：Repo Chat 更偏即时问答；`project-wiki` 更强调证据、页面结构、缺口、决策上下文和更新路径，适合项目解释、设计评估、方案对比、onboarding 与 troubleshooting 沉淀。
- **相对静态 wiki / 普通文档库**：传统文档更擅长”存放内容”；`project-wiki` 更强调 source priority、事实与推断分离、显式冲突处理，以及围绕项目工作来持续更新知识层，而不只是堆文档。
- **相对通用 AI 记忆 / 笔记产品**：通用产品往往偏个人记录或自由检索；`project-wiki` 更强调项目语境、主知识源优先级，以及在本地证据不足时才谨慎回退到一般知识。
- **相对云端优先 / 外部索引优先产品**：很多产品默认把内容发到外部索引或在线服务；`project-wiki` 默认是 **local-first**，更适合私有仓库、敏感材料和离线优先流程。
- **相对一次性总结工具**：一次性总结更容易过期；`project-wiki` 支持轻量生命周期语义（`review_status`、`supersedes`、`retention_class`、`consolidation_status`），更适合长期维护。

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
- **知识库查询响应**：带结构化引用的证据化回答 + 覆盖度评估 + 保存提议
- **API 引用对象**：前端可渲染为链接、提示框或高亮的结构化引用

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

### 6. AI SaaS 知识库优先回答
构建 AI SaaS 产品时：
- 用 `contracts/retrieval-contract.schema.json` 作为检索接口
- 用 `contracts/output-contract.schema.json` → `citations` 字段渲染引用
- 用 `references/modes-and-safety.md` 处理离线降级
- 用 `references/cold-start-protocol.md` 引导新实例冷启动

### 7. 讲题 / 教学系统场景
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
- `references/modes-and-safety.md` — local-first 与 online/API-enhanced 边界，离线 SaaS 能力边界
- `references/source-priority-guidance.md` — 指定本地知识源优先讲解与讲解风格复用规则
- `references/system-integration-guidance.md` — 作为平台能力规范时的系统使用方式，SaaS 集成契约
- `references/wiki-linking.md` — `[[slug]]` 交叉引用语法、反向链接、孤页检测
- `references/cold-start-protocol.md` — 从零引导知识库冷启动

### 契约文件
- `contracts/output-contract.schema.json` — 按任务类型的结构化输出，含引用对象
- `contracts/source-policy.schema.json` — 知识源优先级策略
- `contracts/retrieval-contract.schema.json` — SaaS/API 场景的检索请求/响应结构

### 维护与质量文件
- `references/evidence-and-citation.md` — 轻量证据引用规范，API 引用格式
- `references/wiki-quality-audit.md` — wiki 质量审计规则，链接校验，孤页检测
- `references/incremental-update-protocol.md` — 增量更新协议，操作日志规范
- `references/knowledge-lifecycle.md` — 轻量知识生命周期词汇，版本快照
- `references/output-quality-standards.md` — 输出质量最低标准
- `references/templates/*.md` — 页面模板（overview、module、decision、glossary、troubleshooting、SCHEMA）
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
