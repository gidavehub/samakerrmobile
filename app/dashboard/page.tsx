"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Home, Zap, Wrench, TrendingUp, LogOut, Bell, FileText } from 'lucide-react';
import gsap from 'gsap';
import styles from './page.module.css';

function ClientDashboardContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            router.replace('/');
            return;
        }

        gsap.fromTo('.animate-item',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
    }, [token, router]);

    if (!token) return null;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.headerProfile}>
                    <div className={styles.avatar}>JD</div>
                    <div>
                        <h1 className={styles.greeting}>Welcome, John</h1>
                        <p className={styles.propertyName}>Property ID: {token.substring(0, 5).toUpperCase()}</p>
                    </div>
                </div>
                <button className={styles.iconBtn}>
                    <Bell size={24} color="var(--text-primary)" />
                </button>
            </header>

            <div className={styles.content}>
                <div className={`${styles.balanceCard} animate-item`}>
                    <p className={styles.balanceLabel}>Current Balance</p>
                    <h2 className={styles.balanceAmount}>0.00 GMD</h2>
                    <div className={styles.balanceActions}>
                        <button className={styles.payBtn}>Pay Rent</button>
                        <button className={styles.historyBtn}>History</button>
                    </div>
                </div>

                <h3 className={`${styles.sectionTitle} animate-item`}>Quick Actions</h3>
                <div className={`${styles.grid} animate-item`}>
                    <button className={styles.actionCard}>
                        <div className={`${styles.iconCircle} ${styles.blueBg}`}>
                            <Zap size={24} color="#0A58CA" />
                        </div>
                        <span>NAWEC Utilities</span>
                    </button>
                    <button className={styles.actionCard}>
                        <div className={`${styles.iconCircle} ${styles.orangeBg}`}>
                            <Wrench size={24} color="#f59e0b" />
                        </div>
                        <span>Maintenance</span>
                    </button>
                    <button className={styles.actionCard}>
                        <div className={`${styles.iconCircle} ${styles.greenBg}`}>
                            <TrendingUp size={24} color="#10b981" />
                        </div>
                        <span>Construction</span>
                    </button>
                    <button className={styles.actionCard}>
                        <div className={`${styles.iconCircle} ${styles.grayBg}`}>
                            <FileText size={24} color="#6b7280" />
                        </div>
                        <span>Documents</span>
                    </button>
                </div>

                <h3 className={`${styles.sectionTitle} animate-item`}>Recent Activity</h3>
                <div className={`${styles.activityList} animate-item`}>
                    <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                            <Home size={18} />
                        </div>
                        <div className={styles.activityDetails}>
                            <p className={styles.activityName}>Property Connected</p>
                            <p className={styles.activityDate}>Just now</p>
                        </div>
                    </div>
                </div>
            </div>

            <nav className={styles.bottomNav}>
                <button className={`${styles.navItem} ${styles.activeNav}`}>
                    <Home size={24} />
                    <span>Home</span>
                </button>
                <button className={styles.navItem}>
                    <Zap size={24} />
                    <span>Utilities</span>
                </button>
                <button className={styles.navItem}>
                    <Wrench size={24} />
                    <span>Requests</span>
                </button>
                <button className={styles.navItem} onClick={() => router.push('/')}>
                    <LogOut size={24} />
                    <span>Disconnect</span>
                </button>
            </nav>
        </main>
    );
}

export default function ClientDashboard() {
    return (
        <Suspense fallback={<div>Loading dashboard...</div>}>
            <ClientDashboardContent />
        </Suspense>
    );
}
