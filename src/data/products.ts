import { cache } from 'react';
import { supabase } from '../lib/supabase';

// High performance in-memory cache with 60s TTL
let productsMemoryCache: {
  data: Product[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000;

export function invalidateProductsCache() {
  productsMemoryCache = null;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  price: number;
  maxPrice?: number;
  originalPrice?: number;
  imageUrl: string;
  galleryImages?: string[];
  description?: string;
  category?: string;
  stockStatus: 'In Stock' | 'Out Of Stock';
  callToOrder?: string;
  productCode?: string;
}

export const mockProducts: Product[] = [
  { 
    id: 1, 
    slug: 'waterproof-bed-cover',
    title: 'Waterproof Bed Cover (6/7 Feet)', 
    price: 1250, 
    originalPrice: 1500, 
    imageUrl: '/images/products/waterproof_bed_cover.png',
    galleryImages: [
      '/images/products/waterproof_bed_cover.png',
    ],
    description: '<p>100% waterproof bed cover that protects your mattress from spills and stains. Breathable, quiet, and fits beds up to 7 feet.</p><ul><li>High-quality materials</li><li>Machine washable</li><li>Hypoallergenic</li></ul>',
    category: 'ওয়াটারপ্রুফ চাদর',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
  { 
    id: 2, 
    slug: 'portable-mini-turbo-fan',
    title: 'Portable Mini Turbo Fan', 
    price: 650, 
    originalPrice: 900, 
    imageUrl: '/images/products/mini_turbo_fan.png',
    galleryImages: [
      '/images/products/mini_turbo_fan.png',
    ],
    description: '<p>Stay cool anywhere with this portable mini turbo fan. Features 3 speed settings and a long-lasting rechargeable battery.</p>',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
  { 
    id: 3, 
    slug: 'plug-in-quran',
    title: 'Plug in Quran', 
    price: 450, 
    imageUrl: '/images/products/plug_in_quran.png',
    galleryImages: [
      '/images/products/plug_in_quran.png'
    ],
    description: '<p>Listen to beautiful Quran recitations simply by plugging this device into any standard outlet.</p>',
    category: 'মশারী',
    stockStatus: 'Out Of Stock',
    callToOrder: '01942-838348'
  },
  {
    id: 101,
    slug: 'diaper-5pcs',
    title: '৫ পিস রি-ইউজেবল ডায়াপার',
    price: 950,
    imageUrl: '/images/products/diaper1.png',
    category: 'ডায়াপার',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
  {
    id: 102,
    slug: 'diaper-4pcs',
    title: '৪ পিস রি-ইউজেবল ডায়াপার',
    price: 850,
    imageUrl: '/images/products/diaper2.png',
    category: 'ডায়াপার',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
  {
    id: 103,
    slug: 'diaper-3pcs',
    title: '৩ পিস রি-ইউজেবল ডায়াপার',
    price: 550,
    imageUrl: '/images/products/diaper3.png',
    category: 'ডায়াপার',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
  {
    id: 104,
    slug: 'diaper-2pcs',
    title: '২ পিস রি-ইউজেবল ডায়াপার',
    price: 450,
    imageUrl: '/images/products/diaper4.png',
    category: 'ডায়াপার',
    stockStatus: 'In Stock',
    callToOrder: '01942-838348'
  },
];

export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const extractProductCode = (description?: string, title?: string): string => {
  try {
    if (description && (description.trim().startsWith('{') || description.trim().startsWith('['))) {
      const parsed = JSON.parse(description);
      if (parsed && typeof parsed === 'object' && parsed.product_code) {
        return parsed.product_code.trim();
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback to title matching
  if (title) {
    const match = title.match(/\b(Y-\d+|W\d+|Y\d+|W-\d+|P\d+|P-\d+|D\d+|D-\d+|B\d+|B-\d+)\b/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return '';
};

export function buildProductSlug(p: { id: number; title: string; slug?: string; description?: string; category?: string }): string {
  const code = extractProductCode(p.description, p.title);
  let slug = (p.slug || '').trim();

  const isGenericSlug = !slug || 
    slug === 'waterproof-bedsheet' || 
    slug === 'waterproof-bedsheet-with-cover' || 
    slug === 'reusable-diaper' || 
    slug === 'product';

  if (isGenericSlug) {
    let base = generateSlug(p.title);
    if (!base || base === 'product') {
      if (p.category === 'ডায়াপার') base = 'reusable-diaper';
      else if (p.category === 'ওয়াটারপ্রুফ চাদর') base = 'waterproof-bedsheet';
      else base = 'product';
    }
    if (base === 'waterproof-bedsheet-with-cover') {
      base = 'waterproof-bedsheet';
    }
    const cleanCode = code ? code.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    if (cleanCode) {
      slug = `${base}-${cleanCode}`;
    } else {
      slug = `${base}-${p.id}`;
    }
  }

  return slug;
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const now = Date.now();
  if (productsMemoryCache && (now - productsMemoryCache.timestamp < CACHE_TTL_MS)) {
    return productsMemoryCache.data;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    if (productsMemoryCache) return productsMemoryCache.data;
    return mockProducts; // Fallback
  }

  const mapped = data.map(p => {
    const slug = buildProductSlug(p);
    return {
      id: p.id,
      slug: slug,
      title: p.title,
      price: p.price,
      originalPrice: p.original_price,
      imageUrl: p.image_url,
      galleryImages: p.gallery_images,
      description: p.description,
      category: p.category,
      stockStatus: p.stock_status,
      callToOrder: p.call_to_order,
      productCode: extractProductCode(p.description, p.title)
    };
  });

  productsMemoryCache = {
    data: mapped,
    timestamp: now
  };

  return mapped;
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | undefined> => {
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();

  // Instant In-Memory Lookup: If products are cached in memory, resolve in ~0ms!
  if (productsMemoryCache && (Date.now() - productsMemoryCache.timestamp < CACHE_TTL_MS)) {
    const memoryFound = productsMemoryCache.data.find(p => 
      p.slug.toLowerCase() === decodedSlug || 
      String(p.id) === decodedSlug ||
      (p.productCode && decodedSlug.endsWith(p.productCode.toLowerCase()))
    );
    if (memoryFound) return memoryFound;
  }

  // If slug is purely numeric, look up directly by ID
  if (/^\d+$/.test(decodedSlug)) {
    const product = await getProductById(parseInt(decodedSlug, 10));
    if (product) return product;
  }

  // Attempt 1: Fetch by exact slug match in Supabase
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', decodedSlug)
    .limit(1);

  if (!error && data && data.length > 0) {
    const item = data[0];
    return {
      id: item.id,
      slug: buildProductSlug(item),
      title: item.title,
      price: item.price,
      originalPrice: item.original_price,
      imageUrl: item.image_url,
      galleryImages: item.gallery_images,
      description: item.description,
      category: item.category,
      stockStatus: item.stock_status,
      callToOrder: item.call_to_order,
      productCode: extractProductCode(item.description, item.title)
    };
  }

  // Attempt 2: If slug has trailing ID (e.g. product-55 or reusable-diaper-57)
  const matchId = decodedSlug.match(/-(\d+)$/);
  if (matchId) {
    const id = parseInt(matchId[1], 10);
    const product = await getProductById(id);
    if (product) return product;
  }

  // Attempt 3: Fetch all products and match by calculated slug, or product code
  const products = await getProducts();
  let found = products.find(p => p.slug.toLowerCase() === decodedSlug.toLowerCase());
  if (found) return found;

  // Match by product code extracted from slug (e.g. waterproof-bedsheet-p32 -> p32)
  const codeMatch = decodedSlug.match(/-([a-z0-9]+)$/i);
  if (codeMatch) {
    const code = codeMatch[1].toLowerCase();
    found = products.find(p => p.productCode && p.productCode.toLowerCase().replace(/[^a-z0-9]/g, '') === code);
    if (found) return found;
  }

  console.error('Product not found for slug:', decodedSlug);
  return mockProducts.find(p => p.slug === decodedSlug);
});

export const getProductById = cache(async (id: number): Promise<Product | undefined> => {
  if (productsMemoryCache && (Date.now() - productsMemoryCache.timestamp < CACHE_TTL_MS)) {
    const cached = productsMemoryCache.data.find(p => p.id === id);
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product by id:', error);
    return mockProducts.find(p => p.id === id);
  }

  return {
    id: data.id,
    slug: buildProductSlug(data),
    title: data.title,
    price: data.price,
    originalPrice: data.original_price,
    imageUrl: data.image_url,
    galleryImages: data.gallery_images,
    description: data.description,
    category: data.category,
    stockStatus: data.stock_status,
    callToOrder: data.call_to_order,
    productCode: extractProductCode(data.description, data.title)
  };
});

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const cleanCat = category
    .replace(/\u09af\u09bc/g, '\u09df') // য + nukta -> য়
    .replace(/\u09a1\u09bc/g, '\u09dc') // ড + nukta -> ড়
    .replace(/\u09a2\u09bc/g, '\u09dd'); // ঢ + nukta -> ঢ়
  const altCat = category
    .replace(/\u09df/g, '\u09af\u09bc')
    .replace(/\u09dc/g, '\u09a1\u09bc')
    .replace(/\u09dd/g, '\u09a2\u09bc');

  const categories = Array.from(new Set([
    category,
    cleanCat,
    altCat,
    category.normalize('NFC'),
    category.normalize('NFD'),
    cleanCat.normalize('NFC'),
    cleanCat.normalize('NFD'),
    altCat.normalize('NFC'),
    altCat.normalize('NFD')
  ]));

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('category', categories)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by category:', error);
    return mockProducts.filter(p => p.category && categories.some(cat => p.category!.normalize('NFC') === cat.normalize('NFC')));
  }

  if (!data || data.length === 0) {
    return mockProducts.filter(p => p.category && categories.some(cat => p.category!.normalize('NFC') === cat.normalize('NFC')));
  }

  return data.map(p => ({
    id: p.id,
    slug: buildProductSlug(p),
    title: p.title,
    price: p.price,
    originalPrice: p.original_price,
    imageUrl: p.image_url,
    galleryImages: p.gallery_images,
    description: p.description,
    category: p.category,
    stockStatus: p.stock_status,
    callToOrder: p.call_to_order,
    productCode: extractProductCode(p.description, p.title)
  }));
}

export async function getRelatedProducts(currentId: number, limit: number = 4): Promise<Product[]> {
  try {
    const products = await getProducts();
    return products.filter(p => p.id !== currentId).slice(0, limit);
  } catch (err) {
    console.error('Error in getRelatedProducts:', err);
    return mockProducts.filter(p => p.id !== currentId).slice(0, limit);
  }
}

export const getBaseTitle = (title: string): string => {
  return title
    .replace(/\s*\(6\/7\s*Feet\)/i, '')
    .replace(/\s*\(7\/8\s*Feet\)/i, '')
    .replace(/\s*\(৬\/৭\s*ফুট\)/i, '')
    .replace(/\s*\(৭\/৮\s*ফুট\)/i, '')
    .trim();
};

export const cleanTitle = (title: string, code?: string): string => {
  let cleaned = title;
  if (code) {
    const escapedCode = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\s*\\b${escapedCode}\\b\\s*`, 'i');
    cleaned = cleaned.replace(regex, ' ');
  }
  return cleaned
    .replace(/\s*\(6\/7\s*Feet\)/i, '')
    .replace(/\s*\(7\/8\s*Feet\)/i, '')
    .replace(/\s*\(৬\/৭\s*ফুট\)/i, '')
    .replace(/\s*\(৭\/৮\s*ফুট\)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const groupProductsByBaseTitle = (products: Product[]): Product[] => {
  const seen = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const p of products) {
    const baseTitle = getBaseTitle(p.title);
    if (!seen.has(baseTitle)) {
      seen.add(baseTitle);
      
      // Find all products sharing this base title to get the lowest and highest price
      const variations = products.filter(item => getBaseTitle(item.title) === baseTitle);
      let lowestPrice = p.price;
      let highestPrice = p.price;
      let lowestOriginalPrice = p.originalPrice;
      
      if (variations.length > 1) {
        lowestPrice = Math.min(...variations.map(v => v.price));
        highestPrice = Math.max(...variations.map(v => v.price));
        // Find the variant with the lowest price to get its matching original price
        const cheapestVariant = variations.find(v => v.price === lowestPrice);
        if (cheapestVariant) {
          lowestOriginalPrice = cheapestVariant.originalPrice;
        }
      }

      uniqueProducts.push({
        ...p,
        title: baseTitle,
        price: lowestPrice,
        maxPrice: highestPrice > lowestPrice ? highestPrice : undefined,
        originalPrice: lowestOriginalPrice
      });
    }
  }

  return uniqueProducts;
};


