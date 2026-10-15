'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import AdminLogoutButton from './AdminLogoutButton';
import styles from './admin.module.scss';
import { useMenuCounts, withCount } from './useMenuCounts';

const LINKS = [
  { href: '/admin/tags', label: '태그요청' },
  { href: '/admin/reports', label: '신고목록' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const counts = useMenuCounts(pathname);

  useEffect(() => {
    if (sessionStorage.getItem('ultary-admin-sidebar') === '0') setOpen(false);
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem('ultary-admin-sidebar', next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className={styles.workspace}>
      <aside className={open ? styles.sidebar : `${styles.sidebar} ${styles.sidebarClosed}`}>
        <button
          type="button"
          className={open ? `${styles.sideToggle} ${styles.sideToggleOpen}` : styles.sideToggle}
          aria-expanded={open}
          aria-label={open ? '메뉴 접기' : '메뉴 열기'}
          onClick={toggle}
        >
          {open ? <ChevronLeft size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
        {open ? (
          <>
            <div className={styles.sideMenu}>
              <p className={styles.sideTitle}>관리자 메뉴</p>
              <nav className={styles.sideNav} aria-label="관리자 메뉴">
                {LINKS.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={active ? `${styles.sideLink} ${styles.sideLinkActive}` : styles.sideLink}
                      aria-current={active ? 'page' : undefined}
                    >
                      {withCount(
                        link.label,
                        link.href === '/admin/tags' ? counts?.pendingTagRequestCount : counts?.requestedReportCount,
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <AdminLogoutButton />
          </>
        ) : null}
      </aside>
      <div className={styles.workspaceMain}>{children}</div>
    </div>
  );
}
