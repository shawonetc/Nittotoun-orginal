'use client';

import React, { useState, Suspense } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location01Icon, Search01Icon, DeliveryTruck01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import styles from '../../Admin.module.css';

function CourierTrackingContent() {
  const [consignmentId, setConsignmentId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consignmentId && !invoiceId) {
      alert('Please enter a Consignment ID or Invoice ID.');
      return;
    }

    setLoading(true);
    setTrackingResult(null);

    try {
      let query = '';
      if (consignmentId) query = `consignment_id=${consignmentId.trim()}`;
      else if (invoiceId) query = `invoice=${invoiceId.trim()}`;

      const res = await fetch(`/api/courier/steadfast/status?${query}`);
      const data = await res.json();
      setTrackingResult(data);
    } catch (err: any) {
      alert(`Error fetching status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(255, 90, 0, 0.1)', color: 'var(--primary-color)', display: 'flex' }}>
              <HugeiconsIcon icon={Location01Icon} size={26} />
            </div>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>Live Parcel Tracking</h1>
          </div>
          <p className={styles.pageSubtitle} style={{ marginTop: '4px' }}>
            Track real-time delivery status and timeline directly from Steadfast Courier API.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '24px 0', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleTrack}>
          <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
            <label className={styles.formLabel} style={{ fontWeight: '600', color: '#1e293b' }}>
              Consignment ID
            </label>
            <div className={styles.searchContainer} style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: '10px', padding: '4px 12px', border: '1px solid #cbd5e1' }}>
              <HugeiconsIcon icon={DeliveryTruck01Icon} size={20} color="var(--primary-color)" />
              <input
                type="text"
                placeholder="Enter Consignment ID (e.g. 294501145)"
                className={styles.searchInput}
                style={{ width: '100%', fontSize: '14px' }}
                value={consignmentId}
                onChange={(e) => setConsignmentId(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.primaryBtn}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '12px 20px', 
              backgroundColor: 'var(--primary-color, #ff5a00)', 
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(255, 90, 0, 0.25)'
            }}
            disabled={loading}
          >
            <HugeiconsIcon icon={Search01Icon} size={20} />
            <span>{loading ? 'Tracking Parcel...' : 'Track Delivery Status'}</span>
          </button>
        </form>

        {trackingResult && (() => {
          const currentStatusRaw = (trackingResult.delivery_status || 'in_review').toLowerCase();

          // Define standard Steadfast tracking steps
          const steps = [
            { key: 'created', label: 'Order Created' },
            { key: 'submitted', label: 'Parcel Submitted' },
            { key: 'in_review', label: 'In Review' },
            { key: 'picked_up', label: 'Picked Up' },
            { key: 'in_transit', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' },
          ];

          const currentStepIndex = steps.findIndex(s => s.key === currentStatusRaw);
          const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 2;

          return (
            <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              {/* Parcel Summary Header */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Consignment:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{consignmentId || trackingResult.consignment_id || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tracking Code:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{trackingResult.tracking_code || 'SFR260909STBF0965BBD'}</strong>
                  </div>
                </div>
              </div>

              {/* Current Status Card */}
              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <HugeiconsIcon icon={Tick02Icon} size={22} color="#16a34a" />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#15803d', margin: 0, textTransform: 'uppercase' }}>
                    Current Status: {currentStatusRaw.replace(/_/g, ' ')}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#166534', paddingLeft: '32px' }}>
                  {trackingResult.message || 'Your parcel is being processed by Steadfast Courier.'}
                </p>
              </div>

              {/* Delivery Progress Timeline */}
              <div style={{ padding: '0 8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Delivery Timeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                  {steps.map((step, idx) => {
                    const isCompleted = idx < activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', paddingBottom: idx === steps.length - 1 ? '0' : '24px' }}>
                        {/* Connecting Line */}
                        {idx !== steps.length - 1 && (
                          <div style={{ 
                            position: 'absolute', 
                            left: '11px', 
                            top: '24px', 
                            bottom: '0', 
                            width: '2px', 
                            backgroundColor: idx < activeIndex ? '#10b981' : '#e2e8f0' 
                          }} />
                        )}

                        {/* Status Icon Indicator */}
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: isCompleted ? '#10b981' : isCurrent ? 'var(--primary-color, #ff5a00)' : '#f1f5f9',
                          color: isCompleted || isCurrent ? '#ffffff' : '#94a3b8',
                          border: isCurrent ? '3px solid #ffedd5' : 'none',
                          zIndex: 2,
                          flexShrink: 0
                        }}>
                          {isCompleted ? (
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                          ) : isCurrent ? (
                            <span style={{ fontSize: '10px' }}>●</span>
                          ) : (
                            <span style={{ fontSize: '10px' }}>○</span>
                          )}
                        </div>

                        {/* Label & Description */}
                        <div style={{ paddingTop: '2px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: isCurrent ? '700' : isCompleted ? '600' : '500', 
                            color: isCurrent ? 'var(--primary-color, #ff5a00)' : isCompleted ? '#0f172a' : '#94a3b8' 
                          }}>
                            {step.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AdminLayout>
  );
}

export default function CourierTrackingPage() {
  return (
    <Suspense fallback={<div>Loading Tracking Page...</div>}>
      <CourierTrackingContent />
    </Suspense>
  );
}
