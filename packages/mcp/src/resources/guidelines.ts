import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

const GUIDELINES = `# Synap AI Operating Guidelines

You are an AI developer operating a Synap project. Follow these guidelines to build high-quality, complete applications.

## CRITICAL RULES
1. NEVER edit files inside src/generated/ — they are overwritten on every generate
2. ALL changes start with specs (YAML), then run generate
3. After creating models, ALWAYS generate code AND seed with example data
4. After generating code, run validate to confirm no errors
5. Custom logic goes ONLY in src/extensions/
6. Respond in the same language as the user

## COMPLETE PROJECT WORKFLOW

### Step 1: Define Models (use add_model tool)
- Start with independent models (no foreign keys) before dependent ones
- Every model MUST have: id (uuid, primary), and meaningful fields
- Include timestamps (default) — never disable unless you have a reason
- Use softDelete: true for user-facing data (orders, users, posts)
- Every model needs api endpoints: [list, get, create, update, delete]
- Every model needs ui components: [table, form, detail]

### Step 2: Define Relations (use add_relation tool)
- Add relations AFTER all related models exist
- belongsTo auto-creates the FK — do NOT add the FK field manually
- Use onDelete: cascade for children (OrderItem → Order)
- Use onDelete: setNull for optional refs
- Use onDelete: restrict for critical refs (prevent deleting User with Orders)
- Always add both sides: if Product belongsTo Category, also add Category hasMany Product

### Step 3: Set Auth Levels
Auth levels in api.auth for each endpoint:
- public: anyone can access
- authenticated: logged-in users only
- owner: only the resource owner
- admin: administrators only

Patterns:
- Marketing content (blog posts, products catalog): list/get = public, create/update/delete = admin
- User-owned data: list = authenticated, create = authenticated, update/delete = owner
- Admin resources: all endpoints = admin
- Public registration: User create = public

### Step 4: Create Pages (use add_page tool)
- Marketing pages: layout: marketing (public, no auth)
- Admin/app pages: layout: app, auth: authenticated or auth: admin
- EVERY project needs minimum: Home page (/) + Admin page (/app)

### Step 5: Generate Code (use generate tool)
- Always target: all to generate everything
- Check output for errors

### Step 6: Seed Data (use seed_data tool)
- Create parent records BEFORE children (Category before Product)
- Use realistic, diverse data — NOT "test1", "test2"
- Create 3-5 records per model minimum
- Include valid foreign keys referencing real parent records
- Use consistent UUIDs so relations work

## FIELD TYPE GUIDE

| Use Case | Type | Notes |
|----------|------|-------|
| Names, titles | string | min: 1, max: 200 |
| Long text, descriptions, articles | text | nullable: true for optional |
| Prices, money amounts | decimal | precision: 10, scale: 2, min: 0 |
| Counts, quantities, stock | integer | min: 0 |
| Flags, toggles, active status | boolean | default: true or false |
| Primary keys | uuid | primary: true |
| Status, role, category type | enum | values: [draft, active, archived] |
| Email addresses | email | unique: true for users |
| Website URLs, image URLs | url | nullable: true |
| SEO-friendly URLs | slug | from: title |
| User passwords | password | hidden: true, min: 8 |
| Flexible metadata | json | Use sparingly |
| File paths | file | maxSize, allowedTypes |

## NAMING CONVENTIONS
- Model names: PascalCase singular (User, Product, OrderItem)
- Field names: camelCase (firstName, createdAt, categoryId)
- Table names: auto-generated snake_case plural (users, products, order_items)
- Spec files: camelCase + .spec.yaml (orderItem.spec.yaml)
- Page files: camelCase + .page.yaml (home.page.yaml)
- API routes: auto-generated /api/{kebab-case-plural} (/api/products, /api/order-items)

## CREATING RICH PAGES

NEVER create empty sections. Every section must have content.

### Hero sections
Always include: title, subtitle, cta (with text + link), background: gradient

### Features sections
Always include: title, items array with 3-4 items, each with title + description + icon emoji.
Set columns: 3

### Pricing sections
Always include: plans array with 2-3 plans. Each plan needs: name, price (number), features (string array).
Mark the recommended plan with highlighted: true

### Testimonials sections
Always include: items array with 3+ items. Each needs: quote, author, role

### FAQ sections
Always include: items array with 5-8 items. Each needs: question, answer

### Stats sections
Always include: items array with 4 items. Each needs: value (string like "10K+"), label

### CTA sections
Always include: title, subtitle, cta with text + link

### Contact sections
Include: title, subtitle (optional)

## WHAT MAKES A PROJECT COMPLETE
1. Models with fields, relations, and API endpoints
2. UI config on every model (components: [table, form, detail])
3. Home page (/) with rich marketing sections
4. Admin page (/app) with auth: authenticated
5. All models have seed data (3-5 records each)
6. Auth levels on all API endpoints
7. Code generated and validated
8. Relations properly defined with onDelete

## COMMON MISTAKES TO AVOID
- Creating belongsTo before the target model exists
- Adding FK field manually (belongsTo auto-creates it)
- Using layout: marketing for admin pages (use layout: app)
- Forgetting auth on admin pages
- Creating sections without content
- Not seeding data after creating models
- Using string for emails (use email type)
- Using string for prices (use decimal with precision/scale)
- Forgetting min: 0 on prices and quantities
- Using boolean without a default value
- Creating models without ui config (no CRUD components generated)

## REALISTIC SEED DATA EXAMPLES

For a Product:
{ name: "MacBook Pro 16-inch", price: 2499.99, stock: 45, description: "Apple M3 Max chip, 36GB RAM", active: true }

For a User:
{ name: "Maria Garcia", email: "maria@example.com", role: "admin" }

For a Category:
{ name: "Electronics", description: "Phones, laptops, tablets and accessories", image: "https://images.unsplash.com/photo-electronics" }

NEVER use: "Test Product", "test@test.com", "Lorem ipsum", "foo", "bar"
`;

export function registerGuidelinesResource(server: McpServer, _ctx: ServerContext): void {
  server.registerResource(
    'guidelines',
    'project://guidelines',
    {
      description: 'Comprehensive AI operating guidelines for Synap projects — read this first',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: GUIDELINES }],
    }),
  );
}
