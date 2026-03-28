import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from '../types.js';

const PATTERNS: Record<string, string> = {
  ecommerce: `# E-Commerce Store — Complete Blueprint

## Step 1: Create Models (in this exact order)

### 1.1 Category
\`\`\`yaml
model: Category
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 100
  slug:
    type: slug
    from: name
  description:
    type: text
    nullable: true
  image:
    type: url
    nullable: true
  active:
    type: boolean
    default: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin
  sortable: [name, createdAt]
  pagination:
    defaultLimit: 20
    maxLimit: 100

ui:
  components: [table, form, detail]
  table:
    columns: [name, description, active]
    searchable: [name]
\`\`\`

### 1.2 Product
\`\`\`yaml
model: Product
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  slug:
    type: slug
    from: name
  description:
    type: text
    nullable: true
  price:
    type: decimal
    precision: 10
    scale: 2
    min: 0
  compareAtPrice:
    type: decimal
    precision: 10
    scale: 2
    min: 0
    nullable: true
  sku:
    type: string
    max: 50
    unique: true
    nullable: true
  stock:
    type: integer
    min: 0
    default: 0
  image:
    type: url
    nullable: true
  active:
    type: boolean
    default: true
  featured:
    type: boolean
    default: false

relations:
  category:
    type: belongsTo
    model: Category
    onDelete: setNull

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin
  sortable: [name, price, stock, createdAt]
  pagination:
    defaultLimit: 20
    maxLimit: 100

ui:
  components: [table, form, detail]
  table:
    columns: [name, price, stock, active, featured]
    searchable: [name, sku]
    filterable: [active, featured]
\`\`\`

### 1.3 Customer
\`\`\`yaml
model: Customer
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  email:
    type: email
    unique: true
  phone:
    type: string
    max: 20
    nullable: true
  address:
    type: text
    nullable: true
  city:
    type: string
    max: 100
    nullable: true
  country:
    type: string
    max: 100
    nullable: true
  active:
    type: boolean
    default: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: admin
    get: admin
    create: public
    update: authenticated
    delete: admin
  sortable: [name, email, createdAt]

ui:
  components: [table, form, detail]
  table:
    columns: [name, email, phone, city, active]
    searchable: [name, email]
\`\`\`

### 1.4 Order
\`\`\`yaml
model: Order
fields:
  id:
    type: uuid
    primary: true
  orderNumber:
    type: string
    unique: true
  status:
    type: enum
    values: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
    default: pending
  subtotal:
    type: decimal
    precision: 10
    scale: 2
    min: 0
    default: 0
  tax:
    type: decimal
    precision: 10
    scale: 2
    min: 0
    default: 0
  total:
    type: decimal
    precision: 10
    scale: 2
    min: 0
    default: 0
  shippingAddress:
    type: text
    nullable: true
  notes:
    type: text
    nullable: true

softDelete: true

relations:
  customer:
    type: belongsTo
    model: Customer
    onDelete: restrict

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: authenticated
    get: authenticated
    create: authenticated
    update: admin
    delete: admin
  sortable: [orderNumber, status, total, createdAt]

ui:
  components: [table, form, detail]
  table:
    columns: [orderNumber, status, total, createdAt]
    searchable: [orderNumber]
    filterable: [status]
\`\`\`

### 1.5 OrderItem
\`\`\`yaml
model: OrderItem
fields:
  id:
    type: uuid
    primary: true
  quantity:
    type: integer
    min: 1
    default: 1
  unitPrice:
    type: decimal
    precision: 10
    scale: 2
    min: 0
  total:
    type: decimal
    precision: 10
    scale: 2
    min: 0

relations:
  order:
    type: belongsTo
    model: Order
    onDelete: cascade
  product:
    type: belongsTo
    model: Product
    onDelete: restrict

api:
  endpoints: [list, get, create, delete]
  auth:
    list: authenticated
    get: authenticated
    create: authenticated
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [quantity, unitPrice, total]
\`\`\`

## Step 2: Add Inverse Relations
After creating all models, add these hasMany relations:
- Category hasMany Product
- Customer hasMany Order
- Order hasMany OrderItem

## Step 3: Create Pages

### Home Page
\`\`\`yaml
page: Home
route: /
layout: marketing
title: "Welcome to Our Store"
sections:
  - type: hero
    title: "Discover Amazing Products"
    subtitle: "Quality products at unbeatable prices. Free shipping on orders over $50."
    background: gradient
    cta:
      text: "Shop Now"
      link: "/products"
  - type: features
    title: "Why Shop With Us"
    subtitle: "We're committed to the best shopping experience"
    columns: 3
    items:
      - title: "Free Shipping"
        description: "Free delivery on all orders over $50. Fast and reliable worldwide shipping."
        icon: "📦"
      - title: "Secure Payment"
        description: "Your payment information is encrypted and secure. We support all major cards."
        icon: "🔒"
      - title: "24/7 Support"
        description: "Our customer service team is available around the clock to help you."
        icon: "💬"
      - title: "Easy Returns"
        description: "Not satisfied? Return any item within 30 days for a full refund."
        icon: "↩️"
  - type: stats
    items:
      - value: "10,000+"
        label: "Happy Customers"
      - value: "500+"
        label: "Products"
      - value: "99.9%"
        label: "Satisfaction Rate"
      - value: "24/7"
        label: "Support"
  - type: testimonials
    title: "What Our Customers Say"
    items:
      - quote: "Best online shopping experience I've ever had. The products arrived quickly and exactly as described."
        author: "Sarah Johnson"
        role: "Verified Buyer"
      - quote: "I've been a customer for 2 years now. The quality is consistently excellent and customer service is top-notch."
        author: "Michael Chen"
        role: "Loyal Customer"
      - quote: "The prices are unbeatable and the free shipping makes it even better. Highly recommend!"
        author: "Emily Rodriguez"
        role: "New Customer"
  - type: cta
    title: "Start Shopping Today"
    subtitle: "Join thousands of satisfied customers"
    cta:
      text: "Browse Products"
      link: "/products"
\`\`\`

### Admin Page
\`\`\`yaml
page: Admin
route: /app
layout: app
auth: admin
title: "Store Admin"
\`\`\`

## Step 4: Seed Data

### Categories (5 records)
Use seed_data tool with model: "Category" and these records:
- id: "cat-001", name: "Electronics", description: "Smartphones, laptops, tablets and accessories"
- id: "cat-002", name: "Clothing", description: "Men's and women's fashion, shoes, and accessories"
- id: "cat-003", name: "Home & Garden", description: "Furniture, decor, kitchen, and outdoor"
- id: "cat-004", name: "Sports & Outdoors", description: "Athletic wear, equipment, and outdoor gear"
- id: "cat-005", name: "Books & Media", description: "Books, e-books, audiobooks, and digital media"

### Products (15 records, 3 per category)
Use seed_data with realistic products:
- Electronics: "iPhone 15 Pro" $999.99, "MacBook Air M3" $1099.99, "AirPods Pro" $249.99
- Clothing: "Classic Denim Jacket" $89.99, "Running Shoes Pro" $129.99, "Silk Scarf" $45.99
- Home: "Ceramic Vase Set" $34.99, "Bamboo Cutting Board" $24.99, "LED Desk Lamp" $59.99
- Sports: "Yoga Mat Premium" $49.99, "Resistance Bands Set" $29.99, "Water Bottle 32oz" $19.99
- Books: "The Art of Code" $24.99, "Cooking Masterclass" $32.99, "Travel Photography Guide" $28.99

### Customers (5 records)
- "Sarah Johnson" sarah@example.com, "Michael Chen" michael@example.com, etc.

### Orders (8 records, mix of statuses)
### OrderItems (20 records, 2-3 per order)
`,

  blog: `# Blog / Content Platform — Complete Blueprint

## Step 1: Create Models (in this exact order)

### 1.1 Author
\`\`\`yaml
model: Author
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  email:
    type: email
    unique: true
  bio:
    type: text
    nullable: true
  avatar:
    type: url
    nullable: true
  role:
    type: enum
    values: [writer, editor, admin]
    default: writer
  active:
    type: boolean
    default: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, email, role, active]
    searchable: [name, email]
\`\`\`

### 1.2 Category
\`\`\`yaml
model: Category
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 100
  slug:
    type: slug
    from: name
  description:
    type: text
    nullable: true
  color:
    type: string
    max: 7
    nullable: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, description]
    searchable: [name]
\`\`\`

### 1.3 Post
\`\`\`yaml
model: Post
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    min: 1
    max: 300
  slug:
    type: slug
    from: title
  excerpt:
    type: text
    nullable: true
  content:
    type: text
  coverImage:
    type: url
    nullable: true
  status:
    type: enum
    values: [draft, published, archived]
    default: draft
  featured:
    type: boolean
    default: false
  publishedAt:
    type: timestamp
    nullable: true
  readTime:
    type: integer
    nullable: true

relations:
  author:
    type: belongsTo
    model: Author
  category:
    type: belongsTo
    model: Category
    onDelete: setNull

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: authenticated
    update: authenticated
    delete: admin
  sortable: [title, publishedAt, createdAt]

ui:
  components: [table, form, detail]
  table:
    columns: [title, status, featured, publishedAt]
    searchable: [title]
    filterable: [status, featured]
\`\`\`

### 1.4 Comment
\`\`\`yaml
model: Comment
fields:
  id:
    type: uuid
    primary: true
  content:
    type: text
    min: 1
  authorName:
    type: string
    min: 1
    max: 100
  authorEmail:
    type: email
  approved:
    type: boolean
    default: false

relations:
  post:
    type: belongsTo
    model: Post
    onDelete: cascade

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: public
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [authorName, content, approved, createdAt]
    searchable: [authorName, content]
    filterable: [approved]
\`\`\`

## Step 2: Add Inverse Relations
- Author hasMany Post
- Category hasMany Post
- Post hasMany Comment

## Step 3: Create Pages

### Home Page
\`\`\`yaml
page: Home
route: /
layout: marketing
title: "Our Blog"
sections:
  - type: hero
    title: "Stories, Ideas, and Insights"
    subtitle: "Explore articles written by industry experts on technology, business, and creativity"
    background: gradient
    cta:
      text: "Read Latest Articles"
      link: "/posts"
  - type: features
    title: "What We Write About"
    columns: 3
    items:
      - title: "Technology"
        description: "Deep dives into the latest tech trends, frameworks, and best practices"
        icon: "💻"
      - title: "Business"
        description: "Startup insights, growth strategies, and entrepreneurship lessons"
        icon: "📈"
      - title: "Design"
        description: "UI/UX principles, design systems, and creative inspiration"
        icon: "🎨"
  - type: stats
    items:
      - value: "500+"
        label: "Articles Published"
      - value: "50K+"
        label: "Monthly Readers"
      - value: "100+"
        label: "Expert Writers"
      - value: "Weekly"
        label: "New Content"
  - type: cta
    title: "Never Miss an Article"
    subtitle: "Subscribe to our newsletter for weekly updates"
    cta:
      text: "Subscribe"
      link: "/subscribe"
\`\`\`

### Admin Page
\`\`\`yaml
page: Admin
route: /app
layout: app
auth: admin
title: "Blog Admin"
\`\`\`

## Step 4: Seed Data
- Authors (3): realistic writer names with bios
- Categories (5): Technology, Business, Design, Lifestyle, Tutorials
- Posts (12): mix of draft/published, 2-3 per category, real titles and excerpts
- Comments (20): 1-3 per published post
`,

  saas: `# SaaS Application — Complete Blueprint

## Step 1: Create Models (in this exact order)

### 1.1 Plan
\`\`\`yaml
model: Plan
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 50
  description:
    type: text
    nullable: true
  price:
    type: decimal
    precision: 10
    scale: 2
    min: 0
  interval:
    type: enum
    values: [monthly, yearly]
    default: monthly
  features:
    type: json
  maxUsers:
    type: integer
    min: 1
    default: 1
  maxProjects:
    type: integer
    min: 1
    default: 5
  popular:
    type: boolean
    default: false
  active:
    type: boolean
    default: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, price, interval, maxUsers, popular, active]
\`\`\`

### 1.2 Organization
\`\`\`yaml
model: Organization
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  slug:
    type: slug
    from: name
  logo:
    type: url
    nullable: true
  active:
    type: boolean
    default: true

relations:
  plan:
    type: belongsTo
    model: Plan

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: admin
    get: authenticated
    create: authenticated
    update: authenticated
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, active, createdAt]
    searchable: [name]
\`\`\`

### 1.3 User
\`\`\`yaml
model: User
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  email:
    type: email
    unique: true
  password:
    type: password
    min: 8
    hidden: true
  role:
    type: enum
    values: [member, admin, owner]
    default: member
  avatar:
    type: url
    nullable: true
  active:
    type: boolean
    default: true
  lastLoginAt:
    type: timestamp
    nullable: true

relations:
  organization:
    type: belongsTo
    model: Organization
    onDelete: setNull

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: admin
    get: authenticated
    create: public
    update: authenticated
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, email, role, active]
    searchable: [name, email]
    filterable: [role, active]
\`\`\`

### 1.4 Project
\`\`\`yaml
model: Project
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  description:
    type: text
    nullable: true
  status:
    type: enum
    values: [active, paused, completed, archived]
    default: active
  color:
    type: string
    max: 7
    nullable: true

relations:
  organization:
    type: belongsTo
    model: Organization
    onDelete: cascade

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: authenticated
    get: authenticated
    create: authenticated
    update: authenticated
    delete: authenticated

ui:
  components: [table, form, detail]
  table:
    columns: [name, status, createdAt]
    searchable: [name]
    filterable: [status]
\`\`\`

## Step 2: Add Inverse Relations
- Plan hasMany Organization
- Organization hasMany User
- Organization hasMany Project

## Step 3: Create Pages

### Home Page
\`\`\`yaml
page: Home
route: /
layout: marketing
title: "Your SaaS Platform"
sections:
  - type: hero
    title: "Build Better Products, Faster"
    subtitle: "The all-in-one platform for modern teams. Collaborate, track, and deliver with ease."
    background: gradient
    cta:
      text: "Start Free Trial"
      link: "/signup"
  - type: features
    title: "Everything You Need"
    subtitle: "Powerful tools designed for teams of all sizes"
    columns: 4
    items:
      - title: "Real-time Analytics"
        description: "Track performance with live dashboards, custom reports, and smart insights"
        icon: "📊"
      - title: "Team Collaboration"
        description: "Work together with shared workspaces, comments, and real-time updates"
        icon: "👥"
      - title: "Automation"
        description: "Automate workflows, notifications, and repetitive tasks effortlessly"
        icon: "⚡"
      - title: "Security"
        description: "Enterprise-grade encryption, SSO, audit logs, and compliance tools"
        icon: "🔒"
  - type: pricing
    title: "Simple, Transparent Pricing"
    subtitle: "No hidden fees. Cancel anytime."
    plans:
      - name: "Starter"
        price: 0
        features: ["1 user", "5 projects", "Basic analytics", "Community support"]
        cta: "Get Started Free"
      - name: "Pro"
        price: 29
        features: ["10 users", "Unlimited projects", "Advanced analytics", "Priority support", "Custom workflows"]
        highlighted: true
        cta: "Start Free Trial"
      - name: "Enterprise"
        price: 99
        features: ["Unlimited users", "Unlimited projects", "Custom analytics", "Dedicated support", "SSO & SAML", "SLA guarantee"]
        cta: "Contact Sales"
  - type: testimonials
    title: "Trusted by Leading Teams"
    items:
      - quote: "Switched from 3 different tools to this one platform. Productivity increased 40% in the first month."
        author: "Alex Rivera"
        role: "VP Engineering, TechCorp"
      - quote: "The best investment we've made for our team. The automation features alone save us 10 hours per week."
        author: "Lisa Park"
        role: "Product Manager, StartupXYZ"
      - quote: "Enterprise-grade security without the enterprise complexity. Perfect for our growing team."
        author: "David Kim"
        role: "CTO, ScaleUp Inc"
  - type: faq
    title: "Frequently Asked Questions"
    items:
      - question: "Can I try it for free?"
        answer: "Yes! Our Starter plan is completely free. No credit card required."
      - question: "How does billing work?"
        answer: "We bill monthly or annually. Annual plans get 2 months free."
      - question: "Can I upgrade or downgrade anytime?"
        answer: "Absolutely. Changes take effect immediately with prorated billing."
      - question: "Is my data secure?"
        answer: "Yes. We use AES-256 encryption, run on SOC 2 compliant infrastructure, and offer SSO on Pro and Enterprise plans."
      - question: "Do you offer a discount for startups?"
        answer: "Yes! Eligible startups get 50% off Pro plans for the first year."
  - type: cta
    title: "Ready to Transform Your Workflow?"
    subtitle: "Join 10,000+ teams already using our platform"
    cta:
      text: "Start Free Trial"
      link: "/signup"
\`\`\`

### Pricing Page
\`\`\`yaml
page: Pricing
route: /pricing
layout: marketing
title: "Pricing"
sections:
  - type: hero
    title: "Choose Your Plan"
    subtitle: "Start free, upgrade when you need to"
  - type: pricing
    title: "Plans & Pricing"
    plans:
      - name: "Starter"
        price: 0
        features: ["1 user", "5 projects", "Basic analytics", "Community support"]
      - name: "Pro"
        price: 29
        features: ["10 users", "Unlimited projects", "Advanced analytics", "Priority support", "Custom workflows", "API access"]
        highlighted: true
      - name: "Enterprise"
        price: 99
        features: ["Unlimited users", "Unlimited projects", "Custom analytics", "Dedicated support", "SSO & SAML", "SLA guarantee", "Custom integrations"]
  - type: faq
    title: "Pricing FAQ"
    items:
      - question: "What payment methods do you accept?"
        answer: "We accept all major credit cards, PayPal, and wire transfer for Enterprise plans."
      - question: "Is there a free trial for paid plans?"
        answer: "Yes, all paid plans come with a 14-day free trial."
      - question: "What happens when my trial ends?"
        answer: "You'll be automatically moved to the Starter plan. No charges unless you explicitly upgrade."
\`\`\`

### Dashboard
\`\`\`yaml
page: Dashboard
route: /app
layout: app
auth: authenticated
title: "Dashboard"
\`\`\`

### Admin
\`\`\`yaml
page: Admin
route: /admin
layout: app
auth: admin
title: "Admin Panel"
\`\`\`

## Step 4: Seed Data
- Plans (3): Starter $0, Pro $29, Enterprise $99 with feature lists
- Organizations (5): "Acme Corp", "TechStart", "DesignLab", "DataFlow", "CloudBase"
- Users (10): 2 per org (1 owner, 1 member), realistic names/emails
- Projects (15): 3 per org, various statuses
`,

  portfolio: `# Portfolio / Agency — Complete Blueprint

## Step 1: Create Models

### 1.1 Category
\`\`\`yaml
model: Category
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 100
  slug:
    type: slug
    from: name
  description:
    type: text
    nullable: true

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, description]
\`\`\`

### 1.2 Project
\`\`\`yaml
model: Project
fields:
  id:
    type: uuid
    primary: true
  title:
    type: string
    min: 1
    max: 200
  slug:
    type: slug
    from: title
  description:
    type: text
  shortDescription:
    type: string
    max: 300
    nullable: true
  image:
    type: url
    nullable: true
  url:
    type: url
    nullable: true
  client:
    type: string
    max: 200
    nullable: true
  year:
    type: integer
    nullable: true
  featured:
    type: boolean
    default: false
  status:
    type: enum
    values: [draft, published]
    default: draft

relations:
  category:
    type: belongsTo
    model: Category
    onDelete: setNull

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin
  sortable: [title, year, createdAt]

ui:
  components: [table, form, detail]
  table:
    columns: [title, client, year, featured, status]
    searchable: [title, client]
    filterable: [featured, status]
\`\`\`

### 1.3 Skill
\`\`\`yaml
model: Skill
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 100
  level:
    type: enum
    values: [beginner, intermediate, advanced, expert]
    default: intermediate
  icon:
    type: string
    max: 10
    nullable: true
  order:
    type: integer
    default: 0

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [name, level, order]
\`\`\`

### 1.4 Testimonial
\`\`\`yaml
model: Testimonial
fields:
  id:
    type: uuid
    primary: true
  quote:
    type: text
    min: 10
  author:
    type: string
    min: 1
    max: 200
  role:
    type: string
    max: 200
    nullable: true
  company:
    type: string
    max: 200
    nullable: true
  avatar:
    type: url
    nullable: true
  featured:
    type: boolean
    default: false

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: public
    get: public
    create: admin
    update: admin
    delete: admin

ui:
  components: [table, form, detail]
  table:
    columns: [author, company, featured]
\`\`\`

## Step 2: Inverse Relations
- Category hasMany Project

## Step 3: Create Pages

### Home
\`\`\`yaml
page: Home
route: /
layout: marketing
title: "Portfolio"
sections:
  - type: hero
    title: "Hi, I'm [Name]"
    subtitle: "Designer & Developer crafting beautiful digital experiences"
    background: gradient
    cta:
      text: "View My Work"
      link: "/projects"
  - type: features
    title: "What I Do"
    columns: 3
    items:
      - title: "Web Design"
        description: "Beautiful, responsive websites that convert visitors into customers"
        icon: "🎨"
      - title: "Development"
        description: "Clean, scalable code using modern technologies and best practices"
        icon: "💻"
      - title: "Branding"
        description: "Memorable brand identities that stand out in crowded markets"
        icon: "✨"
  - type: stats
    items:
      - value: "8+"
        label: "Years Experience"
      - value: "120+"
        label: "Projects Completed"
      - value: "50+"
        label: "Happy Clients"
      - value: "15"
        label: "Awards"
  - type: testimonials
    title: "Client Feedback"
    items:
      - quote: "Exceptional design work. They understood our vision perfectly and delivered beyond expectations."
        author: "Jennifer Walsh"
        role: "CEO, BrightStart"
      - quote: "Professional, creative, and incredibly easy to work with. The results speak for themselves."
        author: "Thomas Lee"
        role: "Marketing Director, TechFlow"
      - quote: "Our conversion rate increased 60% after the redesign. Best investment we've made."
        author: "Amanda Foster"
        role: "Founder, GreenLeaf"
  - type: cta
    title: "Let's Work Together"
    subtitle: "Have a project in mind? I'd love to hear about it."
    cta:
      text: "Get in Touch"
      link: "/contact"
\`\`\`

### About
\`\`\`yaml
page: About
route: /about
layout: marketing
title: "About Me"
sections:
  - type: hero
    title: "About Me"
    subtitle: "Passionate about creating meaningful digital experiences"
  - type: content
    content: "With over 8 years of experience in design and development, I help businesses create digital products that users love. I believe in clean design, efficient code, and honest communication."
  - type: stats
    items:
      - value: "2016"
        label: "Started Freelancing"
      - value: "120+"
        label: "Projects"
      - value: "15"
        label: "Countries"
      - value: "100%"
        label: "Client Satisfaction"
\`\`\`

### Contact
\`\`\`yaml
page: Contact
route: /contact
layout: marketing
title: "Contact"
sections:
  - type: hero
    title: "Get in Touch"
    subtitle: "I'd love to hear about your project"
  - type: contact
    title: "Send a Message"
    subtitle: "Fill out the form below and I'll get back to you within 24 hours"
\`\`\`

### Admin
\`\`\`yaml
page: Admin
route: /app
layout: app
auth: admin
title: "Admin"
\`\`\`

## Step 4: Seed Data
- Categories (4): "Web Design", "Mobile Apps", "Branding", "UI/UX"
- Projects (8): 2 per category with realistic titles and clients
- Skills (8): React, TypeScript, Node.js, Figma, Tailwind, Next.js, PostgreSQL, Docker
- Testimonials (4): realistic client quotes
`,

  api: `# API-Only (Headless) — Complete Blueprint

No frontend/pages needed. Focus on a robust, well-documented API.

## Key Principles
1. Strong auth on every endpoint
2. Pagination on all list endpoints (defaultLimit: 20, maxLimit: 100)
3. Sortable fields on every model
4. Proper onDelete behavior on all relations
5. No ui config (no frontend generated)

## Example Model Template
\`\`\`yaml
model: Resource
fields:
  id:
    type: uuid
    primary: true
  name:
    type: string
    min: 1
    max: 200
  status:
    type: enum
    values: [active, inactive, archived]
    default: active

api:
  endpoints: [list, get, create, update, delete]
  auth:
    list: authenticated
    get: authenticated
    create: authenticated
    update: authenticated
    delete: admin
  sortable: [name, status, createdAt]
  pagination:
    defaultLimit: 20
    maxLimit: 100
\`\`\`

## Common API-Only Patterns

### Multi-tenant API
- Organization model as tenant
- All resources have belongsTo Organization
- Auth: list/get scoped to org, create requires org membership

### Public API
- API key auth via headers
- Rate limiting per key
- Versioned endpoints

### Internal Microservice
- All endpoints authenticated
- No public access
- Service-to-service auth tokens

## Apply these principles when the user says they want "just an API" or "headless backend".
`,
};

export function registerPatternsResource(server: McpServer, _ctx: ServerContext): void {
  // Static list resource
  server.registerResource(
    'patterns',
    'project://patterns',
    {
      description: 'Available project patterns: ecommerce, blog, saas, portfolio, api. Read a specific pattern with project://patterns/{type}',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: `# Available Project Patterns\n\nRead a specific pattern for complete blueprints with copy-pasteable YAML:\n\n${Object.keys(PATTERNS).map((k) => `- project://patterns/${k}`).join('\n')}\n\nEach pattern includes: complete model specs, page specs, relation setup, and seed data instructions.`,
      }],
    }),
  );

  // Dynamic pattern detail
  server.registerResource(
    'pattern-detail',
    new ResourceTemplate('project://patterns/{type}', {
      list: async () => ({
        resources: Object.keys(PATTERNS).map((k) => ({
          uri: `project://patterns/${k}`,
          name: k.charAt(0).toUpperCase() + k.slice(1) + ' Pattern',
        })),
      }),
    }),
    {
      description: 'Complete project blueprint with full YAML specs for models, pages, relations, and seed data',
      mimeType: 'text/plain',
    },
    async (uri, { type }) => {
      const pattern = PATTERNS[String(type)];
      if (!pattern) {
        return {
          contents: [{
            uri: uri.href,
            text: `Pattern "${type}" not found. Available: ${Object.keys(PATTERNS).join(', ')}`,
          }],
        };
      }
      return { contents: [{ uri: uri.href, text: pattern }] };
    },
  );
}
