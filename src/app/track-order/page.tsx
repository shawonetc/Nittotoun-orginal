"use client";

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Calendar03Icon,
  UserIcon,
  Location01Icon,
  PackageIcon,
  CallIcon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  RefreshIcon
} from "@hugeicons/core-free-icons";
import styles from './track-order.module.css';
import Image from 'next/image';

interface OrderItem {
  id: number;
  product_title: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: string;
  payment_status: string;
  consignment_id?: string;
  tracking_code?: string;
  courier_status?: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function TrackOrderPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [liveCourierStatus, setLiveCourierStatus] = useState<{ [orderId: number]: any }>({});
  const [loadingCourier, setLoadingCourier] = useState<{ [orderId: number]: boolean }>({});

  const fetchLiveCourierStatus = async (order: Order) => {
    setLoadingCourier(prev => ({ ...prev, [order.id]: true }));
    try {
      let url = `/api/courier/steadfast/status?invoice=INV-${order.id}`;
      if (order.consignment_id) {
        url = `/api/courier/steadfast/status?consignment_id=${order.consignment_id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data && (data.delivery_status || data.status === 200)) {
        setLiveCourierStatus(prev => ({ ...prev, [order.id]: data }));
      } else if (data && data.consignment) {
        setLiveCourierStatus(prev => ({ ...prev, [order.id]: data.consignment }));
      } else {
        setLiveCourierStatus(prev => ({ ...prev, [order.id]: { error: data.message || 'কুরিয়ারে অর্ডারের সরাসরি তথ্য পাওয়া যায়নি' } }));
      }
    } catch (err: any) {
      setLiveCourierStatus(prev => ({ ...prev, [order.id]: { error: 'কুরিয়ার সার্ভিস সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি' } }));
    } finally {
      setLoadingCourier(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearched(false);

    const cleanInput = phone.trim();
    if (!cleanInput) {
      setErrorMsg('দয়া করে আপনার মোবাইল নাম্বার, অর্ডার আইডি বা Consignment ID দিন।');
      return;
    }

    setLoading(true);

    try {
      const numericInput = cleanInput.replace('#ORD-', '').replace('#', '');
      const digitsOnly = cleanInput.replace(/\D/g, '');
      const rawDigits = digitsOnly.startsWith('88') ? digitsOnly.slice(2) : digitsOnly;
      const standard01 = rawDigits.startsWith('0') ? rawDigits : '0' + rawDigits;
      const rawNoPrefix = standard01.startsWith('0') ? standard01.slice(1) : standard01;
      const phone88 = '88' + standard01;
      const phonePlus88 = '+88' + standard01;

      let query = supabase.from('orders').select('*, order_items(*)');

      // If user typed order ID (e.g. 33 or #ORD-33)
      if (/^\d+$/.test(numericInput) && numericInput.length <= 6) {
        query = query.or(`id.eq.${numericInput},customer_phone.eq.${cleanInput},customer_phone.eq.${standard01},consignment_id.eq.${cleanInput}`);
      } else {
        query = query.or(`customer_phone.eq.${cleanInput},customer_phone.eq.${standard01},customer_phone.eq.${rawNoPrefix},customer_phone.eq.${phone88},customer_phone.eq.${phonePlus88},consignment_id.eq.${cleanInput}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedOrders = (data || []) as Order[];
      setOrders(fetchedOrders);
      setSearched(true);

      // Auto fetch Steadfast status for orders that have consignment_id or were dispatched
      fetchedOrders.forEach(o => {
        if (o.consignment_id || o.status === 'Processing' || o.status === 'Shipped') {
          fetchLiveCourierStatus(o);
        }
      });

    } catch (err) {
      console.error('Error tracking order:', err);
      setErrorMsg('সার্ভারে সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase().trim();
    switch (statusLower) {
      case 'new order':
      case 'new':
        return { text: 'অর্ডার পাওয়া গেছে', class: styles.statusNew };
      case 'pending confirmation':
      case 'pending':
        return { text: 'কনফার্মেশনের অপেক্ষায়', class: styles.statusPending };
      case 'processing':
        return { text: 'প্রসেসিং হচ্ছে', class: styles.statusProcessing };
      case 'shipped':
        return { text: 'শিপিং করা হয়েছে', class: styles.statusShipped };
      case 'delivered':
        return { text: 'ডেলিভারি সম্পন্ন', class: styles.statusDelivered };
      case 'cancelled':
      case 'canceled':
        return { text: 'বাতিল করা হয়েছে', class: styles.statusCancelled };
      default:
        return { text: status, class: styles.statusDefault };
    }
  };

  const getPaymentLabel = (payment: string) => {
    const paymentLower = payment.toLowerCase().trim();
    switch (paymentLower) {
      case 'unpaid':
        return { text: 'পরিশোধ করা হয়নি', class: styles.payUnpaid };
      case 'paid':
        return { text: 'পরিশোধিত', class: styles.payPaid };
      default:
        return { text: payment, class: styles.payDefault };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const getSteadfastStatusLabel = (statusStr?: string) => {
    if (!statusStr) return 'প্রসেসিং হচ্ছে / In Review';
    const s = statusStr.toLowerCase();
    if (s === 'delivered' || s === 'delivered_approval_pending') return 'ডেলিভারি সম্পন্ন ✅';
    if (s === 'in_transit') return 'পথে আছে (In Transit) 🚚';
    if (s === 'hold') return 'কুরিয়ার অফিসে হোল্ডে আছে ⚠️';
    if (s === 'cancelled' || s === 'canceled' || s === 'returned') return 'বাতিল / রিটার্ন করা হয়েছে ❌';
    if (s === 'partial_delivered') return 'আংশিক ডেলিভারি 📦';
    if (s === 'in_review' || s === 'pending') return 'কুরিয়ার প্রসেসিং এ রয়েছে ⏳';
    return statusStr;
  };

  const getSteadfastStatusMessage = (statusStr?: string) => {
    if (!statusStr) return 'অর্ডারটি Steadfast কুরিয়ার সার্ভিসে পাঠানোর জন্য প্রস্তুত করা হচ্ছে।';
    const s = statusStr.toLowerCase();
    if (s === 'delivered' || s === 'delivered_approval_pending') return 'আপনার পার্সেলটি গ্রাহকের নিকট সফলভাবে পৌঁছে দেওয়া হয়েছে। ধন্যবাদ!';
    if (s === 'in_transit') return 'আপনার পার্সেলটি ডেলিভারির জন্য বর্তমানে Steadfast রাইডারের নিকট বা গন্তব্যের পথে রয়েছে।';
    if (s === 'hold') return 'গ্রাহকের অনুরোধে অথবা ঠিকানার কারণে পার্সেলটি বর্তমানে স্থানীয় Steadfast পয়েন্টে হোল্ড রয়েছে।';
    if (s === 'cancelled' || s === 'canceled' || s === 'returned') return 'পার্সেলটির ডেলিভারি বাতিল করা হয়েছে এবং মার্চেন্টের কাছে রিটার্ন করা হচ্ছে।';
    if (s === 'partial_delivered') return 'পার্সেলটির কিছু অংশ বা পরিমাণ সফলভাবে ডেলিভারি হয়েছে।';
    return 'Steadfast কুরিয়ার এন্ট্রি করা হয়েছে। শীঘ্রই লাইভ ট্র্যাকিং সম্পূর্ণ তথ্য যুক্ত হবে।';
  };

  const getStepActive = (order: Order, step: number) => {
    const s = (order.status || '').toLowerCase();
    const cStatus = (order.courier_status || '').toLowerCase();
    
    if (step === 1) return true; // Order Confirmed
    if (step === 2) return s !== 'new order' && s !== 'new' && s !== 'cancelled';
    if (step === 3) return s === 'processing' || s === 'shipped' || s === 'delivered' || !!order.consignment_id || cStatus === 'in_transit';
    if (step === 4) return s === 'delivered' || cStatus === 'delivered' || cStatus === 'delivered_approval_pending';
    return false;
  };

  return (
    <>
      <Header />
      <main className={styles.mainContainer}>
        <div className={styles.container}>
          <div className={styles.cardHeader}>
            <h1>অর্ডার ট্র্যাক করুন</h1>
            <p>আপনার মোবাইল নাম্বার, অর্ডার আইডি বা Consignment ID দিয়ে অর্ডারের বর্তমান অবস্থা চেক করুন</p>
          </div>

          <form onSubmit={handleTrack} className={styles.trackForm}>
            <div className={styles.inputWrapper}>
              <HugeiconsIcon icon={CallIcon} size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="মোবাইল নাম্বার, অর্ডার আইডি (#ORD-33) বা Consignment ID দিন..."
                className={styles.inputField}
              />
            </div>
            {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  <HugeiconsIcon icon={Search01Icon} size={20} />
                  ট্র্যাক করুন
                </>
              )}
            </button>
          </form>

          {searched && orders && orders.length === 0 && (
            <div className={styles.noOrderAlert}>
              <p>দুঃখিত, কোনো অর্ডার পাওয়া যায়নি। দয়া করে সঠিক মোবাইল নাম্বার বা অর্ডার আইডি দিন।</p>
            </div>
          )}

          {searched && orders && orders.length > 0 && (
            <div className={styles.resultsContainer}>
              <h2 className={styles.resultsTitle}>অর্ডার বিবরণ ({orders.length}টি পাওয়া গেছে)</h2>
              {orders.map((order) => {
                const statusInfo = getStatusLabel(order.status);
                const paymentInfo = getPaymentLabel(order.payment_status);
                const courierData = liveCourierStatus[order.id];

                return (
                  <div key={order.id} className={styles.orderCard}>
                    {/* Top Row: ID, Date, Status */}
                    <div className={styles.orderCardHeader}>
                      <div>
                        <span className={styles.orderId}>#ORD-{order.id}</span>
                        <span className={styles.orderDate}>
                          <HugeiconsIcon icon={Calendar03Icon} size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className={styles.badgeContainer}>
                        <span className={`${styles.badge} ${statusInfo.class}`}>{statusInfo.text}</span>
                      </div>
                    </div>

                    {/* Progress Stepper Timeline */}
                    <div className={styles.stepperContainer}>
                      <div className={`${styles.stepItem} ${getStepActive(order, 1) ? styles.stepActive : ''}`}>
                        <div className={styles.stepCircle}>1</div>
                        <span className={styles.stepLabel}>অর্ডার গৃহীত</span>
                      </div>
                      <div className={`${styles.stepLine} ${getStepActive(order, 2) ? styles.stepLineActive : ''}`} />
                      <div className={`${styles.stepItem} ${getStepActive(order, 2) ? styles.stepActive : ''}`}>
                        <div className={styles.stepCircle}>2</div>
                        <span className={styles.stepLabel}>প্রসেসিং</span>
                      </div>
                      <div className={`${styles.stepLine} ${getStepActive(order, 3) ? styles.stepLineActive : ''}`} />
                      <div className={`${styles.stepItem} ${getStepActive(order, 3) ? styles.stepActive : ''}`}>
                        <div className={styles.stepCircle}>3</div>
                        <span className={styles.stepLabel}>কুরিয়ারে শিপড 🚚</span>
                      </div>
                      <div className={`${styles.stepLine} ${getStepActive(order, 4) ? styles.stepLineActive : ''}`} />
                      <div className={`${styles.stepItem} ${getStepActive(order, 4) ? styles.stepActive : ''}`}>
                        <div className={styles.stepCircle}>4</div>
                        <span className={styles.stepLabel}>ডেলিভারি সম্পন্ন 🎉</span>
                      </div>
                    </div>

                    {/* Live Steadfast Courier Parcel Tracking Widget */}
                    <div className={styles.liveCourierContainer}>
                      <div className={styles.liveCourierHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HugeiconsIcon icon={DeliveryTruck01Icon} size={22} color="#ff5a00" />
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                            🚀 লাইভ কুরিয়ার ট্র্যাকিং (SteadFast Courier)
                          </h3>
                        </div>
                        <button 
                          type="button"
                          className={styles.refreshCourierBtn}
                          onClick={() => fetchLiveCourierStatus(order)}
                          disabled={loadingCourier[order.id]}
                        >
                          {loadingCourier[order.id] ? 'আপডেট হচ্ছে...' : 'লাইভ আপডেট চেক করুন'}
                        </button>
                      </div>

                      {courierData ? (
                        courierData.error ? (
                          <p className={styles.courierErrorText}>
                            {courierData.error}
                          </p>
                        ) : (
                          <div className={styles.liveCourierBody}>
                            <div className={styles.courierStatusBadgeRow}>
                              <span className={styles.courierBadge}>
                                কুরিয়ার স্ট্যাটাস: <strong>{getSteadfastStatusLabel(courierData.delivery_status || courierData.status || order.courier_status)}</strong>
                              </span>
                              {(order.consignment_id || courierData.consignment_id) && (
                                <span className={styles.consignmentBadge}>
                                  Consignment ID: <strong>{order.consignment_id || courierData.consignment_id}</strong>
                                </span>
                              )}
                              {(order.tracking_code || courierData.tracking_code) && (
                                <span className={styles.consignmentBadge} style={{ background: '#f0fdf4', color: '#166534' }}>
                                  Tracking Code: <strong>{order.tracking_code || courierData.tracking_code}</strong>
                                </span>
                              )}
                            </div>
                            <p className={styles.courierNoteText}>
                              {getSteadfastStatusMessage(courierData.delivery_status || courierData.status || order.courier_status)}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className={styles.liveCourierPlaceholder}>
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563' }}>
                            {order.consignment_id ? 
                              `কুরিয়ার Consignment ID (${order.consignment_id}) পাওয়া গেছে। লাইভ আপডেট দেখতে 'লাইভ আপডেট চেক করুন' বাটনে চাপ দিন।` : 
                              'পার্সেলটি Steadfast কুরিয়ারে সাবমিট করার সাথে সাথেই আপনি এখান থেকে সরাসরি রিয়েল-টাইম কুরিয়ার লোকেশন ও স্ট্যাটাস ট্র্যাক করতে পারবেন।'
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Delivery & Customer Info */}
                    <div className={styles.orderGrid}>
                      <div className={styles.infoSection}>
                        <h3>
                          <HugeiconsIcon icon={UserIcon} size={16} className={styles.infoIcon} />
                          গ্রাহক তথ্য
                        </h3>
                        <p><strong>নাম:</strong> {order.customer_name}</p>
                        <p><strong>মোবাইল:</strong> {order.customer_phone}</p>
                      </div>

                      <div className={styles.infoSection}>
                        <h3>
                          <HugeiconsIcon icon={Location01Icon} size={16} className={styles.infoIcon} />
                          ডেলিভারি ঠিকানা
                        </h3>
                        <p className={styles.addressText}>{order.address}</p>
                        {order.notes && <p className={styles.notesText}><strong>নোট:</strong> {order.notes}</p>}
                      </div>
                    </div>

                    {/* Product Items */}
                    <div className={styles.itemsSection}>
                      <h3>
                        <HugeiconsIcon icon={PackageIcon} size={16} className={styles.infoIcon} />
                        অর্ডারকৃত পণ্যসমূহ
                      </h3>
                      <div className={styles.itemsList}>
                        {order.order_items && order.order_items.map((item) => (
                          <div key={item.id} className={styles.itemRow}>
                            <div className={styles.itemImageWrapper}>
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.product_title}
                                  width={50}
                                  height={50}
                                  className={styles.itemImage}
                                />
                              ) : (
                                <div className={styles.itemPlaceholder}>No Image</div>
                              )}
                            </div>
                            <div className={styles.itemDetails}>
                              <span className={styles.itemTitle}>{item.product_title}</span>
                              <span className={styles.itemQtyPrice}>৳ {item.price} x {item.quantity}</span>
                            </div>
                            <div className={styles.itemTotal}>
                              ৳ {item.price * item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className={styles.summarySection}>
                      <div className={styles.paymentInfo}>
                        <HugeiconsIcon icon={CreditCardIcon} size={16} className={styles.infoIcon} />
                        <span>পেমেন্ট স্ট্যাটাস: </span>
                        <span className={`${styles.payStatusText} ${paymentInfo.class}`}>{paymentInfo.text}</span>
                      </div>
                      <div className={styles.pricingSummary}>
                        <div className={styles.priceRow}>
                          <span>উপ-মোট (Subtotal):</span>
                          <span>৳ {order.subtotal || (order.total - (order.shipping_cost || 0))}</span>
                        </div>
                        <div className={styles.priceRow}>
                          <span>ডেলিভারি চার্জ:</span>
                          <span>৳ {order.shipping_cost || 0}</span>
                        </div>
                        <div className={`${styles.priceRow} ${styles.totalRow}`}>
                          <span>সর্বমোট (Total):</span>
                          <span>৳ {order.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
