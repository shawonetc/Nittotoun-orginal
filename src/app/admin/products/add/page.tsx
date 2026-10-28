'use client';

import React from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ArrowLeft01Icon, 
  CloudUploadIcon,
  Cancel01Icon,
  Tick02Icon,
  ImageAdd01Icon
} from '@hugeicons/core-free-icons';
import styles from '../../Admin.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import Image from 'next/image';


const AddProductPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    price: '',
    original_price: '',
    image_url: '',
    gallery_images: ['', '', '', ''],
    category: '',
    stock_status: 'In Stock',
    call_to_order: '01887245556',
    product_code: ''
  });
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);

  // Size variations state
  const [enableSizes, setEnableSizes] = React.useState(false);
  const [size6x7, setSize6x7] = React.useState({ enabled: true, price: '', originalPrice: '' });
  const [size7x8, setSize7x8] = React.useState({ enabled: true, price: '', originalPrice: '' });
  const [size6x7Image, setSize6x7Image] = React.useState('');
  const [size7x8Image, setSize7x8Image] = React.useState('');
  const [uploadingSize6x7, setUploadingSize6x7] = React.useState(false);
  const [uploadingSize7x8, setUploadingSize7x8] = React.useState(false);

  const handleSizeImageUpload = async (file: File, size: '6x7' | '7x8') => {
    const setUploading = size === '6x7' ? setUploadingSize6x7 : setUploadingSize7x8;
    const setImage = size === '6x7' ? setSize6x7Image : setSize7x8Image;
    
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImage(publicUrl);
    } catch (error) {
      console.error('Error uploading size image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload size image: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File, index: number) => {
    try {
      setUploadingIndex(index);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const newGallery = [...formData.gallery_images];
      newGallery[index] = publicUrl;
      
      setFormData({ 
        ...formData, 
        gallery_images: newGallery,
        // If it's the first slot or image_url is empty, set it
        image_url: index === 0 ? publicUrl : (formData.image_url || publicUrl)
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    const hasGlobalImage = formData.image_url || formData.gallery_images.some(img => img !== '');
    const hasSizeImage = size6x7Image || size7x8Image;
    const hasImage = hasGlobalImage || (enableSizes && hasSizeImage);

    if (!formData.title || (!enableSizes && !formData.price) || !hasImage || !formData.category) {
      alert('Please fill in required fields (Title, Price/Sizes, at least one image, Category)');
      return;
    }

    setLoading(true);
    try {
      const activeGallery = formData.gallery_images.filter(img => img !== '');
      const image_url = formData.image_url || activeGallery[0];
      const active_category = formData.category;
      let baseSlug = generateSlug(formData.title);
      if (!baseSlug) {
        if (formData.category === 'ডায়াপার') baseSlug = 'reusable-diaper';
        else if (formData.category === 'ওয়াটারপ্রুফ চাদর') baseSlug = 'waterproof-bedsheet';
        else baseSlug = 'product';
      }
      const cleanCode = formData.product_code ? formData.product_code.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const slug = cleanCode ? `${baseSlug}-${cleanCode}` : `${baseSlug}-${Date.now().toString().slice(-4)}`;

      if (enableSizes) {
        // Validate size inputs
        if (size6x7.enabled && !size6x7.price) {
          alert('Please enter Sale Price for size ৬ফুট x ৭ ফুট.');
          setLoading(false);
          return;
        }
        if (size7x8.enabled && !size7x8.price) {
          alert('Please enter Sale Price for size ৭ফুট x ৮ ফুট.');
          setLoading(false);
          return;
        }
        if (!size6x7.enabled && !size7x8.enabled) {
          alert('Please enable and configure at least one size.');
          setLoading(false);
          return;
        }

        // Build serialized JSON description
        const sizesData = {
          "6x7": size6x7.enabled ? {
            enabled: true,
            price: parseFloat(size6x7.price),
            originalPrice: size6x7.originalPrice ? parseFloat(size6x7.originalPrice) : null,
            image: size6x7Image || null
          } : null,
          "7x8": size7x8.enabled ? {
            enabled: true,
            price: parseFloat(size7x8.price),
            originalPrice: size7x8.originalPrice ? parseFloat(size7x8.originalPrice) : null,
            image: size7x8Image || null
          } : null
        };

        const serializedDescription = JSON.stringify({
          htmlDescription: formData.description,
          sizes: sizesData,
          product_code: formData.product_code || ''
        });

        // Determine default representative price & original price
        const defaultPrice = size6x7.enabled 
          ? parseFloat(size6x7.price) 
          : parseFloat(size7x8.price);
          
        const defaultOriginalPrice = size6x7.enabled 
          ? (size6x7.originalPrice ? parseFloat(size6x7.originalPrice) : null)
          : (size7x8.originalPrice ? parseFloat(size7x8.originalPrice) : null);

        const defaultImage = size6x7.enabled 
          ? (size6x7Image || image_url) 
          : (size7x8Image || image_url);

        const { error } = await supabase
          .from('products')
          .insert({
            title: formData.title,
            slug: slug,
            description: serializedDescription,
            price: defaultPrice,
            original_price: defaultOriginalPrice,
            image_url: defaultImage,
            gallery_images: activeGallery,
            category: active_category,
            stock_status: formData.stock_status,
            call_to_order: formData.call_to_order
          });

        if (error) throw error;
      } else {
        const serializedDescription = JSON.stringify({
          htmlDescription: formData.description,
          sizes: null,
          product_code: formData.product_code || ''
        });
        const { error } = await supabase
          .from('products')
          .insert({
            title: formData.title,
            slug: slug,
            description: serializedDescription,
            price: parseFloat(formData.price),
            original_price: formData.original_price ? parseFloat(formData.original_price) : null,
            image_url: image_url,
            gallery_images: activeGallery,
            category: active_category,
            stock_status: formData.stock_status,
            call_to_order: formData.call_to_order
          });
          
        if (error) throw error;
      }

      // Trigger cache revalidation
      try {
        await fetch(`/api/revalidate?slug=${slug}`);
      } catch (revalErr) {
        console.error('Failed to trigger revalidation:', revalErr);
      }

      alert('Product saved successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div>
          <button 
            onClick={handleBack} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            Back to Products
          </button>
          <h1 className={styles.pageTitle}>Add New Product</h1>
          <p className={styles.pageSubtitle}>Create a new product listing for your store.</p>
        </div>
        <div className={`${styles.headerActions} ${styles.hideOnMobile}`}>
          <button className={styles.secondaryBtn} onClick={handleBack}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
            <span>Cancel</span>
          </button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={loading || uploadingIndex !== null}>
            <HugeiconsIcon icon={Tick02Icon} size={18} />
            <span>{loading ? 'Saving...' : uploadingIndex !== null ? 'Uploading...' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formLeft}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>General Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Title *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Premium Wireless Headphones" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Code (যেমন: Y-61)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Y-61" 
                  value={formData.product_code || ''}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea 
                className={styles.textarea} 
                placeholder="Describe your product in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>Pricing & Stock</h2>
            
            {!enableSizes && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sale Price (৳) *</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Regular Price (৳)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="0.00" 
                    value={formData.original_price || ''}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Size selection and pricing */}
            <div style={{ marginTop: '10px', marginBottom: '20px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: enableSizes ? '16px' : '0' }}>
                <input 
                  type="checkbox" 
                  id="enableSizes" 
                  checked={enableSizes} 
                  onChange={(e) => setEnableSizes(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <label htmlFor="enableSizes" style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  প্রোডাক্ট এর সাইজ নির্বাচন করুন (Enable Size Variations)
                </label>
              </div>

              {enableSizes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Size 6x7 */}
                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        id="size6x7_enabled"
                        checked={size6x7.enabled}
                        onChange={(e) => setSize6x7({ ...size6x7, enabled: e.target.checked })}
                        style={{ accentColor: 'var(--primary-color)' }}
                      />
                      <label htmlFor="size6x7_enabled" style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                        সাইজ: ৬ফুট x ৭ ফুট (6/7 Feet)
                      </label>
                    </div>
                    {size6x7.enabled && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Sale Price (৳) *</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              placeholder="e.g. 1090" 
                              value={size6x7.price}
                              onChange={(e) => setSize6x7({ ...size6x7, price: e.target.value })}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Regular Price (৳)</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              placeholder="e.g. 1550" 
                              value={size6x7.originalPrice}
                              onChange={(e) => setSize6x7({ ...size6x7, originalPrice: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Size Specific Image Upload */}
                        <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                          <label className={styles.formLabel}>সাইজের জন্য আলাদা ছবি (Size Specific Image)</label>
                          <div 
                            onClick={() => !uploadingSize6x7 && document.getElementById('size6x7ImageInput')?.click()}
                            style={{ 
                              border: '1px dashed rgba(255, 255, 255, 0.15)', 
                              borderRadius: '6px', 
                              padding: '12px', 
                              textAlign: 'center', 
                              cursor: 'pointer', 
                              backgroundColor: 'rgba(255, 255, 255, 0.01)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              minHeight: '60px'
                            }}
                          >
                            <input 
                              type="file" 
                              id="size6x7ImageInput" 
                              hidden 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) await handleSizeImageUpload(file, '6x7');
                              }}
                            />
                            {uploadingSize6x7 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className={styles.loader} style={{ width: '16px', height: '16px' }}></div>
                                <span style={{ fontSize: '12px' }}>Uploading...</span>
                              </div>
                            ) : size6x7Image ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Image src={size6x7Image} alt="6x7 Size" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                                  <span style={{ fontSize: '11px', color: 'var(--text-light)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>Image Uploaded</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSize6x7Image('');
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <HugeiconsIcon icon={CloudUploadIcon} size={18} color="var(--text-light)" />
                                <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: '600' }}>Upload image for this size</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Size 7x8 */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        id="size7x8_enabled"
                        checked={size7x8.enabled}
                        onChange={(e) => setSize7x8({ ...size7x8, enabled: e.target.checked })}
                        style={{ accentColor: 'var(--primary-color)' }}
                      />
                      <label htmlFor="size7x8_enabled" style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
                        সাইজ: ৭ফুট x ৮ ফুট (7/8 Feet)
                      </label>
                    </div>
                    {size7x8.enabled && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Sale Price (৳) *</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              placeholder="e.g. 1250" 
                              value={size7x8.price}
                              onChange={(e) => setSize7x8({ ...size7x8, price: e.target.value })}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Regular Price (৳)</label>
                            <input 
                              type="number" 
                              className={styles.input} 
                              placeholder="e.g. 1550" 
                              value={size7x8.originalPrice}
                              onChange={(e) => setSize7x8({ ...size7x8, originalPrice: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Size Specific Image Upload */}
                        <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                          <label className={styles.formLabel}>সাইজের জন্য আলাদা ছবি (Size Specific Image)</label>
                          <div 
                            onClick={() => !uploadingSize7x8 && document.getElementById('size7x8ImageInput')?.click()}
                            style={{ 
                              border: '1px dashed rgba(255, 255, 255, 0.15)', 
                              borderRadius: '6px', 
                              padding: '12px', 
                              textAlign: 'center', 
                              cursor: 'pointer', 
                              backgroundColor: 'rgba(255, 255, 255, 0.01)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              minHeight: '60px'
                            }}
                          >
                            <input 
                              type="file" 
                              id="size7x8ImageInput" 
                              hidden 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) await handleSizeImageUpload(file, '7x8');
                              }}
                            />
                            {uploadingSize7x8 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className={styles.loader} style={{ width: '16px', height: '16px' }}></div>
                                <span style={{ fontSize: '12px' }}>Uploading...</span>
                              </div>
                            ) : size7x8Image ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Image src={size7x8Image} alt="7x8 Size" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                                  <span style={{ fontSize: '11px', color: 'var(--text-light)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px' }}>Image Uploaded</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSize7x8Image('');
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <HugeiconsIcon icon={CloudUploadIcon} size={18} color="var(--text-light)" />
                                <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: '600' }}>Upload image for this size</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Stock Status</label>
                <select 
                  className={styles.select} 
                  style={{ width: '100%' }}
                  value={formData.stock_status}
                  onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out Of Stock">Out Of Stock</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Call to Order</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="01xxx-xxxxxx" 
                  value={formData.call_to_order}
                  onChange={(e) => setFormData({ ...formData, call_to_order: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>


        <div className={styles.formRight}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>Product Gallery (Up to 4 images) *</h2>
            
            <div className={styles.galleryGrid}>
              {formData.gallery_images.map((img, index) => (
                <div 
                  key={index}
                  className={styles.smallUploadArea}
                  style={{ position: 'relative', overflow: 'hidden' }}
                  onClick={() => !uploadingIndex && document.getElementById(`fileInput-${index}`)?.click()}
                >
                  <input 
                    type="file" 
                    id={`fileInput-${index}`} 
                    hidden 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleFileUpload(file, index);
                    }}
                  />
                  
                  {uploadingIndex === index ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className={styles.loader} style={{ width: '20px', height: '20px', marginBottom: '8px' }}></div>
                      <p style={{ fontSize: '10px' }}>Uploading...</p>
                    </div>
                  ) : img ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <Image 
                        src={img} 
                        alt={`Gallery ${index}`} 
                        width={150}
                        height={120}
                        className={styles.galleryImagePreview}
                      />
                      <button 
                        className={styles.removeImageBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newGallery = [...formData.gallery_images];
                          newGallery[index] = '';
                          setFormData({ ...formData, gallery_images: newGallery });
                        }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} color="#ef4444" />
                      </button>
                      {index === 0 && (
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--primary-color)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Main
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <HugeiconsIcon icon={ImageAdd01Icon} size={24} color="var(--text-light)" />
                      <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-gray)' }}>{index === 0 ? 'Main Image' : `Image ${index + 1}`}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '12px' }}>
              Tip: The first image will be used as the primary product image.
            </p>
          </div>


          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>Category</h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Product Category *</label>
              <select 
                className={styles.select} 
                style={{ width: '100%' }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                <option value="ওয়াটারপ্রুফ চাদর">ওয়াটারপ্রুফ চাদর</option>
                <option value="ডায়াপার">ডায়াপার</option>
                <option value="মশারী">মশারী</option>
              </select>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>Status</h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Visibility</label>
              <select className={styles.select} style={{ width: '100%' }}>
                <option>Published</option>
                <option>Draft</option>
                <option>Hidden</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.btnGroup} ${styles.hideOnDesktop}`}>
        <button className={styles.secondaryBtn} onClick={handleBack}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} style={{ marginRight: '8px' }} />
          Cancel
        </button>
        <button className={styles.primaryBtn} onClick={handleSave} disabled={loading || uploadingIndex !== null}>
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{loading ? 'Saving...' : uploadingIndex !== null ? 'Uploading...' : 'Save Product'}</span>
        </button>

      </div>
    </AdminLayout>
  );
};

export default AddProductPage;
