# CommonsMesh

> **完全去中心化的社区互助网络** — 基于 libp2p、本地 LLM 和密码学验证的开源应用

CommonsMesh 帮助世界各地的社群（无论是地理社区还是网络社群）实现高效的互助、资源匹配、社区动议和项目协作。它没有中央服务器，你的数据存储在你的设备上。

---

## 核心理念

用户在 app 中声明自己的**需求**和**能提供的资源**。这些信息以加密签名的增量消息形式，通过 libp2p 网络在社区节点间传播。每个 app 本地维护一个**社区图谱数据库**，内嵌的**轻量级 LLM（~1B 参数）**持续分析图谱，主动发现：

- 需求 ↔ 资源的直接匹配（互助搬家、技能交换等）
- 多人聚合需求（团购议价机会）
- 互补技能组合（项目合作机会）
- 社区活动和集体行动

AI 主动提出**动议**，代替用户完成匹配、分工、任务分配和进度跟进。

---

## Monorepo 结构

```
CommonsMesh/
├── protocol/                    # 协议层（消息格式、验证引擎、密码学）
│   ├── src/
│   │   ├── types.ts             # 完整类型定义
│   │   ├── validator.ts         # 消息验证流水线（含防女巫、防重放）
│   │   ├── engine.ts            # 状态转换引擎
│   │   ├── capability.ts        # 能力令牌（授权系统）
│   │   ├── crypto.ts            # Ed25519 签名 + SHA-256
│   │   ├── canonical.ts         # 规范化 JSON（确定性序列化）
│   │   ├── graph.ts             # 内存图谱操作
│   │   └── state.ts             # 初始状态工厂
│   ├── message-v1.schema.json   # JSON Schema（消息格式规范）
│   ├── SYBIL-RESISTANCE.md      # 防女巫攻击设计文档
│   ├── SYNC.md                  # 增量同步协议设计文档
│   └── examples/
│       └── demo-node.ts         # 协议层演示
│
├── packages/
│   ├── network/                 # libp2p 网络层
│   │   └── src/
│   │       ├── node.ts          # libp2p 节点工厂（TCP+WS+mDNS+DHT+GossipSub）
│   │       ├── sync.ts          # 增量同步协议实现（Bloom filter）
│   │       ├── types.ts         # 网络层类型和 Topic 命名规范
│   │       └── index.ts
│   │
│   ├── db/                      # 本地图谱数据库层
│   │   └── src/
│   │       ├── db.ts            # SQLite 连接管理和迁移运行器
│   │       ├── schema.ts        # 数据库 schema 类型
│   │       ├── event-store.ts   # 事件日志持久化
│   │       ├── graph-store.ts   # 图节点/边 CRUD + 查询
│   │       ├── nonce-store.ts   # 持久化 nonce 缓存（防重放）
│   │       ├── index.ts
│   │       └── migrations/
│   │           └── 001_initial.sql
│   │
│   └── llm/                     # 本地 LLM 集成层
│       └── src/
│           ├── llm-engine.ts    # LLM 引擎（llama.rn 或 OpenAI 兼容 API）
│           ├── matcher.ts       # 社区图谱匹配引擎（规则 + LLM）
│           └── index.ts
│
├── apps/
│   └── mobile/                  # React Native 移动端应用（Expo）
│       └── src/
│           ├── App.tsx          # 根组件
│           ├── navigation/      # React Navigation 路由
│           ├── screens/         # 所有页面
│           │   ├── OnboardingScreen.tsx      # 新用户引导（密钥生成）
│           │   ├── CommunityMapScreen.tsx    # 社区图谱主界面
│           │   ├── NeedsResourcesScreen.tsx  # 需求/资源声明
│           │   ├── ProjectsScreen.tsx        # 社区项目列表
│           │   ├── ProjectDetailScreen.tsx   # 项目详情
│           │   ├── TaskScreen.tsx            # 任务详情
│           │   ├── MatchSuggestionsScreen.tsx # AI 匹配建议
│           │   ├── ProfileScreen.tsx         # 用户档案
│           │   └── DisputeScreen.tsx         # 争议处理
│           ├── components/      # 公共组件（MatchCard, EventCard）
│           ├── hooks/           # useLLM hook
│           ├── services/        # keychain 服务（密钥生成和签名）
│           └── store/           # Zustand 状态管理
│
├── docs/
│   └── ARCHITECTURE.md          # 系统架构文档
│
├── legacy-src/                  # 原始 src/ 目录（历史参考）
├── tsconfig.base.json           # 共享 TypeScript 配置
└── package.json                 # pnpm workspace 配置
```

---

## 安全设计

| 威胁 | 防护机制 |
|------|----------|
| **女巫攻击** | 信任分数阈值（高影响力操作需 score ≥ 0.1）+ 社会证明 + 硬件证明 |
| **消息重放** | TTL 限定的 nonce 缓存（24h 自动过期）+ 时间窗口验证 |
| **消息篡改** | Ed25519 签名 + 规范化 JSON 的 SHA-256 payload hash |
| **链分叉** | 严格线性 chain_hash 链（只接受 prev_event_hash = 上一事件的 chain_hash）|
| **时钟攻击** | 消息 created_at 必须在本地时钟 ±5 分钟内 |
| **能力滥用** | 能力令牌 max_count 执行 + 即时撤销（revokedCapabilities set）|
| **投票双花** | 选举 nullifier 集合（每个 nullifier 只能使用一次）|

详见 [`protocol/SYBIL-RESISTANCE.md`](protocol/SYBIL-RESISTANCE.md)。

---

## 快速开始

### 环境要求

- Node.js ≥ 20
- pnpm ≥ 9
- React Native 开发环境（Expo CLI）

### 安装

```bash
git clone https://github.com/e982happy/CommonsMesh.git
cd CommonsMesh
pnpm install
```

### 构建协议层

```bash
pnpm build
```

### 运行移动端

```bash
cd apps/mobile
pnpm start
```

### 运行协议层演示

```bash
cd protocol
pnpm build
node dist/examples/demo-node.js
```

---

## 推荐的本地 LLM 模型

| 模型 | 大小 | 质量 | 备注 |
|------|------|------|------|
| Qwen2.5-1.5B-Instruct-Q4_K_M | ~1.0 GB | ★★★★ | 推荐首选，中文优秀 |
| SmolLM2-1.7B-Instruct-Q4_K_M | ~1.1 GB | ★★★☆ | 英文为主 |
| Phi-3.5-mini-instruct-Q4_K_M | ~2.2 GB | ★★★★★ | 质量最高，需要更多内存 |

模型文件（GGUF 格式）应放置于：
- iOS: `Documents/models/`
- Android: `files/models/`

---

## 贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 安全漏洞

请阅读 [SECURITY.md](SECURITY.md)。

## 路线图

请阅读 [ROADMAP.md](ROADMAP.md)。

## 许可证

[AGPL-3.0-only](LICENSE) — 使用本项目的任何修改版本必须以相同许可证开源。
