# 🤖 Copilot CLI Session

> [!NOTE]
> - **Session ID:** `8a3fcbdb-fcc8-4726-af85-b676b4c8dc97`  
> - **Started:** 01/04/2026, 1:33:46 PM  
> - **Duration:** 4m 52s  
> - **Exported:** 01/04/2026, 1:38:38 PM  

---

<sub>⏱️ 0s</sub>

### ℹ️ Info

Environment loaded

---

<sub>⏱️ 1s</sub>

### ℹ️ Info

MCP Servers reloaded: 1 server connected

---

<sub>⏱️ 34s</sub>

### 👤 User

explore the https://github.com/affaan-m/everything-claude-code project and tell me how can use it with github copilot cli

---

<sub>⏱️ 36s</sub>

### 💭 Reasoning

*The user wants me to explore the GitHub repository `affaan-m/everything-claude-code` and explain how it can be used with GitHub Copilot CLI. Let me fetch the repository contents and README.*

---

<sub>⏱️ 39s</sub>

### ✅ `github-mcp-server-get_file_contents`

**/**

<details>
<summary>Arguments</summary>

```json
{
  "owner": "affaan-m",
  "repo": "everything-claude-code",
  "path": "/"
}
```

</details>

```
Output too large to read at once (37.6 KB). Saved to: C:\Users\ZAKARY~1\AppData\Local\Temp\1775046865993-copilot-tool-output-ialwqk.txt
Consider using tools like grep (for searching), head/tail (for viewing start/end), view with view_range (for specific sections), or jq (for JSON) to examine portions of the output.

Preview (first 500 chars):
[{"type":"dir","size":0,"name":".agents","path":".agents","sha":"e2516d1f399c5b6db57d209b833df935ef584ca5","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/e2516d1f399c5b6db57d209b833df935ef584ca5","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents"},{"type":"dir","size
```


---

<sub>⏱️ 45s</sub>

### ✅ `github-mcp-server-get_file_contents`

**README.md**

<details>
<summary>Arguments</summary>

```json
{
  "owner": "affaan-m",
  "repo": "everything-claude-code",
  "path": "README.md"
}
```

</details>

<details>
<summary>7 lines</summary>

```
Output too large to read at once (60.1 KB). Saved to: C:\Users\ZAKARY~1\AppData\Local\Temp\1775046871222-copilot-tool-output-e6q0v2.txt
Consider using tools like grep (for searching), head/tail (for viewing start/end), view with view_range (for specific sections), or jq (for JSON) to examine portions of the output.

Preview (first 500 chars):
successfully downloaded text file (SHA: ced6bbc7c45b265f154f37d6050b7532a4dbcdfb)**Language:** English | [Português (Brasil)](docs/pt-BR/README.md) | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md) | [日本語](docs/ja-JP/README.md) | [한국어](docs/ko-KR/README.md) | [Türkçe](docs/tr/README.md)

# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![Forks](https://img.sh
```

</details>


---

<sub>⏱️ 44s</sub>

### ✅ `github-mcp-server-get_file_contents`

**.agents**

<details>
<summary>Arguments</summary>

```json
{
  "owner": "affaan-m",
  "repo": "everything-claude-code",
  "path": ".agents"
}
```

</details>

```
[{"type":"dir","size":0,"name":"plugins","path":".agents/plugins","sha":"2979dbf6011535467921b9983a843f9f96de6be9","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/plugins?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/2979dbf6011535467921b9983a843f9f96de6be9","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/plugins"},{"type":"dir","size":0,"name":"skills","path":".agents/skills","sha":"fd078e9d5d36bb1a7217f7e08296543dd5d67d49","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/fd078e9d5d36bb1a7217f7e08296543dd5d67d49","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills"}]
```


---

<sub>⏱️ 55s</sub>

### ✅ `powershell`

**Read README content**

<details>
<summary>Arguments</summary>

```json
{
  "command": "Get-Content \"C:\\Users\\ZAKARY~1\\AppData\\Local\\Temp\\1775046871222-copilot-tool-output-e6q0v2.txt\" | Select-Object -First 300",
  "description": "Read README content"
}
```

</details>

<details>
<summary>231 lines</summary>

````
successfully downloaded text file (SHA: ced6bbc7c45b265f154f37d6050b7532a4dbcdfb)**Language:** English | [Português (Brasil)](docs/pt-BR/README.md) | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md) | [日本語](docs/ja-JP/README.md) | [한국어](docs/ko-KR/README.md) | [Türkçe](docs/tr/README.md)

# Everything Claude Code[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![Forks](https://img.shields.io/github/forks/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/network/members)
[![Contributors](https://img.shields.io/github/contributors/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/graphs/contributors)
[![npm ecc-universal](https://img.shields.io/npm/dw/ecc-universal?label=ecc-universal%20weekly%20downloads&logo=npm)](https://www.npmjs.com/package/ecc-universal)
[![npm ecc-agentshield](https://img.shields.io/npm/dw/ecc-agentshield?label=ecc-agentshield%20weekly%20downloads&logo=npm)](https://www.npmjs.com/package/ecc-agentshield)
[![GitHub App Install](https://img.shields.io/badge/GitHub%20App-150%20installs-2ea44f?logo=github)](https://github.com/marketplace/ecc-tools)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Java](https://img.shields.io/badge/-Java-ED8B00?logo=openjdk&logoColor=white)
![Perl](https://img.shields.io/badge/-Perl-39457E?logo=perl&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)> **50K+ stars** | **6K+ forks** | **30 contributors** | **7 languages supported** | **Anthropic Hackathon Winner**---<div align="center">**Language / 语言 / 語言 / Dil**[**English**](README.md) | [Português (Brasil)](docs/pt-BR/README.md) | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md) | [日本語](docs/ja-JP/README.md) | [한국어](docs/ko-KR/README.md)
 | [Türkçe](docs/tr/README.md)</div>---**The performance optimization system for AI agent harnesses. From an Anthropic hackathon winner.**Not just configs. A complete system: skills, instincts, memory optimization, continuous learning, security scanning, and research-first development. Production-ready agents, skills, hooks, rules, MCP configurations, and legacy command shims evolved over 10+ months of intensive daily use building real products.Works across **Claude Code**, **Codex**, **Cowork**, and other AI agent harnesses.---## The GuidesThis repo is the raw code only. The guides explain everything.<table>
<tr>
<td width="33%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="./assets/images/guides/shorthand-guide.png" alt="The Shorthand Guide to Everything Claude Code" />
</a>
</td>
<td width="33%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="./assets/images/guides/longform-guide.png" alt="The Longform Guide to Everything Claude Code" />
</a>
</td>
<td width="33%">
<a href="https://x.com/affaanmustafa/status/2033263813387223421">
<img src="./assets/images/security/security-guide-header.png" alt="The Shorthand Guide to Everything Agentic Security" /
/>
</a>
</td>
</tr>
<tr>
<td align="center"><b>Shorthand Guide</b><br/>Setup, foundations, philosophy. <b>Read this first.</b></td>
<td align="center"><b>Longform Guide</b><br/>Token optimization, memory persistence, evals, parallelization.</td>       
<td align="center"><b>Security Guide</b><br/>Attack vectors, sandboxing, sanitization, CVEs, AgentShield.</td>
</tr>
</table>

| Topic | What You'll Learn |
|-------|-------------------|
| Token Optimization | Model selection, system prompt slimming, background processes |
| Memory Persistence | Hooks that save/load context across sessions automatically |
| Continuous Learning | Auto-extract patterns from sessions into reusable skills |
| Verification Loops | Checkpoint vs continuous evals, grader types, pass@k metrics |
| Parallelization | Git worktrees, cascade method, when to scale instances |
| Subagent Orchestration | The context problem, iterative retrieval pattern |

---

## What's New

### v1.9.0 — Selective Install & Language Expansion (Mar 2026)

- **Selective install architecture** — Manifest-driven install pipeline with `install-plan.js` and `install-apply.js` fo
or targeted component installation. State store tracks what's installed and enables incremental updates.
- **6 new agents** — `typescript-reviewer`, `pytorch-build-resolver`, `java-build-resolver`, `java-reviewer`, `kotlin-re
eviewer`, `kotlin-build-resolver` expand language coverage to 10 languages.
- **New skills** — `pytorch-patterns` for deep learning workflows, `documentation-lookup` for API reference research, `b
bun-runtime` and `nextjs-turbopack` for modern JS toolchains, plus 8 operational domain skills and `mcp-server-patterns`.
- **Session & state infrastructure** — SQLite state store with query CLI, session adapters for structured recording, ski
ill evolution foundation for self-improving skills.
- **Orchestration overhaul** — Harness audit scoring made deterministic, orchestration status and launcher compatibility
y hardened, observer loop prevention with 5-layer guard.
- **Observer reliability** — Memory explosion fix with throttling and tail sampling, sandbox access fix, lazy-start logi
ic, and re-entrancy guard.
- **12 language ecosystems** — New rules for Java, PHP, Perl, Kotlin/Android/KMP, C++, and Rust join existing TypeScript
t, Python, Go, and common rules.
- **Community contributions** — Korean and Chinese translations, security hook, biome hook optimization, video processin
ng skills, operational skills, PowerShell installer, Antigravity IDE support.
- **CI hardening** — 19 test failure fixes, catalog count enforcement, install manifest validation, and full test suite 
 green.

### v1.8.0 — Harness Performance System (Mar 2026)

- **Harness-first release** — ECC is now explicitly framed as an agent harness performance system, not just a config pac
ck.
- **Hook reliability overhaul** — SessionStart root fallback, Stop-phase session summaries, and script-based hooks repla
acing fragile inline one-liners.
- **Hook runtime controls** — `ECC_HOOK_PROFILE=minimal|standard|strict` and `ECC_DISABLED_HOOKS=...` for runtime gating
g without editing hook files.
- **New harness commands** — `/harness-audit`, `/loop-start`, `/loop-status`, `/quality-gate`, `/model-route`.
- **NanoClaw v2** — model routing, skill hot-load, session branch/search/export/compact/metrics.
- **Cross-harness parity** — behavior tightened across Claude Code, Cursor, OpenCode, and Codex app/CLI.
- **997 internal tests passing** — full suite green after hook/runtime refactor and compatibility updates.

### v1.7.0 — Cross-Platform Expansion & Presentation Builder (Feb 2026)

- **Codex app + CLI support** — Direct `AGENTS.md`-based Codex support, installer targeting, and Codex docs
- **`frontend-slides` skill** — Zero-dependency HTML presentation builder with PPTX conversion guidance and strict viewp
port-fit rules
- **5 new generic business/content skills** — `article-writing`, `content-engine`, `market-research`, `investor-material
ls`, `investor-outreach`
- **Broader tool coverage** — Cursor, Codex, and OpenCode support tightened so the same repo ships cleanly across all ma
ajor harnesses
- **992 internal tests** — Expanded validation and regression coverage across plugin, hooks, skills, and packaging

### v1.6.0 — Codex CLI, AgentShield & Marketplace (Feb 2026)

- **Codex CLI support** — New `/codex-setup` command generates `codex.md` for OpenAI Codex CLI compatibility
- **7 new skills** — `search-first`, `swift-actor-persistence`, `swift-protocol-di-testing`, `regex-vs-llm-structured-te
ext`, `content-hash-cache-pattern`, `cost-aware-llm-pipeline`, `skill-stocktake`
- **AgentShield integration** — `/security-scan` skill runs AgentShield directly from Claude Code; 1282 tests, 102 rules
- **GitHub Marketplace** — ECC Tools GitHub App live at [github.com/marketplace/ecc-tools](https://github.com/marketplac
ce/ecc-tools) with free/pro/enterprise tiers
- **30+ community PRs merged** — Contributions from 30 contributors across 6 languages
- **978 internal tests** — Expanded validation suite across agents, skills, commands, hooks, and rules

### v1.4.1 — Bug Fix (Feb 2026)

- **Fixed instinct import content loss** — `parse_instinct_file()` was silently dropping all content after frontmatter (
(Action, Evidence, Examples sections) during `/instinct-import`. ([#148](https://github.com/affaan-m/everything-claude-co
ode/issues/148), [#161](https://github.com/affaan-m/everything-claude-code/pull/161))

### v1.4.0 — Multi-Language Rules, Installation Wizard & PM2 (Feb 2026)

- **Interactive installation wizard** — New `configure-ecc` skill provides guided setup with merge/overwrite detection  
- **PM2 & multi-agent orchestration** — 6 new commands (`/pm2`, `/multi-plan`, `/multi-execute`, `/multi-backend`, `/mul
lti-frontend`, `/multi-workflow`) for managing complex multi-service workflows
- **Multi-language rules architecture** — Rules restructured from flat files into `common/` + `typescript/` + `python/` 
 + `golang/` directories. Install only the languages you need
- **Chinese (zh-CN) translations** — Complete translation of all agents, commands, skills, and rules (80+ files)        
- **GitHub Sponsors support** — Sponsor the project via GitHub Sponsors
- **Enhanced CONTRIBUTING.md** — Detailed PR templates for each contribution type

### v1.3.0 — OpenCode Plugin Support (Feb 2026)

- **Full OpenCode integration** — 12 agents, 24 commands, 16 skills with hook support via OpenCode's plugin system (20+ 
 event types)
- **3 native custom tools** — run-tests, check-coverage, security-audit
- **LLM documentation** — `llms.txt` for comprehensive OpenCode docs

### v1.2.0 — Unified Commands & Skills (Feb 2026)

- **Python/Django support** — Django patterns, security, TDD, and verification skills
- **Java Spring Boot skills** — Patterns, security, TDD, and verification for Spring Boot
- **Session management** — `/sessions` command for session history
- **Continuous learning v2** — Instinct-based learning with confidence scoring, import/export, evolution

See the full changelog in [Releases](https://github.com/affaan-m/everything-claude-code/releases).

---

## Quick Start

Get up and running in under 2 minutes:

### Step 1: Install the Plugin

```bash
# Add marketplace
/plugin marketplace add affaan-m/everything-claude-code

# Install plugin
/plugin install everything-claude-code@everything-claude-code
```

### Step 2: Install Rules (Required)

> WARNING: **Important:** Claude Code plugins cannot distribute `rules` automatically. Install them manually:

```bash
# Clone the repo first
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# Install dependencies (pick your package manager)
npm install        # or: pnpm install | yarn install | bun install

# macOS/Linux

# Recommended: install everything (full profile)
./install.sh --profile full

# Or install for specific languages only
./install.sh typescript    # or python or golang or swift or php
# ./install.sh typescript python golang swift php
# ./install.sh --target cursor typescript
# ./install.sh --target antigravity typescript
# ./install.sh --target gemini --profile full
```

```powershell
# Windows PowerShell

# Recommended: install everything (full profile)
.\install.ps1 --profile full

# Or install for specific languages only
.\install.ps1 typescript   # or python or golang or swift or php
# .\install.ps1 typescript python golang swift php
# .\install.ps1 --target cursor typescript
# .\install.ps1 --target antigravity typescript
# .\install.ps1 --target gemini --profile full

# npm-installed compatibility entrypoint also works cross-platform
npx ecc-install typescript
```

For manual install instructions see the README in the `rules/` folder. When copying rules manually, copy the whole langu
uage directory (for example `rules/common` or `rules/golang`), not the files inside it, so relative references keep worki
ing and filenames do not collide.

### Step 3: Start Using

```bash
# Skills are the primary workflow surface.
# Existing slash-style command names still work while ECC migrates off commands/.

# Plugin install uses the namespaced form
/everything-claude-code:plan "Add user authentication"

# Manual install keeps the shorter slash form:
# /plan "Add user authentication"

# Check available commands
/plugin list everything-claude-code@everything-claude-code
```

**That's it!** You now have access to 36 agents, 147 skills, and 68 legacy command shims.

### Multi-model commands require additional setup

> WARNING: `multi-*` commands are **not** covered by the base plugin/rules install above.
>
> To use `/multi-plan`, `/multi-execute`, `/multi-backend`, `/multi-frontend`, and `/multi-workflow`, you must also inst
tall the `ccg-workflow` runtime.
>
> Initialize it with `npx ccg-workflow`.
>
> That runtime provides the external dependencies these commands expect, including:
> - `~/.claude/bin/codeagent-wrapper`
> - `~/.claude/.ccg/prompts/*`
>
> Without `ccg-workflow`, these `multi-*` commands will not run correctly.

---

## Cross-Platform Support

This plugin now fully supports **Windows, macOS, and Linux**, alongside tight integration across major IDEs (Cursor, Ope
enCode, Antigravity) and CLI harnesses. All hooks and scripts have been rewritten in Node.js for maximum compatibility.  

### Package Manager Detection

The plugin automatically detects your preferred package manager (npm, pnpm, yarn, or bun) with the following priority:  

1. **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2. **Project config**: `.claude/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Detection from package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5. **Global config**: `~/.claude/package-manager.json`
6. **Fallback**: First available package manager

To set your preferred package manager:

```bash
# Via environment variable
export CLAUDE_PACKAGE_MANAGER=pnpm

# Via global config
node scripts/setup-package-manager.js --global pnpm

# Via project config
node scripts/setup-package-manager.js --project bun

# Detect current setting
node scripts/setup-package-manager.js --detect
```

Or use the `/setup-pm` command in Claude Code.

### Hook Runtime Controls

Use runtime flags to tune strictness or disable specific hooks temporarily:

```bash
# Hook strictness profile (default: standard)
export ECC_HOOK_PROFILE=standard

# Comma-separated hook IDs to disable
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
```

---

## What's Inside

This repo is a **Claude Code plugin** - install it directly or copy components manually.

```
everything-claude-code/
|-- .claude-plugin/   # Plugin and marketplace manifests
|   |-- plugin.json         # Plugin metadata and component paths
<exited with exit code 0>
````

</details>


---

<sub>⏱️ 50s</sub>

### ✅ `github-mcp-server-get_file_contents`

**.agents/skills**

<details>
<summary>Arguments</summary>

```json
{
  "owner": "affaan-m",
  "path": ".agents/skills",
  "repo": "everything-claude-code"
}
```

</details>

```
[{"type":"dir","size":0,"name":"api-design","path":".agents/skills/api-design","sha":"a524e5b686de4426996f3c2ce7c851e4b2677519","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/api-design?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/a524e5b686de4426996f3c2ce7c851e4b2677519","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/api-design"},{"type":"dir","size":0,"name":"article-writing","path":".agents/skills/article-writing","sha":"843137fadbe7e1f86275518bbdcffe67942ee59f","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/article-writing?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/843137fadbe7e1f86275518bbdcffe67942ee59f","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/article-writing"},{"type":"dir","size":0,"name":"backend-patterns","path":".agents/skills/backend-patterns","sha":"29dda5404b56dfc4102d534cecb2b0c2ff9a9d24","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/backend-patterns?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/29dda5404b56dfc4102d534cecb2b0c2ff9a9d24","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/backend-patterns"},{"type":"dir","size":0,"name":"bun-runtime","path":".agents/skills/bun-runtime","sha":"5b132aca6e9aa6cf0f3bedbd19b303da0301674b","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/bun-runtime?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/5b132aca6e9aa6cf0f3bedbd19b303da0301674b","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/bun-runtime"},{"type":"dir","size":0,"name":"claude-api","path":".agents/skills/claude-api","sha":"50c0f9672b117a163d3069c8c52c8e113ad2754f","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/claude-api?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/50c0f9672b117a163d3069c8c52c8e113ad2754f","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/claude-api"},{"type":"dir","size":0,"name":"coding-standards","path":".agents/skills/coding-standards","sha":"135670972c8a731903cc922dd432e9c681eb4b89","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/coding-standards?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/135670972c8a731903cc922dd432e9c681eb4b89","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/coding-standards"},{"type":"dir","size":0,"name":"content-engine","path":".agents/skills/content-engine","sha":"73a3c8f31647c7b19fe13b01dad5c26bad638077","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/content-engine?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/73a3c8f31647c7b19fe13b01dad5c26bad638077","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/content-engine"},{"type":"dir","size":0,"name":"crosspost","path":".agents/skills/crosspost","sha":"35a11516d660ea5895fced35e71514773240bd50","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/crosspost?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/35a11516d660ea5895fced35e71514773240bd50","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/crosspost"},{"type":"dir","size":0,"name":"deep-research","path":".agents/skills/deep-research","sha":"5e9717c45dde573986e648d87f6d50701c6c30ea","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/deep-research?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/5e9717c45dde573986e648d87f6d50701c6c30ea","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/deep-research"},{"type":"dir","size":0,"name":"dmux-workflows","path":".agents/skills/dmux-workflows","sha":"1ee8a8ac5b7308c45ae06c0f0b4714ce2d00be14","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/dmux-workflows?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/1ee8a8ac5b7308c45ae06c0f0b4714ce2d00be14","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/dmux-workflows"},{"type":"dir","size":0,"name":"documentation-lookup","path":".agents/skills/documentation-lookup","sha":"0c16bc13c425bd29dd6100f60f69a1083abe4e76","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/documentation-lookup?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/0c16bc13c425bd29dd6100f60f69a1083abe4e76","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/documentation-lookup"},{"type":"dir","size":0,"name":"e2e-testing","path":".agents/skills/e2e-testing","sha":"9637451eea2d36dd803c10ba4049a21f15fa59cf","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/e2e-testing?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/9637451eea2d36dd803c10ba4049a21f15fa59cf","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/e2e-testing"},{"type":"dir","size":0,"name":"eval-harness","path":".agents/skills/eval-harness","sha":"671c03cc45bfb0e8da42fcd8f343be8b5a099e98","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/eval-harness?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/671c03cc45bfb0e8da42fcd8f343be8b5a099e98","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/eval-harness"},{"type":"dir","size":0,"name":"everything-claude-code","path":".agents/skills/everything-claude-code","sha":"ebf87afb2b3ed29b4f3274d4ce33bc35c98bee0c","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/everything-claude-code?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/ebf87afb2b3ed29b4f3274d4ce33bc35c98bee0c","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/everything-claude-code"},{"type":"dir","size":0,"name":"exa-search","path":".agents/skills/exa-search","sha":"1c34e62fbd38354ffc7106c0d06e657cbb68ec19","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/exa-search?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/1c34e62fbd38354ffc7106c0d06e657cbb68ec19","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/exa-search"},{"type":"dir","size":0,"name":"fal-ai-media","path":".agents/skills/fal-ai-media","sha":"5c5dcfef79919de7c02709535f77c642ddbdc07b","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/fal-ai-media?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/5c5dcfef79919de7c02709535f77c642ddbdc07b","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/fal-ai-media"},{"type":"dir","size":0,"name":"frontend-patterns","path":".agents/skills/frontend-patterns","sha":"8b9c28df9258b70e7877dc9079713d585f8f28e0","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/frontend-patterns?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/8b9c28df9258b70e7877dc9079713d585f8f28e0","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/frontend-patterns"},{"type":"dir","size":0,"name":"frontend-slides","path":".agents/skills/frontend-slides","sha":"c25e239cec4894950e1d38eaae3547943a45337a","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/frontend-slides?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/c25e239cec4894950e1d38eaae3547943a45337a","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/frontend-slides"},{"type":"dir","size":0,"name":"investor-materials","path":".agents/skills/investor-materials","sha":"698a38d34fdab1facd8f1b9ec4d6750fcd02ffbb","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/investor-materials?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/698a38d34fdab1facd8f1b9ec4d6750fcd02ffbb","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/investor-materials"},{"type":"dir","size":0,"name":"investor-outreach","path":".agents/skills/investor-outreach","sha":"c51b45f2b148615696f263f78f4e84395890f637","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/investor-outreach?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/c51b45f2b148615696f263f78f4e84395890f637","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/investor-outreach"},{"type":"dir","size":0,"name":"market-research","path":".agents/skills/market-research","sha":"0e7cffd2cdaa5cc3cceaf93dacd6e970b8141c72","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/market-research?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/0e7cffd2cdaa5cc3cceaf93dacd6e970b8141c72","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/market-research"},{"type":"dir","size":0,"name":"mcp-server-patterns","path":".agents/skills/mcp-server-patterns","sha":"51fce498442f364ba1ce16e5ef170da971bec6b7","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/mcp-server-patterns?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/51fce498442f364ba1ce16e5ef170da971bec6b7","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/mcp-server-patterns"},{"type":"dir","size":0,"name":"nextjs-turbopack","path":".agents/skills/nextjs-turbopack","sha":"6da362ccd92e03ee73b01912ea623baaeb78cd86","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/nextjs-turbopack?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/6da362ccd92e03ee73b01912ea623baaeb78cd86","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/nextjs-turbopack"},{"type":"dir","size":0,"name":"security-review","path":".agents/skills/security-review","sha":"97969cfd1ad6f95fa9b6560e78f84263dd1b618a","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/security-review?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/97969cfd1ad6f95fa9b6560e78f84263dd1b618a","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/security-review"},{"type":"dir","size":0,"name":"strategic-compact","path":".agents/skills/strategic-compact","sha":"866bc50ad5871fabe168d474b08a28f37802bd10","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/strategic-compact?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/866bc50ad5871fabe168d474b08a28f37802bd10","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/strategic-compact"},{"type":"dir","size":0,"name":"tdd-workflow","path":".agents/skills/tdd-workflow","sha":"ceba07ed4494b6e0238837a3f3bcd5d2d5b55a4f","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/tdd-workflow?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/ceba07ed4494b6e0238837a3f3bcd5d2d5b55a4f","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/tdd-workflow"},{"type":"dir","size":0,"name":"verification-loop","path":".agents/skills/verification-loop","sha":"4b5559cdcc6300a8368a00e3ae772417224dda9d","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/verification-loop?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/4b5559cdcc6300a8368a00e3ae772417224dda9d","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/verification-loop"},{"type":"dir","size":0,"name":"video-editing","path":".agents/skills/video-editing","sha":"f3547fa77fe393f7dc68ad9bb110ba4969777d10","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/video-editing?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/f3547fa77fe393f7dc68ad9bb110ba4969777d10","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/video-editing"},{"type":"dir","size":0,"name":"x-api","path":".agents/skills/x-api","sha":"7a9825a4464b26bcc12cc2bd4d4ef4bb36f572f9","url":"https://api.github.com/repos/affaan-m/everything-claude-code/contents/.agents/skills/x-api?ref=1abeff9be79ac0b1b06f87a04c57823e10d068ee","git_url":"https://api.github.com/repos/affaan-m/everything-claude-code/git/trees/7a9825a4464b26bcc12cc2bd4d4ef4bb36f572f9","html_url":"https://github.com/affaan-m/everything-claude-code/tree/1abeff9be79ac0b1b06f87a04c57823e10d068ee/.agents/skills/x-api"}]
```


---

<sub>⏱️ 59s</sub>

### 💭 Reasoning

*Now I have a good understanding of the `everything-claude-code` project. Let me summarize what it is and how it can be used with GitHub Copilot CLI.

Key findings:
1. **everything-claude-code** is a performance optimization system for AI agent harnesses (Claude Code, Codex, Cowork, etc.)
2. It's primarily built for **Claude Code** (Anthropic's CLI), not GitHub Copilot CLI
3. It has `.agents/skills/` and `.agents/plugins/` directories which suggest it targets agent harnesses that support this structure
4. The README explicitly mentions it works across "Claude Code, Codex, Cowork, and other AI agent harnesses"


5. GitHub Copilot CLI isn't listed as a supported harness, though the markdown-based skills and rules files could potentially be adapted for manual use with Copilot if needed.

The project is fundamentally built for Claude Code and its ecosystem, not Copilot CLI, so I should be clear about that distinction while acknowledging that some patterns could be borrowed if someone wanted to apply them elsewhere.*

---

<sub>⏱️ 1m 8s</sub>

### 💬 Copilot

## `everything-claude-code` vs GitHub Copilot CLI

**Short answer: this project is not designed for GitHub Copilot CLI.** It's an agent harness performance system built specifically for **Claude Code** (Anthropic's CLI), with secondary support for Codex CLI, Cursor, and OpenCode.

### What the project offers:
- **36 agents**, **147 skills**, **68 command shims** — all wired for Claude Code's plugin/slash-command system
- Skills in `.agents/skills/` (markdown context files)
- Hooks, rules, memory persistence, and continuous learning — all tied to Claude Code's hook lifecycle

### Why it won't work directly with GitHub Copilot CLI:
| Feature | Claude Code | GitHub Copilot CLI |
|---|---|---|
| Plugin system (`/plugin install`) | ✅ | ❌ |
| Slash commands (`/plan`, `/harness-audit`) | ✅ | ❌ |
| Hook lifecycle (SessionStart, Stop, etc.) | ✅ | ❌ |
| `.agents/` skill loading | ✅ | ❌ |

### What you *can* borrow from it for Copilot CLI:
1. **Coding rules** — Copy files from `rules/typescript/`, `rules/python/`, etc. into your repo as context (e.g., in `CLAUDE.md` or a `copilot-instructions.md`)
2. **Skill patterns** — The skill markdowns in `.agents/skills/` are plain-text guides; you can paste them as context in your Copilot CLI prompts
3. **Architecture ideas** — Patterns like TDD workflow, verification loops, and security review checklists can be adapted as custom instructions

### If you want a Claude Code-like experience:
You'd need to install **Claude Code** (`npm install -g @anthropic-ai/claude-code`) and use the repo as intended. This Copilot CLI (GitHub Copilot) is a separate product with a different extension model.

---

<sub>⏱️ 2m 47s</sub>

### ℹ️ Info

Plugin Command Usage:

Marketplace Management:
  /plugin marketplace add \<source\>    - Add a marketplace (e.g., anthropics/skills)
  /plugin marketplace remove \<name\>   - Remove a marketplace
  /plugin marketplace list            - List registered marketplaces
  /plugin marketplace browse \<name\>   - Browse plugins in a marketplace

Plugin Management:
  /plugin install \<plugin\>@\<market\>   - Install a plugin from marketplace
  /plugin install owner/repo          - Install directly from GitHub repo
  /plugin install owner/repo:path     - Install from repo subdirectory
  /plugin install \<url\>               - Install directly from git URL
  /plugin uninstall \<plugin\>@\<market\> - Uninstall a marketplace plugin
  /plugin uninstall \<plugin\>          - Uninstall a directly installed plugin
  /plugin update \<plugin\>@\<market\>    - Update a marketplace plugin
  /plugin update \<plugin\>             - Update a directly installed plugin
  /plugin list                        - List installed plugins

Examples:
  /plugin marketplace add anthropics/skills
  /plugin install document-skills@anthropic-agent-skills
  /plugin install owner/my-plugin
  /plugin install owner/repo:plugins/my-plugin
  /plugin update document-skills@anthropic-agent-skills
  /plugin update my-plugin
  /plugin uninstall my-plugin

---

<sub>⏱️ 3m 34s</sub>

### ❌ Error

Usage: /plugin marketplace browse \<marketplace-name\>

Example: /plugin marketplace browse anthropic-agent-skills

---

<sub>⏱️ 4m 0s</sub>

### ℹ️ Info

Plugin Command Usage:

Marketplace Management:
  /plugin marketplace add \<source\>    - Add a marketplace (e.g., anthropics/skills)
  /plugin marketplace remove \<name\>   - Remove a marketplace
  /plugin marketplace list            - List registered marketplaces
  /plugin marketplace browse \<name\>   - Browse plugins in a marketplace

Plugin Management:
  /plugin install \<plugin\>@\<market\>   - Install a plugin from marketplace
  /plugin install owner/repo          - Install directly from GitHub repo
  /plugin install owner/repo:path     - Install from repo subdirectory
  /plugin install \<url\>               - Install directly from git URL
  /plugin uninstall \<plugin\>@\<market\> - Uninstall a marketplace plugin
  /plugin uninstall \<plugin\>          - Uninstall a directly installed plugin
  /plugin update \<plugin\>@\<market\>    - Update a marketplace plugin
  /plugin update \<plugin\>             - Update a directly installed plugin
  /plugin list                        - List installed plugins

Examples:
  /plugin marketplace add anthropics/skills
  /plugin install document-skills@anthropic-agent-skills
  /plugin install owner/my-plugin
  /plugin install owner/repo:plugins/my-plugin
  /plugin update document-skills@anthropic-agent-skills
  /plugin update my-plugin
  /plugin uninstall my-plugin

---

<sub>Generated by [GitHub Copilot CLI](https://github.com/features/copilot/cli)</sub>
