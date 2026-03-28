import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

const REFERENCES: Record<string, string> = {
  fields: `# Field Type Reference

## String Types

### string
General text field with length constraints.
\`\`\`yaml
name:
  type: string
  min: 1        # minimum length
  max: 200      # maximum length
  unique: true  # unique constraint
  index: true   # database index for faster queries
  pattern: "^[A-Za-z]+"  # regex validation
  trim: true    # auto-trim whitespace
\`\`\`
Use for: names, titles, short labels, codes, SKUs

### text
Long-form content without length limit.
\`\`\`yaml
description:
  type: text
  nullable: true
\`\`\`
Use for: descriptions, bios, article content, notes, addresses

### email
String with email format validation.
\`\`\`yaml
email:
  type: email
  unique: true
\`\`\`
Use for: user emails, contact emails. Always set unique: true for user accounts.

### url
String with URL format validation.
\`\`\`yaml
website:
  type: url
  nullable: true
\`\`\`
Use for: website links, image URLs, avatar URLs, social media links

### slug
Auto-generated URL-friendly string from another field.
\`\`\`yaml
slug:
  type: slug
  from: title   # source field
\`\`\`
Use for: SEO-friendly URLs. Always pair with the source field.

### password
Hashed password field, never exposed in API responses.
\`\`\`yaml
password:
  type: password
  min: 8
  hidden: true
\`\`\`
Use for: user passwords only. Always set hidden: true and min: 8.

## Numeric Types

### integer
Whole numbers.
\`\`\`yaml
stock:
  type: integer
  min: 0
  default: 0
\`\`\`
Use for: counts, quantities, stock levels, ages, order numbers, sort order

### decimal
Floating-point numbers with precision.
\`\`\`yaml
price:
  type: decimal
  precision: 10  # total digits
  scale: 2       # decimal places
  min: 0
\`\`\`
Use for: prices, money, percentages, measurements, ratings.
ALWAYS set precision and scale for money fields.

## Boolean

### boolean
True/false flag.
\`\`\`yaml
active:
  type: boolean
  default: true
\`\`\`
Use for: active/inactive, published/draft, featured, verified, approved.
ALWAYS provide a default value.

## Date/Time

### date
Date without time.
\`\`\`yaml
birthDate:
  type: date
  nullable: true
\`\`\`

### timestamp
Date with time. Use for tracking events.
\`\`\`yaml
publishedAt:
  type: timestamp
  nullable: true
lastLoginAt:
  type: timestamp
  auto: update  # auto-updates on every change
\`\`\`
auto: create = set once on creation
auto: update = set on every update

## Special Types

### uuid
Universally unique identifier.
\`\`\`yaml
id:
  type: uuid
  primary: true
\`\`\`
Use for: primary keys (always). Synap auto-generates UUIDs.

### enum
Fixed set of string values.
\`\`\`yaml
status:
  type: enum
  values: [draft, published, archived]
  default: draft
\`\`\`
Use for: statuses, roles, types, priorities, categories.
ALWAYS provide values array and a default.

Common enum patterns:
- Status: [draft, active, inactive, archived]
- Role: [user, admin, superadmin]
- Priority: [low, medium, high, urgent]
- Order status: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
- Payment: [pending, paid, failed, refunded]

### json
Flexible structured data.
\`\`\`yaml
metadata:
  type: json
  nullable: true
\`\`\`
Use sparingly. Prefer typed fields. Good for: feature flags, settings, dynamic attributes.

### file
File reference (stores path/URL).
\`\`\`yaml
document:
  type: file
  maxSize: "10MB"
  allowedTypes: ["pdf", "doc", "docx"]
\`\`\`

## Field Modifiers

| Modifier | Type | Description |
|----------|------|-------------|
| primary | boolean | Primary key (use with uuid) |
| required | boolean | Cannot be null (default for non-nullable) |
| unique | boolean | Unique constraint |
| index | boolean | Database index for faster queries |
| nullable | boolean | Can be null |
| immutable | boolean | Cannot be changed after creation |
| hidden | boolean | Excluded from API responses (passwords) |
| default | any | Default value |
| label | string | Human-readable label for forms |
`,

  sections: `# Section Type Reference

## hero
Large banner, always first on the page.
\`\`\`yaml
- type: hero
  title: "Main Headline"           # Required. Bold, impactful.
  subtitle: "Supporting text"       # Optional. Explain the value.
  background: gradient              # "gradient" for blue-purple, omit for white
  image: "https://..."              # Optional hero image
  cta:                              # Optional call-to-action button
    text: "Get Started"
    link: "/signup"
\`\`\`

## features
Grid of feature cards. Use 3-4 items.
\`\`\`yaml
- type: features
  title: "Why Choose Us"
  subtitle: "Optional supporting text"
  columns: 3                        # 2, 3, or 4
  items:
    - title: "Feature Name"
      description: "One sentence explaining the benefit"
      icon: "⚡"                    # Emoji icon
    - title: "Another Feature"
      description: "Clear, concise benefit statement"
      icon: "🔒"
\`\`\`
Good icons: ⚡ 🔒 📊 👥 🚀 💡 🎨 📦 ↩️ 💬 ✨ 🛡️ ⏱️ 🌍 📱 🔧

## pricing
Pricing table with plans.
\`\`\`yaml
- type: pricing
  title: "Simple Pricing"
  subtitle: "No hidden fees"
  plans:
    - name: "Free"
      price: 0
      features: ["Feature 1", "Feature 2"]
    - name: "Pro"
      price: 29
      features: ["Everything in Free", "Feature 3", "Feature 4"]
      highlighted: true              # Visually emphasized
      cta: "Start Free Trial"
    - name: "Enterprise"
      price: 99
      features: ["Everything in Pro", "Feature 5", "Feature 6"]
      cta: "Contact Sales"
\`\`\`

## cta
Call-to-action banner. Use near bottom.
\`\`\`yaml
- type: cta
  title: "Ready to Start?"
  subtitle: "Join 10,000+ happy customers"
  cta:
    text: "Sign Up Free"
    link: "/signup"
\`\`\`

## testimonials
Customer quotes. Use 3 minimum.
\`\`\`yaml
- type: testimonials
  title: "What Customers Say"
  items:
    - quote: "Full sentence testimonial with specific detail."
      author: "Full Name"
      role: "Title, Company"
\`\`\`

## faq
Accordion Q&A. Use 5-8 items.
\`\`\`yaml
- type: faq
  title: "Frequently Asked Questions"
  items:
    - question: "How does X work?"
      answer: "Clear, helpful answer."
\`\`\`

## stats
Number metrics. Use exactly 4.
\`\`\`yaml
- type: stats
  title: "By the Numbers"   # Optional
  items:
    - value: "10K+"
      label: "Active Users"
    - value: "99.9%"
      label: "Uptime"
    - value: "50+"
      label: "Countries"
    - value: "24/7"
      label: "Support"
\`\`\`

## team
Team member grid.
\`\`\`yaml
- type: team
  title: "Meet Our Team"
  items:
    - name: "Full Name"
      role: "Job Title"
      avatar: "https://..."
\`\`\`

## contact
Contact form.
\`\`\`yaml
- type: contact
  title: "Get in Touch"
  subtitle: "We'll respond within 24 hours"
\`\`\`

## content
Free-form text block.
\`\`\`yaml
- type: content
  title: "About Us"
  content: "Plain text content here. Can be multiple paragraphs."
\`\`\`

## custom
Reference a custom component from extensions.
\`\`\`yaml
- type: custom
  component: "MyWidget"
  props:
    someKey: someValue
\`\`\`

## Recommended Page Layouts

### Landing/Home Page
hero → features → stats → testimonials → cta

### Pricing Page
hero → pricing → faq → cta

### About Page
hero → content → team → stats

### Contact Page
hero → contact

### Blog Home
hero → features (categories) → cta
`,

  relations: `# Relation Type Reference

## belongsTo
The child model holds the foreign key. Creates a FK column automatically.

\`\`\`yaml
# In Post model:
relations:
  author:
    type: belongsTo
    model: User
    foreignKey: authorId    # Optional, auto-generated as {model}Id
    onDelete: cascade       # What happens when parent is deleted
\`\`\`

onDelete options:
- cascade: delete children when parent is deleted (OrderItem when Order deleted)
- setNull: set FK to null (Post.categoryId when Category deleted)
- restrict: prevent deleting parent if children exist (User with Orders)
- noAction: database default (usually restrict)

### When to use belongsTo:
- Post belongs to Author
- Product belongs to Category
- OrderItem belongs to Order
- Comment belongs to Post
- User belongs to Organization

## hasMany
The parent model has multiple children. Does NOT create a column — it's the inverse of belongsTo.

\`\`\`yaml
# In User model:
relations:
  posts:
    type: hasMany
    model: Post
    foreignKey: authorId
\`\`\`

### Always add both sides:
If Post belongsTo User, also add User hasMany Post.

## hasOne
Like hasMany but expects exactly one related record.

\`\`\`yaml
relations:
  profile:
    type: hasOne
    model: Profile
\`\`\`

### When to use:
- User hasOne Profile
- Order hasOne Invoice
- Organization hasOne Settings

## manyToMany
Both models can have multiple of each other. Requires a pivot table.

\`\`\`yaml
relations:
  tags:
    type: manyToMany
    model: Tag
    pivotTable: post_tags
\`\`\`

### When to use:
- Post manyToMany Tag
- User manyToMany Role
- Product manyToMany Collection

## Common Relation Patterns

### Parent-Child (1:N)
Category → Product, User → Post, Order → OrderItem
Always: child belongsTo parent, parent hasMany child

### Self-referencing
\`\`\`yaml
# Category with parent category
relations:
  parent:
    type: belongsTo
    model: Category
    foreignKey: parentId
    onDelete: setNull
  children:
    type: hasMany
    model: Category
\`\`\`

### Polymorphic-like
Use a type + id pair:
\`\`\`yaml
# Comment that can belong to Post or Product
commentableType:
  type: enum
  values: [post, product]
commentableId:
  type: uuid
\`\`\`

## Dependency Order Rule
ALWAYS create the parent model BEFORE the child model.
ALWAYS add belongsTo BEFORE hasMany.
The resolver will error if you reference a model that doesn't exist.

Creation order example:
1. Category (no dependencies)
2. User (no dependencies)
3. Product (belongsTo Category)
4. Order (belongsTo User)
5. OrderItem (belongsTo Order, belongsTo Product)
`,
};

export function registerReferenceResources(server: McpServer, _ctx: ServerContext): void {
  // List all references
  server.registerResource(
    'reference',
    'project://reference',
    {
      description: 'Available reference docs: fields, sections, relations. Read with project://reference/{topic}',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: `# Synap Reference Documentation\n\nDetailed reference for:\n${Object.keys(REFERENCES).map((k) => `- project://reference/${k} — ${k.charAt(0).toUpperCase() + k.slice(1)} reference`).join('\n')}`,
      }],
    }),
  );

  // Dynamic reference detail
  server.registerResource(
    'reference-detail',
    new ResourceTemplate('project://reference/{topic}', {
      list: async () => ({
        resources: Object.keys(REFERENCES).map((k) => ({
          uri: `project://reference/${k}`,
          name: k.charAt(0).toUpperCase() + k.slice(1) + ' Reference',
        })),
      }),
    }),
    {
      description: 'Detailed reference documentation for fields, sections, or relations',
      mimeType: 'text/plain',
    },
    async (uri, { topic }) => {
      const ref = REFERENCES[String(topic)];
      if (!ref) {
        return { contents: [{ uri: uri.href, text: `Reference "${topic}" not found. Available: ${Object.keys(REFERENCES).join(', ')}` }] };
      }
      return { contents: [{ uri: uri.href, text: ref }] };
    },
  );
}
