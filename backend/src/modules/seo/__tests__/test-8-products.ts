import { SeoService, SeoProductInput } from '../seo.service';

const testProducts: SeoProductInput[] = [
  {
    name: 'Dark Brown Wash & Wear Stitched Suit',
    category: 'Stitched',
    subcategory: 'Wash and Wear',
    fabric: 'Wash and Wear',
    color: 'Dark Brown',
    price: 6500,
    brand: 'Top Threadz',
  },
  {
    name: 'Navy Blue Wash and Wear Unstitched Fabric',
    category: 'Unstitched',
    subcategory: 'Wash and Wear',
    fabric: 'Wash and Wear',
    color: 'Navy Blue',
    price: 4200,
    brand: 'Top Threadz',
  },
  {
    name: 'Natural Cream Boski Unstitched Fabric',
    category: 'Unstitched',
    subcategory: 'Boski',
    fabric: 'Boski',
    color: 'Cream',
    price: 9500,
    brand: 'Top Threadz',
  },
  {
    name: 'Crisp White Cotton Unstitched Fabric',
    category: 'Unstitched',
    subcategory: 'Cotton',
    fabric: 'Cotton',
    color: 'White',
    price: 3800,
    brand: 'Top Threadz',
  },
  {
    name: 'Charcoal Grey Two Piece Stitched Suit',
    category: 'Stitched',
    subcategory: 'Two Piece',
    fabric: 'Blended Wash & Wear',
    color: 'Charcoal Grey',
    price: 7200,
    brand: 'Top Threadz',
  },
  {
    name: "Men's Black Three Piece Formal Suit",
    category: 'Stitched',
    subcategory: 'Three Piece',
    fabric: 'Tropical Blend',
    color: 'Black',
    price: 14500,
    brand: 'Top Threadz',
  },
  {
    name: "Midnight Blue Men's Waistcoat",
    category: 'Stitched',
    subcategory: 'Waistcoats',
    fabric: 'Textured Blend',
    color: 'Midnight Blue',
    price: 5200,
    brand: 'Top Threadz',
  },
  {
    name: 'Boys Traditional Maroon Shalwar Kameez',
    category: 'Kids',
    subcategory: 'Boys Traditional',
    fabric: 'Soft Cotton Blend',
    color: 'Maroon',
    price: 3200,
    brand: 'Top Threadz',
  },
];

async function runAudit() {
  const service = new SeoService();
  const results: any[] = [];

  for (const p of testProducts) {
    const res = await service.generate(p);
    const content = res.content;
    const titleLen = (content.seoTitle || '').length;
    const metaLen = (content.metaDescription || '').length;
    const wordCount = (content.description || '').split(/\s+/).filter(Boolean).length;

    results.push({
      product: p.name,
      category: p.category,
      seoTitle: content.seoTitle,
      titleLength: titleLen,
      metaDescription: content.metaDescription,
      metaLength: metaLen,
      primaryKeyword: content.primaryKeyword,
      secondaryKeywords: content.secondaryKeywords,
      longTailKeywords: content.longTailKeywords,
      descriptionWordCount: wordCount,
      imageAlt: content.imageAltText,
      score: res.score.score,
      warnings: res.score.warnings,
      criticalFailures: res.score.criticalFailures,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
