# ☤ Hermes HUD — Web UI / 中文版

A browser-based consciousness monitor for [Hermes](https://github.com/nousresearch/hermes-agent), the AI agent with persistent memory.

这是一个面向 [Hermes](https://github.com/nousresearch/hermes-agent) 的浏览器可视化面板，用来查看代理的记忆、会话、技能、项目、健康状态、成本与实时聊天。

Same data, same soul, same dashboard that made the [TUI version](https://github.com/joeynyc/hermes-hud) popular — now in your browser.

它延续了 [TUI 版本](https://github.com/joeynyc/hermes-hud) 的核心体验，把同一份 Hermes 数据目录搬到了 Web 界面里。

## Fork Notice / 分支说明

This public release is a Simplified Chinese localization based on the original project [joeynyc/hermes-hudui](https://github.com/joeynyc/hermes-hudui).

这个公开版本基于原项目 [joeynyc/hermes-hudui](https://github.com/joeynyc/hermes-hudui) 做了简体中文本地化与公开发布整理。

Original author: [@joeynyc](https://github.com/joeynyc)

原作者：[@joeynyc](https://github.com/joeynyc)

Thanks to the original author for designing, building, and open-sourcing Hermes HUD UI.

感谢原作者设计、开发并开源 Hermes HUD UI。

This fork focuses on:
- Simplified Chinese UI localization
- public-friendly release cleanup
- integrated live chat with local Hermes CLI
- embedded official Hermes dashboard tab

这个分支主要做了：
- 界面简体中文化
- 面向公开分发的仓库整理
- 接入本地 Hermes CLI 的可用聊天页
- 内嵌官方 Hermes Dashboard 页签

## Public Release Safety / 公开发布安全说明

This repository is intended for public source distribution only. It does not include personal Hermes runtime data, `.env` files, API keys, tokens, session databases, or local logs.

这个仓库只用于公开源码分发，不包含个人 Hermes 运行数据、`.env` 文件、API Key、Token、会话数据库或本地日志。

If you plan to use it publicly, keep your own `HERMES_HOME`, credentials, and runtime data outside this repository.

如果你准备公开使用本项目，请把自己的 `HERMES_HOME`、凭据和运行数据放在仓库之外。

## Quick Start / 快速开始

```bash
git clone https://github.com/yinchun6969/Hermes-HUD_CN.git
cd Hermes-HUD_CN
./install.sh
hermes-hudui
```

Open / 打开:

```text
http://localhost:3001
```

Requirements / 环境要求:
- Python 3.11+
- Node.js 18+
- a running Hermes agent with data in `~/.hermes/`
- 已运行过的 Hermes，且数据目录位于 `~/.hermes/`

On future runs / 后续启动:
```bash
source venv/bin/activate && hermes-hudui
```

## What’s Inside / 功能概览

13+ tabs covering identity, memory, skills, sessions, cron jobs, projects, health, agents, chat, profiles, costs, corrections, patterns, and the embedded official Hermes dashboard.

共 13+ 个主要标签页，覆盖身份信息、记忆、技能、会话、定时任务、项目、健康、代理、聊天、画像、成本、纠错、模式分析，以及内嵌的官方新版 Dashboard。

Updates in real-time via WebSocket. No manual refresh needed.

通过 WebSocket 实时刷新，不需要手动刷新页面。

## Themes / 主题

Four themes switchable with `t`: **Neural Awakening** (cyan), **Blade Runner** (amber), **fsociety** (green), **Anime** (purple). Optional CRT scanlines.

按 `t` 可以切换四套主题：**Neural Awakening**（青色）、**Blade Runner**（琥珀色）、**fsociety**（绿色）、**Anime**（紫色），并支持可选 CRT 扫描线效果。

## Keyboard Shortcuts / 快捷键

| Key | Action | 中文说明 |
|-----|--------|----------|
| `1`–`9`, `0` | Switch tabs | 切换标签页 |
| `t` | Theme picker | 打开主题切换 |
| `Ctrl+K` | Command palette | 打开命令面板 |

## Relationship to the TUI / 与 TUI 的关系

This is the browser companion to [hermes-hud](https://github.com/joeynyc/hermes-hud). Both read from the same `~/.hermes/` data directory independently — use either one, or both at the same time.

这是 [hermes-hud](https://github.com/joeynyc/hermes-hud) 的浏览器版配套界面。两者都读取同一个 `~/.hermes/` 数据目录，但彼此独立运行。

The Web UI is fully standalone and adds features the TUI doesn't have: dedicated Memory, Skills, Sessions, Costs, official dashboard embedding, command palette, and live chat.

相比终端界面，Web UI 额外提供了更清晰的 Memory、Skills、Sessions、Costs、官方新版整合和实时 Chat 视图。

If you also have the TUI installed, you can enable it with `pip install hermes-hudui[tui]`.

如果你也使用 TUI，可以执行 `pip install hermes-hudui[tui]`。

## Platform Support / 平台支持

macOS · Linux · WSL

支持平台：macOS · Linux · WSL

## License / 许可证

MIT — see [LICENSE](LICENSE).

MIT 许可证，详见 [LICENSE](LICENSE)。

---

<a href="https://www.star-history.com/?repos=joeynyc%2Fhermes-hudui&type=date&logscale=&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=joeynyc/hermes-hudui&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=joeynyc/hermes-hudui&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=joeynyc/hermes-hudui&type=date&legend=top-left" />
 </picture>
</a>
