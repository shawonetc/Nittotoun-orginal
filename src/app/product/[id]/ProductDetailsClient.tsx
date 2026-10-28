"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import styles from './product.module.css';
import { Product, cleanTitle } from '../../../data/products';
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { fbqEvent } from '../../../lib/metaPixel';

export default function ProductDetailsClient({ product }: { product: Product }) {
  // Parse dynamic sizes and product code from description JSON
  let parsedDescription = product.description;
  let dynamicSizes: any = null;
  let productCode = '';

  try {
    if (product.description && (product.description.trim().startsWith('{') || product.description.trim().startsWith('['))) {
      const parsed = JSON.parse(product.description);
      if (parsed && typeof parsed === 'object') {
        parsedDescription = parsed.htmlDescription || '';
        dynamicSizes = parsed.sizes || null;
        productCode = parsed.product_code || '';
      }
    }
  } catch (e) {
    console.error('Failed to parse serialized product description JSON:', e);
  }

  const isBedCover = !!dynamicSizes || 
                     product.title.toLowerCase().includes('waterproof') || 
                     product.title.toLowerCase().includes('bed cover') || 
                     product.title.includes('চাদর') || 
                     product.category === 'ওয়াটারপ্রুফ চাদর' || 
                     product.category === 'নরমাল চাদর' || 
                     product.id === 4 || 
                     product.id === 5;

  const [selectedProduct, setSelectedProduct] = useState<any>(product);
  const [activeImage, setActiveImage] = useState(product.imageUrl);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'policy'>('description');
  const { addToCart } = useCart();
  const router = useRouter();

  // Dynamic Size Options loaded from database or JSON
  const [sizeOptions, setSizeOptions] = useState<any[]>([]);

  // Function to extract base title by removing size suffixes
  const getBaseTitle = (title: string) => {
    return title
      .replace(/\s*\(6\/7\s*Feet\)/i, '')
      .replace(/\s*\(7\/8\s*Feet\)/i, '')
      .replace(/\s*\(৬\/৭\s*ফুট\)/i, '')
      .replace(/\s*\(৭\/৮\s*ফুট\)/i, '')
      .trim();
  };

  React.useEffect(() => {
    setSelectedProduct(product);
    setActiveImage(product.imageUrl);

    // 1. If we have dynamic sizes in description JSON
    if (dynamicSizes) {
      const options: any[] = [];
      if (dynamicSizes["6x7"] && dynamicSizes["6x7"].enabled) {
        const disc = dynamicSizes["6x7"].originalPrice 
          ? Math.round(((dynamicSizes["6x7"].originalPrice - dynamicSizes["6x7"].price) / dynamicSizes["6x7"].originalPrice) * 100)
          : 0;
        options.push({
          id: `${product.id}-6x7`,
          sizeKey: "6x7",
          title: `${getBaseTitle(product.title)} (6/7 Feet)`,
          price: dynamicSizes["6x7"].price,
          originalPrice: dynamicSizes["6x7"].originalPrice,
          discount: disc,
          sizeName: 'সাইজ, ৬ফুট x ৭ ফুট',
          imageUrl: dynamicSizes["6x7"].image || product.imageUrl,
          stockStatus: product.stockStatus,
          isBestSeller: false,
          galleryImages: dynamicSizes["6x7"].image ? [dynamicSizes["6x7"].image, ...(product.galleryImages || [])] : (product.galleryImages || [product.imageUrl])
        });
      }
      if (dynamicSizes["7x8"] && dynamicSizes["7x8"].enabled) {
        const disc = dynamicSizes["7x8"].originalPrice 
          ? Math.round(((dynamicSizes["7x8"].originalPrice - dynamicSizes["7x8"].price) / dynamicSizes["7x8"].originalPrice) * 100)
          : 0;
        options.push({
          id: `${product.id}-7x8`,
          sizeKey: "7x8",
          title: `${getBaseTitle(product.title)} (7/8 Feet)`,
          price: dynamicSizes["7x8"].price,
          originalPrice: dynamicSizes["7x8"].originalPrice,
          discount: disc,
          sizeName: 'সাইজ, ৭ফুট x ৮ ফুট',
          imageUrl: dynamicSizes["7x8"].image || product.imageUrl,
          stockStatus: product.stockStatus,
          isBestSeller: true,
          galleryImages: dynamicSizes["7x8"].image ? [dynamicSizes["7x8"].image, ...(product.galleryImages || [])] : (product.galleryImages || [product.imageUrl])
        });
      }

      setSizeOptions(options);
      if (options.length > 0) {
        setSelectedProduct(options[0]);
        setActiveImage(options[0].imageUrl);
      }
      return;
    }

    // 2. Fallback for older separate DB row variations (only if they have explicit size suffixes)
    const fetchSizes = async () => {
      try {
        const { getProducts } = await import('../../../data/products');
        const allProducts = await getProducts();
        
        const currentBase = getBaseTitle(product.title);
        
        // Only group if there are variations that explicitly mention size suffixes
        const matching = allProducts.filter(p => 
          getBaseTitle(p.title) === currentBase && 
          (p.title.toLowerCase().includes('6/7') || p.title.toLowerCase().includes('7/8') || p.title.includes('৬/৭') || p.title.includes('৭/৮'))
        );
        
        if (matching.length > 1) {
          const options = matching.map(p => {
            const is6x7 = p.title.toLowerCase().includes('6/7') || p.title.includes('৬/৭');
            const sizeName = is6x7 ? 'সাইজ, ৬ফুট x ৭ ফুট' : 'সাইজ, ৭ফুট x ৮ ফুট';
            const disc = p.originalPrice 
               ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
               : 0;
               
            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              price: p.price,
              originalPrice: p.originalPrice,
              discount: disc,
              sizeName,
              imageUrl: p.imageUrl,
              stockStatus: p.stockStatus,
              isBestSeller: !is6x7,
              galleryImages: p.galleryImages || [p.imageUrl]
            };
          });

          // Sort so 6/7 Feet comes first
          options.sort((a, b) => {
            const aIs6x7 = a.title.toLowerCase().includes('6/7') || a.title.includes('৬/৭');
            const bIs6x7 = b.title.toLowerCase().includes('6/7') || b.title.includes('৬/৭');
            if (aIs6x7 && !bIs6x7) return -1;
            if (!aIs6x7 && bIs6x7) return 1;
            return 0;
          });

          setSizeOptions(options);
          
          // Select current product
          const current = options.find(o => String(o.id) === String(product.id));
          if (current) {
            setSelectedProduct(current);
            setActiveImage(current.imageUrl);
          }
        } else {
          setSizeOptions([]);
          setSelectedProduct(product);
          setActiveImage(product.imageUrl);
        }
      } catch (err) {
        console.error('Error fetching size variants:', err);
      }
    };

    if (isBedCover) {
      fetchSizes();
    } else {
      setSizeOptions([]);
    }
  }, [product, isBedCover]);

  // Track ViewContent event when selected product/variation changes
  React.useEffect(() => {
    if (selectedProduct) {
      fbqEvent('ViewContent', {
        content_name: selectedProduct.title,
        content_ids: [String(selectedProduct.id)],
        content_type: 'product',
        value: selectedProduct.price,
        currency: 'BDT'
      });
    }
  }, [selectedProduct]);

  const discount = selectedProduct.originalPrice 
    ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100) 
    : 0;

  const images = selectedProduct.galleryImages || [selectedProduct.imageUrl];

  const handleSizeSelect = (opt: any) => {
    setSelectedProduct(opt);
    setActiveImage(opt.imageUrl);
  };

  const handleAddToCart = () => {
    addToCart({ id: selectedProduct.id, title: selectedProduct.title, price: selectedProduct.price, imageUrl: selectedProduct.imageUrl }, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  return (
    <div className={styles.container}>
      <div className={styles.productSection}>
        {/* Left: Image Gallery */}
        <div className={styles.imageGallery}>
          <div className={styles.mainImage}>
            {activeImage && (
              <Image 
                src={activeImage} 
                alt={selectedProduct.title} 
                width={450}
                height={450}
                priority 
                className={styles.mainProductImage}
              />
            )}
          </div>
          <div className={styles.thumbnailContainer}>
            {images.map((img: string, idx: number) => (
              <div 
                key={idx}
                className={`${styles.thumbnail} ${activeImage === img ? styles.activeThumbnail : ''}`}
                onClick={() => setActiveImage(img)}
              >
                <Image 
                  src={img} 
                  alt={`${selectedProduct.title} thumbnail ${idx + 1}`} 
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className={styles.productInfo}>
          <h1 className={styles.title}>{cleanTitle(product.title, productCode)} {productCode ? `(${productCode})` : ''}</h1>
          
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>৳{selectedProduct.price}</span>
            {selectedProduct.originalPrice && (
              <>
                <span className={styles.originalPrice}>৳{selectedProduct.originalPrice}</span>
                <span className={styles.discountBadge}>-{discount}%</span>
              </>
            )}
          </div>

          <div className={styles.statusBlock}>
            Stock: <span className={`${styles.stockStatus} ${selectedProduct.stockStatus === 'Out Of Stock' ? styles.outOfStock : ''}`}>
              {selectedProduct.stockStatus}
            </span>
          </div>

          {productCode && (
            <div className={styles.statusBlock} style={{ marginTop: '4px' }}>
              Product Code: <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{productCode}</span>
            </div>
          )}

          {selectedProduct.callToOrder && (
            <div className={styles.callToOrder}>
              Call to order: <span>{selectedProduct.callToOrder}</span>
            </div>
          )}

          {/* Size Selection Section */}
          {isBedCover && sizeOptions.length > 0 && (
            <div className={styles.sizeSelectionBlock}>
              <h3 className={styles.sizeSelectHeading}>প্রোডাক্ট এর সাইজ নির্বাচন করুন</h3>
              <div className={styles.sizeOptionsGrid}>
                {sizeOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.sizeOptionCard} ${selectedProduct.id === opt.id ? styles.activeSizeCard : ''}`}
                    onClick={() => handleSizeSelect(opt)}
                  >
                    <div className={styles.sizeRadioWrapper}>
                      <span className={styles.sizeRadioCircle}>
                        {selectedProduct.id === opt.id && <span className={styles.sizeRadioInnerCircle}></span>}
                      </span>
                      <div className={styles.sizeCardDetails}>
                        <div className={styles.sizeLabel}>{opt.sizeName}</div>
                        <div className={styles.sizePriceRow}>
                          <span className={styles.sizeMrp}>MRP: {opt.originalPrice}৳</span>
                          <span className={styles.sizeDiscountBadge}>{opt.discount}% ছাড়</span>
                        </div>
                        <div className={styles.sizeFinalPrice}>{opt.price}৳</div>
                      </div>
                    </div>
                    {opt.isBestSeller && (
                      <span className={styles.bestSellerBadge}>বেস্ট সেলার</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionBlock}>
            <div className={styles.qtyWrapper}>
              <span className={styles.qtyLabel}>Quantity:</span>
              <div className={styles.qtyControls}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div className={styles.buttons}>
              <button 
                className={styles.buyNowBtn} 
                onClick={handleBuyNow}
                disabled={selectedProduct.stockStatus === 'Out Of Stock'}
                style={{ opacity: selectedProduct.stockStatus === 'Out Of Stock' ? 0.5 : 1, cursor: selectedProduct.stockStatus === 'Out Of Stock' ? 'not-allowed' : 'pointer' }}
              >
                অর্ডার করুন
              </button>
              <button 
                className={styles.addToCartBtn} 
                onClick={handleAddToCart}
                disabled={selectedProduct.stockStatus === 'Out Of Stock'}
                style={{ opacity: selectedProduct.stockStatus === 'Out Of Stock' ? 0.5 : 1, cursor: selectedProduct.stockStatus === 'Out Of Stock' ? 'not-allowed' : 'pointer' }}
                title="Add to Cart"
              >
                <HugeiconsIcon icon={ShoppingCart01Icon} size={24} color="white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className={styles.tabsSection}>
        <div className={styles.tabHeaders}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'description' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'policy' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('policy')}
          >
            Return Policy
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'description' ? (
            <div dangerouslySetInnerHTML={{ __html: parsedDescription || 'No description available for this product.' }} />
          ) : (
            <div>
              <h3>Delivery Policy</h3>
              <p>Delivery time is 2-4 working days inside Dhaka, and 3-5 working days outside Dhaka.</p>
              <h3>Return Policy</h3>
              <p>You can return the product within 7 days if it is damaged or doesn't match the description. Please keep the original packaging intact.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
