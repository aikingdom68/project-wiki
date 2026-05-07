# Project Wiki 与 Meta 记忆结构分析

> 目的：解释 Meta 的“三层记忆”到底是什么，它的项目逻辑是什么，以及 `project-wiki` 和你的 C/C++ 教学知识库可以借鉴哪些点。

---

## 1. 先说结论

Meta 的“三层记忆”本质不是神秘技术，而是：

```text
目录 → 分类正文 → 旧资料归档
```

它主要服务的是：

```text
让 Claude / Agent 下次重新开始工作时，可以快速恢复上下文。
```

你的项目不能直接照搬它，因为你的项目不是 Agent 自己恢复工作状态，而是：

```text
本地优先的 C/C++ 教学知识系统。
```

但是你可以借鉴它的核心思想：

```text
不要把所有知识堆在一起。
先有入口索引，再有稳定知识，再有原始证据，再有反馈归档。
```

对于 `project-wiki` 来说，最好的升级方向不是固定“三层记忆”，而是：

```text
根据项目类型，自动推荐合适的知识结构、检索方式和更新策略。
```

---

## 2. Meta 的“三层记忆”到底是什么？

Meta 的记忆系统，本质上是在解决一个问题：

> Claude / Agent 做完一堆事以后，下一次重新打开，怎么快速知道“我之前做到哪了、什么重要、什么可以忘掉”？

它不是为了普通用户查知识。

它是为了 **Agent 自己恢复工作状态**。

---

## 3. 第一套核心三层：Index / Topic / Archive

Meta 的 `meta-librarian` 里有一套三层结构：

```text
┌────────────────────────────┐
│ 第 1 层：MEMORY.md 索引层   │
│ 像目录 / 书签 / 前台指路牌  │
└─────────────┬──────────────┘
              │ 指向
              ▼
┌────────────────────────────┐
│ 第 2 层：Topic 主题文件层   │
│ 像一本本分类笔记            │
│ 真正内容放这里              │
└─────────────┬──────────────┘
              │ 过期 / 不常用
              ▼
┌────────────────────────────┐
│ 第 3 层：Archive 归档层     │
│ 像仓库 / 冷库 / 历史档案    │
└────────────────────────────┘
```

用小白话讲：

```text
MEMORY.md = 目录
Topic files = 正文
Archive = 旧资料仓库
```

它的重点不是“存得多”，而是：

```text
下次醒来，30 秒内能恢复状态。
```

---

## 4. 为什么要这么分？

如果所有东西都塞进一个文件，就会变成垃圾堆：

```text
今天的任务
昨天的 bug
半年前的设计决定
用户偏好
临时日志
历史错误
全堆一起
```

下次 Claude 一打开，根本不知道该看哪里。

所以它分成三层：

```text
索引层：告诉你该看哪里
主题层：真正保存重要知识
归档层：旧的、不常用的东西放冷库
```

---

## 5. Meta 的写入流程

它大概是这样：

```text
一次会话结束
    │
    ▼
提取有价值的信息
    │
    ├─ 是临时任务？──────► 短期保存，过期后归档
    │
    ├─ 是设计决策？──────► 长期保存到 topic 文件
    │
    ├─ 是错误模式？──────► 保存一段时间，看是否复发
    │
    └─ 是外部引用？──────► 保存，但定期重新验证
    │
    ▼
更新 MEMORY.md 目录指针
```

图解：

```text
[当前会话]
    │
    ▼
[提取信息]
    │
    ├── 临时进度 ─────► 短期记忆 ─────► 过期归档
    │
    ├── 重要决策 ─────► 主题文件 ─────► 永久保留
    │
    ├── 错误经验 ─────► 主题文件 ─────► 30天无复发归档
    │
    └── 外部资料 ─────► 主题文件 ─────► 定期重查
    │
    ▼
[更新 MEMORY.md 索引]
```

---

## 6. Meta 的读取流程

下次 Agent 醒来，它不是全库乱搜，而是：

```text
先读 MEMORY.md
    │
    ▼
找到相关 topic 文件
    │
    ▼
读真正内容
    │
    ▼
如果还不够，再去 archive 找旧资料
```

图解：

```text
[新会话开始]
      │
      ▼
[读 MEMORY.md 目录]
      │
      ├── 找到了当前任务相关指针
      │          │
      │          ▼
      │     [读 topic 文件]
      │          │
      │          ▼
      │     [恢复工作状态]
      │
      └── 没找到
                 │
                 ▼
            [查 archive / 项目文件]
```

所以它不是“记忆很玄学”，就是：

```text
目录先行，正文分类，旧东西归档。
```

---

## 7. Meta 里的另一套 Memory/RAG 逻辑

你项目里还有一个文件：

```text
G:\CTools\web\agents\memory-rag-agent.md
```

它里面讲的是另一种层级：

```text
┌─────────────────────────────────┐
│ Session Memory 短期记忆          │
│ 当前对话上下文                   │
├─────────────────────────────────┤
│ Project Memory 中期记忆          │
│ 项目级已学习模式                 │
├─────────────────────────────────┤
│ Knowledge Base 长期知识库        │
│ 结构化、可索引、长期保存         │
├─────────────────────────────────┤
│ Archive 冷存储                   │
│ 很少访问的旧会话                 │
└─────────────────────────────────┘
```

注意，这其实更像 **四层**，不是严格三层。

小白解释：

```text
Session Memory = 这次聊天刚发生的东西
Project Memory = 这个项目反复出现的经验
Knowledge Base = 整理过、可以长期使用的知识
Archive = 很旧但不想彻底删的东西
```

流转方式：

```text
当前对话
  ↓
提取重要内容
  ↓
变成项目记忆
  ↓
多次出现、验证稳定
  ↓
沉淀成知识库
  ↓
过时后归档
```

图解：

```text
[当前会话 Session]
        │
        ▼
[项目记忆 Project Memory]
        │
        ▼
[长期知识库 Knowledge Base]
        │
        ▼
[归档 Archive]
```

这套逻辑和你的后端知识库更接近。

---

## 8. Meta 的项目逻辑到底是什么？

Meta 不是普通软件，它更像一个：

```text
Claude Code 多 Agent 治理系统
```

它的目标是：

```text
让 Claude Code 做复杂任务时，不要乱猜、乱改、乱忘。
```

它里面有很多 Agent：

```text
meta-warden      总协调
meta-conductor   编排流程
meta-librarian   管记忆
meta-prism       做质量审查
meta-sentinel    管安全
meta-artisan     配技能
```

你可以把它想成一个公司：

```text
老板 / 项目经理 / 档案管理员 / 审查员 / 安全员 / 工具管理员
```

它的记忆系统就是这个公司里的“档案室”。

---

## 9. Meta 记忆系统的真实目的

它不是为了学生问问题。

不是为了教学。

不是为了 API 返回答案。

而是为了：

```text
Agent 下次还能接着干活
不会重复犯错
不会忘记之前的决策
不会把临时东西当长期知识
```

所以它的三层记忆是：

```text
Agent 工作记忆
```

---

## 10. 你的项目逻辑是什么？

你的 `G:\CTools\web` 更像：

```text
本地优先的 C/C++ 教学知识系统
```

它现在大概有这些部分：

```text
┌──────────────────────────────┐
│ 前端页面                       │
│ web/offline-tutor/             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Python 本地后端服务            │
│ offline_c_tutor_server.py      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 知识库运行时                   │
│ kb_runtime.py                  │
│ 负责选知识源、检索、引用         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 本地教学知识库                 │
│ data/knowledge-base/           │
└──────────────────────────────┘
```

更具体：

```text
用户输入问题
  ↓
网页发给本地 Python 服务
  ↓
后端判断是讲概念 / 讲代码 / 诊断错误 / 项目解释
  ↓
kb_runtime.py 选择知识源
  ↓
查 topics / common-errors / glossary / OCR 页
  ↓
离线模式：本地脚本生成回答
API 模式：本地证据 + 大模型生成回答
  ↓
返回给用户
```

---

## 11. 你的项目现有知识结构

你现在已经有一套知识层雏形：

```text
data/knowledge-base/
├── kb-catalog.json              # 总目录
├── source-policies.json         # 谁优先、冲突听谁
├── retrieval-presets.json       # 不同模式怎么查
├── cpp-tutorial/                # 结构化知识层
│   ├── index.md
│   ├── topics.md
│   ├── common-errors.md
│   ├── glossary.md
│   ├── chapters.md
│   └── examples.md
└── c-tutorial/                  # 原始素材层 / 历史目录名
    ├── pages/
    ├── source/tutorial.pdf
    ├── common-errors.md
    └── vc6-compatibility.md
```

图解：

```text
┌─────────────────────────────────────┐
│ 控制入口层                            │
│ kb-catalog / policies / presets      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 结构化教学知识层                      │
│ topics / common-errors / glossary    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 原始证据素材层                        │
│ PDF / OCR pages / 原始例题            │
└─────────────────────────────────────┘
```

所以你不是从零开始。

你已经有一个“教学知识库版三层结构”的雏形了。

---

## 12. 你的项目能借鉴 Meta 哪些点？

### 12.1 借鉴点一：目录层不要放正文

Meta 的 `MEMORY.md` 只做索引，不塞大量正文。

你项目可以借鉴：

```text
kb-catalog.json 不应该放大量解释
它只负责告诉系统：
- 有哪些知识源
- 每个知识源入口在哪
- 适合什么任务
```

对应关系：

```text
Meta MEMORY.md
    ↓
你的 kb-catalog.json
```

---

### 12.2 借鉴点二：主题层才是真正知识

Meta 的 topic 文件才放真正内容。

你的项目对应：

```text
cpp-tutorial/topics.md
cpp-tutorial/common-errors.md
cpp-tutorial/glossary.md
cpp-tutorial/examples.md
```

这些才是“学生真的要看的知识”。

对应关系：

```text
Meta topic files
    ↓
你的 cpp-tutorial/*.md
```

---

### 12.3 借鉴点三：归档层保留原始证据

Meta 的 archive 是旧资料仓库。

你的项目不是简单 archive，而是：

```text
PDF
OCR 页文本
原始教材页
历史例题
source-map
```

这些不一定天天直接回答学生，但它们很重要，因为可以证明：

```text
这个知识从哪来的？
```

对应关系：

```text
Meta archive
    ↓
你的 c-tutorial/pages + PDF + source-map
```

---

### 12.4 借鉴点四：不是所有东西都永久放主知识库

Meta 很强调“过期策略”。

你的项目也需要区分：

```text
学生临时提问
某次 API 生成的解释
临时诊断结果
未验证的补充知识
```

这些不能一上来就进入正式 `topics.md`。

应该先进入一个“候选层”：

```text
data/knowledge-base/candidates/
```

或者：

```text
data/memory/learning-feedback/
```

等多次出现、人工确认后，再沉淀到正式知识页。

---

### 12.5 借鉴点五：冷启动恢复

Meta 讲“30 秒恢复工作状态”。

你的项目也可以借鉴：

> 后端启动时，不应该扫描所有 PDF/OCR 页；应该先读 catalog/policy/preset。

也就是：

```text
系统启动
  ↓
读 kb-catalog.json
  ↓
知道有哪些知识源
  ↓
读 retrieval-presets.json
  ↓
知道不同模式怎么查
  ↓
等用户提问时再按需查具体页面
```

这样比全量扫描更稳。

---

## 13. 哪些不能照搬？

### 13.1 不能照搬 Claude 的 MEMORY.md

`MEMORY.md` 是给 Claude Code 自动加载用的。

你的后端不应该依赖它。

后端应该依赖：

```text
kb-catalog.json
source-policies.json
retrieval-presets.json
```

---

### 13.2 不能照搬 7 天过期规则

Meta 说 session notes 7 天过期。

但你的教材知识不能这么搞。

比如：

```text
数组
函数
循环
常见错误
VC6 兼容
```

这些不能 7 天过期。

你的过期规则应该是：

```text
教材原文：永久保存
结构化知识页：长期保存，但可更新
学生临时反馈：短期保存
API 生成解释：先临时保存，验证后再进入知识库
```

---

### 13.3 不能照搬 Agent 工作流状态

Meta 记的是：

```text
哪个 Agent 做了什么
哪个任务还没完成
哪个决策已经通过
```

你的系统更需要记的是：

```text
哪个概念学生常问
哪个错误经常出现
哪种解释学生更容易懂
哪个知识点教材覆盖不足
```

这是完全不同的记忆对象。

---

## 14. “自动选择结构”到底靠什么判断？

如果说自动选择，它不能靠玄学，应该靠几个现实依据。

---

### 14.1 判断依据一：项目里面有什么材料？

```text
如果有 src / api / tests
  → 这是代码项目

如果有 PDF / OCR / lessons / examples
  → 这是教学/资料项目

如果有 FAQ / tickets / customer docs
  → 这是客服/产品知识库

如果有 papers / notes / citations
  → 这是研究资料库

如果都有
  → 这是混合项目
```

图解：

```text
项目文件
  │
  ├── src/api/tests 很多 ─────► 代码库结构
  │
  ├── PDF/教材/例题很多 ─────► 教学知识结构
  │
  ├── FAQ/工单/客户问题很多 ─► 支持知识库结构
  │
  ├── 论文/笔记/引用很多 ───► 研究资料结构
  │
  └── 多种都有 ─────────────► 混合结构
```

---

### 14.2 判断依据二：用户想干什么？

同一个项目，用户目的不同，结构也不同。

```text
用户想理解项目
  → overview / modules / decisions

用户想做教学回答
  → topics / examples / common-errors

用户想排错
  → troubleshooting / common-errors / logs

用户想做 API 产品
  → catalog / policy / contract / citations

用户想整理长期知识
  → wiki pages / index / archive
```

---

### 14.3 判断依据三：知识变化快不快？

```text
代码变化快
  → 需要 runtime evidence 优先

教材变化慢
  → 结构化知识页可以长期用

学生反馈变化快
  → 先放临时反馈层

API 生成内容不稳定
  → 不能直接进正式知识库
```

---

### 14.4 判断依据四：回答需不需要证据？

如果是教学、考试、项目决策，就需要证据。

```text
需要证据
  → 必须保留 source_path / citation

不太需要证据
  → 可以简单总结

有冲突风险
  → 必须 source policy
```

---

### 14.5 判断依据五：离线还是 API？

```text
离线优先
  → 结构化 Markdown 页面必须可直接读

API 增强
  → 需要 retrieval contract / output contract / citations

全在线
  → 可以更依赖模型，但仍建议保留本地证据
```

---

## 15. 自动选择结构树

```text
Project Wiki 启动
│
├── Step 1：识别项目材料
│   │
│   ├── 代码为主？
│   │      └── 使用「代码库 Wiki 结构」
│   │
│   ├── 教材/例题/PDF 为主？
│   │      └── 使用「教学知识库结构」
│   │
│   ├── 文档/FAQ/工单为主？
│   │      └── 使用「产品支持知识库结构」
│   │
│   ├── 论文/笔记/引用为主？
│   │      └── 使用「研究资料库结构」
│   │
│   └── 多种都有？
│          └── 使用「混合结构」
│
├── Step 2：识别用户目标
│   │
│   ├── 解释项目 → overview / modules
│   ├── 教学讲解 → topics / examples
│   ├── 错误诊断 → common-errors / troubleshooting
│   ├── 方案决策 → decisions / evidence
│   └── API 接入 → contracts / citations
│
├── Step 3：选择检索方式
│   │
│   ├── 小项目 / 明确文件 → direct read
│   ├── 关键词明确 → lexical search
│   ├── 大量资料 → indexed retrieval
│   ├── 问法很口语 → semantic / hybrid
│   └── 有 API → local evidence + model synthesis
│
└── Step 4：选择更新方式
    │
    ├── 只读查询 → 不写文件
    ├── 有价值回答 → 提议写入 wiki
    ├── 临时反馈 → 放 feedback/candidates
    └── 过期资料 → 放 archive
```

---

## 16. 不同项目可以搭不同结构

### 16.1 教学系统结构

适合你的 C/C++ 项目。

```text
┌──────────────────────────────┐
│ A. 控制层                      │
│ catalog / policy / presets     │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ B. 教学知识层                  │
│ topics / glossary / errors     │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ C. 证据素材层                  │
│ PDF / OCR / 原始例题           │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ D. 学习反馈层                  │
│ 学生常错点 / 高价值问答        │
└──────────────────────────────┘
```

这其实是四层。

你的项目很适合四层，因为教学系统天然有“学生反馈”。

---

### 16.2 普通代码库结构

适合后端、SDK、工程项目。

```text
┌──────────────────────────────┐
│ A. 项目入口层                  │
│ README / docs/wiki/index       │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ B. 模块知识层                  │
│ modules/auth.md                │
│ modules/api.md                 │
│ modules/db.md                  │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ C. 决策与排障层                │
│ decisions/                     │
│ troubleshooting.md             │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ D. 运行证据层                  │
│ source code / tests / configs  │
└──────────────────────────────┘
```

这里代码是真相，所以 runtime evidence 要优先。

---

### 16.3 PDF / 资料库结构

适合课程资料、研究资料、论文库。

```text
┌──────────────────────────────┐
│ A. 资料目录层                  │
│ catalog / tags / source list   │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ B. 主题综述层                  │
│ topic summaries                │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ C. 原文证据层                  │
│ PDF pages / quotes / citations │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ D. 研究问题层                  │
│ open questions / hypotheses    │
└──────────────────────────────┘
```

---

### 16.4 产品客服知识库结构

适合 FAQ、客户支持、工单系统。

```text
┌──────────────────────────────┐
│ A. 问题入口层                  │
│ FAQ index / issue categories   │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ B. 标准答案层                  │
│ approved answers               │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ C. 案例证据层                  │
│ tickets / logs / examples      │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ D. 反馈修正层                  │
│ unresolved / wrong answers     │
└──────────────────────────────┘
```

---

### 16.5 小项目结构

小项目没必要复杂。

```text
┌──────────────────────────────┐
│ overview.md                   │
├──────────────────────────────┤
│ decisions.md                  │
├──────────────────────────────┤
│ troubleshooting.md            │
└──────────────────────────────┘
```

对小项目来说，这就够了。

会判断“不需要复杂化”本身就是能力。

---

## 17. 你的项目我建议怎么搭配？

你的项目不是单一类型，它是混合型。

它同时有：

```text
1. 教学资料库
2. 本地后端运行时
3. Claude/Agent 治理痕迹
4. API 增强能力
5. 离线包 portable
```

所以我建议你用一个“混合架构”。

---

## 18. 你的项目推荐大图

```text
                           ┌────────────────────────────┐
                           │ 用户问题                     │
                           │ 讲概念 / 讲代码 / 诊断 / 项目解释 │
                           └──────────────┬─────────────┘
                                          ▼
                           ┌────────────────────────────┐
                           │ 问题路由层                   │
                           │ 判断用户到底想干什么           │
                           └──────────────┬─────────────┘
                                          ▼
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ 教学知识分支             │  │ 项目运行分支             │  │ 知识库维护分支           │
│ 数组/循环/函数/报错       │  │ 后端/API/脚本/架构        │  │ 建 wiki / 更新知识页      │
└───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
            ▼                           ▼                           ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ cpp-tutorial/           │  │ docs/wiki/              │  │ candidates / updates    │
│ topics/errors/glossary  │  │ README / scripts        │  │ log / review status     │
└───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
            ▼                           ▼                           ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ c-tutorial/pages/       │  │ source code / tests     │  │ 人工确认后写回正式知识库  │
│ PDF/OCR/原始证据         │  │ runtime truth            │  │                         │
└───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
            └───────────────┬───────────┴───────────────┬───────────┘
                            ▼                           ▼
                 ┌────────────────────┐      ┌────────────────────┐
                 │ 离线回答             │      │ API 增强回答         │
                 │ 本地证据 + 本地脚本   │      │ 本地证据 + 模型综合   │
                 └────────────────────┘      └────────────────────┘
```

---

## 19. 你的项目实际可以分成 5 个区域

### 19.1 控制入口区

存：

```text
kb-catalog.json
source-policies.json
retrieval-presets.json
```

作用：

```text
告诉后端：
- 有哪些知识源
- 谁优先
- 什么问题查哪里
```

---

### 19.2 教学知识区

存：

```text
cpp-tutorial/topics.md
cpp-tutorial/common-errors.md
cpp-tutorial/glossary.md
cpp-tutorial/examples.md
cpp-tutorial/chapters.md
```

作用：

```text
真正给学生讲东西。
```

---

### 19.3 原始证据区

存：

```text
c-tutorial/pages/
source/tutorial.pdf
source-map.md
OCR 文本
原始例题
```

作用：

```text
证明教学知识从哪里来。
```

---

### 19.4 项目运行知识区

存：

```text
docs/wiki/overview.md
scripts/kb_runtime.py
scripts/offline_c_tutor_server.py
scripts/offline_cpp_tutor.py
web/offline-tutor/
README.md
```

作用：

```text
解释这个系统自己怎么运行。
```

---

### 19.5 反馈进化区

这个你现在还不够明确，我建议新增。

存：

```text
data/knowledge-base/feedback/
data/knowledge-base/candidates/
data/knowledge-base/review-log.md
```

作用：

```text
记录：
- 学生常问问题
- 常见误解
- API 生成但还没确认的好解释
- 需要补进正式知识库的候选内容
```

图解：

```text
学生问题 / API 回答 / 错误案例
        │
        ▼
候选反馈区 candidates / feedback
        │
        ├── 多次出现 + 被确认
        │          ▼
        │     写入 topics / common-errors
        │
        └── 过时 / 不可靠
                   ▼
              archive
```

这部分就是你从 Meta 记忆系统里最值得借鉴的点。

---

## 20. 最终建议：不是固定结构，而是“结构组合器”

你想法的核心应该落成这个：

```text
Project Wiki = 知识结构组合器
```

它不是固定三层，而是根据项目组合：

```text
代码库项目：
  项目总览 + 模块页 + 决策页 + 排障页

教学项目：
  教学主题 + 例题 + 常错点 + 原始教材证据 + 学习反馈

资料库项目：
  资料目录 + 主题综述 + 原文证据 + 开放问题

AI 产品项目：
  catalog + source policy + retrieval contract + output contract + feedback loop

小项目：
  overview + decisions + troubleshooting
```

---

## 21. project-wiki 现在还能怎么优化？

### 第一优先级：补“自适应知识结构”说明

建议新增：

```text
references/adaptive-knowledge-architecture.md
```

里面讲：

```text
不同项目类型
怎么判断
用什么结构
用什么检索
用什么更新策略
```

这个就是当前最核心的新想法。

---

### 第二优先级：SKILL.md 里加一个简短入口

不用写很长，只加一段：

```text
Project Wiki does not force every project into the same wiki layout.
During Adapt, classify the project type and select a fitting knowledge architecture:
small project, software repo, teaching system, document corpus, AI knowledge app, or mixed.
```

中文理解：

```text
不要强行所有项目套同一套 wiki。
先判断项目类型，再选结构。
```

---

### 第三优先级：做 C/C++ 教学系统真实 demo

最强 demo 应该是：

```text
输入：一个 C/C++ 教学系统
材料：PDF/OCR/例题/常见错误/术语表
输出：本地优先知识库 + 带引用回答
```

demo 可以展示：

```text
问：数组越界是什么？
系统：
- 先查 topics.md
- 再查 common-errors.md
- 必要时查 OCR 原文
- 输出带 citation 的小白解释
```

---

### 第四优先级：加“结构选择树”到 README

评委一眼就能看懂：

```text
Project Wiki 不是固定模板
它会根据项目类型选择结构
```

可以放这张树：

```text
Project type?
│
├── Teaching system → Teaching KB structure
├── Software repo → Architecture Wiki structure
├── Document corpus → Evidence Corpus structure
├── AI knowledge app → API-ready KB structure
├── Small project → Minimal wiki structure
└── Mixed project → Hybrid structure
```

---

### 第五优先级：改进后端检索

现在 `kb_runtime.py` 还比较朴素。

最明显的问题是：

```text
Open questions 有时会排到正式知识前面
```

应该优化排序：

```text
common-errors / topics 正文 > glossary > index > open questions
```

尤其教学回答不能先命中“待办问题”。

---

## 22. 最小落地版本

如果不想一下做太多，我建议就做三件事：

```text
1. 在 project-wiki 里加 adaptive knowledge architecture 说明
2. 在 README 里加结构选择树
3. 做 C/C++ 教学系统真实 demo
```

这三个最能提升整体表现。

---

## 23. 一句话总结

Meta 的三层记忆本质是：

```text
目录 → 分类正文 → 旧资料归档
```

它服务的是：

```text
Agent 恢复工作状态
```

你的项目不能照搬它，但可以借鉴它的核心思想：

```text
不要把所有知识堆一起；
先有入口索引，再有稳定知识，再有原始证据，再有反馈归档。
```

而 `project-wiki` 更适合升级成：

```text
一个能根据项目类型自动推荐知识结构、检索方式和更新策略的 skill。
```

你的 C/C++ 项目适合的不是固定三层，而是混合结构：

```text
控制入口层
教学知识层
原始证据层
项目运行知识层
反馈进化层
```

这才是你的项目最值得借鉴 Meta 的地方。
