/**
 * Centralized Human Search Intent Engine for Top Threadz
 *
 * Generates natural human-search variations, English synonyms, spelling variants,
 * Roman Urdu equivalents, and categorized search intents based strictly on the actual
 * product or category attributes (never fabricating absent details).
 */

export interface ProductAttributes {
  name: string;
  category?: string;
  subcategory?: string;
  collection?: string;
  productType?: string;
  fabric?: string;
  material?: string;
  color?: string;
  colors?: string[];
  price?: number;
  salePrice?: number;
  discount?: number;
  brand?: string;
  tags?: string[];
  sizes?: string[];
  careInstructions?: string;
  description?: string;
}

export type SearchIntentType =
  | 'CATEGORY'
  | 'PRODUCT'
  | 'FABRIC'
  | 'COLOR'
  | 'STYLE'
  | 'OCCASION'
  | 'BUYING'
  | 'PRICE'
  | 'LOCATION'
  | 'SEASON'
  | 'USE_CASE'
  | 'ROMAN_URDU';

export interface SearchIntentGroup {
  intent: SearchIntentType;
  label: string;
  keywords: string[];
}

export interface GeneratedSearchVocabulary {
  // Page-level keyword hierarchy (Section 34)
  primaryKeyword: string;
  secondaryKeywords: string[];
  supportingKeywords: string[];

  // Google SEO Keywords: Natural, concise, high-value keywords (6-12) for meta tags
  googleKeywords: string[];
  // Internal Search Aliases: Comprehensive human phrases, Roman Urdu, and spelling variations (max 250)
  searchAliases: string[];
  // Grouped search intents for transparency in admin and intelligent search routing
  intents: Record<SearchIntentType, string[]>;
  // Categorized breakdown for admin visualization
  intentGroups: SearchIntentGroup[];

  // Stats & breakdown for Admin Validation Report (Section 39)
  stats: {
    totalAliases: number;
    romanUrduCount: number;
    spellingVariantsCount: number;
    primaryTopic: string;
    secondaryCount: number;
    supportingCount: number;
  };
}

// Color translation & synonym dictionary for Pakistan fashion context
const COLOR_SYNONYMS: Record<string, { synonyms: string[]; romanUrdu: string[] }> = {
  black: { synonyms: ['jet black', 'dark'], romanUrdu: ['kala', 'kaala', 'kala kapra', 'kala suit'] },
  white: { synonyms: ['pure white', 'snow white'], romanUrdu: ['safed', 'chitta', 'safed kapra', 'safed suit'] },
  'off white': { synonyms: ['cream', 'ivory', 'off-white', 'light cream'], romanUrdu: ['halka safed', 'cream kapra', 'safed kapra'] },
  navy: { synonyms: ['navy blue', 'dark blue', 'midnight blue'], romanUrdu: ['neela', 'gehra neela', 'neela suit', 'neela kapra'] },
  'navy blue': { synonyms: ['navy', 'dark blue', 'midnight blue'], romanUrdu: ['neela', 'gehra neela', 'neela suit', 'neela kapra'] },
  blue: { synonyms: ['royal blue', 'sky blue'], romanUrdu: ['neela', 'neela suit', 'neela kapra'] },
  'royal blue': { synonyms: ['bright blue', 'cobalt'], romanUrdu: ['neela suit', 'chamkeela neela'] },
  'sky blue': { synonyms: ['light blue', 'powder blue'], romanUrdu: ['halka neela', 'aasmaani'] },
  grey: { synonyms: ['gray', 'charcoal grey', 'ash grey', 'silver grey'], romanUrdu: ['surmai', 'slaty', 'surmai kapra'] },
  charcoal: { synonyms: ['charcoal grey', 'dark grey', 'anthracite'], romanUrdu: ['gehra surmai', 'charcoal suit', 'slaty'] },
  brown: { synonyms: ['coffee', 'chocolate brown', 'tan'], romanUrdu: ['bhura', 'bhoora', 'brown kapra'] },
  beige: { synonyms: ['khaki', 'fawn', 'sand', 'camel'], romanUrdu: ['badami', 'khaki kapra', 'gandumee'] },
  olive: { synonyms: ['olive green', 'army green', 'moss'], romanUrdu: ['mehndi rang', 'sabz'] },
  maroon: { synonyms: ['burgundy', 'wine', 'dark red'], romanUrdu: ['surkh', 'maroon kapra', 'lal suit'] },
  'bottle green': { synonyms: ['emerald', 'dark green'], romanUrdu: ['gehra sabz', 'bottle green suit'] },
  cream: { synonyms: ['ivory', 'buttercream', 'vanilla'], romanUrdu: ['cream kapra', 'makhan'] },
};

export function normalizeText(text: string): string {
  return String(text || '').toLowerCase().trim();
}

/**
 * Normalizes phrases before comparing or storing to prevent duplicate alias explosion (Section 33)
 */
export function normalizeCanonicalPhrase(phrase: string): string {
  return String(phrase || '')
    .toLowerCase()
    .replace(/['’]/g, '')             // men's -> mens
    .replace(/&/g, 'and')             // & -> and
    .replace(/[-_]/g, ' ')            // 2-piece -> 2 piece, wash-n-wear -> wash n wear
    .replace(/shalwar\s+qameez/g, 'shalwar kameez') // spelling variant normalization
    .replace(/wash\s+n\s+wear/g, 'wash and wear')
    .replace(/wash\s+wear/g, 'wash and wear')
    .replace(/washwear/g, 'wash and wear')
    .replace(/readymade/g, 'ready made')
    .replace(/ready\s+to\s+wear/g, 'ready made')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const norm = normalizeCanonicalPhrase(item);
    if (norm.length >= 2 && !seen.has(norm)) {
      seen.add(norm);
      result.push(item.trim());
    }
  }
  return result;
}

/**
 * Evaluates phrase quality from 0-100 and applies anti-stuffing & attribute truth checks (Section 30)
 */
export function scoreSearchPhrase(
  phrase: string,
  product: ProductAttributes,
  context: {
    isStitched: boolean;
    isUnstitched: boolean;
    isKids: boolean;
    isWashAndWear: boolean;
    activeColors: string[];
    effectivePrice: number;
    allowedSeasons: string[];
  }
): number {
  const norm = normalizeCanonicalPhrase(phrase);
  const words = norm.split(' ');

  // Immediate rejection for severe attribute contradictions (Section 31)
  if (context.isStitched && (norm.includes('unstitched') || norm.includes('kapra'))) {
    return 0;
  }
  if (context.isUnstitched && (norm.includes('stitched') || norm.includes('ready made'))) {
    return 0;
  }
  if (!context.isKids && (norm.includes('kids') || norm.includes('boys') || norm.includes('children'))) {
    return 0;
  }
  if (context.isKids && (norm.includes('mens') || norm.includes('gents') || norm.includes('male'))) {
    return 0;
  }

  // Price contradiction check (Section 32)
  if (context.effectivePrice > 0) {
    if (norm.includes('under 3000') && context.effectivePrice > 3000) return 0;
    if (norm.includes('under 4000') && context.effectivePrice > 4000) return 0;
    if (norm.includes('under 5000') && context.effectivePrice > 5000) return 0;
    if (norm.includes('under 6000') && context.effectivePrice > 6000) return 0;
  }

  // Season validation (Section 32)
  if (norm.includes('summer') || norm.includes('garmi')) {
    const hasSummer = context.allowedSeasons.some((s) => s.toLowerCase().includes('summer') || s.toLowerCase().includes('garmi'));
    if (!hasSummer) return 0;
  }
  if (norm.includes('winter') || norm.includes('sardi')) {
    const hasWinter = context.allowedSeasons.some((s) => s.toLowerCase().includes('winter') || s.toLowerCase().includes('sardi'));
    if (!hasWinter) return 0;
  }

  // Combination explosion protection: reject phrases that string too many words (Section 29)
  if (words.length > 5) {
    return 0;
  }

  let score = 40; // baseline

  // Exact relevance points (+25)
  const pName = normalizeText(product.name);
  if (pName.includes(norm) || norm.includes(pName)) score += 25;
  else if (words.some((w) => pName.includes(w) && w.length > 3)) score += 15;

  // Exact attribute relevance (+20)
  if (context.isWashAndWear && norm.includes('wash and wear')) score += 20;
  if (context.isUnstitched && (norm.includes('unstitched') || norm.includes('fabric'))) score += 15;
  if (context.isStitched && (norm.includes('stitched') || norm.includes('suit'))) score += 15;

  // Color relevance
  if (context.activeColors.length > 0) {
    const hasActiveColor = context.activeColors.some((c) => norm.includes(c.toLowerCase()));
    if (hasActiveColor) score += 15;
    else {
      // Check if phrase mentions an unrelated color
      const mentionsUnrelatedColor = Object.keys(COLOR_SYNONYMS).some(
        (c) => norm.includes(c) && !context.activeColors.some((ac) => ac.toLowerCase() === c)
      );
      if (mentionsUnrelatedColor) return 0; // Contradictory color rejected
    }
  }

  // Commercial intent (+10)
  if (/suit|fabric|clothes|clothing|kameez|kurta|price|buy|online/i.test(norm)) score += 10;

  // Pakistan relevance (+10)
  if (/pakistan|pakistani|shalwar|kameez|kapra/i.test(norm)) score += 10;

  // Natural language length bonus (2-4 words is ideal customer search)
  if (words.length >= 2 && words.length <= 4) score += 10;

  // Penalize single overly generic words (-20)
  if (words.length === 1) score -= 20;

  return Math.min(100, Math.max(0, score));
}

/**
 * Builds comprehensive human search intelligence for a product
 */
export function generateProductSearchIntelligence(product: ProductAttributes): GeneratedSearchVocabulary {
  const name = normalizeText(product.name);
  const category = normalizeText(product.category || '');
  const subcategory = normalizeText(product.subcategory || '');
  const fabric = normalizeText(product.fabric || product.material || '');
  const collection = normalizeText(product.collection || '');
  const desc = normalizeText(product.description || '');

  // Attribute detectors (strictly truth-bound)
  const isUnstitched =
    /unstitched/i.test(category) ||
    /unstitched/i.test(subcategory) ||
    /unstitched/i.test(name) ||
    /fabric|suit length|kapra/i.test(fabric);

  const isStitched =
    /stitched|ready to wear|readymade|ready-made/i.test(category) ||
    /stitched|ready to wear|readymade|ready-made/i.test(subcategory) ||
    /stitched|ready made/i.test(name);

  const isTwoPiece =
    /two piece|2 piece|2-piece/i.test(category) ||
    /two piece|2 piece|2-piece/i.test(subcategory) ||
    /two piece|2 piece|2-piece/i.test(name);

  const isThreePiece =
    /three piece|3 piece|3-piece/i.test(category) ||
    /three piece|3 piece|3-piece/i.test(subcategory) ||
    /three piece|3 piece|3-piece/i.test(name);

  const isKids =
    /kid|child|boy/i.test(category) ||
    /kid|child|boy/i.test(subcategory) ||
    /kid|child|boy/i.test(name);

  const isWashAndWear =
    /wash (and|&|n) wear|wash wear|washwear|wash-and-wear/i.test(name) ||
    /wash (and|&|n) wear|wash wear|washwear|wash-and-wear/i.test(fabric) ||
    /wash (and|&|n) wear|wash wear|washwear|wash-and-wear/i.test(desc) ||
    /wash (and|&|n) wear/i.test(subcategory);

  const isKurta = /kurta/i.test(name) || /kurta/i.test(subcategory);
  const isShalwarKameez = /shalwar kameez|shalwar qameez|suit/i.test(name) || /shalwar kameez|suit/i.test(subcategory) || !isKurta;

  // Actual colors
  const activeColors: string[] = [];
  if (product.colors && product.colors.length) {
    activeColors.push(...product.colors);
  } else if (product.color) {
    activeColors.push(product.color);
  }
  // Also check if common color names appear in the product title
  for (const c of Object.keys(COLOR_SYNONYMS)) {
    if (name.includes(c) && !activeColors.some((ac) => ac.toLowerCase() === c)) {
      activeColors.push(c);
    }
  }

  // Actual price
  const effectivePrice = product.salePrice && product.salePrice > 0
    ? product.salePrice
    : product.price && product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price || 0;

  // ── 1. CATEGORY INTENT ──
  const categoryKeywords: string[] = [];
  if (isKids) {
    categoryKeywords.push(
      'kids clothes',
      'kids clothing',
      'kids wear',
      "children's clothing",
      'children clothes',
      'boys clothes',
      'boys clothing',
      'boys wear',
      'boys suit',
      'boys suits',
      'boys shalwar kameez',
      'kids shalwar kameez',
      'kids traditional wear',
      'boys traditional wear',
      'kids Pakistani clothes',
      'Pakistani clothes for boys'
    );
    if (isKurta) {
      categoryKeywords.push('kids kurta', 'boys kurta', 'boys kurta pajama');
    }
  } else {
    // Men's clothing category terms
    categoryKeywords.push(
      "men's clothes",
      'mens clothes',
      'men clothes',
      'men clothing',
      "men's clothing",
      'menswear',
      "men's wear",
      'mens wear',
      'gents clothes',
      'gents clothing',
      'gents wear',
      "men's fashion",
      "men's dress",
      "men's outfits",
      "men's suits",
      'men suit',
      'male clothing',
      'male wear',
      'clothes for men',
      'clothing for men',
      'dress for men',
      "men's apparel",
      "men's traditional wear",
      "men's ethnic wear",
      "Pakistani men's clothing",
      "Pakistani men's wear",
      'Pakistani clothes for men',
      'Pakistani menswear'
    );
  }

  // ── 2. PRODUCT & STYLE INTENT ──
  const productKeywords: string[] = [];
  const styleKeywords: string[] = [];

  if (isStitched && !isKids) {
    productKeywords.push(
      'stitched clothes',
      'stitched clothing',
      'stitched suit',
      'stitched suits',
      "stitched men's suit",
      "stitched men's clothes",
      "stitched men's clothing",
      "men's stitched clothes",
      "men's stitched suit",
      'ready made suit',
      'ready-made suit',
      'ready to wear',
      'ready-to-wear',
      'ready made clothes',
      "ready made men's clothes",
      "men's ready made clothes",
      "men's ready to wear",
      'stitched shalwar kameez',
      'stitched shalwar qameez',
      "men's stitched shalwar kameez",
      "men's stitched wear"
    );
    if (isKurta) {
      productKeywords.push('stitched kurta', 'stitched kurta pajama', 'stitched kurta shalwar');
    }
  }

  if (isUnstitched && !isKids) {
    productKeywords.push(
      'unstitched clothes',
      'unstitched clothing',
      'unstitched fabric',
      'unstitched fabrics',
      'unstitched suit',
      'unstitched suits',
      "unstitched men's fabric",
      "men's unstitched fabric",
      'men unstitched fabric',
      'unstitched cloth',
      'unstitched cloth for men',
      "men's cloth",
      "men's fabric",
      'mens fabric',
      'men fabric',
      'gents fabric',
      'gents cloth',
      'suit fabric',
      "men's suit fabric",
      'shalwar kameez fabric',
      'fabric for men',
      'cloth for men',
      'dress material for men',
      "men's dress material"
    );
    if (isKurta) {
      productKeywords.push('kurta fabric');
    }
  }

  if (isTwoPiece) {
    styleKeywords.push(
      'two piece',
      '2 piece',
      '2-piece',
      'two piece suit',
      '2 piece suit',
      'two-piece suit',
      "men's two piece",
      "men's two piece suit",
      'mens two piece suit',
      "two piece men's clothing",
      'two piece shalwar kameez',
      "men's two piece clothing",
      'two piece dress for men'
    );
  }

  if (isThreePiece) {
    styleKeywords.push(
      'three piece',
      '3 piece',
      '3-piece',
      'three piece suit',
      '3 piece suit',
      'three-piece suit',
      "men's three piece",
      "men's three piece suit",
      'mens three piece suit',
      "three piece men's clothing",
      'three piece shalwar kameez',
      "men's three piece clothing"
    );
  }

  if (isShalwarKameez && !isKids) {
    styleKeywords.push(
      'shalwar kameez',
      'shalwar qameez',
      'shalwar kameez for men',
      "men's shalwar kameez",
      'mens shalwar kameez',
      'shalwar kameez men',
      'men shalwar kameez',
      'shalwar kameez suit',
      'shalwar qameez suit',
      'Pakistani shalwar kameez',
      "Pakistani men's shalwar kameez",
      "traditional men's clothing",
      'traditional wear for men',
      'Pakistani traditional wear'
    );
  }

  if (isKurta) {
    styleKeywords.push(
      'kurta',
      'kurta pajama',
      'kurta shalwar',
      "men's kurta",
      'men kurta',
      "men's kurta pajama",
      "men's kurta shalwar"
    );
  }

  // ── 3. FABRIC INTENT ──
  const fabricKeywords: string[] = [];
  if (isWashAndWear) {
    fabricKeywords.push(
      'wash and wear',
      'wash & wear',
      'wash wear',
      'washwear',
      'wash n wear',
      'wash-n-wear',
      'wash and wear fabric',
      'wash wear fabric',
      'wash & wear fabric',
      'washwear fabric',
      'wash and wear cloth',
      'wash wear cloth',
      'wash and wear suit',
      'wash wear suit',
      "men's wash and wear",
      'mens wash and wear',
      'men wash wear',
      'wash and wear for men',
      'wash wear for men',
      'wash and wear shalwar kameez',
      'wash wear shalwar kameez',
      'wash & wear shalwar kameez',
      'wash and wear suit fabric'
    );
  }

  // General fabric terms based on actual attributes
  if (isUnstitched || fabric) {
    fabricKeywords.push(
      "men's fabric",
      'men fabric',
      'fabric for men',
      'suit fabric',
      'suiting fabric',
      'premium fabric',
      "premium men's fabric",
      'quality fabric',
      'soft fabric',
      'comfortable fabric',
      'breathable fabric'
    );
    if (/summer/i.test(collection) || /summer/i.test(name) || /cotton|lawn|light/i.test(fabric)) {
      fabricKeywords.push('summer fabric', 'lightweight fabric');
    }
    if (/winter/i.test(collection) || /winter/i.test(name) || /warm|wool|khaddar|boski/i.test(fabric)) {
      fabricKeywords.push('winter fabric', 'warm fabric');
    }
  }

  // ── 4. COLOR INTENT ──
  const colorKeywords: string[] = [];
  const colorRomanUrdu: string[] = [];

  for (const rawColor of activeColors) {
    const c = rawColor.toLowerCase().trim();
    if (!c) continue;

    const baseSuit = isKids ? 'boys suit' : 'suit';
    const baseFabric = isUnstitched ? 'fabric' : 'clothes';

    colorKeywords.push(
      `${c} suit`,
      `${c} men's suit`,
      `${c} shalwar kameez`,
      `${c} men's clothing`,
      `${c} fabric`,
      `${c} men's fabric`
    );
    if (isWashAndWear) {
      colorKeywords.push(`${c} wash and wear`, `${c} wash wear`);
    }
    if (isUnstitched) {
      colorKeywords.push(`${c} unstitched fabric`, `${c} unstitched suit`);
    }

    // Look up color synonyms and Roman Urdu
    const colorInfo = COLOR_SYNONYMS[c];
    if (colorInfo) {
      for (const syn of colorInfo.synonyms) {
        colorKeywords.push(`${syn} ${baseSuit}`, `${syn} ${baseFabric}`);
      }
      for (const ru of colorInfo.romanUrdu) {
        colorRomanUrdu.push(ru, `${ru} suit`, `${ru} kapra`);
      }
    }
  }

  // ── 5. OCCASION INTENT ──
  const occasionKeywords: string[] = [];
  const nameAndDesc = `${name} ${desc} ${collection}`.toLowerCase();

  // Eid
  if (/eid|festive|celebration/i.test(nameAndDesc)) {
    occasionKeywords.push(
      'Eid clothes for men',
      "men's Eid clothes",
      'Eid men\'s wear',
      'Eid shalwar kameez',
      'Eid suit for men',
      'Eid collection men',
      'Eid outfits for men'
    );
  }

  // Wedding
  if (/wedding|groom|shaadi|baraat|walima|mehndi/i.test(nameAndDesc)) {
    occasionKeywords.push(
      "men's wedding clothes",
      'wedding clothes for men',
      "men's wedding wear",
      'wedding wear men',
      "men's wedding suit",
      'wedding shalwar kameez',
      'groom clothes',
      'groom wear',
      'baraat clothes',
      'mehndi clothes for men',
      'walima clothes for men'
    );
  }

  // Formal
  if (/formal|office|executive|classic/i.test(nameAndDesc) || isWashAndWear || isTwoPiece) {
    occasionKeywords.push(
      "men's formal wear",
      'formal clothes for men',
      "formal men's clothing",
      'formal suit for men',
      'formal shalwar kameez',
      'office wear men',
      "men's office clothes"
    );
  }

  // Casual
  if (/casual|daily|everyday/i.test(nameAndDesc)) {
    occasionKeywords.push(
      "men's casual wear",
      'casual clothes for men',
      "casual men's clothing",
      'casual shalwar kameez',
      'daily wear men',
      'everyday clothes for men'
    );
  }

  // ── 6. BUYING INTENT ──
  const buyingKeywords: string[] = [
    "buy men's clothes",
    "buy men's clothing",
    "buy men's clothes online",
    "men's clothes online",
    "men's clothing online",
    "buy men's suit online",
    'buy shalwar kameez online',
    "men's clothes online Pakistan",
    "men's wear online Pakistan",
    "order men's clothes online",
    "shop men's clothing",
    "shop men's wear"
  ];
  if (isUnstitched) {
    buyingKeywords.push(
      "buy men's fabric",
      'buy fabric online',
      'buy unstitched fabric',
      'buy unstitched fabric online',
      "men's fabric online Pakistan",
      'unstitched fabric online Pakistan',
      "order men's fabric online",
      "shop men's fabric"
    );
  }
  if (isWashAndWear) {
    buyingKeywords.push(
      'buy wash and wear',
      'buy wash and wear fabric',
      'wash and wear online Pakistan'
    );
  }

  // ── 7. PRICE INTENT (Strictly bound to actual price) ──
  const priceKeywords: string[] = [];
  if (effectivePrice > 0) {
    priceKeywords.push("men's suit price", 'shalwar kameez price');
    if (isUnstitched) {
      priceKeywords.push("men's fabric price", 'unstitched fabric price');
    }
    if (isWashAndWear) {
      priceKeywords.push('wash and wear price', 'wash and wear fabric price');
    }
    if (isTwoPiece) {
      priceKeywords.push('two piece suit price');
    }
    if (isThreePiece) {
      priceKeywords.push('three piece suit price');
    }

    // Never fabricate or contradict price brackets:
    if (effectivePrice <= 3000) {
      priceKeywords.push("men's suit under 3000", "men's fabric under 3000");
    } else if (effectivePrice <= 4000) {
      priceKeywords.push("men's suit under 4000", "men's fabric under 4000");
    } else if (effectivePrice <= 5000) {
      priceKeywords.push("men's suit under 5000", "men's fabric under 5000");
    } else if (effectivePrice <= 6000) {
      priceKeywords.push("men's suit under 6000", "men's fabric under 6000");
    } else if (effectivePrice <= 8000) {
      priceKeywords.push("men's suit under 8000");
    }
  }

  // ── 8. LOCATION INTENT (Pakistan) ──
  const locationKeywords: string[] = [
    'Pakistan',
    'in Pakistan',
    'online Pakistan',
    'Pakistan online',
    'Pakistani',
    "men's clothing Pakistan",
    "men's clothes Pakistan",
    "men's wear Pakistan",
    "men's suits Pakistan",
    'shalwar kameez Pakistan',
    "Pakistani men's clothing",
    "Pakistani men's wear"
  ];
  if (isUnstitched) {
    locationKeywords.push(
      "men's fabric Pakistan",
      'unstitched fabric Pakistan',
      "Pakistani men's fabric"
    );
  }
  if (isWashAndWear) {
    locationKeywords.push('wash and wear Pakistan');
  }

  // ── 9. ROMAN URDU INTENT ──
  const romanUrduKeywords: string[] = [
    'mardon ka kapra',
    'mardon ke kapray',
    'mardon ke kapre',
    'mardon ka libas',
    'gents kapra',
    'gents ke kapray',
    'gents ka suit',
    'mardon ka suit',
    'mardon ke suit',
    'shalwar kameez ka kapra',
    'shalwar qameez ka kapra',
    'kapra online',
    'kapray online',
    'mardon ke kapray online',
    'mardon ka kapra online',
    ...colorRomanUrdu
  ];
  if (isUnstitched) {
    romanUrduKeywords.push(
      'unstitched kapra',
      'unstitched kapray',
      'unstitched kapda',
      'mardon ka unstitched kapra',
      'gents ka unstitched kapra',
      'kurta ka kapra'
    );
  }
  if (isWashAndWear) {
    romanUrduKeywords.push(
      'wash wear kapra',
      'wash and wear kapra',
      'wash n wear kapra',
      'wash wear suit'
    );
  }

  // ── 10. SEASON & USE CASE INTENT ──
  const seasonKeywords: string[] = [];
  const useCaseKeywords: string[] = [];

  if (/summer/i.test(collection) || /summer/i.test(name)) {
    seasonKeywords.push('summer collection', "summer clothes for men", "summer men's wear", 'garmiyon ke kapray');
  }
  if (/winter/i.test(collection) || /winter/i.test(name)) {
    seasonKeywords.push('winter collection', "winter clothes for men", "winter men's wear", 'sardiyon ke kapray');
  }
  if (/all season/i.test(collection) || !seasonKeywords.length) {
    seasonKeywords.push('all season fabric', 'four season suit', 'all weather clothing');
  }

  useCaseKeywords.push('Jummah prayer clothes', 'office clothing men', 'everyday traditional wear');

  // Consolidate intent dictionary
  const intents: Record<SearchIntentType, string[]> = {
    CATEGORY: uniq(categoryKeywords),
    PRODUCT: uniq(productKeywords),
    FABRIC: uniq(fabricKeywords),
    COLOR: uniq(colorKeywords),
    STYLE: uniq(styleKeywords),
    OCCASION: uniq(occasionKeywords),
    BUYING: uniq(buyingKeywords),
    PRICE: uniq(priceKeywords),
    LOCATION: uniq(locationKeywords),
    SEASON: uniq(seasonKeywords),
    USE_CASE: uniq(useCaseKeywords),
    ROMAN_URDU: uniq(romanUrduKeywords),
  };

  const rawIntentGroups: Array<{ intent: SearchIntentType; label: string; keywords: string[] }> = [
    { intent: 'CATEGORY', label: 'Category & Demographics', keywords: intents.CATEGORY },
    { intent: 'PRODUCT', label: 'Product & Stitching Type', keywords: intents.PRODUCT },
    { intent: 'FABRIC', label: 'Fabric & Material', keywords: intents.FABRIC },
    { intent: 'COLOR', label: 'Color Variations', keywords: intents.COLOR },
    { intent: 'STYLE', label: 'Style & Silhouette', keywords: intents.STYLE },
    { intent: 'OCCASION', label: 'Occasions & Events', keywords: intents.OCCASION },
    { intent: 'BUYING', label: 'Buying & Commercial Intent', keywords: intents.BUYING },
    { intent: 'PRICE', label: 'Price & Value Intent', keywords: intents.PRICE },
    { intent: 'LOCATION', label: 'Pakistan Regional Intent', keywords: intents.LOCATION },
    { intent: 'SEASON', label: 'Seasonality', keywords: intents.SEASON },
    { intent: 'ROMAN_URDU', label: 'Roman Urdu & Conversational', keywords: intents.ROMAN_URDU },
    { intent: 'USE_CASE', label: 'Use Case & Lifestyle', keywords: intents.USE_CASE },
  ];
  const scoringContext = {
    isStitched,
    isUnstitched,
    isKids,
    isWashAndWear,
    activeColors,
    effectivePrice,
    allowedSeasons: seasonKeywords,
  };

  // Score and filter each intent group (cap each group to max 30 candidates)
  const scoredIntentMap: Record<SearchIntentType, string[]> = {} as any;
  for (const [intentKey, list] of Object.entries(intents)) {
    const scoredList = (list as string[])
      .map((phrase) => ({
        phrase,
        score: scoreSearchPhrase(phrase, product, scoringContext),
      }))
      .filter((item) => item.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30) // Section 28: hard maximum 30 per intent group
      .map((item) => item.phrase);

    scoredIntentMap[intentKey as SearchIntentType] = scoredList;
  }

  const intentGroups: SearchIntentGroup[] = rawIntentGroups
    .map((g) => ({
      intent: g.intent,
      label: g.label,
      keywords: scoredIntentMap[g.intent] || [],
    }))
    .filter((g) => g.keywords.length > 0);

  // All combined internal search aliases (strictly scored >= 50, capped at max 250 aliases - Section 28)
  const combinedRaw = uniq([
    ...scoredIntentMap.PRODUCT,
    ...scoredIntentMap.FABRIC,
    ...scoredIntentMap.STYLE,
    ...scoredIntentMap.COLOR,
    ...scoredIntentMap.ROMAN_URDU,
    ...scoredIntentMap.CATEGORY,
    ...scoredIntentMap.OCCASION,
    ...scoredIntentMap.BUYING,
    ...scoredIntentMap.PRICE,
    ...scoredIntentMap.LOCATION,
  ]);

  const allAliasesScored = combinedRaw
    .map((phrase) => ({
      phrase,
      score: scoreSearchPhrase(phrase, product, scoringContext),
    }))
    .filter((item) => item.score >= 50)
    .sort((a, b) => b.score - a.score);

  // Cap at hard maximum 250 aliases (Section 28 & 29)
  const finalAliases = allAliasesScored.slice(0, 250).map((item) => item.phrase);

  // ── PAGE-LEVEL KEYWORD HIERARCHY (Section 34) ──
  // 1 Primary Keyword (score >= 75)
  // 3-8 Secondary Keywords (score >= 70)
  // 5-20 Supporting Semantic Phrases (score >= 60)
  const highConfidenceCandidates = allAliasesScored.filter((item) => item.score >= 75);
  const primaryKeyword =
    highConfidenceCandidates[0]?.phrase ||
    (isKids
      ? 'kids shalwar kameez'
      : isWashAndWear
      ? "men's wash and wear fabric"
      : isUnstitched
      ? "men's unstitched fabric"
      : isStitched
      ? "men's stitched suit"
      : "men's clothing");

  const secondaryKeywords = allAliasesScored
    .filter((item) => item.score >= 65 && item.phrase !== primaryKeyword)
    .slice(0, 7)
    .map((item) => item.phrase);

  const supportingKeywords = allAliasesScored
    .filter(
      (item) =>
        item.score >= 55 &&
        item.phrase !== primaryKeyword &&
        !secondaryKeywords.includes(item.phrase)
    )
    .slice(0, 15)
    .map((item) => item.phrase);

  // Google SEO Keywords: Natural, concise (6-12), high-value keywords without keyword-stuffing
  const googleKeywords = uniq([
    primaryKeyword,
    ...secondaryKeywords.slice(0, 5),
    ...supportingKeywords.slice(0, 4),
  ]).slice(0, 10);

  const romanUrduCount = scoredIntentMap.ROMAN_URDU?.length || 0;
  const spellingVariantsCount = finalAliases.filter((a) =>
    /shalwar|qameez|wash wear|washwear|2 piece|3 piece/i.test(a)
  ).length;

  return {
    primaryKeyword,
    secondaryKeywords,
    supportingKeywords,
    googleKeywords,
    searchAliases: finalAliases,
    intents: scoredIntentMap,
    intentGroups,
    stats: {
      totalAliases: finalAliases.length,
      romanUrduCount,
      spellingVariantsCount,
      primaryTopic: primaryKeyword,
      secondaryCount: secondaryKeywords.length,
      supportingCount: supportingKeywords.length,
    },
  };
}
