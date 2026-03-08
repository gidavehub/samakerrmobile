"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Building2, MapPin, Share2, Navigation, ExternalLink,
    HardHat, CheckCircle2, Clock, Image as ImageIcon, Cuboid, Copy, Check
} from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { motion, Variants } from 'framer-motion';

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const slideUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

interface PropertyData {
    name?: string;
    address?: string;
    googlePlusCode?: string;
    completionState?: string;
    nawecCashPower?: string;
    nawecWaterBill?: string;
    tenantName?: string;
    notes?: string;
    images?: string[];
}

interface CompanyData {
    companyName?: string;
    companyLogo?: string;
    brandColor1?: string;
    ownerName?: string;
}

interface BillingData {
    rentAmount?: string;
    rentSchedule?: string;
    paymentModel?: string;
    maintenanceFee?: string;
}

export default function PropertyPage() {
    const router = useRouter();
    const [property, setProperty] = useState<PropertyData | null>(null);
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('samakerr_token');
        if (!token) { router.replace('/'); return; }
        setLoading(true);
        try {
            const companiesSnap = await get(ref(database, 'companies'));
            if (companiesSnap.exists()) {
                const companies = companiesSnap.val();
                for (const [compId, compData] of Object.entries(companies) as [string, any][]) {
                    const propSnap = await get(ref(database, `properties/${compId}/${token}`));
                    if (propSnap.exists()) {
                        setProperty(propSnap.val());
                        setCompany(compData);
                        const billSnap = await get(ref(database, `billing/${compId}/${token}`));
                        if (billSnap.exists()) setBilling(billSnap.val());
                        setLoading(false);
                        return;
                    }
                }
            }
            const legacySnap = await get(ref(database, `homes/${token}`));
            if (legacySnap.exists()) setProperty(legacySnap.val());
        } catch (err) {
            console.error('Failed to fetch property:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDisconnect = () => {
        localStorage.removeItem('samakerr_token');
        router.replace('/');
    };

    const handleShare = async () => {
        const text = `${property?.name || 'Property'}\n${property?.address || ''}\n${property?.googlePlusCode ? `Plus Code: ${property.googlePlusCode}` : ''}`;
        if (navigator.share) {
            try { await navigator.share({ title: property?.name || 'Property', text }); } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNavigate = () => {
        const query = encodeURIComponent(property?.address || property?.googlePlusCode || property?.name || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    // Construction progress
    const progressStages = [
        { key: 'planning', label: 'Planning', icon: Clock },
        { key: 'construction', label: 'Building', icon: HardHat },
        { key: 'completed', label: 'Completed', icon: CheckCircle2 },
    ];
    const currentStageIndex = progressStages.findIndex(s => s.key === (property?.completionState || 'planning'));
    const progressPercent = currentStageIndex < 0 ? 0 : ((currentStageIndex + 1) / progressStages.length) * 100;

    const modelLabels: Record<string, string> = { rent: 'Renting', mortgage: 'Mortgage', installment: 'Installment Plan' };

    // Details key-value pairs
    const details = [
        { label: 'Property Name', value: property?.name },
        { label: 'Address', value: property?.address },
        { label: 'Google Plus Code', value: property?.googlePlusCode },
        { label: 'Tenant', value: property?.tenantName },
        { label: 'Managed By', value: company?.companyName },
        { label: 'Payment Type', value: modelLabels[billing?.paymentModel || 'rent'] },
        { label: 'Rent Amount', value: billing?.rentAmount ? `D ${parseFloat(billing.rentAmount).toLocaleString()}` : undefined },
        { label: 'Schedule', value: billing?.rentSchedule },
        { label: 'Maintenance Fee', value: billing?.maintenanceFee ? `D ${parseFloat(billing.maintenanceFee).toLocaleString()}` : undefined },
    ].filter(d => d.value);

    // Placeholder gallery images (property.images from Firebase if available)
    const galleryImages: string[] = property?.images || [];

    if (loading) {
        return (
            <main className="min-h-[100dvh] bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-[#E5E5E5] border-t-[#1b1b1b] rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-white flex flex-col font-inter pb-16">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="px-5 pt-[env(safe-area-inset-top,40px)] pb-4 flex items-center gap-3 z-10"
            >
                <button onClick={() => router.back()} className="w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center active:bg-[#e4e4e4] transition-colors">
                    <ChevronLeft size={24} strokeWidth={2} className="text-[#1b1b1b]" />
                </button>
                <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">My Property</h1>
            </motion.div>

            {/* Content */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="flex-1 px-6 space-y-6 pt-2"
            >
                {/* Hero Card */}
                <motion.div variants={slideUp} className="bg-[#E4F4F9] rounded-[32px] p-6 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                        {company?.companyLogo ? (
                            <div className="w-14 h-14 rounded-[20px] bg-white overflow-hidden border border-white/50 shadow-sm shrink-0">
                                <img src={company.companyLogo} alt={company.companyName} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-[20px] bg-white/60 flex items-center justify-center shrink-0">
                                <Building2 size={28} className="text-[#1b1b1b]" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[24px] font-bold text-[#1b1b1b] leading-tight tracking-tight">{property?.name || 'Your Property'}</h2>
                            <p className="text-[14px] text-[#1b1b1b]/60 mt-1 flex items-center gap-1.5 font-medium">
                                <MapPin size={14} strokeWidth={2.5} />
                                {property?.address || 'No address set'}
                            </p>
                            {company?.companyName && (
                                <p className="text-[12px] text-[#1b1b1b]/40 mt-2 font-semibold uppercase tracking-wider">
                                    Managed by {company.companyName}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Gallery */}
                <motion.div variants={slideUp}>
                    <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Gallery</h3>
                    {galleryImages.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
                            {galleryImages.map((img, i) => (
                                <div key={i} className="w-[200px] h-[140px] rounded-[24px] overflow-hidden bg-[#f5f5f5] shrink-0 snap-center shadow-sm">
                                    <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#f8f8f8] rounded-[24px] p-8 flex flex-col items-center justify-center gap-3 border border-[#efefef]">
                            <div className="w-14 h-14 rounded-[18px] bg-[#efefef] flex items-center justify-center">
                                <ImageIcon size={24} className="text-[#b1afad]" />
                            </div>
                            <p className="text-[14px] text-[#b1afad] font-medium text-center">No images yet.<br />Your manager can upload photos from the desktop portal.</p>
                        </div>
                    )}
                </motion.div>

                {/* Construction Progress */}
                <motion.div variants={slideUp}>
                    <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Construction Progress</h3>
                    <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-5 shadow-sm">
                        {/* Progress Bar */}
                        <div className="relative h-2 bg-[#efefef] rounded-full mb-5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                className="absolute inset-y-0 left-0 bg-[#34C759] rounded-full"
                            />
                        </div>
                        {/* Stage Labels */}
                        <div className="flex justify-between">
                            {progressStages.map((stage, i) => {
                                const StageIcon = stage.icon;
                                const isActive = i <= currentStageIndex;
                                const isCurrent = i === currentStageIndex;
                                return (
                                    <div key={stage.key} className="flex flex-col items-center gap-1.5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCurrent ? 'bg-[#34C759] text-white' : isActive ? 'bg-[#34C759]/15 text-[#34C759]' : 'bg-[#f5f5f5] text-[#c8c6c4]'}`}>
                                            <StageIcon size={18} strokeWidth={2.5} />
                                        </div>
                                        <span className={`text-[11px] font-semibold tracking-wide ${isCurrent ? 'text-[#1b1b1b]' : isActive ? 'text-[#34C759]' : 'text-[#c8c6c4]'}`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Share & Navigate */}
                <motion.div variants={slideUp} className="grid grid-cols-2 gap-3">
                    <button onClick={handleShare} className="bg-[#E4F4F9] rounded-[24px] py-5 flex flex-col items-center gap-2.5 active:scale-[0.98] transition-transform">
                        {copied ? <Check size={22} strokeWidth={2.5} className="text-[#34C759]" /> : <Share2 size={22} strokeWidth={2} className="text-[#1b1b1b]" />}
                        <span className="text-[14px] font-semibold text-[#1b1b1b]">{copied ? 'Copied!' : 'Share'}</span>
                    </button>
                    <button onClick={handleNavigate} className="bg-[#E6F5DF] rounded-[24px] py-5 flex flex-col items-center gap-2.5 active:scale-[0.98] transition-transform">
                        <Navigation size={22} strokeWidth={2} className="text-[#1b1b1b]" />
                        <span className="text-[14px] font-semibold text-[#1b1b1b]">Navigate</span>
                    </button>
                </motion.div>

                {/* Property Details */}
                <motion.div variants={slideUp}>
                    <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Details</h3>
                    <div className="bg-white border border-[#E5E5E5] rounded-[28px] overflow-hidden shadow-sm">
                        {details.map(({ label, value }, i) => (
                            <div key={label} className={`flex justify-between items-center px-5 py-4 ${i < details.length - 1 ? 'border-b border-[#f3f2f1]' : ''}`}>
                                <span className="text-[13px] text-[#8a8886] font-medium">{label}</span>
                                <span className="text-[13px] font-semibold text-[#1b1b1b] text-right max-w-[55%] truncate">{value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Notes */}
                {property?.notes && (
                    <motion.div variants={slideUp}>
                        <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">Notes</h3>
                        <div className="bg-[#FFF6D4] rounded-[24px] p-5">
                            <p className="text-[14px] text-[#1b1b1b]/80 font-medium leading-relaxed whitespace-pre-wrap">{property.notes}</p>
                        </div>
                    </motion.div>
                )}

                {/* Disconnect */}
                <motion.div variants={slideUp} className="pt-4 pb-8">
                    <button onClick={handleDisconnect} className="w-full py-4 rounded-[20px] bg-[#FFF0F0] text-[14px] font-bold text-[#FF5C5C] active:bg-[#FFE0E0] transition-colors">
                        Disconnect Property
                    </button>
                </motion.div>
            </motion.div>
        </main>
    );
}
