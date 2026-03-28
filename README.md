# Synap

> **Experimental** — This project is in early development and not ready for production use. APIs, specs, and generated code may change without notice. Use for learning, prototyping, and experimentation only.

**The AI-first full-stack TypeScript framework.**

Synap is a framework where AI is the primary developer. Instead of adapting human frameworks for AI, Synap is architecturally designed so AI knows exactly what to generate, where to put it, and how to validate it.

```
Idea → Spec (YAML) → synap generate → Working full-stack app
```

## Quick Start

```bash
npx @synap-js/cli init my-app
cd my-app
npm install
npx synap dev
```

During `init`, you'll be asked which AI tool you use — the MCP config is generated automatically so your AI connects on first open.

That's it. You now have:
- REST API with full CRUD, SQLite database, pagination
- React frontend with marketing pages and CRUD views
- MCP server so any AI can operate your project

```bash
# API on port 3000
curl http://localhost:3000/api/tasks

# Frontend on port 3001
open http://localhost:3001
```

## How It Works

### Backend: Model Specs → API

```yaml
# specs/models/product.spec.yaml
model: Product
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    max: 200
  price:
    type: decimal
    min: 0
  stock:
    type: integer
    default: 0

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    create: authenticated
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, price, stock]
    searchable: [name]
```

### Frontend: Page Specs → React Pages

```yaml
# specs/pages/home.page.yaml
page: Home
route: /
layout: marketing
sections:
  - type: hero
    title: "Welcome to MyApp"
    subtitle: "Build faster with AI"
    cta:
      text: "Get Started"
      link: /products
    background: gradient

  - type: features
    columns: 3
    items:
      - title: "Fast"
        description: "Lightning performance"
        icon: "⚡"
      - title: "Secure"
        description: "Enterprise-grade security"
        icon: "🔒"
      - title: "Simple"
        description: "Easy to use"
        icon: "✨"

  - type: pricing
    plans:
      - name: Free
        price: 0
        features: ["5 projects", "Basic support"]
      - name: Pro
        price: 29
        features: ["Unlimited projects", "Priority support"]
        highlighted: true

  - type: cta
    title: "Ready to start?"
    cta:
      text: "Sign Up Now"
      link: /signup
```

### Generate & Run

```bash
npx synap generate    # Generates backend + frontend
npx synap dev         # API on :3000, frontend on :3001
```

## What Gets Generated

### Backend (from model specs)

| File | Content |
|---|---|
| `models/product.types.ts` | TypeScript interfaces |
| `models/product.schema.ts` | Drizzle ORM schema |
| `validators/product.validator.ts` | Zod validation schemas |
| `api/product.controller.ts` | CRUD controller with pagination |
| `api/product.routes.ts` | Hono routes |

### Frontend (from model + page specs)

| File | Content |
|---|---|
| `ui/components/*.tsx` | Base components (Button, Input, Card, DataTable, etc.) |
| `ui/sections/*.tsx` | Marketing sections (Hero, Features, Pricing, FAQ, etc.) |
| `ui/layouts/*.tsx` | Layouts (Marketing, App, Blank) |
| `ui/models/product-table.tsx` | CRUD table with pagination, search, delete |
| `ui/models/product-form.tsx` | Create/edit form with validation |
| `ui/models/product-detail.tsx` | Detail view |
| `ui/hooks/use-product.ts` | Data hooks (useProducts, useCreateProduct, etc.) |
| `ui/pages/*.tsx` | Marketing pages + CRUD pages |
| `ui/router.tsx` | SPA router |

## Authentication

Built-in JWT auth — generated automatically, enforced by spec.

### Auth Levels

Set per-endpoint in model specs:

```yaml
api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public          # Anyone
    get: public
    create: authenticated # Logged-in users
    update: owner         # Resource owner only
    delete: admin         # Admins only
```

### Auth Endpoints

The dev server provides these automatically:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John","password":"mypassword"}'

# Login (returns JWT token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"mypassword"}'

# Get current user (requires token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Default Admin

On first run, a default admin is created:
- Email: `admin@synap.dev`
- Password: `admin123`

### Frontend Auth

Generated automatically:
- `/login` — Sign in page
- `/register` — Create account page
- `AuthProvider` context wraps the entire app
- `ProtectedRoute` wrapper for auth-required pages
- All API hooks include the JWT token automatically

### Page Auth

Protect pages in page specs:

```yaml
page: Admin
route: /app
layout: app
auth: admin     # Only admins can access
```

## Section Types

11 built-in section types for marketing pages:

| Section | Purpose |
|---|---|
| `hero` | Large banner with title, subtitle, CTA |
| `features` | Grid of feature cards |
| `pricing` | Pricing table with plans |
| `cta` | Call-to-action banner |
| `testimonials` | Customer quotes |
| `faq` | Accordion Q&A |
| `content` | Freeform text block |
| `stats` | Numbers/metrics display |
| `team` | Team member grid |
| `contact` | Contact form |
| `custom` | Your own component |

## Customization

Three levels of customization:

**1. Via YAML** — Control content, layout, columns, fields, sections from specs.

**2. Override components** — Create a file in `src/extensions/ui/` to replace any generated component:

```
src/extensions/ui/
├── sections/hero-section.tsx     → Replaces generated hero
├── models/product-table.tsx      → Replaces generated table
├── layouts/marketing-layout.tsx  → Replaces generated layout
└── pages/home-page.tsx           → Replaces entire page
```

**3. Custom components** — Create your own in `src/extensions/ui/components/` and reference with `type: custom` in page specs.

## MCP Server

Any AI tool auto-connects via MCP when you open the project.

### Setup

During `synap init` you select your AI tool. Or run later:

```bash
npx synap mcp setup claude      # Claude Code
npx synap mcp setup cursor      # Cursor
npx synap mcp setup vscode      # VS Code / GitHub Copilot
npx synap mcp setup windsurf    # Windsurf
npx synap mcp setup all         # All of the above
```

### Resources (AI reads context)

| Resource | URI | Description |
|---|---|---|
| Guidelines | `project://guidelines` | AI operating manual (~250 lines) |
| Patterns | `project://patterns/{type}` | Complete blueprints (ecommerce, blog, saas, portfolio, api) |
| Reference | `project://reference/{topic}` | Field, section, and relation reference docs |
| Completeness | `project://completeness` | Project health score with warnings and next steps |
| Manifest | `project://manifest` | Project summary with seed/auth status |
| Models | `project://models` | All models with fields and relations |
| Model Detail | `project://models/{name}` | Full detail of a specific model |
| Pages | `project://pages` | All page specs |
| Routes | `project://routes` | API endpoint map with auth levels |
| Extensions | `project://extensions` | Active hooks and overrides |
| Errors | `project://errors` | Current validation errors |
| Config | `project://config` | Project configuration |

### Tools (AI executes actions)

| Tool | Description |
|---|---|
| `validate` | Validate all specs |
| `generate` | Generate code (backend + frontend) |
| `add_model` | Create a new model spec |
| `add_field` | Add a field to a model |
| `add_relation` | Create a relation between models |
| `add_page` | Create a marketing or custom page |
| `add_section` | Add a section to an existing page |
| `seed_data` | Create seed data for a model |
| `inspect` | Diagnostic inspection |

### Example AI Workflow

```
Developer: "Add a pricing page with 3 plans and a FAQ section"

AI → add_page (Pricing, /pricing, sections: hero + pricing + faq)
AI → generate → produces React page with all sections
AI → reads project://pages → confirms page is available
```

## Spec Features

### Field Types

`string`, `text`, `integer`, `decimal`, `boolean`, `date`, `timestamp`, `uuid`, `json`, `enum`, `email`, `url`, `slug`, `password`, `file`

### Constraints

```yaml
name:
  type: string
  min: 1
  max: 200
  unique: true

price:
  type: decimal
  precision: 10
  scale: 2

status:
  type: enum
  values: [draft, published, archived]
  default: draft
```

### Relations

```yaml
relations:
  author:
    type: belongsTo
    model: User
    foreignKey: authorId
    onDelete: cascade

  comments:
    type: hasMany
    model: Comment
```

## CLI Commands

```bash
npx @synap-js/cli init [name]   # Create new project (interactive AI setup)
npx synap generate [target]     # Generate code (models, api, ui, or all)
npx synap validate [spec]       # Validate specs without generating
npx synap dev                   # API server + Vite frontend dev server
npx synap mcp setup <target>    # Generate MCP config for AI tools
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           MCP LAYER                         │  ← AI connects here
├─────────────────────────────────────────────┤
│           SPEC LAYER                        │  ← .spec.yaml + .page.yaml
├─────────────────────────────────────────────┤
│           ENGINE LAYER                      │  ← Parser + Validators + Generators
├─────────────────────────────────────────────┤
│           RUNTIME LAYER                     │  ← Hono + SQLite + React + Tailwind
├─────────────────────────────────────────────┤
│           OUTPUT LAYER                      │  ← Generated code (don't edit)
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript (strict) | Types constrain AI output |
| HTTP | [Hono](https://hono.dev) | 14KB, TypeScript-first |
| Database | SQLite via [libsql](https://github.com/tursodatabase/libsql) | Zero config |
| Validation | [Zod](https://zod.dev) | Declarative, type inference |
| Schema | [Drizzle](https://orm.drizzle.team) | Type-safe SQL |
| Frontend | [React](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) | AI-friendly, declarative |
| Dev Server | [Vite](https://vite.dev) | Instant HMR |
| Auth | JWT via [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless, zero native deps |
| AI Protocol | [MCP](https://modelcontextprotocol.io) | Standard AI integration |
| Testing | [Vitest](https://vitest.dev) | Ultra-fast ESM |

## Packages

```
packages/
├── core/        → @synap-js/core        # Spec parser, validator, resolver
├── generators/  → @synap-js/generators  # Backend + frontend generators
├── runtime/     → @synap-js/runtime     # Error hierarchy, hooks, server utils
├── cli/         → @synap-js/cli         # CLI commands
├── mcp/         → @synap-js/mcp         # MCP server (15 resources, 9 tools)
└── devtools/    → @synap-js/devtools    # Inspector (planned)
```

## Project Status

**Working** — `synap init` → `synap dev` produces a full-stack app with API + frontend.

| Feature | Status |
|---|---|
| Spec parser + validation | Done |
| Model generator (types + Drizzle schemas) | Done |
| Validator generator (Zod) | Done |
| API generator (Hono controllers + routes) | Done |
| UI generator (React + Tailwind) | Done |
| Marketing page generator (11 section types) | Done |
| CRUD components (table, form, detail) | Done |
| Data hooks (fetch, create, update, delete) | Done |
| Dev server (API + Vite) | Done |
| Auth system (JWT, register, login, guards) | Done |
| MCP server (15 resources, 9 tools) | Done |
| AI context (guidelines, patterns, completeness) | Done |
| 152 tests passing | Done |
| Plugin system | Planned |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

## License

MIT — see [LICENSE](./LICENSE) for details.
