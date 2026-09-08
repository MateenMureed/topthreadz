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
  // Google SEO Keywords: Natural, concise, high-value keywords (6-12) for meta tags
  googleKeywords: string[];
  // Internal Search Aliases: Comprehensive human phrases, Roman Urdu, and spelling variations
  searchAliases: string[];
  // Grouped search intents for transparency in admin and intelligent search routing
  intents: Record<SearchIntentType, string[]>;
  // Categorized breakdown for admin visualization
  intentGroups: SearchIntentGroup[];
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

function normalizeText(text: string): string {
  return String(text || '').toLowerCase().trim();
}

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const cleaned = item.trim().toLowerCase();
    if (cleaned.length >= 2 && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(item.trim());
    }
  }
  return result;
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
  const intentGroups: SearchIntentGroup[] = rawIntentGroups.filter((g) => g.keywords.length > 0);

  // All combined internal search aliases
  const allAliases = uniq([
    ...intents.PRODUCT,
    ...intents.FABRIC,
    ...intents.STYLE,
    ...intents.COLOR,
    ...intents.ROMAN_URDU,
    ...intents.CATEGORY,
    ...intents.OCCASION,
    ...intents.BUYING,
  ]);

  // Curate 8-12 top-tier, high-value, non-stuffed Google SEO keywords
  const googleCandidates: string[] = [];
  // 1. Primary product name variant
  if (activeColors[0]) {
    const primaryColor = activeColors[0];
    if (isWashAndWear) googleCandidates.push(`${primaryColor} wash and wear suit`);
    if (isUnstitched) googleCandidates.push(`${primaryColor} unstitched fabric men`);
    if (isStitched) googleCandidates.push(`${primaryColor} stitched suit men`);
    googleCandidates.push(`${primaryColor} shalwar kameez`);
  }
  if (isWashAndWear) googleCandidates.push("men's wash and wear fabric", 'wash and wear shalwar kameez');
  if (isUnstitched) googleCandidates.push("men's unstitched fabric pakistan", 'unstitched suit for men');
  if (isStitched) googleCandidates.push("men's stitched shalwar kameez", 'ready to wear suit for men');
  if (isTwoPiece) googleCandidates.push("men's two piece suit pakistan");
  if (isThreePiece) googleCandidates.push("men's three piece suit pakistan");
  if (isKids) googleCandidates.push("boys traditional wear pakistan", 'kids shalwar kameez');
  googleCandidates.push("pakistani men's clothing", 'buy mens clothes online pakistan');

  const googleKeywords = uniq(googleCandidates).slice(0, 12);

  return {
    googleKeywords,
    searchAliases: allAliases,
    intents,
    intentGroups,
  };
}
