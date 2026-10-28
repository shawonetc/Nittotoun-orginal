import React, { Suspense } from 'react';
import { getProductBySlug, getRelatedProducts } from '../../../data/products';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductDetailsClient from './ProductDetailsClient';
import ProductGrid from '../../../components/ProductGrid';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.title,
    description: product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) || `Buy ${product.title} online at best price in Bangladesh.`,
    openGraph: {
      title: product.title,
      description: `Shop for ${product.title} at Nittonotonbd. Genuine quality and fast delivery.`,
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
  };
}

async function RelatedSection({ productId }: { productId: number }) {
  const relatedProducts = await getRelatedProducts(productId, 4);
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginBottom: '40px' }}>
      <ProductGrid title="Related Products" products={relatedProducts} />
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productSlug = resolvedParams.id;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <ProductDetailsClient key={product.id} product={product} />
      <Suspense fallback={<div style={{ minHeight: '120px' }} />}>
        <RelatedSection productId={product.id} />
      </Suspense>
      <Footer />
    </>
  );
}
