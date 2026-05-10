# Tide 项目 — Claude Code 工作指南

## 一、项目灵魂(必须先读)

Tide 是一段五分钟的冥想式体验。给那些大脑跑得比自己想要的更快的人。它通过五个微型游戏读你怎样注意,然后还给你一份属于你这种心智的肖像和一段为这种心智量身做的声音。

Tide 不治愈,不优化,不打分。它在你已经愿意安静下来的那五分钟里,陪你待一会儿,给你一些关于你这颗心怎么动的诚实的话。

如果有人在玩完 Tide 之后,觉得他被读懂了一点,那这个作品就成立了。

**核心研究问题**:AI 能否为以不同方式感知世界的人,生成属于他们的审美体验?

注意力的多样性不是需要被修正的问题,而是需要被回应的现实。潮、山、镜、溪、萤这五种类型,没有优劣。Tide 不是要把用户训练成某一种"理想"类型,而是读懂他独特的注意力形状,然后为他生成一段与之共鸣的体验。

---

## 二、文献依据

Tide 处于 SensiLab (Jon McCormack 实验室) 研究脉络的延长线上。三条核心参考:

1. **Krol, Llano, Butler & Goncu 2024**, "Design Considerations for Automatic Musical Soundscapes of Visual Art for People with Blindness or Low Vision"。AI 自动生成的音景,为以不同方式感知世界的人提供审美体验。**这是 Tide 的直接方法论参照**。

2. **Trolland, Smith, Ilsar & McCormack 2024**, "Visual instrument co-design embracing the unique movement capabilities of a dancer with physical disability" (MOCO '24)。设计系统适应人,而不是要求人适应系统。

3. **Yang, Llano & McCormack 2024**, "Exploring Real-Time Music-to-Image Systems for Creative Inspiration in Music Creation"。实时数据驱动的生成式音视觉系统。

Tide 把这条研究线扩展到注意力差异的领域。

---

## 三、技术栈

- 框架: Next.js 14 (App Router,不是 Pages Router)
- 语言: TypeScript (strict 模式)
- 样式: Tailwind CSS
- 动画: Framer Motion
- 音频: Tone.js (实时调制) + Suno 预生成的 MP3 (基础层)
- AI: Anthropic Claude API
- 部署: Vercel
- 包管理: npm

---

## 四、项目结构

```
tide/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 落地页
│   │   ├── games/
│   │   │   ├── drift/page.tsx    # 游戏 1
│   │   │   ├── periphery/        # 游戏 2 (含 quiz 子页)
│   │   │   ├── pulse/page.tsx    # 游戏 3
│   │   │   ├── glimpse/page.tsx  # 游戏 4
│   │   │   └── current/page.tsx  # 游戏 5
│   │   ├── result/page.tsx       # 第 7 页:类型肖像
│   │   ├── meditation/page.tsx   # 第 8 页:Soundscape
│   │   ├── about/page.tsx        # 第 9 页:诗化数据收尾
│   │   └── api/
│   │       └── soundscape/route.ts  # Claude API 端点
│   ├── components/
│   ├── lib/
│   │   ├── types.ts              # 5 种类型定义
│   │   ├── scoring.ts            # 评分算法
│   │   ├── portrait.ts           # 肖像生成
│   │   └── sound/                # Tone.js 调制层
├── public/
│   ├── sounds/                   # Suno 预生成的 MP3
│   │   ├── tide.mp3
│   │   ├── mountain.mp3
│   │   ├── mirror.mp3
│   │   ├── stream.mp3
│   │   └── firefly.mp3
│   └── calligraphy/              # 用户手写的水墨毛笔字
│       ├── tide.png              # 潮
│       ├── mountain.png          # 山
│       ├── mirror.png            # 镜
│       ├── stream.png            # 溪
│       └── firefly.png           # 萤
└── CLAUDE.md
```

---

## 五、视觉设计原则

### 分页面色调

**深色页面** (#0a0e14 背景, #e0dfdb 文字):
- 落地页
- 5 个游戏页

**米白宣纸页面** (#f5f1e8 背景, #1a1a1a 文字):
- 第 7 页 (Result)
- 第 8 页 (Soundscape)
- 第 9 页 (About / 诗化数据)

色调切换发生在游戏 5 完成跳转到结果页时。这个明暗反转本身就是体验设计的关键节点。

### 通用原则

- 字体: 标题用 serif (EB Garamond / Cormorant Garamond),正文用 sans (Inter),中文用 Noto Serif SC
- 留白: 每屏至少 30% 空白
- 动画: 用 easeInOut,永远不用 linear。默认时长 0.6 至 0.8 秒
- 所有过渡像呼吸,不像剪切

### 五种类型的视觉语言

| 类型 | 视觉关键词 | 主色调 |
|------|-----------|--------|
| 潮 Tide | 水平流动的波形,缓慢起伏 | 蓝灰 |
| 山 Mountain | 三角几何,向上堆叠的稳定结构 | 土色 |
| 镜 Mirror | 对称镜像,柔和模糊 | 银白 |
| 溪 Stream | 分支线条,有机网络 | 翠绿 |
| 萤 Firefly | 散布粒子,间歇明灭 | 暗底 + 暖琥珀 |

---

## 六、数据流

```
用户玩 5 个游戏
  ↓
每个游戏写入 localStorage: tide_<gamename>_result
  ↓
Result 页读取 5 个 key
  ↓
calculateType() 返回 {type, scores}
  ↓
Result 页渲染肖像、得分、解释文字
  ↓
进入 Soundscape 页时,调用 /api/soundscape
  传入 {type, scores, gameData}
  ↓
Claude API 返回 {description, soundscape}
  ↓
Soundscape 页:加载 Suno MP3 + Tone.js 实时调制 + 显示 description
  ↓
进入第 9 页:从 localStorage 读取所有数据,诗化展示
```

---

## 七、第 8 页 (Soundscape) 详细设计

这一页是用户拿到属于他这种心智的声音的那一刻。Tide 不规定他怎样使用这段声音,只是把它给他。

### 进入页面

米白宣纸底 (#f5f1e8)。
**中央上半部分**: 用户类型对应的水墨毛笔字 (作者: 屈丽萱),约 240px × 240px,居中。这是第 7 页之后视觉的延续,但不再是程序生成的肖像,而是手写的字。
中央下半部分: 三段说明文字 (Claude API 生成的英文)。
底部: 极细横线作为播放进度。

### 音乐自动开始

页面加载后 3 秒淡入 (从 -∞ 到 -22 dB)。
Tone.js 加载 `public/sounds/{type}.mp3` (Suno 预生成的基础层),叠加实时调制层。
调制参数 (混响 decay、滤波 cutoff、音量包络) 由用户的具体游戏数据计算,通过 Claude API 返回的 soundscape 参数应用。

(注: 浏览器要求 Tone.js 由用户手势触发。第 7 页的 Continue 按钮点击算作手势,所以第 8 页可以自动播放。)

### 文字部分 (Claude API 实时生成)

肖像和音乐控件下方,三段克制的文字。直接显示,不做逐句浮现。居中,max-width 480px,段落之间 64px 间距。

**第一段 (about the sound)**:
*"This is the sound of [Tide / Mountain / Mirror / Stream / Firefly]."*
2-3 句话,描述实际生成的音频特征 (频率范围、层次、节奏感)。

**第二段 (recommended music)**:
*"Music that resonates with this attention type:"*
3-5 个艺术家或风格,从 ambient、modern classical、generative music 范围里选。

**第三段 (how others have used it)**:
*"How others have used it:"*
2-3 句使用情景,描述别人在什么情境下听这种音乐 (写作、编程、安静的早晨等),不规定。

### 底部

一条极细的横线 (1px, opacity 0.2, width 200px, 居中) 作为音乐播放进度指示,慢慢从左向右填满。不是传统播放控件。

### 离开

页面右下角一个极小的箭头 → 通向第 9 页。
点击离开时,音乐淡出 5 秒。

---

## 八、Claude API 端点规格

`POST /api/soundscape`

### 请求

```typescript
{
  type: 'tide' | 'mountain' | 'mirror' | 'stream' | 'firefly',
  scores: { [type: string]: number },
  gameData: {
    drift: { meanDistance: number, distanceVariance: number },
    periphery: { count: number, accuracy: number },
    pulse: { tapCount: number, meanInterval: number, intervalVariance: number },
    glimpse: { whole: number, detail: number, mood: number, structure: number },
    current: { totalDwell: number, switches: number, longestDwell: number }
  }
}
```

### 响应

```typescript
{
  description: {
    aboutTheSound: string,        // 2-3 句,描述音频特征
    recommendedMusic: string,     // 3-5 个艺术家/风格
    howOthersHaveUsedIt: string   // 2-3 句使用情景
  },
  soundscape: {
    reverbDecay: number,          // 1-8 秒
    filterCutoff: number,         // 200-8000 Hz
    targetVolume: number,         // dB, -30 至 -15
    fadeInDuration: number        // 秒,默认 3
  }
}
```

### Claude System Prompt

```
You are designing a personalized audio experience for a user who completed
the Tide attention test. Their attention type is: {type}.
Their game data: {humanReadable gameData}.

Generate a JSON response with two parts:

PART 1: description (three short paragraphs in English)

aboutTheSound: 2-3 sentences describing the actual audio characteristics
of the soundscape they're about to hear. Reference frequency range,
layering, reverb, rhythm. Make it specific to their data.

recommendedMusic: list 3-5 artists or styles in ambient, modern classical,
or generative music that resonate with this attention type. Be specific
(e.g., "Brian Eno's Music for Airports", "Stars of the Lid", "Tim Hecker").

howOthersHaveUsedIt: 2-3 sentences describing how others with this
attention type tend to use this kind of music. Describe scenarios
(writing, coding, quiet mornings) without prescribing.

Tone:
- Direct, calm, confident
- No wellness language, no therapy framing
- Treat the user as an adult who can decide for themselves
- English only

PART 2: soundscape (parameters for real-time audio modulation)

reverbDecay (1-8 seconds): longer for users with high longestDwell
filterCutoff (200-8000 Hz): brighter for higher periphery accuracy
targetVolume (-30 to -15 dB): louder for higher tapCount, quieter for low
fadeInDuration (default 3 seconds)

Output ONLY valid JSON, no preamble.
```

---

## 九、第 9 页 (Final Page) 详细设计

这一页是 Tide 的诗意收尾。**不是 about page,不是 contact page,不是 pitch**。

### 核心理念

用户玩完 Tide,最后一页看到的是**他自己刚才的数据被诗化展示**。这是一个"作品最终把注意力还给用户"的时刻。

### 视觉布局

米白宣纸底 (#f5f1e8),墨黑文字 (#1a1a1a)。

```
[顶部 20% 留白]

[中央: 诗化数据,EB Garamond italic, 16px, line-height 2.4, 居中, max-width 480px]

[底部 20% 留白]

[最底部: 极小字 "Lixuan Qu · github.com/Seraphine-qlx/Tide", 11px, opacity 0.3]
```

**没有按钮、没有 next、没有 back、没有 contact me**。这是体验的终点。

### 语言切换逻辑

读取 `navigator.language`:
- 包含 "zh" → 显示中文版
- 否则 → 显示英文版

### 中文模板

```
你的目光跟随了潮水 {drift.distanceVariance} 毫秒的起伏
你点击了 {pulse.tapCount} 次
你在 {current.switches} 次注意力转移之间切换
你最长一次停留了 {(current.longestDwell/1000).toFixed(1)} 秒
你以 {periphery.accuracy.toFixed(2)} 的精度感知了边缘

这些数字是你今天的影子
明天会不一样

— Tide, May 2026
```

### 英文模板

```
Your gaze followed the tide through {drift.distanceVariance} ms of variation.
You tapped {pulse.tapCount} times.
You shifted between elements {current.switches} times.
Your longest pause lasted {(current.longestDwell/1000).toFixed(1)} seconds.
You sensed the edges with {periphery.accuracy.toFixed(2)} precision.

These numbers are your shadow today.
Tomorrow they will be different.

— Tide, May 2026
```

### 数据来源

从 localStorage 读取所有 5 个游戏的结果,组合成模板里的占位符。如果某个数据不存在,那一行不显示。

### 实现要点

- 写死模板,不调用 Claude API
- 中英文版本两份模板,根据 navigator.language 选择
- 所有数字计算在客户端完成

---

## 十、五种类型定义 (lib/types.ts)

```typescript
export const ATTENTION_TYPES = {
  tide: {
    chinese: '潮',
    english: 'Tide',
    oneLine: 'You move in rhythms. Attention flows, recedes, and returns.',
    visualKeywords: ['flowing curves', 'horizontal motion', 'blue-grey'],
    color: '#5B7B9F'
  },
  mountain: {
    chinese: '山',
    english: 'Mountain',
    oneLine: 'You hold steady. Attention is a form of loyalty.',
    visualKeywords: ['triangular geometry', 'vertical stillness', 'earth tones'],
    color: '#8B7355'
  },
  mirror: {
    chinese: '镜',
    english: 'Mirror',
    oneLine: 'You reflect without grasping.',
    visualKeywords: ['symmetry', 'reflection', 'silver-white'],
    color: '#C0C5CE'
  },
  stream: {
    chinese: '溪',
    english: 'Stream',
    oneLine: 'You find the path. Attention follows what yields.',
    visualKeywords: ['branching lines', 'organic asymmetry', 'emerald'],
    color: '#5C8870'
  },
  firefly: {
    chinese: '萤',
    english: 'Firefly',
    oneLine: 'Attention pulses. Bright, dim, bright again.',
    visualKeywords: ['scattered points', 'intermittent glow', 'amber + indigo'],
    color: '#D4A574'
  }
};
```

---

## 十一、关键禁忌

- **永远不要**把 .env.local 提交到 Git。API key 放在那里。
- **永远不要**使用 Pages Router 模式。
- **永远不要**使用 HTML `<form>` 标签。用 button + onClick。
- **音频源是 Suno 预生成的 MP3 文件**,放在 `public/sounds/` 目录。Tone.js 负责加载、播放、实时调制 (混响、滤波、音量包络),所有调制效果由用户数据驱动。
- Tone.js 必须由用户手势触发才能开始。第 7 页的 Continue 按钮点击算作手势。
- **永远不要在第 8 页放程序生成的肖像**。第 7 页已经有肖像,第 8 页中央是用户手写的水墨毛笔字 (PNG)。
- **永远不要在第 9 页放 about、contact、pitch**。第 9 页只有用户自己的诗化数据。
- 永远不要在组件里硬编码 5 种注意力类型的文本。从 lib/types.ts 读取。
- 永远不要用心理治疗或医疗的语言写文案。Tide 不修复人。
- 移动端必须能跑,但是次要的。桌面端是主要体验场景。

---

## 十二、代码规范

- 组件: PascalCase,一文件一组件,default export
- Hooks: camelCase,以 use 开头
- 类型/接口: PascalCase,优先 type 而非 interface
- 文件名: 非组件文件用 kebab-case
- 不写注释,除非解释 WHY,永远不要解释 WHAT
- 避免 any。如果不可避免,加 TODO 注释
- Server vs Client 组件: 默认 server。仅在需要 state、hooks、浏览器 API 时才加 "use client"

---

## 十三、协作风格

当用户提出任务时:
1. 如果任务涉及多个文件,先简要列出要改什么,再动手。
2. 小步走,每一步可验证。不要一次性重写。
3. 完成大改动后,建议一个 git commit message。
4. 遇到歧义时,问一个聚焦的问题,不要瞎猜。
5. 如果发现之前的决定与项目灵魂相悖,立刻指出来。不要悄悄绕过。

---

## 十四、开发流程

- 启动开发服务器: `npm run dev`
- 类型检查: `npx tsc --noEmit`
- 构建测试: `npm run build`
- Push 触发 Vercel 自动部署

---

## 十五、美学北极星

- Jon McCormack / SensiLab 作品
- Generative.fm
- Are.na 的极简美学
- 早期 Brian Eno ambient 唱片
- Refactoring UI 的间距和字体原则

---

## 十六、当前状态

- ✅ 项目骨架 (Next.js + TypeScript + Tailwind)
- ✅ 5 个游戏全部实现
- ✅ 数据存储 localStorage
- ✅ 评分算法 (已修复 periphery accuracy 范围 bug)
- ✅ Result 页 (米白宣纸 + 程序化肖像 + 三段解释 + 五型墨点)
- ✅ Anthropic SDK 安装,API key 配置 (.env.local + Vercel)
- ✅ Vercel 部署 (tide-lilac.vercel.app)
- 🟡 进行中: 第 8 页 (Soundscape)
- ⏳ 待做: 5 个水墨毛笔字 (用户手写,扫描后放到 public/calligraphy/)
- ⏳ 待做: 5 段 Suno 音乐 (放到 public/sounds/)
- ⏳ 待做: Claude API 端点 /api/soundscape
- ⏳ 待做: Tone.js 实时调制层
- ⏳ 待做: 第 9 页 (诗化数据)
- ⏳ 待做: README + Demo 视频

---

## 十七、下一步任务 (按顺序)

### Step 1: 用户准备资源
- 玩一遍 Tide 确认自己的注意力类型
- 写 5 个水墨毛笔字 (潮、山、镜、溪、萤),拍照
- 用 Suno 生成 5 段 ambient 音乐 (每种类型一段)

### Step 2: 处理资源文件
- 把毛笔字 PNG 处理成透明背景,统一 600x600,放到 public/calligraphy/
- 把 Suno MP3 重命名 (tide.mp3 等),放到 public/sounds/

### Step 3: 第 8 页 UI 实现
- 米白底,水墨字居中
- 三段文字布局
- 底部进度条

### Step 4: Claude API 端点 /api/soundscape
- 接收 type, scores, gameData
- 调用 Claude API,返回 description + soundscape
- 错误回退到默认参数

### Step 5: Tone.js 加载 MP3 + 实时调制层
- 加载对应类型的 MP3
- 应用 reverb、filter、volume 调制
- 3 秒淡入,5 秒淡出

### Step 6: 第 9 页 (诗化数据)
- 读取 localStorage 全部数据
- 根据 navigator.language 选模板
- 居中排版

### Step 7: README + Demo 视频

---

## 十八、给 Claude Code 的最后提醒

每次写代码前,问自己一个问题:

> 这一行代码,是在帮 Tide 表达"注意力的多样性是被回应的现实", 还是在帮 Tide 变成又一个 wellness app?

如果答案不清楚,停下来问用户。

灵魂比代码重要。
