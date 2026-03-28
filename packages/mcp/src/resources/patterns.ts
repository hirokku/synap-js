import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

const PATTERNS = `# Synap Project Patterns

Use these as complete blueprints. Create models in the listed order, then relations, then pages, then seed data.

---

## E-Commerce Store

### Models (create in order):
1. Category: name(string), slug(slug from:name), description(text nullable), image(url nullable), active(boolean default:true)
2. Product: name(string), slug(slug from:name), description(text nullable), price(decimal min:0), stock(integer min:0 default:0), image(url nullable), active(boolean default:true)
3. Customer: name(string), email(email unique), phone(string nullable), address(text nullable)
4. Order: status(enum [pending,paid,shipped,delivered,cancelled] default:pending), total(decimal min:0 default:0), notes(text nullable)
5. OrderItem: quantity(integer min:1), unitPrice(decimal min:0)

### Relations:
- Product belongsTo Category (onDelete: setNull)
- Category hasMany Product
- Order belongsTo Customer (onDelete: restrict)
- Customer hasMany Order
- OrderItem belongsTo Order (onDelete: cascade)
- OrderItem belongsTo Product (onDelete: restrict)
- Order hasMany OrderItem

### Auth:
- Category/Product: list/get = public, create/update/delete = admin
- Customer: all = admin
- Order: list/get = authenticated, create = authenticated, update/delete = admin
- OrderItem: all = admin

### Pages:
Home page (/) layout: marketing:
  - hero: title "Welcome to [Store Name]", subtitle "Find the best products", background: gradient, cta "Shop Now" -> /products
  - features: 3 items (Free Shipping, Secure Payment, 24/7 Support)
  - testimonials: 3 customer quotes
  - cta: "Start Shopping Today" -> /products

Products page (/products) layout: marketing:
  - hero: title "Our Products", subtitle "Browse our catalog"
  - features: show product categories

Admin (/app) layout: app, auth: admin

### Seed data order:
1. Categories (5): Electronics, Clothing, Home & Garden, Sports, Books
2. Products (15): 3 per category with realistic names, prices $9.99-$2499.99
3. Customers (5): realistic names and emails
4. Orders (10): mix of statuses, totals matching items
5. OrderItems (25): 2-3 per order, referencing real products

---

## Blog / Content Platform

### Models (create in order):
1. Author: name(string), email(email unique), bio(text nullable), avatar(url nullable), role(enum [writer,editor,admin] default:writer)
2. Category: name(string), slug(slug from:name), description(text nullable)
3. Post: title(string max:300), slug(slug from:title), excerpt(text nullable), content(text), status(enum [draft,published,archived] default:draft), featured(boolean default:false), publishedAt(timestamp nullable)
4. Comment: content(text), authorName(string), authorEmail(email), approved(boolean default:false)

### Relations:
- Post belongsTo Author
- Author hasMany Post
- Post belongsTo Category
- Category hasMany Post
- Comment belongsTo Post (onDelete: cascade)
- Post hasMany Comment

### Auth:
- Post/Category: list/get = public, create/update = authenticated, delete = admin
- Comment: list/get = public, create = public, update/delete = admin
- Author: list/get = public, create/update/delete = admin

### Pages:
Home (/) layout: marketing:
  - hero: title "[Blog Name]", subtitle "Stories, ideas, and insights", cta "Read Latest" -> /posts
  - features: 3 items (Daily Articles, Expert Writers, Free Access)
  - testimonials: reader quotes
  - cta: "Subscribe to Our Newsletter"

Blog (/blog) layout: marketing:
  - hero: title "All Articles"

Admin (/app) layout: app, auth: authenticated

### Seed data:
1. Authors (3): realistic writer names
2. Categories (5): Technology, Lifestyle, Business, Health, Travel
3. Posts (12): mix of statuses, 2-3 per category with real titles
4. Comments (20): 1-3 per published post

---

## SaaS Application

### Models (create in order):
1. User: name(string), email(email unique), role(enum [user,admin,superadmin] default:user), avatar(url nullable), active(boolean default:true)
2. Organization: name(string), slug(slug from:name), plan(enum [free,pro,enterprise] default:free), active(boolean default:true)
3. Plan: name(string), price(decimal min:0), interval(enum [monthly,yearly] default:monthly), features(json), active(boolean default:true), popular(boolean default:false)
4. Subscription: status(enum [active,cancelled,past_due,trialing] default:trialing), currentPeriodStart(timestamp), currentPeriodEnd(timestamp)
5. Invoice: amount(decimal min:0), status(enum [draft,paid,overdue,void] default:draft), issuedAt(timestamp), paidAt(timestamp nullable)

### Relations:
- User belongsTo Organization (onDelete: setNull)
- Organization hasMany User
- Subscription belongsTo Organization (onDelete: cascade)
- Subscription belongsTo Plan
- Plan hasMany Subscription
- Invoice belongsTo Subscription (onDelete: cascade)
- Subscription hasMany Invoice

### Auth:
- Plan: list/get = public, create/update/delete = admin
- User: list = admin, get = authenticated, create = public, update = owner, delete = admin
- Organization: list = admin, get = authenticated, create = authenticated, update = owner, delete = admin
- Subscription/Invoice: all = authenticated

### Pages:
Home (/) layout: marketing:
  - hero: title "[App Name]", subtitle "The platform for modern teams", background: gradient, cta "Start Free Trial" -> /signup
  - features: 4 items (Analytics, Collaboration, Automation, Security)
  - pricing: 3 plans (Free $0, Pro $29/mo highlighted, Enterprise $99/mo)
  - testimonials: 3 customer quotes
  - faq: 6 common questions
  - cta: "Get Started for Free" -> /signup

Pricing (/pricing) layout: marketing:
  - pricing: same 3 plans with more detail
  - faq: pricing-specific questions

Dashboard (/app) layout: app, auth: authenticated
Admin (/admin) layout: app, auth: admin

### Seed data:
1. Plans (3): Free, Pro ($29), Enterprise ($99)
2. Organizations (5): realistic company names
3. Users (10): 2 per org, at least 1 admin
4. Subscriptions (5): 1 per org, mix of statuses
5. Invoices (15): 3 per subscription

---

## Portfolio / Agency

### Models (create in order):
1. Project: title(string), slug(slug from:title), description(text), image(url nullable), url(url nullable), featured(boolean default:false), status(enum [draft,published] default:draft)
2. Category: name(string), slug(slug from:name), description(text nullable)
3. Skill: name(string), level(enum [beginner,intermediate,advanced,expert] default:intermediate), icon(string nullable)
4. Testimonial: quote(text), author(string), role(string nullable), company(string nullable), avatar(url nullable)

### Relations:
- Project belongsTo Category
- Category hasMany Project

### Auth:
- All: list/get = public, create/update/delete = admin

### Pages:
Home (/) layout: marketing:
  - hero: title "[Your Name]", subtitle "Designer & Developer", background: gradient, cta "View Work" -> /projects
  - features: 3-4 services offered
  - stats: years experience, projects completed, happy clients
  - testimonials: client quotes
  - cta: "Let's Work Together" -> /contact

Projects (/projects) layout: marketing:
  - hero: title "My Work", subtitle "Selected projects"

About (/about) layout: marketing:
  - hero: title "About Me"
  - content: bio text
  - stats: experience metrics

Contact (/contact) layout: marketing:
  - hero: title "Get in Touch"
  - contact: contact form

Admin (/app) layout: app, auth: admin

### Seed data:
1. Categories (4): Web Design, Mobile Apps, Branding, UI/UX
2. Projects (8): 2 per category with real project names
3. Skills (8): React, TypeScript, Node.js, Figma, etc.
4. Testimonials (4): realistic client quotes

---

## API-Only (Headless)

### No page specs needed. Focus on:
- Strong auth on all endpoints
- Pagination: defaultLimit: 20, maxLimit: 100
- Sortable fields on every model
- Filters for search/filtering
- Proper onDelete behavior on all relations
- No ui config needed (no frontend)

### Example model with full API config:
model: Product
fields:
  id: { type: uuid, primary: true }
  name: { type: string, min: 1, max: 200 }
  price: { type: decimal, min: 0 }
api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin
  sortable: [name, price, createdAt]
  pagination:
    defaultLimit: 20
    maxLimit: 100
`;

export function registerPatternsResource(server: McpServer, _ctx: ServerContext): void {
  server.registerResource(
    'patterns',
    'project://patterns',
    {
      description: 'Complete project blueprints for e-commerce, blog, SaaS, portfolio, and API-only projects',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: PATTERNS }],
    }),
  );
}
