import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { invalidateProductsCache } from '../../../data/products';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  const slug = request.nextUrl.searchParams.get('slug');

  try {
    // Clear in-memory cache
    invalidateProductsCache();

    // Revalidate home page cache
    revalidatePath('/');
    
    // Revalidate all products list page cache
    revalidatePath('/products');
    
    // Revalidate category pages pattern
    revalidatePath('/category/[slug]', 'page');

    // If a specific path or slug is provided, revalidate it as well
    if (path) {
      revalidatePath(path);
    }
    if (slug) {
      revalidatePath(`/product/${slug}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { 
        revalidated: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
