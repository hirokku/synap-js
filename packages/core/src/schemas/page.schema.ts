import { z } from 'zod';

const VALID_SECTION_TYPES = [
  'hero', 'features', 'pricing', 'cta', 'testimonials',
  'faq', 'content', 'stats', 'team', 'contact', 'custom',
] as const;

const VALID_LAYOUTS = ['marketing', 'app', 'blank'] as const;
const VALID_AUTH_LEVELS = ['public', 'authenticated', 'owner', 'admin'] as const;

const CtaSchema = z.object({
  text: z.string(),
  link: z.string(),
  variant: z.string().optional(),
});

const PlanSchema = z.object({
  name: z.string(),
  price: z.union([z.number(), z.string()]),
  features: z.array(z.string()),
  cta: z.string().optional(),
  highlighted: z.boolean().optional(),
});

const PageSectionSchema = z.object({
  type: z.enum(VALID_SECTION_TYPES),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  cta: CtaSchema.optional(),
  items: z.array(z.record(z.unknown())).optional(),
  plans: z.array(PlanSchema).optional(),
  columns: z.number().optional(),
  background: z.string().optional(),
  image: z.string().optional(),
  component: z.string().optional(),
  props: z.record(z.unknown()).optional(),
});

export const PageSpecSchema = z.object({
  page: z.string().regex(/^[A-Z][a-zA-Z0-9]*$/, 'Page name must be PascalCase'),
  route: z.string().startsWith('/'),
  layout: z.enum(VALID_LAYOUTS).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  auth: z.enum(VALID_AUTH_LEVELS).optional(),
  sections: z.array(PageSectionSchema).optional(),
  model: z.string().optional(),
  view: z.enum(['table', 'form', 'detail']).optional(),
});

export { VALID_SECTION_TYPES, VALID_LAYOUTS };
