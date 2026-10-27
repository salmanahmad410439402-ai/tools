/**
 * Content + registry checks. Run with:
 *   node --experimental-strip-types scripts/validate-content.ts
 * (Node 22+; only type-stripping is needed because data/tools.ts imports types.)
 *
 * Fails the process when something would hurt SEO, AdSense review or the
 * "no thin pages" rule, so mistakes are caught before a deploy.
 */
import { tools } from "../data/tools.ts";
import { guides } from "../data/guides.ts";
import { CATEGORIES, SITE_URL, SITE_URL_IS_PLACEHOLDER } from "../data/site.ts";

const problems: string[] = [];
const warnings: string[] = [];

// The launch blocker that is easiest to forget: building with the fallback
// origin publishes canonicals, a sitemap and structured data for example.com.
if (SITE_URL_IS_PLACEHOLDER) {
  warnings.push(
    "SITE_URL is still the placeholder origin. Set NEXT_PUBLIC_SITE_URL to the live domain before deploying, or every canonical, sitemap entry and JSON-LD URL will point at example.com.",
  );
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const seen = new Set<string>();
const baseUrlTitles = new Map<string, string>();

for (const tool of tools) {
  const where = `tool "${tool.slug}"`;

  if (seen.has(tool.slug)) problems.push(`${where}: duplicate slug`);
  seen.add(tool.slug);
  if (!/^[a-z0-9-]+$/.test(tool.slug)) problems.push(`${where}: slug must be lowercase kebab-case`);

  // The slug is the search phrase: the same words must appear in the <title>
  // and the H1, so the page's promise and its URL cannot drift apart.
  const phrase = tool.slug.replace(/-/g, " ");
  if (!tool.seoTitle.toLowerCase().includes(phrase)) {
    problems.push(`${where}: <title> must contain the slug phrase "${phrase}"`);
  }
  if (!tool.h1.toLowerCase().includes(phrase)) {
    problems.push(`${where}: H1 must contain the slug phrase "${phrase}"`);
  }

  if (!CATEGORIES.some((category) => category.slug === tool.category)) {
    problems.push(`${where}: unknown category "${tool.category}"`);
  }
  if (tool.seoTitle.length > 50) {
    problems.push(`${where}: seoTitle is ${tool.seoTitle.length} chars (max 50 so " | Site" keeps <title> ≤ 60)`);
  }
  if (baseUrlTitles.has(tool.seoTitle)) problems.push(`${where}: seoTitle duplicates "${baseUrlTitles.get(tool.seoTitle)}"`);
  baseUrlTitles.set(tool.seoTitle, tool.slug);
  if (tool.metaDescription.length > 155) {
    problems.push(`${where}: metaDescription is ${tool.metaDescription.length} chars (max 155)`);
  }
  if (tool.metaDescription.length < 70) warnings.push(`${where}: metaDescription is very short (${tool.metaDescription.length})`);
  if (tool.intro.length < 2) problems.push(`${where}: needs at least 2 intro paragraphs`);
  if (tool.faqs.length < 5) problems.push(`${where}: needs at least 5 FAQs (has ${tool.faqs.length})`);
  if (tool.faqs.length > 8) warnings.push(`${where}: ${tool.faqs.length} FAQs (keep to 8)`);
  if (tool.bullets.length < 4) problems.push(`${where}: needs 4–6 feature bullets`);
  if (tool.steps.length < 3) problems.push(`${where}: needs at least 3 how-to steps`);
  if (tool.tips.length < 3) problems.push(`${where}: needs at least 3 tips`);
  if (tool.limits.length < 2) problems.push(`${where}: needs at least 2 documented limits`);
  if (!tool.h1.includes(tool.name.split(" ")[0])) warnings.push(`${where}: H1 does not contain the tool name`);

  for (const slug of tool.related) {
    if (!seen.has(slug) && !tools.some((entry) => entry.slug === slug)) {
      problems.push(`${where}: related slug "${slug}" does not exist`);
    }
    if (slug === tool.slug) problems.push(`${where}: relates to itself`);
  }

  const body = [
    ...tool.intro,
    ...tool.bullets.map((item) => `${item.title} ${item.text}`),
    ...tool.steps.map((item) => `${item.title} ${item.text}`),
    ...tool.limits.map((item) => `${item.title} ${item.text}`),
    ...tool.tips.map((item) => `${item.title} ${item.text}`),
    ...tool.faqs.map((item) => `${item.q} ${item.a}`),
  ].join(" ");
  const wordCount = words(body);
  if (wordCount < 800) problems.push(`${where}: only ${wordCount} words of written content (target 800+)`);
  // eslint-disable-next-line no-console
  console.log(`  ${tool.slug.padEnd(22)} ${String(wordCount).padStart(5)} words · ${tool.faqs.length} FAQs · title ${tool.seoTitle.length}`);

  // The filler-text utility is *about* lorem ipsum, so the usual "did someone
  // forget to write the copy" scan would flag every paragraph on that page.
  const writesPlaceholderCopy = /lorem|placeholder/i.test(`${tool.slug} ${tool.name} ${tool.keywords.join(" ")}`);
  const placeholderPattern = writesPlaceholderCopy ? /TODO|TBD|coming soon/i : /lorem ipsum|TODO|TBD|placeholder|coming soon/i;
  if (placeholderPattern.test(body)) {
    problems.push(`${where}: contains placeholder text`);
  }
}

const guideSlugs = new Set<string>();
for (const guide of guides) {
  if (guideSlugs.has(guide.slug)) problems.push(`guide "${guide.slug}": duplicate slug`);
  guideSlugs.add(guide.slug);
  const wordCount = guide.body.reduce((total, block) => {
    if (block.type === "ul" || block.type === "ol") return total + block.items.reduce((sum, item) => sum + words(item), 0);
    return total + words(block.text);
  }, 0);
  if (wordCount < 800) problems.push(`guide "${guide.slug}": only ${wordCount} words (guides need 800+)`);
  if (guide.title.length > 50) problems.push(`guide "${guide.slug}": title ${guide.title.length} chars (max 50)`);
  if (guide.excerpt.length > 155) problems.push(`guide "${guide.slug}": excerpt ${guide.excerpt.length} chars (max 155)`);
}

// eslint-disable-next-line no-console
console.log(`\n${tools.length} tools · ${guides.length} guides · ${CATEGORIES.length} categories · ${SITE_URL}`);

if (warnings.length) {
  // eslint-disable-next-line no-console
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`  ! ${warning}`);
}

if (problems.length) {
  // eslint-disable-next-line no-console
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("\nAll content checks passed.");
