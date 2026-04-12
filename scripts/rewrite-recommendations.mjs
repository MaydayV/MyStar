import fs from "node:fs/promises";

const file = new URL("../src/data/repos.json", import.meta.url);

const CURATED = {
  "openclaw/openclaw": "一个把消息通道、工具调用、会话编排整合到同一运行时的 Agent 框架，适合作为可落地 AI 助手系统的工程底座。",
  "jackfrued/Python-100-Days": "覆盖从基础语法到工程实践的系统化 Python 路线，适合新人培养和全链路复盘。",
  "n8n-io/n8n": "开源自动化平台的成熟方案，连接器生态和流程编排能力都很强，业务自动化可直接上线。",
  "langgenius/dify": "LLM 应用平台化能力完整，RAG、Agent、可观测性和发布链路都做到了产品级。",
  "microsoft/PowerToys": "系统级效率工具的标杆项目，模块设计和交互细节都值得做桌面工具时对标。",
  "open-webui/open-webui": "面向私有化大模型场景的高完成度 WebUI，部署、模型管理和知识库能力都很实用。",
  "anomalyco/opencode": "聚焦 AI 编程协作的新一代工具链方向，适合持续跟踪“代码生产流程被智能体重写”的路径。",
  "mrdoob/three.js": "Web 3D 的事实标准库，生态与案例极其丰富，做可视化和交互展示几乎绕不开。",
  "shadcn-ui/ui": "现代 React 组件工程的最佳实践样板，组合式设计和可维护性非常适合中大型项目。",
  "Comfy-Org/ComfyUI": "节点式 AI 生成工作流代表项目，复杂生成链路可视化能力强，适合沉淀可复用生产模板。",
  "clash-verge-rev/clash-verge-rev": "跨平台代理客户端里体验和可维护性都很均衡，配置管理与日常可用性表现突出。",
  "ChatGPTNextWeb/NextChat": "轻量化 Chat 客户端模板，界面和部署都足够简洁，做自托管 AI 对话入口非常高效。",
  "louislam/uptime-kuma": "监控可用性场景的低门槛优选，告警链路清晰、部署轻量，适合中小团队快速接入。",
  "github/spec-kit": "围绕规范驱动开发的实用工具集，适合把需求、接口和交付过程做成可验证流程。",
  "obra/superpowers": "面向效率增强的开发辅助项目，适合用来补齐日常编码与调试中的高频动作。",
  "lobehub/lobehub": "AI 产品化能力做得很完整，UI 体验和模型接入都比较先进，适合作为 AI 应用交互层参考。",
  "obsproject/obs-studio": "直播与录制领域的开源基建级项目，插件体系和性能控制都非常成熟。",
  "binary-husky/gpt_academic": "把大模型能力与学术/知识工作场景结合得很实用，中文用户上手门槛低。",
  "affaan-m/everything-claude-code": "面向 Claude Code 生态的整理仓库，适合快速建立实践地图和使用边界认知。",
  "facebook/docusaurus": "文档站框架中的稳定方案，信息架构、版本化和扩展能力都适合工程团队长期维护。",
  "remix-run/react-router": "前端路由生态核心项目，理解它有助于掌握 React 应用的页面与数据流组织方式。",
  "RVC-Boss/GPT-SoVITS": "语音生成与克隆方向的高热度项目，效果与社区资料都比较完整。",
  "ngosang/trackerslist": "BT 生态常用资源集合，维护持续且实用，适合作为下载工具链基础依赖。",
  "odoo/odoo": "开源 ERP 的重量级方案，业务模块覆盖广，适合作为企业数字化系统选型参考。",
  "AlistGo/alist": "多存储统一文件管理的成熟项目，部署简单、扩展性好，适合个人与小团队自建网盘入口。",
  "1c7/chinese-independent-developer": "独立开发者中文社区里内容质量很高的资源库，长期更新，信息密度大。",
  "discourse/discourse": "社区论坛系统的现代化代表实现，权限体系和插件机制都非常成熟。",
  "tw93/Pake": "将 Web 应用快速打包为桌面端的轻量方案，适合快速验证跨平台桌面工具想法。",
  "GitHubDaily/GitHubDaily": "高频更新的开源项目发现渠道，适合持续追踪技术趋势和新工具。",
  "NaiboWang/EasySpider": "可视化爬虫与自动化采集工具，适合低门槛搭建数据抓取流程。",
  "iina/iina": "macOS 平台体验最好的开源视频播放器之一，交互和系统融合度很高，日常使用与二次开发都很友好。",
  "upscayl/upscayl": "本地图片超分辨率工具里最易用的一档，模型选择和批处理流程都做得很顺手。",
  "zhongyang219/TrafficMonitor": "轻量级网络与硬件监控工具，常驻显示设计很实用，适合做系统状态可视化参考。",
  "DIYgod/RSSHub": "RSS 聚合生态的核心基础设施，源覆盖广、可扩展性强，做信息订阅系统基本必备。",
  "zhayujie/chatgpt-on-wechat": "把大模型能力接入微信场景的经典实现，机器人路由和多渠道接入思路很清晰。",
  "payloadcms/payload": "TypeScript 生态下的现代 Headless CMS，数据模型、权限和内容发布流程都很工程化。",
  "CherryHQ/cherry-studio": "桌面端 AI 工作台方向做得很完整，模型管理与多任务交互体验都比较成熟。",
  "twentyhq/twenty": "开源 CRM 中产品化完成度很高的项目，界面现代、流程完整，适合业务系统选型对比。",
  "RSSNext/Folo": "信息流阅读体验做得很轻快，作为新一代订阅客户端方向值得长期关注。",
  "exelban/stats": "macOS 菜单栏系统监控的高质量方案，性能开销低、可视化清晰，实用性很强。",
  "reworkd/AgentGPT": "Auto Agent 概念早期代表项目，适合理解任务分解驱动的 AI 执行模式。",
  "pbatard/rufus": "U 盘启动盘制作工具中的硬核选手，稳定性高，系统安装与运维场景很可靠。",
  "RVC-Project/Retrieval-based-Voice-Conversion-WebUI": "语音转换方向的高热度开源方案，模型生态活跃，实验和创作场景都能覆盖。",
  "directus/directus": "数据库驱动的内容平台方案，后台管理和 API 层都很强，适合作为数据中台型 CMS。",
  "mpv-player/mpv": "极客向播放器标杆，脚本化能力和可定制性极高，适合进阶用户深度改造。",
  "drizzle-team/drizzle-orm": "TypeScript ORM 里类型安全做得非常激进的一派，适合追求可维护数据库层的项目。",
  "chen08209/FlClash": "跨平台代理客户端中易用性不错的实现，配置与连接管理做得比较直观。",
  "zeromicro/go-zero": "Go 微服务脚手架中的成熟路线，代码生成、治理与工程规范都比较体系化。",
  "qier222/YesPlayMusic": "网易云音乐第三方客户端里 UI 和体验完成度较高，前端工程实现值得参考。",
  "remix-run/remix": "全栈 React 框架的核心项目，数据加载与路由模型对现代 Web 架构启发很大。",
  "frappe/erpnext": "开源 ERP 的另一条成熟路线，业务模块化和流程能力都很完整。",
  "Chanzhaoyu/chatgpt-web": "轻量化 ChatGPT Web 客户端模板，部署快、改造成本低，适合快速搭建对话入口。",
  "coolsnowwolf/lede": "OpenWrt 生态里影响力极高的固件项目，路由器折腾与网络能力扩展的经典方案。",
  "dgtlmoon/changedetection.io": "网页变更检测的实战利器，监控配置灵活，信息追踪场景非常实用。",
  "VincentGarreau/particles.js": "前端粒子动画经典库，轻量且上手快，做视觉增强和动效背景很方便。",
  "songquanpeng/one-api": "多模型统一网关思路的代表项目，适合整合不同 LLM 渠道和计费策略。",
  "telegramdesktop/tdesktop": "Telegram 官方桌面客户端，跨平台工程质量高，适合研究大型即时通信客户端实现。",
  "jumpserver/jumpserver": "堡垒机场景的开源主力方案，权限审计链路完整，企业安全运维场景可直接落地。",
  "kingToolbox/WindTerm": "跨平台终端工具里手感和功能都很均衡，适合开发与运维日常主力使用。",
  "chatwoot/chatwoot": "开源客服系统成熟方案，渠道接入、会话管理和自动化能力都具备生产可用性。",
  "MetaCubeX/mihomo": "Clash 内核方向的核心项目，规则系统和性能表现都很强，网络代理场景的底层能力参考价值很高。",
  "labring/FastGPT": "面向知识库问答与工作流编排的中文友好方案，企业内落地 AI 助手时非常实用。",
  "cloudreve/cloudreve": "私有云盘里部署体验和可维护性都很不错，文件管理、分享和多存储接入能力比较完整。",
  "jordanbaird/Ice": "macOS 菜单栏管理工具，交互简洁、打磨细致，适合研究系统小工具的产品设计。",
  "Vision-CAIR/MiniGPT-4": "多模态大模型早期代表项目，理解视觉与语言联合推理路线时很有参考意义。",
  "lbjlaq/Antigravity-Manager": "面向特定代理客户端的管理工具，配置聚合和日常维护流程都做得比较顺手。",
  "apple/container": "Apple 在容器方向的官方探索项目，适合关注系统级虚拟化与开发环境演进的人持续跟进。",
  "pppscn/SmsForwarder": "短信转发自动化场景的实用工具，通知桥接和规则分发能力在个人自动化里很常用。",
  "zeroclaw-labs/zeroclaw": "智能体基础设施方向的新项目，定位明确，适合作为 Agent 工程化演进的观察样本。",
  "monicahq/monica": "个人关系管理领域的经典开源项目，数据结构与提醒机制适合做长期信息管理参考。",
  "Anjok07/ultimatevocalremovergui": "音频人声分离工具里的高口碑方案，模型集成与实际效果都比较可靠。",
  "dataease/dataease": "开源 BI 工具中上手门槛较低的一档，报表和可视化能力能覆盖多数业务分析场景。",
  "Johnshall/Shadowrocket-ADBlock-Rules-Forever": "规则维护持续、实用性高，适合作为网络过滤配置的长期基础资源。",
  "wechaty/wechaty": "微信机器人生态的核心项目，消息驱动编排和多协议适配路线都值得研究。",
  "RooCodeInc/Roo-Code": "面向 AI 编程代理的工具链项目，交互路径清晰，适合关注下一代开发工作流。",
  "marticliment/UniGetUI": "Windows 包管理整合工具，统一安装与更新体验做得很顺，效率提升明显。",
  "mihomo-party-org/clash-party": "代理客户端领域的新实现，UI 体验和配置可用性方向值得关注。",
  "maboloshi/github-chinese": "GitHub 中文化增强工具，解决阅读门槛问题非常直接，信息获取效率提升明显。",
  "activepieces/activepieces": "自动化编排平台里增长很快的开源选手，产品化和插件扩展能力都比较均衡。",
  "AutomaApp/automa": "浏览器自动化工具中非常实用的一款，流程录制和节点编排适合快速搭建 RPA 任务。",
  "1Panel-dev/MaxKB": "面向知识库问答场景的企业化方案，部署和运维路径清晰，适合内部 AI 知识助手落地。",
  "vercel/chatbot": "Vercel 官方 AI 聊天模板，工程结构干净，拿来做 Next.js + AI 产品原型非常高效。",
  "QuantumNous/new-api": "多模型统一接入网关方案，渠道聚合和配额管理在多供应商场景下很实用。",
  "kortix-ai/suna": "AI Agent 产品化方向的新项目，任务执行与交互闭环设计值得持续观察。",
  "whyour/qinglong": "自动化任务管理领域的经典项目，面板体验和脚本生态都比较成熟。",
  "MatsuriDayo/NekoBoxForAndroid": "Android 代理工具中完成度较高的一款，协议支持和稳定性表现都不错。",
  "k4yt3x/video2x": "视频超分辨率增强工具，适合低分辨率素材修复和清晰度提升场景。",
  "birobirobiro/awesome-shadcn-ui": "shadcn/ui 生态精选集合，做设计系统和组件选型时可以快速找到高质量案例。",
  "lionsoul2014/ip2region": "离线 IP 地址定位方案中的常用项目，查询性能和易集成性都很好。",
  "lss233/kirara-ai": "AI 对话与工具接入方向的社区项目，中文开发者上手成本较低。",
  "ourongxing/newsnow": "信息流聚合阅读项目，结构轻巧，适合做内容订阅入口和资讯看板。",
  "dropzone/dropzone": "前端上传组件经典库，交互成熟、接入简单，文件上传场景可快速落地。",
  "rocksdanister/lively": "Windows 动态壁纸工具里体验非常好的一款，性能和可玩性都很强。",
  "iOfficeAI/AionUi": "AI 应用界面组件化方向项目，适合作为 AI 产品前端搭建参考。",
  "matryer/xbar": "菜单栏插件框架老牌项目，扩展机制优雅，做轻量系统监控与快捷入口很方便。",
  "Mikubill/sd-webui-controlnet": "Stable Diffusion ControlNet 核心扩展，控制生成结构与一致性时几乎必用。",
  "sczhou/CodeFormer": "人脸修复领域的高质量项目，老照片/低清人像增强效果很有竞争力。",
  "OpenEmu/OpenEmu": "macOS 模拟器整合体验的标杆项目，统一管理和即开即玩的产品感很强。",
  "kvcache-ai/ktransformers": "推理性能优化方向项目，围绕 KV cache 等关键路径做了不少工程化提速探索。",
  "jianchang512/pyvideotrans": "视频翻译与处理自动化工具，适合做多语言视频内容生产和二次加工流程。",
  "putyy/res-downloader": "多平台资源下载工具，覆盖面广、上手门槛低，适合做内容采集与归档的日常工具。",
  "zai-org/ChatGLM2-6B": "中文大模型早期关键项目，适合理解国产通用模型在推理与部署层面的工程路径。",
  "OpenEthan/SMSBoom": "短信轰炸防范相关的测试类项目，更多适合作为安全对抗与风控策略研究样本。",
  "czlonkowski/n8n-mcp": "把 MCP 能力接入 n8n 工作流的实用桥接项目，自动化与工具调用结合得比较直接。",
  "sunnyyoung/WeChatTweak": "微信客户端增强工具，功能补强点清晰，适合研究桌面客户端能力扩展。",
  "JoeanAmier/TikTokDownloader": "短视频下载工具里体验较好的实现，批量处理和兼容性方面表现不错。",
  "hq450/fancyss": "路由器科学网络场景的经典插件方案，配置与稳定性都经过长期社区验证。",
  "darkroomengineering/lenis": "现代网页滚动体验优化库，手感细腻，做高品质前端动效时非常加分。",
  "metersphere/metersphere": "测试管理平台的成熟开源方案，接口测试到质量流程管理都能覆盖。",
  "babalae/better-genshin-impact": "面向游戏体验增强的工具项目，功能聚焦明确，社区活跃度也较高。",
  "libnyanpasu/clash-nyanpasu": "代理客户端中的高颜值实现，配置体验和跨平台支持都比较完整。",
  "go-admin-team/go-admin": "Go 后台管理脚手架的常用方案，RBAC、代码生成和管理后台能力齐全。",
  "xszyou/Fay": "AI 助手方向的应用型项目，交互和能力集成思路适合快速做产品验证。",
  "snarktank/ralph": "AI 工具链新项目，定位偏开发效率增强，适合持续观察其能力演进。",
  "willwulfken/MidJourney-Styles-and-Keywords-Reference": "MidJourney 提示词与风格参考库，信息密度高，适合做视觉生成风格库。",
  "typecho/typecho": "轻量博客系统里的老牌项目，结构简洁、维护稳定，适合个人内容站快速上线。",
  "DayBreak-u/chineseocr_lite": "中文 OCR 轻量方案，部署成本低，适合做文档识别和数据提取的基础能力。",
  "assimon/dujiaoka": "发卡系统领域的实战项目，支付与商品管理流程完整，商业化路径清晰。",
  "doocs/md": "微信 Markdown 编辑器的高口碑项目，内容排版和发布效率提升明显。",
  "alienator88/Pearcleaner": "macOS 应用卸载清理工具，界面简洁、清理逻辑明确，日常系统维护很好用。",
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function fallback(r) {
  const lang = r.language || "多语言";
  const topics = (r.topics || []).slice(0, 3);
  const focus = topics.length ? topics.join(" / ") : "工程实现";
  const stars = r.stars || 0;

  const starters = [
    `${r.name} 在 ${focus} 这个方向的完成度不错`,
    `这个仓库的核心价值在于 ${focus} 的可落地实现`,
    `围绕 ${focus} 的工程组织做得比较扎实`,
    `从实战角度看，这是一个在 ${focus} 上可直接借鉴的项目`,
  ];
  const middles = [
    `技术栈以 ${lang} 为主，结构清晰`,
    `主栈是 ${lang}，代码组织相对规整`,
    `${lang} 生态下的实现细节有参考价值`,
  ];
  const ends = [
    stars >= 50000
      ? `社区规模很大（⭐ ${stars.toLocaleString()}），属于该方向的高优先级参考。`
      : stars >= 10000
        ? `社区验证充分（⭐ ${stars.toLocaleString()}），适合优先纳入收藏。`
        : stars >= 2000
          ? `热度和质量都在线（⭐ ${stars.toLocaleString()}），值得完整过一遍。`
          : `虽然热度不高，但实现思路实用，适合作为细分场景补充。`,
  ];

  const h = hash(r.fullName || r.name || "x");
  return `${starters[h % starters.length]}；${middles[h % middles.length]}。${ends[0]}`;
}

const raw = await fs.readFile(file, "utf8");
const data = JSON.parse(raw);

data.repos = data.repos.map((r) => ({
  ...r,
  recommendation: CURATED[r.fullName] || fallback(r),
}));

data.generatedAt = new Date().toISOString();

await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Rewrote recommendations for ${data.repos.length} repos`);
