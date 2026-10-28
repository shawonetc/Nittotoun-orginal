"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../context/CartContext';
import styles from './cart.module.css';
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { supabase } from '../../lib/supabase';
import { fbqEvent } from '../../lib/metaPixel';
import OrderSuccess from '../../components/OrderSuccess';

const getBaseTitle = (title: string): string => {
  return title
    .replace(/\s*\(6\/7\s*Feet\)/i, '')
    .replace(/\s*\(7\/8\s*Feet\)/i, '')
    .replace(/\s*\(৬\/৭\s*ফুট\)/i, '')
    .replace(/\s*\(৭\/৮\s*ফুট\)/i, '')
    .trim();
};

const getBaseId = (id: any): string => {
  if (typeof id === 'string' && id.includes('-')) {
    return id.split('-')[0];
  }
  return String(id);
};

const parseProductId = (id: any): number | null => {
  const base = getBaseId(id);
  const parsed = parseInt(base, 10);
  return isNaN(parsed) ? null : parsed;
};


const isOptionActive = (itemId: any, optId: any, itemPrice: number, optPrice: number): boolean => {
  if (itemId === optId) return true;
  const cleanItemId = getBaseId(itemId);
  const cleanOptId = getBaseId(optId);
  if (cleanItemId === cleanOptId) {
    return itemPrice === optPrice;
  }
  return false;
};

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart, changeCartItemProduct } = useCart();
  const subtotal = getCartTotal();
  const [shippingCost, setShippingCost] = useState(0); // Free Delivery
  const total = subtotal + shippingCost;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: any; name: string; total: number } | null>(null);
  const [selectedFallbackSize, setSelectedFallbackSize] = useState('default-6x7');

  const targetItem = cartItems.find(item =>
    item.title.toLowerCase().includes('waterproof') ||
    item.title.toLowerCase().includes('bed cover') ||
    item.title.toLowerCase().includes('bedsheet') ||
    item.title.includes('চাদর') ||
    item.id === 4 ||
    item.id === 5 ||
    String(item.id).includes('6x7') ||
    String(item.id).includes('7x8')
  ) || cartItems[0];

  const formSizeOptions = targetItem ? [
    {
      id: `${getBaseId(targetItem.id)}-6x7`,
      title: `${getBaseTitle(targetItem.title)} (6/7 Feet)`,
      price: 1150,
      sizeName: 'সাইজ, ৬ফুট x ৭ ফুট',
      imageUrl: targetItem.imageUrl
    },
    {
      id: `${getBaseId(targetItem.id)}-7x8`,
      title: `${getBaseTitle(targetItem.title)} (7/8 Feet)`,
      price: 1350,
      sizeName: 'সাইজ, ৭ফুট x ৮ ফুট',
      imageUrl: targetItem.imageUrl
    }
  ] : [
    {
      id: 'default-6x7',
      title: 'Waterproof Bed Cover (6/7 Feet)',
      price: 1150,
      sizeName: 'সাইজ, ৬ফুট x ৭ ফুট',
      imageUrl: ''
    },
    {
      id: 'default-7x8',
      title: 'Waterproof Bed Cover (7/8 Feet)',
      price: 1350,
      sizeName: 'সাইজ, ৭ফুট x ৮ ফুট',
      imageUrl: ''
    }
  ];


  const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);

  // Track InitiateCheckout on page mount once cart items are loaded
  useEffect(() => {
    if (cartItems.length > 0 && !hasInitiatedCheckout) {
      fbqEvent('InitiateCheckout', {
        value: total,
        currency: 'BDT',
        content_type: 'product',
        content_ids: cartItems.map(item => String(getBaseId(item.id))),
        num_items: cartItems.reduce((acc, item) => acc + item.quantity, 0)
      });
      setHasInitiatedCheckout(true);
    }
  }, [cartItems, total, hasInitiatedCheckout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("আপনার কার্ট খালি!");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const customerName = (formData.get('name') as string || '').trim();
    const customerPhone = (formData.get('phone') as string || '').trim();
    const address = (formData.get('address') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    if (!customerName || !customerPhone) {
      alert("দয়া করে আপনার নাম ও মোবাইল নম্বর প্রদান করুন।");
      return;
    }

    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      address: address,
      notes: notes,
      shipping_cost: shippingCost,
      subtotal: subtotal,
      total: total,
      status: 'New order',
      payment_status: 'Unpaid'
    };

    setIsSubmitting(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: parseProductId(item.id),
        product_title: item.title,
        quantity: item.quantity,
        price: item.price,
        image_url: item.imageUrl || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Add Notification
      try {
        await supabase.from('notifications').insert({
          title: 'New Order Received',
          message: `A new order (#ORD-${order.id}) has been placed by ${orderData.customer_name}.`,
          type: 'success',
          is_read: false
        });
      } catch (notifyError) {
        console.error('Notification Error:', notifyError);
      }

      // Facebook Pixel Purchase Event
      fbqEvent('Purchase', {
        value: total,
        currency: 'BDT',
        content_type: 'product',
        content_ids: cartItems.map(item => String(getBaseId(item.id))),
        contents: cartItems.map(item => ({
          id: String(getBaseId(item.id)),
          title: item.title,
          quantity: item.quantity,
          item_price: item.price,
          price: item.price
        })),
        num_items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        order_id: String(order.id)
      });

      clearCart();
      setOrderResult({
        id: order.id,
        name: orderData.customer_name,
        total: orderData.total
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert("অর্ডার করার সময় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <Header />
      <main className={styles.container}>
        {orderResult ? (
          <OrderSuccess
            orderId={orderResult.id}
            customerName={orderResult.name}
            totalAmount={orderResult.total}
          />
        ) : (
          <div className={styles.layout}>


            {/* Left Column: Form */}
            <div className={styles.formSection}>
              <div className={styles.formHeader}>
                অর্ডারটি কনফার্ম করতে আপনার নাম, ঠিকানা, মোবাইল নাম্বার, লিখে <strong>অর্ডার কনফার্ম করুন</strong> বাটনে ক্লিক করুন
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>আপনার নাম *</label>
                  <input type="text" name="name" placeholder="আপনার নাম" required />

                </div>

                <div className={styles.formGroup}>
                  <label>আপনার মোবাইল নম্বর *</label>
                  <input type="tel" name="phone" placeholder="আপনার মোবাইল নম্বর" required />

                </div>

                <div className={styles.formGroup}>
                  <label>আপনার সম্পূর্ণ ঠিকানা</label>
                  <input type="text" name="address" placeholder="আপনার সম্পূর্ণ ঠিকানা" />
                </div>

                <div className={styles.formGroup} style={{ marginTop: '15px', marginBottom: '20px' }}>
                  <label className={styles.cartSizeSelectLabel}>সাইজ নির্ধারণ করুন:</label>
                  <div className={styles.cartSizeOptionsGrid}>
                    {formSizeOptions.map((opt) => {
                      const isActive = targetItem
                        ? isOptionActive(targetItem.id, opt.id, targetItem.price, opt.price)
                        : (selectedFallbackSize === opt.id);

                      return (
                        <div
                          key={opt.id}
                          className={`${styles.cartSizeOptionCard} ${isActive ? styles.cartActiveSizeCard : ''}`}
                          onClick={() => {
                            if (targetItem) {
                              if (!isActive) {
                                changeCartItemProduct(targetItem.id, {
                                  id: opt.id,
                                  title: opt.title,
                                  price: opt.price,
                                  imageUrl: opt.imageUrl
                                });
                              }
                            } else {
                              setSelectedFallbackSize(opt.id);
                            }
                          }}
                        >
                          <span className={styles.cartSizeRadioCircle}>
                            {isActive && <span className={styles.cartSizeRadioInnerCircle}></span>}
                          </span>
                          <span className={styles.cartSizeName}>{opt.sizeName}</span>
                          <span className={styles.cartSizePrice}>{opt.price} টাকা</span>
                        </div>
                      );
                    })}
                  </div>
                  <input
                    type="hidden"
                    name="notes"
                    value={
                      targetItem
                        ? (targetItem.id.toString().includes('7x8') ? 'সাইজ, ৭ফুট x ৮ ফুট (১৩৫০ টাকা)' : 'সাইজ, ৬ফুট x ৭ ফুট (১১৫০ টাকা)')
                        : (selectedFallbackSize.includes('7x8') ? 'সাইজ, ৭ফুট x ৮ ফুট (১৩৫০ টাকা)' : 'সাইজ, ৬ফুট x ৭ ফুট (১১৫০ টাকা)')
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ডেলিভারি চার্জ</label>
                  <div className={styles.radioGroup}>
                    <div className={`${styles.radioOption} ${styles.activeRadio}`}>
                      <span className={styles.customRadio}></span>
                      <span className={styles.radioText}>ডেলিভারি চার্জ ফ্রি / ক্যাশ অন ডেলিভারি</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                </button>

              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className={styles.summarySection}>
              <div className={styles.summaryTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.colProduct}>Product</div>
                  <div className={styles.colPrice}>Price</div>
                  <div className={styles.colQty}>Quantity</div>
                  <div className={styles.colTotal}>Total</div>
                </div>

                <div className={styles.tableBody}>
                  {cartItems.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>কার্টে কোন প্রোডাক্ট নেই</div>
                  ) : cartItems.map(item => (
                    <div key={item.id} className={styles.tableRow}>
                      <div className={styles.rowMainInfo}>
                        <div className={styles.colProduct}>
                          <div className={styles.itemImage} style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
                          <span>{item.title}</span>
                        </div>
                        <div className={styles.colPrice}>{item.price} টাকা</div>
                        <div className={styles.colQty}>
                          <div className={styles.qtyControls}>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                        <div className={styles.colTotal}>
                          {item.price * item.quantity} টাকা
                          <button type="button" onClick={() => removeFromCart(item.id)} className={styles.removeBtn}>
                            <HugeiconsIcon icon={Delete01Icon} size={16} color="#aaa" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.totals}>
                <div className={styles.totalsRow}>
                  <span>Sub-Total</span>
                  <span>{subtotal} টাকা</span>
                </div>
                <div className={styles.totalsRow}>
                  <span>Delivery Charges</span>
                  <span>{shippingCost} টাকা</span>
                </div>
                <div className={`${styles.totalsRow} ${styles.finalTotal}`}>
                  <span>Total Amount</span>
                  <span>{total} টাকা</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
