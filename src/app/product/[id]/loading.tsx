import React from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import styles from './loading.module.css';

export default function ProductLoading() {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.productSection}>
          {/* Image Gallery Skeleton */}
          <div className={styles.imageGallery}>
            <div className={`${styles.mainImageSkeleton} ${styles.shimmer}`} />
            <div className={styles.thumbnailRow}>
              <div className={`${styles.thumbSkeleton} ${styles.shimmer}`} />
              <div className={`${styles.thumbSkeleton} ${styles.shimmer}`} />
              <div className={`${styles.thumbSkeleton} ${styles.shimmer}`} />
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className={styles.productInfo}>
            <div className={`${styles.titleSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.priceSkeleton} ${styles.shimmer}`} />
            <div className={`${styles.statusSkeleton} ${styles.shimmer}`} />
            
            <div className={styles.sizesBox}>
              <div className={`${styles.sizeBtnSkeleton} ${styles.shimmer}`} />
              <div className={`${styles.sizeBtnSkeleton} ${styles.shimmer}`} />
            </div>

            <div className={styles.actionBtns}>
              <div className={`${styles.btnSkeleton} ${styles.shimmer}`} />
              <div className={`${styles.btnSkeleton} ${styles.shimmer}`} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
