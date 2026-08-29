import prisma from '../../utils/prisma';
import { NotFoundError } from '../../utils/errors';
import { CreateProductInput, UpdateProductInput } from './product.schema';
import { Prisma } from '@prisma/client';
import { deleteFromCloudinary } from '../../config/cloudinary';

export class ProductService {
  private normalizeUnstitchedMensProduct(data: CreateProductInput | UpdateProductInput): Record<string, unknown> {
    const sizes = Array.isArray(data.sizes) && data.sizes.length > 0 
      ? data.sizes 
      : ['S', 'M', 'L', 'XL', 'XXL', '4.5m', '7 meter'];

    return {
      ...data,
      category: data.category || 'Unstitched',
      gender: data.gender || 'MALE',
      sizes,
      comparePrice: null,
      salePrice: null,
      variants: Prisma.JsonNull,
      weight: null,
      dimensions: null,
      shippingClass: null,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: [],
      relatedProducts: [],
      upsellProducts: [],
      crossSellProducts: [],
      visibility: 'PUBLIC',
    };
  }

  async create(data: CreateProductInput) {
    const baseSlug = data.slug || this.generateSlug(data.name);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const productData = this.normalizeUnstitchedMensProduct(data);

    return prisma.product.create({
      data: {
        ...productData,
        slug,
      } as Prisma.ProductUncheckedCreateInput,
    });
  }

  async findAll(query: any) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '16');
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.category && !query.subcategory && !query.collection) {
      where.category = query.category === 'Unstitched Fabric'
        ? { in: ['Unstitched Fabric', 'Unstitched'], mode: 'insensitive' }
        : { equals: query.category, mode: 'insensitive' };
    }
    if (query.subcategory && query.collection) {
      where.subcategory = { equals: query.subcategory, mode: 'insensitive' };
      where.collection = { equals: query.collection, mode: 'insensitive' };
    } else if (query.subcategory) {
      where.OR = [
        { subcategory: { equals: query.subcategory, mode: 'insensitive' } },
        { collection: { equals: query.subcategory, mode: 'insensitive' } },
        { category: { equals: query.subcategory, mode: 'insensitive' } },
      ];
    } else if (query.collection) {
      where.OR = [
        { collection: { equals: query.collection, mode: 'insensitive' } },
        { subcategory: { equals: query.collection, mode: 'insensitive' } },
        { category: { equals: query.collection, mode: 'insensitive' } },
      ];
    }
    if (query.brand) {
      where.brand = { equals: query.brand, mode: 'insensitive' };
    }
    if (query.gender) {
      where.gender = query.gender;
    }
    if (query.productStatus) {
      where.productStatus = query.productStatus;
    }
    if (query.visibility) {
      where.visibility = query.visibility;
    }
    if (query.stockStatus) {
      where.stockStatus = query.stockStatus;
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }
    if (query.minDiscount) {
      where.discount = { gte: parseFloat(query.minDiscount) };
    }
    if (query.size) {
      where.sizes = { has: query.size };
    }
    if (query.color) {
      where.colors = { has: query.color };
    }
    const searchText = String(query.search || '').trim();
    if (searchText) {
      where.OR = [
        { name: { contains: searchText, mode: 'insensitive' } },
        { description: { contains: searchText, mode: 'insensitive' } },
        { tags: { has: searchText } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
      { featured: 'desc' },
      { trending: 'desc' },
      { createdAt: 'desc' },
    ];
    const isPriceSort = query.sortBy === 'price_asc' || query.sortBy === 'price_desc';
    switch (query.sortBy) {
      case 'recommended':
        orderBy = [
          { featured: 'desc' },
          { trending: 'desc' },
          { discount: 'desc' },
          { createdAt: 'desc' },
        ];
        break;
      case 'price_asc':
      case 'price_desc':
        // Will sort in-memory by discounted price below
        orderBy = { price: query.sortBy === 'price_asc' ? 'asc' : 'desc' };
        break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
    }

    let [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy }),
      prisma.product.count({ where }),
    ]);

    // Sort by effective discounted price when price sorting is requested
    if (isPriceSort && products.length > 1) {
      const getEffectivePrice = (p: { price: number; discount: number }) =>
        p.price * (1 - (p.discount || 0) / 100);
      products.sort((a, b) => {
        const diff = getEffectivePrice(a) - getEffectivePrice(b);
        return query.sortBy === 'price_asc' ? diff : -diff;
      });
    }

    let typoFixedQuery: string | null = null;
    if (searchText && products.length === 0) {
      const similar = await this.findTypoTolerant(searchText, limit);
      if (similar.length > 0) {
        products = similar;
        total = similar.length;
        typoFixedQuery = searchText;
      }
    }

    if (searchText) {
      await prisma.searchQuery.create({
        data: {
          userId: query.userId || null,
          query: searchText,
          resultCount: total,
          hasTypoFix: Boolean(typoFixedQuery),
        },
      });
    }

    return {
      products,
      searchMeta: {
        query: searchText || null,
        typoFixed: Boolean(typoFixedQuery),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(idOrSlug: string) {
    // Preserve legacy UUID links while allowing the public /products/:slug
    // contract used by product cards and direct API consumers.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    const product = await prisma.product.findFirst({
      where: isUuid ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug },
      include: { reviews: { include: { user: { select: { name: true } } }, take: 10 } },
    });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { reviews: { include: { user: { select: { name: true } } }, take: 10 } },
    });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async update(id: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const updateData: UpdateProductInput & { slug?: string } = this.normalizeUnstitchedMensProduct(data);

    if (data.slug) {
      updateData.slug = await this.ensureUniqueSlug(data.slug, id);
    } else if (data.name) {
      updateData.slug = await this.ensureUniqueSlug(this.generateSlug(data.name), id);
    }

    const updated = await prisma.product.update({ where: { id }, data: updateData as Prisma.ProductUncheckedUpdateInput });
    if (data.images) await this.removeDeletedCloudinaryImages(product.imageMeta, data.images);
    return updated;
  }

  async delete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');
    await prisma.product.delete({ where: { id } });
    await this.removeDeletedCloudinaryImages(product.imageMeta, []);
    return { message: 'Product deleted' };
  }

  async recordView(userId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { slug: productId },
        ],
      },
      select: { id: true },
    });

    if (!product) return;

    await prisma.productView.create({
      data: { userId, productId: product.id },
    });
  }

  async getCategories() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return products.map((p: { category: string }) => p.category);
  }

  async searchSuggestions(query: string) {
    if (!query || query.length < 2) return [];
    let products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      select: { id: true, name: true, slug: true, images: true, price: true },
      take: 5,
    });

    if (products.length === 0) {
      const fallback = await this.findTypoTolerant(query, 5);
      products = fallback.map((p) => ({ id: p.id, name: p.name, slug: p.slug, images: p.images, price: p.price }));
    }

    return products;
  }

  async getPopularSearches(limit = 10) {
    const top = await prisma.searchQuery.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return top.map((row: any) => ({
      query: row.query,
      count: row._count.query,
    }));
  }

  async aiSearch(rawQuery: string, page = 1, limit = 12) {
    const query = String(rawQuery || '').trim();
    if (!query) {
      return {
        products: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        searchMeta: { query: null, typoFixed: false },
        aiMeta: { interpreted: {}, normalizedQuery: '' },
      };
    }

    const interpreted = this.interpretNaturalLanguageQuery(query);
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (interpreted.category) where.category = interpreted.category;
    if (interpreted.minPrice !== undefined || interpreted.maxPrice !== undefined) {
      where.price = {};
      if (interpreted.minPrice !== undefined) where.price.gte = interpreted.minPrice;
      if (interpreted.maxPrice !== undefined) where.price.lte = interpreted.maxPrice;
    }
    if (interpreted.minDiscount !== undefined) {
      where.discount = { gte: interpreted.minDiscount };
    }
    if (interpreted.color) {
      where.colors = { has: interpreted.color };
    }
    if (interpreted.size) {
      where.sizes = { has: interpreted.size };
    }

    const normalizedQuery = interpreted.searchText;
    if (normalizedQuery) {
      where.OR = [
        { name: { contains: normalizedQuery, mode: 'insensitive' } },
        { description: { contains: normalizedQuery, mode: 'insensitive' } },
        { tags: { has: normalizedQuery } },
      ];
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      searchMeta: {
        query,
        typoFixed: false,
      },
      aiMeta: {
        interpreted,
        normalizedQuery,
      },
    };
  }

  async getUpsellSuggestions(productIdentifier: string, limit = 4) {
    // Public product URLs use slugs, while internal callers use UUIDs.
    // Resolve either form before selecting related products.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productIdentifier);
    const product = isUuid
      ? await prisma.product.findFirst({ where: { OR: [{ id: productIdentifier }, { slug: productIdentifier }] } })
      : await prisma.product.findUnique({ where: { slug: productIdentifier } });
    if (!product) throw new NotFoundError('Product not found');
    const productId = product.id;

    const selected: any[] = [];

    if (product.upsellProducts.length > 0) {
      const explicit = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { in: product.upsellProducts, not: productId },
        },
        take: limit,
      });
      selected.push(...explicit);
    }

    if (selected.length < limit) {
      const fallback = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: [productId, ...selected.map((p) => p.id)] },
          category: product.category,
          OR: [
            { price: { gt: product.price } },
            { featured: true },
            { trending: true },
          ],
        },
        orderBy: [{ featured: 'desc' }, { trending: 'desc' }, { price: 'asc' }],
        take: limit - selected.length,
      });
      selected.push(...fallback);
    }

    return selected.slice(0, limit);
  }

  private async findTypoTolerant(query: string, limit: number) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const candidates = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        discount: true,
        category: true,
        sizes: true,
        createdAt: true,
      },
      take: 250,
      orderBy: { createdAt: 'desc' },
    });

    const scored = candidates
      .map((p) => ({
        product: p,
        score: this.levenshteinDistance(q, p.name.toLowerCase()),
      }))
      .filter((entry) => entry.score <= Math.max(2, Math.floor(q.length / 3)))
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((entry) => entry.product as any);

    return scored;
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) {
        return slug;
      }
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  private async removeDeletedCloudinaryImages(imageMeta: Prisma.JsonValue | null, retainedUrls: string[]) {
    if (!Array.isArray(imageMeta)) return;
    const retained = new Set(retainedUrls);
    const removed = imageMeta
      .filter((item): item is { url?: string; publicId?: string } => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
      .filter((item) => item.publicId && !retained.has(item.url || ''));
    await Promise.all(removed.map((item) => deleteFromCloudinary(item.publicId!)));
  }

  private interpretNaturalLanguageQuery(query: string) {
    const lower = query.toLowerCase();

    const categoryKeywords: Array<{ category: string; keywords: string[] }> = [
      { category: 'Unstitched', keywords: ['unstitched', 'lawn suit', '3 piece', '2 piece'] },
      { category: 'Pret', keywords: ['pret', 'ready to wear', 'kurta', 'shirt'] },
      { category: 'Bottoms', keywords: ['bottom', 'trouser', 'jeans', 'culottes', 'shalwar'] },
      { category: 'Outerwear', keywords: ['outerwear', 'jacket', 'waistcoat', 'coat', 'sweater'] },
      { category: 'Accessories', keywords: ['accessories', 'dupatta', 'scarf', 'bag', 'footwear'] },
    ];

    let category: string | undefined;
    for (const group of categoryKeywords) {
      if (group.keywords.some((kw) => lower.includes(kw))) {
        category = group.category;
        break;
      }
    }

    const underMatch = lower.match(/(?:under|below|less than)\s*(\d{3,7})/i);
    const overMatch = lower.match(/(?:over|above|more than)\s*(\d{3,7})/i);
    const betweenMatch = lower.match(/between\s*(\d{3,7})\s*(?:and|to)\s*(\d{3,7})/i);
    const discountMatch = lower.match(/(\d{1,2})\s*%\s*(?:off|discount)?/i);

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (betweenMatch) {
      minPrice = Number(betweenMatch[1]);
      maxPrice = Number(betweenMatch[2]);
    } else {
      if (underMatch) maxPrice = Number(underMatch[1]);
      if (overMatch) minPrice = Number(overMatch[1]);
    }

    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
    const colors = ['black', 'white', 'navy', 'blue', 'grey', 'gray', 'green', 'brown', 'beige', 'maroon'];
    const size = sizes.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(lower));
    const color = colors.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(lower));

    const normalized = lower
      .replace(/(?:under|below|less than|over|above|more than|between|and|to)\s*\d{1,7}/g, ' ')
      .replace(/\d{1,2}\s*%\s*(?:off|discount)?/g, ' ')
      .replace(/\b(show|find|get|me|for|a|an|the|with|in|on|of|pkr|rs)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      category,
      minPrice,
      maxPrice,
      minDiscount: discountMatch ? Number(discountMatch[1]) : undefined,
      size: size?.toUpperCase(),
      color: color ? color.charAt(0).toUpperCase() + color.slice(1) : undefined,
      searchText: normalized,
    };
  }
}

export const productService = new ProductService();
