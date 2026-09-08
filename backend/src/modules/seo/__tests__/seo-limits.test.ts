/**
 * Automated SEO Validation Tests (Section 38)
 *
 * Verifies the 10 core measurable SEO Optimizer rules and safety limits:
 * Test 1: Stitched product accuracy (no unstitched/kids/unrelated fabrics)
 * Test 2: Unstitched Wash & Wear accuracy (no stitched/kids/women)
 * Test 3: Kids product (rejects adult men as primary intent)
 * Test 4: Price validation (rejects "under 3000" when price is 5999)
 * Test 5: Duplicate validation & normalization
 * Test 6: Title hard limit (<= 65 characters)
 * Test 7: Meta description hard limit (<= 170 characters)
 * Test 8: Keyword stuffing & density detection
 * Test 9: Unsupported attribute truth rejection
 * Test 10: Combination explosion cap (<= 250 aliases, <= 30 per group)
 */

import {
  generateProductSearchIntelligence,
  normalizeCanonicalPhrase,
  scoreSearchPhrase,
} from '../search-intent.engine';
import { calculateSeoScore, calculateKeywordStuffing } from '../seo-score';
import { enforceTitleLimit, enforceMetaLimit } from '../seo.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING AUTOMATED SEO VALIDATION TESTS (SECTION 38)');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // Test 1 — Stitched product
  // ----------------------------------------------------
  console.log('Test 1: Stitched product');
  const stitchedResult = generateProductSearchIntelligence({
    name: 'Charcoal Grey Stitched Shalwar Kameez',
    category: 'Stitched',
    subcategory: 'Shalwar Kameez',
    color: 'Charcoal',
    brand: 'Top Threadz',
  });

  const stitchedAliases = stitchedResult.searchAliases.map((a) => a.toLowerCase());
  assert(
    stitchedAliases.some((a) => a.includes('stitched') || a.includes('ready made') || a.includes('suit')),
    'Generates stitched keywords'
  );
  assert(
    stitchedAliases.some((a) => a.includes('men') || a.includes('gents')),
    "Generates men's keywords"
  );
  assert(
    stitchedAliases.some((a) => a.includes('charcoal') || a.includes('surmai')),
    'Generates charcoal grey keywords'
  );
  assert(
    !stitchedAliases.some((a) => a.includes('unstitched')),
    'Must NOT generate "unstitched" keywords for stitched product'
  );
  assert(
    !stitchedAliases.some((a) => a.includes('kids') || a.includes('boys')),
    'Must NOT generate kids keywords for adult stitched suit'
  );

  // ----------------------------------------------------
  // Test 2 — Unstitched Wash & Wear
  // ----------------------------------------------------
  console.log('\nTest 2: Unstitched Wash & Wear product');
  const unstitchedResult = generateProductSearchIntelligence({
    name: 'Navy Blue Wash and Wear Unstitched Suit Fabric',
    category: 'Unstitched',
    subcategory: 'Wash and Wear',
    fabric: 'Wash and Wear',
    color: 'Navy Blue',
    brand: 'Top Threadz',
  });

  const unstitchedAliases = unstitchedResult.searchAliases.map((a) => a.toLowerCase());
  assert(
    unstitchedAliases.some((a) => a.includes('unstitched') || a.includes('fabric')),
    'Generates unstitched / fabric variations'
  );
  assert(
    unstitchedAliases.some((a) => a.includes('wash') && a.includes('wear')),
    'Generates wash & wear variations'
  );
  assert(
    unstitchedAliases.some((a) => a.includes('navy') || a.includes('neela')),
    'Generates navy blue and Roman Urdu aliases'
  );
  assert(
    !unstitchedAliases.some((a) => a.includes('stitched') || a.includes('ready made')),
    'Must NOT generate stitched / readymade variations'
  );
  assert(
    !unstitchedAliases.some((a) => a.includes('women') || a.includes('ladies')),
    "Must NOT generate women's clothing aliases"
  );

  // ----------------------------------------------------
  // Test 3 — Kids product
  // ----------------------------------------------------
  console.log('\nTest 3: Kids product');
  const kidsResult = generateProductSearchIntelligence({
    name: 'Boys Cotton Kurta Shalwar',
    category: 'Kids',
    subcategory: 'Boys Wear',
    color: 'White',
    brand: 'Top Threadz',
  });

  const kidsAliases = kidsResult.searchAliases.map((a) => a.toLowerCase());
  assert(
    kidsAliases.some((a) => a.includes('kids') || a.includes('boys')),
    'Generates kids / boys clothing variations'
  );
  assert(
    !kidsResult.primaryKeyword.toLowerCase().includes('men'),
    "Must NOT have men's clothing as primary intent"
  );

  // ----------------------------------------------------
  // Test 4 — Price validation
  // ----------------------------------------------------
  console.log('\nTest 4: Price validation');
  const priceScoreAllowed = scoreSearchPhrase('wash and wear price', { name: 'Men Suit', price: 5999 }, {
    isStitched: false,
    isUnstitched: true,
    isKids: false,
    isWashAndWear: true,
    activeColors: [],
    effectivePrice: 5999,
    allowedSeasons: [],
  });
  const priceScoreRejected = scoreSearchPhrase("men's suit under 3000", { name: 'Men Suit', price: 5999 }, {
    isStitched: false,
    isUnstitched: true,
    isKids: false,
    isWashAndWear: true,
    activeColors: [],
    effectivePrice: 5999,
    allowedSeasons: [],
  });

  assert(priceScoreAllowed > 0, 'Allows general price queries');
  assert(priceScoreRejected === 0, 'Strictly rejects "under 3000" when product price is PKR 5,999');

  // ----------------------------------------------------
  // Test 5 — Duplicate validation & normalization
  // ----------------------------------------------------
  console.log('\nTest 5: Duplicate normalization');
  const norm1 = normalizeCanonicalPhrase('wash & wear');
  const norm2 = normalizeCanonicalPhrase('wash and wear');
  const norm3 = normalizeCanonicalPhrase('wash wear');
  const norm4 = normalizeCanonicalPhrase('shalwar qameez');
  const norm5 = normalizeCanonicalPhrase('shalwar kameez');

  assert(norm1 === norm2, 'Treats "wash & wear" and "wash and wear" as identical canonical forms');
  assert(norm2 === norm3, 'Normalizes "wash wear" to canonical "wash and wear"');
  assert(norm4 === norm5, 'Normalizes "shalwar qameez" and "shalwar kameez" to identical canonical form');

  // ----------------------------------------------------
  // Test 6 — Title hard limit (<= 65 characters)
  // ----------------------------------------------------
  console.log('\nTest 6: Title hard limit enforcement');
  const longTitle = 'Premium Men Charcoal Grey Luxurious Wash and Wear Unstitched Suit Fabric For Winter Pakistan | Top Threadz';
  const enforcedTitle = enforceTitleLimit(longTitle, 'Charcoal Grey Wash & Wear');

  assert(enforcedTitle.length <= 65, `Enforced title length is ${enforcedTitle.length} <= 65 characters`);
  assert(enforcedTitle.includes('Top Threadz'), 'Preserves brand suffix when practical');

  // ----------------------------------------------------
  // Test 7 — Meta description hard limit (<= 170 characters)
  // ----------------------------------------------------
  console.log('\nTest 7: Meta description hard limit enforcement');
  const longMeta =
    'Shop the finest luxury charcoal grey wash and wear unstitched men fabric suit at Top Threadz Pakistan with wrinkle-free finish, vibrant long-lasting color, cash on delivery nationwide, and premier soft handfeel for all occasions.';
  const enforcedMeta = enforceMetaLimit(longMeta, '');

  assert(enforcedMeta.length <= 170, `Enforced meta length is ${enforcedMeta.length} <= 170 characters`);
  assert(enforcedMeta.length >= 80, `Enforced meta maintains minimum informative length (${enforcedMeta.length} >= 80)`);

  // ----------------------------------------------------
  // Test 8 — Keyword stuffing & density detection
  // ----------------------------------------------------
  console.log('\nTest 8: Keyword stuffing & density detection');
  const stuffedContent =
    'wash and wear suit. best wash and wear. buy wash and wear. quality wash and wear. wash and wear fabric. top wash and wear. online wash and wear. wash and wear price. cheap wash and wear. wash and wear pakistan.';
  const stuffingAnalysis = calculateKeywordStuffing(stuffedContent, 'wash and wear');

  assert(stuffingAnalysis.isStuffing === true, 'Flags artificial repetitive keyword occurrences as stuffing');
  assert(stuffingAnalysis.densityPercent > 4.5, `Calculates high keyword density (${stuffingAnalysis.densityPercent}%)`);

  const scoreWithStuffing = calculateSeoScore({
    name: 'Wash & Wear Suit',
    slug: 'wash-and-wear-suit',
    seoTitle: 'Men Wash and Wear Suit | Top Threadz',
    metaDescription: 'Shop premium wash and wear unstitched fabric suits for men at Top Threadz Pakistan. Wrinkle resistant and color fast with express delivery.',
    description: stuffedContent,
    keywords: ['wash and wear', 'mens suit'],
    h1: 'Wash & Wear Suit',
  });
  assert(
    scoreWithStuffing.criticalFailures.some((c) => c.includes('stuffing') || c.includes('density')),
    'SEO Score generates critical failure for keyword stuffing'
  );
  assert(
    scoreWithStuffing.status === 'Needs Review',
    'Keyword stuffing sets Quality Gate status to "Needs Review"'
  );

  // ----------------------------------------------------
  // Test 9 — Unsupported attribute rejection
  // ----------------------------------------------------
  console.log('\nTest 9: Unsupported attribute rejection');
  const unverifiedSummerScore = scoreSearchPhrase('best fabric for summer', { name: 'Formal Suit Fabric', brand: 'Top Threadz' }, {
    isStitched: false,
    isUnstitched: true,
    isKids: false,
    isWashAndWear: false,
    activeColors: [],
    effectivePrice: 4000,
    allowedSeasons: [], // No summer attribute confirmed in database
  });
  assert(unverifiedSummerScore === 0, 'Rejects unverified "summer" claims when database does not confirm summer');

  // ----------------------------------------------------
  // Test 10 — Combination explosion cap
  // ----------------------------------------------------
  console.log('\nTest 10: Combination explosion cap');
  const explosionInput = generateProductSearchIntelligence({
    name: 'Charcoal Grey Wash & Wear Premium Unstitched Fabric Suit For Men Festive Collection',
    category: 'Unstitched',
    subcategory: 'Wash and Wear',
    collection: 'Festive',
    fabric: 'Wash and Wear',
    color: 'Charcoal',
    colors: ['Charcoal', 'Grey', 'Black'],
    price: 4999,
    discount: 10,
    brand: 'Top Threadz',
  });

  assert(
    explosionInput.searchAliases.length <= 250,
    `Total generated aliases capped at hard maximum 250 (actual: ${explosionInput.searchAliases.length})`
  );
  for (const group of explosionInput.intentGroups) {
    assert(
      group.keywords.length <= 30,
      `Intent group "${group.label}" capped at max 30 candidates (actual: ${group.keywords.length})`
    );
  }

  console.log('\n==================================================');
  console.log('🎉 ALL 10 AUTOMATED SEO TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
