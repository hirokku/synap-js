import type { GeneratedFile, GeneratorContext } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export function generateSectionComponents(context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui/sections`;
  const header = generatedHeader('synap:ui');

  return [
    {
      path: `${dir}/hero-section.tsx`,
      content: `${header}
import React from 'react';
import { Button } from '../components/button.js';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  cta?: { text: string; link: string };
  background?: string;
  image?: string;
}

export function HeroSection({ title, subtitle, cta, background, image }: HeroSectionProps) {
  return (
    <section className={\`relative py-24 \${background === 'gradient' ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white' : 'bg-white text-gray-900'}\`}>
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className={\`mt-4 text-xl \${background === 'gradient' ? 'text-blue-100' : 'text-gray-600'}\`}>{subtitle}</p>}
        {cta && (
          <div className="mt-8">
            <a href={cta.link}>
              <Button size="lg" variant={background === 'gradient' ? 'secondary' : 'primary'}>{cta.text}</Button>
            </a>
          </div>
        )}
        {image && <img src={image} alt="" className="mx-auto mt-12 max-w-3xl rounded-xl shadow-2xl" />}
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/features-section.tsx`,
      content: `${header}
import React from 'react';

interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  items: FeatureItem[];
  columns?: number;
}

export function FeaturesSection({ title, subtitle, items, columns = 3 }: FeaturesSectionProps) {
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900">{title}</h2>}
        {subtitle && <p className="mt-2 text-center text-gray-600">{subtitle}</p>}
        <div className={\`mt-12 grid gap-8 \${gridCols}\`}>
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-6 text-center">
              {item.icon && <div className="mb-4 text-3xl">{item.icon}</div>}
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/pricing-section.tsx`,
      content: `${header}
import React from 'react';
import { Button } from '../components/button.js';

interface Plan {
  name: string;
  price: number | string;
  features: string[];
  cta?: string;
  highlighted?: boolean;
}

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  plans: Plan[];
}

export function PricingSection({ title, subtitle, plans }: PricingSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900">{title}</h2>}
        {subtitle && <p className="mt-2 text-center text-gray-600">{subtitle}</p>}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div key={i} className={\`rounded-xl border-2 p-8 \${plan.highlighted ? 'border-blue-600 bg-white shadow-lg' : 'border-gray-200 bg-white'}\`}>
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">{typeof plan.price === 'number' ? (plan.price === 0 ? 'Free' : \`$\${plan.price}\`) : plan.price}</span>
                {typeof plan.price === 'number' && plan.price > 0 && <span className="text-gray-500">/mo</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full">{plan.cta ?? 'Get Started'}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/cta-section.tsx`,
      content: `${header}
import React from 'react';
import { Button } from '../components/button.js';

interface CtaSectionProps {
  title: string;
  subtitle?: string;
  cta?: { text: string; link: string };
}

export function CtaSection({ title, subtitle, cta }: CtaSectionProps) {
  return (
    <section className="py-20 bg-blue-600">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-4 text-blue-100">{subtitle}</p>}
        {cta && <div className="mt-8"><a href={cta.link}><Button size="lg" variant="secondary">{cta.text}</Button></a></div>}
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/testimonials-section.tsx`,
      content: `${header}
import React from 'react';

interface Testimonial { quote: string; author: string; role?: string; }
interface TestimonialsSectionProps { title?: string; items: Testimonial[]; }

export function TestimonialsSection({ title, items }: TestimonialsSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{title}</h2>}
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((t, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-6">
              <p className="text-gray-600 italic">"{t.quote}"</p>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">{t.author}</p>
                {t.role && <p className="text-sm text-gray-500">{t.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/faq-section.tsx`,
      content: `${header}
import React, { useState } from 'react';

interface FaqItem { question: string; answer: string; }
interface FaqSectionProps { title?: string; items: FaqItem[]; }

export function FaqSection({ title, items }: FaqSectionProps) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{title}</h2>}
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200">
              <button className="flex w-full items-center justify-between p-4 text-left font-medium text-gray-900" onClick={() => setOpen(open === i ? null : i)}>
                {item.question}
                <span className="text-gray-400">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <div className="px-4 pb-4 text-gray-600">{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/content-section.tsx`,
      content: `${header}
import React from 'react';

interface ContentSectionProps { title?: string; content: string; }

export function ContentSection({ title, content }: ContentSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        {title && <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>}
        <div className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/stats-section.tsx`,
      content: `${header}
import React from 'react';

interface StatItem { value: string; label: string; }
interface StatsSectionProps { title?: string; items: StatItem[]; }

export function StatsSection({ title, items }: StatsSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{title}</h2>}
        <div className="grid gap-8 md:grid-cols-4">
          {items.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-blue-600">{stat.value}</div>
              <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/team-section.tsx`,
      content: `${header}
import React from 'react';

interface TeamMember { name: string; role?: string; avatar?: string; }
interface TeamSectionProps { title?: string; items: TeamMember[]; }

export function TeamSection({ title, items }: TeamSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{title}</h2>}
        <div className="grid gap-8 md:grid-cols-4">
          {items.map((member, i) => (
            <div key={i} className="text-center">
              {member.avatar && <img src={member.avatar} alt={member.name} className="mx-auto h-24 w-24 rounded-full object-cover" />}
              <p className="mt-4 font-semibold text-gray-900">{member.name}</p>
              {member.role && <p className="text-sm text-gray-500">{member.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/contact-section.tsx`,
      content: `${header}
import React, { useState } from 'react';
import { Input } from '../components/input.js';
import { Textarea } from '../components/textarea.js';
import { Button } from '../components/button.js';

interface ContactSectionProps { title?: string; subtitle?: string; }

export function ContactSection({ title, subtitle }: ContactSectionProps) {
  const [sent, setSent] = useState(false);
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-xl px-6">
        {title && <h2 className="text-3xl font-bold text-center text-gray-900">{title}</h2>}
        {subtitle && <p className="mt-2 text-center text-gray-600">{subtitle}</p>}
        {sent ? (
          <div className="mt-8 text-center text-green-600 font-medium">Thank you! We will be in touch.</div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <Input label="Name" name="name" required />
            <Input label="Email" name="email" type="email" required />
            <Textarea label="Message" name="message" required />
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        )}
      </div>
    </section>
  );
}
`,
    },
    {
      path: `${dir}/index.ts`,
      content: `${header}
export { HeroSection } from './hero-section.js';
export { FeaturesSection } from './features-section.js';
export { PricingSection } from './pricing-section.js';
export { CtaSection } from './cta-section.js';
export { TestimonialsSection } from './testimonials-section.js';
export { FaqSection } from './faq-section.js';
export { ContentSection } from './content-section.js';
export { StatsSection } from './stats-section.js';
export { TeamSection } from './team-section.js';
export { ContactSection } from './contact-section.js';
`,
    },
  ];
}
