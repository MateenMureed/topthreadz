// Deterministic, application-side SEO scoring (0-100) — never trusts the AI's
// self-reported score. Pure function, unit-testable, no I/O.

export interface SeoScoreInput {
  name: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  description: string;
  keywords: string[];
  shortDescription: string;
  highlights: string[];
}

export interface SeoScoreResult {
  score: number;
  max: 100;
  suggestions: string[];
}

const FASHION_TERMS = [
  'men', "men's", 'mens', 'unstitched', 'stitched', 'two piece', 'three piece',
  'fabric', 'pakistan', 'pakistani', 'suit', 'kameez', 'kurta', 'wash & wear',
  'wash and wear', 'wrinkle', 'premium', 'top threadz',
];

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textQuality(text: string, idealMin: number, idealMax: number): { ratio: number; length: number } {
  const length = stripHtml(text).length;
  if (length === 0) return { ratio: 0, length: 0 };
  if (length < idealMin) return { ratio: length / idealMin * 0.5, length };
  if (length > idealMax) return { ratio: Math.max(0.3, 1 - (length - idealMax) / idealMax), length };
  return { ratio: 1, length };
}

export function calculateSeoScore(input: SeoScoreInput): SeoScoreResult {
  const suggestions: string[] = [];
  let points = 0;

  // 1. SEO title (20 pts)
  const seoTitle = (input.seoTitle || '').trim();
  if (seoTitle.length === 0) {
    suggestions.push('Add an SEO title.');
  } else {
    const len = seoTitle.length;
    let titlePts = 12;
    if (len >= 30 && len <= 60) titlePts = 20;
    else if (len < 30) suggestions.push('SEO title is short — aim for 30-60 characters.');
    else suggestions.push('SEO title is long — keep it under 60 characters to avoid truncation.');
    // Reward containing the product name.
    if (seoTitle.toLowerCase().includes((input.name || '').trim().toLowerCase().slice(0, 12)) || seoTitle.toLowerCase().includes('top threadz')) {
      titlePts = Math.min(20, titlePts + 4);
    }
    points += titlePts;
  }

  // 2. Meta description (20 pts)
  const meta = (input.metaDescription || '').trim();
  if (meta.length === 0) {
    suggestions.push('Add a meta description.');
  } else {
    const q = textQuality(meta, 120, 160);
    let metaPts = Math.round(20 * q.ratio);
    if (meta.length < 70) { metaPts = Math.min(metaPts, 8); suggestions.push('Meta description is short — aim for 120-160 characters.'); }
    if (meta.length > 165) suggestions.push('Meta description exceeds 160 characters and may be truncated in search results.');
    points += metaPts;
  }

  // 3. Primary keyword presence in title + description (15 pts)
  const primary = (input.keywords[0] || '').toLowerCase().trim();
  if (!primary) {
    suggestions.push('Define a primary keyword.');
  } else {
    let kwPts = 5;
    if (seoTitle.toLowerCase().includes(primary)) kwPts += 5;
    if (stripHtml(input.description).toLowerCase().includes(primary)) kwPts += 3;
    if (stripHtml(input.shortDescription).toLowerCase().includes(primary)) kwPts += 2;
    if (kwPts <= 5) suggestions.push(`Primary keyword "${input.keywords[0]}" missing from the title or description.`);
    points += kwPts;
  }

  // 4. Keyword set quality (10 pts)
  const kwCount = (input.keywords || []).filter(Boolean).length;
  if (kwCount === 0) {
    suggestions.push('Add keywords.');
  } else {
    points += kwCount >= 5 && kwCount <= 15 ? 10 : 6;
    if (kwCount > 15) suggestions.push('Too many keywords can dilute relevance — trim to 10-15.');
  }

  // 5. Description length (15 pts)
  const descQ = textQuality(input.description, 250, 2500);
  points += Math.round(15 * descQ.ratio);
  if (descQ.length === 0) suggestions.push('Add a product description.');
  else if (descQ.length < 250) suggestions.push('Description is thin — aim for at least 250 characters.');
  else if (descQ.length > 2500) suggestions.push('Description is very long — consider tightening it.');

  // 6. Product-specific content (10 pts)
  const descLower = stripHtml(input.description).toLowerCase();
  const specificTerms = FASHION_TERMS.filter((t) => descLower.includes(t));
  const categoryOk = descLower.includes((input.name || '').toLowerCase().split(' ').slice(0, 2).join(' '));
  let specPts = Math.min(6, specificTerms.length);
  if (categoryOk) specPts += 4;
  points += specPts;
  if (specificTerms.length === 0 && !categoryOk) suggestions.push('Description lacks product-specific terms — mention fabric, category or fit.');

  // 7. Slug quality (10 pts)
  const slug = (input.slug || '').trim();
  if (!slug) {
    suggestions.push('Set a URL slug.');
  } else {
    let slugPts = 10;
    if (slug.length > 60 || slug.split('-').length > 8) { slugPts -= 4; suggestions.push('Slug is long — remove unnecessary words.'); }
    if (/\d{4,}/.test(slug)) slugPts -= 2;
    if (!/^[a-z0-9-]+$/.test(slug)) { slugPts = 0; suggestions.push('Slug must be lowercase with hyphens only.'); }
    points += Math.max(0, slugPts);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(points))),
    max: 100,
    suggestions,
  };
}
