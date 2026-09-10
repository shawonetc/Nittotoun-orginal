'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  DashboardSquare01Icon, 
  PackageIcon, 
  ShoppingBasket01Icon, 
  UserGroupIcon, 
  Settings02Icon,
  Store01Icon,
  Notification01Icon,
  Logout01Icon,
  ChartLineData01Icon,
  UserIcon,
  AiChat02Icon,
  ArrowRight01Icon,
  BrowserIcon,
  DeliveryTruck01Icon,
  Location01Icon,
  RefreshIcon
} from '@hugeicons/core-free-icons';
import styles from '../../app/admin/Admin.module.css';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', icon: DashboardSquare01Icon, href: '/admin' },
      { name: 'Analytics', icon: ChartLineData01Icon, href: '/admin/reports' },
    ]
  },
  {
    title: '🚚 Courier',
    items: [
      { name: 'Overview', icon: DashboardSquare01Icon, href: '/admin/courier/overview' },
      { name: 'Shipments', icon: DeliveryTruck01Icon, href: '/admin/courier/shipments' },
      { name: 'Tracking', icon: Location01Icon, href: '/admin/courier/tracking' },
      { name: 'Returns', icon: RefreshIcon, href: '/admin/courier/returns' },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Products', icon: PackageIcon, href: '/admin/products' },
      { name: 'Orders', icon: ShoppingBasket01Icon, href: '/admin/orders' },
      { name: 'Users', icon: UserGroupIcon, href: '/admin/users' },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', icon: Notification01Icon, href: '/admin/notifications' },
      { name: 'Settings', icon: Settings02Icon, href: '/admin/settings' },
    ]
  }
];

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Image 
              src="/images/logo.png" 
              alt="Nittonotonbd Logo" 
              width={32} 
              height={32} 
              className={styles.adminLogoImage}
            />
          </div>
          <div className={styles.logoInfo}>
            <span className={styles.logoText}>Nittonotonbd</span>
            <span className={styles.logoTagline}>Admin Panel</span>
          </div>
        </div>
      </div>
      
      <div className={styles.sidebarScrollArea}>
        <nav className={styles.sidebarNav}>
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.navGroup}>
              <h3 className={styles.navGroupTitle}>{group.title}</h3>
              <div className={styles.navGroupItems}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    >
                      <div className={styles.navItemIcon}>
                        <HugeiconsIcon icon={item.icon} size={20} />
                      </div>
                      <span className={styles.navItemText}>{item.name}</span>
                      {isActive && <div className={styles.activeIndicator} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerLinks}>
            <Link href="/" className={styles.footerLink}>
              <HugeiconsIcon icon={BrowserIcon} size={18} />
              <span>View Website</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} className={styles.footerArrow} />
            </Link>
          </div>

          <div className={styles.userProfileSection}>
            <div className={styles.userAvatar}>
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userEmail}>{user?.email?.split('@')[0] || 'Admin'}</span>
              <span className={styles.userRole}>Store Manager</span>
            </div>
            <button 
              onClick={handleLogout} 
              className={styles.logoutBtn}
              title="Logout"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
