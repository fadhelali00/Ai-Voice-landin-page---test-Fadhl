# Design workflow

**Current project: the landing page for Mithqal (مثقال), the ERP system in `fadhelali00/erp-system-2026`.** Its visual identity is in `brand/BRAND.md`, `brand/tokens.css` and `brand/mithqal-mark.svg`. Those override any palette, font or tone the design skills would otherwise pick: taste-skill chooses composition and art direction *within* this identity, not a new one.

This repo is set up so Claude designs, builds, tests and screenshots web pages from a plain-language brief.

## Skills (`.claude/skills/`)

| Skill | Source | Use for |
|---|---|---|
| `impeccable` | pbakaus/impeccable (Apache-2.0) | Rules for type, spacing, layout, color, motion; `critique` / `audit` / `polish` passes |
| `taste-skill` (design-taste-frontend) | Leonxlnx/taste-skill (MIT) | Art direction from real award-level reference sites, anti-"AI look" house style |
| `emil-design-eng` + animation skills | emilkowalski/skills (MIT) | Motion and interaction detail: easing, durations, review/improve/remove animations, `break-ui`, `mobile-native`, `prototype` |

## MCP servers (`.mcp.json`)

- **playwright** — opens the page in a real browser, clicks through it and takes screenshots.

## How to work on any page

When the user describes a page or says "تصميم" / "design":

1. **Direction** — use `taste-skill` to pick a concrete art direction (idea, composition, type, palette, imagery). No generic centered-hero + three-icon-cards layout.
2. **Rules** — follow `impeccable` for typography, spacing scale, layout and color; follow `emil-design-eng` for motion.
3. **Build** — write the page.
4. **Test & screenshot** — open it with the playwright MCP at desktop (1440px) and mobile (390px) widths, take screenshots, and look at them.
5. **Fix loop** — run `impeccable` critique/audit and `break-ui` on what you see; fix and re-screenshot until it holds up. Show the user the final screenshots.
