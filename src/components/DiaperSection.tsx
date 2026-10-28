"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import styles from './DiaperSection.module.css';

interface DiaperItem {
  id: string | number;
  slug?: string;
  title: string;
  price: number;
  imageUrl: string;
}

interface DiaperSectionProps {
  products: DiaperItem[];
}

export default function DiaperSection({ products }: DiaperSectionProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleOrderNow = (diaper: DiaperItem) => {
    addToCart({
      id: diaper.id,
      title: diaper.title,
      price: diaper.price,
      imageUrl: diaper.imageUrl
    });
    router.push('/checkout');
  };

  if (!products || products.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.title}>রি-ইউজেবল ডায়াপার</h2>
          <div className={styles.titleUnderline}></div>
        </div>

        <div className={styles.grid}>
          {products.map((diaper) => (
            <div key={diaper.id} className={styles.card}>
              <Link 
                href={`/product/${diaper.slug || diaper.id}`} 
                className={styles.cardLink}
                prefetch={true}
                onMouseEnter={() => router.prefetch(`/product/${diaper.slug || diaper.id}`)}
              >
                <div className={styles.imageWrapper}>
                  <Image
                    src={diaper.imageUrl}
                    alt={diaper.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className={styles.image}
                    priority
                  />
                </div>
                <div className={styles.details}>
                  <h3 className={styles.productTitle}>{diaper.title}</h3>
                  <span className={styles.price}>৳ {diaper.price}</span>
                </div>
              </Link>
              <button
                className={styles.orderBtn}
                onClick={() => handleOrderNow(diaper)}
              >
                অর্ডার করুন <span className={styles.arrow}>➔</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
