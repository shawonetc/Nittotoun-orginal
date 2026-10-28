"use client";

import React from 'react';
import styles from './ProductCard.module.css';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { cleanTitle } from '../data/products';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: number;
  slug: string;
  title: string;
  price: number;
  maxPrice?: number;
  originalPrice?: number;
  imageUrl?: string;
  productCode?: string;
  description?: string;
}

export default function ProductCard({ id, slug, title, price, maxPrice, originalPrice, imageUrl, productCode, description }: ProductCardProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  let minPrice = price;
  let maxPriceVal = maxPrice ?? price;

  if (description) {
    try {
      if (typeof description === 'string' && (description.trim().startsWith('{') || description.trim().startsWith('['))) {
        const parsed = JSON.parse(description);
        if (parsed && parsed.sizes) {
          const activePrices: number[] = [];
          Object.values(parsed.sizes).forEach((s: any) => {
            if (s && s.enabled && typeof s.price === 'number') {
              activePrices.push(s.price);
            }
          });
          if (activePrices.length > 0) {
            minPrice = Math.min(...activePrices);
            maxPriceVal = Math.max(...activePrices);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const discount = originalPrice && originalPrice > minPrice ? Math.round(((originalPrice - minPrice) / originalPrice) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, title, price: minPrice, imageUrl });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, title, price: minPrice, imageUrl });
    router.push('/checkout');
  };

  const formattedPrice = maxPriceVal > minPrice
    ? `৳ ${minPrice.toLocaleString('en-US')} – ৳ ${maxPriceVal.toLocaleString('en-US')}`
    : `৳ ${minPrice.toLocaleString('en-US')}`;

  const cleanedTitle = cleanTitle(title, productCode);

  return (
    <div className={styles.card}>
      <Link 
        href={`/product/${slug || id}`} 
        className={styles.cardLink}
        prefetch={true}
        onMouseEnter={() => router.prefetch(`/product/${slug || id}`)}
      >
        <div className={styles.imageContainer}>
          {discount > 0 && <span className={styles.badge}>-{discount}%</span>}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className={styles.image}
              priority={id <= 4}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              No Image
            </div>
          )}
        </div>
        <div className={styles.details}>
          <h3 className={styles.title}>{cleanedTitle}</h3>
          <div className={styles.priceContainer}>
            <span className={styles.price}>{formattedPrice}</span>
          </div>
        </div>
      </Link>
      <div className={styles.buttonContainer}>
        <button className={styles.buyNowBtn} onClick={handleBuyNow}>
          অর্ডার করুন
        </button>
        <button className={styles.addToCartBtn} onClick={handleAddToCart} title="Add to Cart">
          <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="white" />
        </button>
      </div>
    </div>
  );
}

