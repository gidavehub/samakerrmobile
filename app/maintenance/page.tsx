"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Droplets, Zap, Wind, DoorOpen, Paintbrush, Bug,
    Flame, ShowerHead, Lock, Lightbulb, Wrench, Camera, X,
    ChevronRight, CheckCircle2, AlertTriangle, Send, Plus, Trash2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const slideUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Issue categories with sub-issues
const issueCategories = [
    {
        id: 'plumbing', label: 'Plumbing', icon: Droplets, color: '#E4F4F9',
        subIssues: ['Leaking tap', 'Blocked drain', 'Toilet won\'t flush', 'No hot water', 'Pipe burst', 'Low water pressure']
    },
    {
        id: 'electrical', label: 'Electrical', icon: Zap, color: '#FFF6D4',
        subIssues: ['Power outage', 'Broken socket', 'Light not working', 'Sparking outlet', 'Tripping breaker', 'Exposed wiring']
    },
    {
        id: 'doors_windows', label: 'Doors & Windows', icon: DoorOpen, color: '#E6F5DF',
        subIssues: ['Door won\'t close', 'Broken lock', 'Cracked window', 'Window won\'t open', 'Broken handle', 'Screen damage']
    },
    {
        id: 'walls_paint', label: 'Walls & Paint', icon: Paintbrush, color: '#F3E8FF',
        subIssues: ['Peeling paint', 'Crack in wall', 'Damp / mould', 'Hole in wall', 'Stains', 'Tiles falling off']
    },
    {
        id: 'pest', label: 'Pests', icon: Bug, color: '#FFE8E0',
        subIssues: ['Termites', 'Cockroaches', 'Ants', 'Rodents', 'Mosquitoes', 'Other insects']
    },
    {
        id: 'hvac', label: 'AC & Ventilation', icon: Wind, color: '#E4F4F9',
        subIssues: ['AC not cooling', 'AC leaking', 'Strange noise', 'Bad smell', 'Fan not working', 'Remote broken']
    },
    {
        id: 'gas', label: 'Gas & Cooking', icon: Flame, color: '#FFF6D4',
        subIssues: ['Gas leak smell', 'Burner not lighting', 'Oven not working', 'Gas bottle empty', 'Regulator issue']
    },
    {
        id: 'other', label: 'Other', icon: Wrench, color: '#f5f5f5',
        subIssues: ['Roof leak', 'Floor damage', 'Furniture broken', 'Appliance malfunction', 'Other']
    },
];

const urgencyLevels = [
    { id: 'low', label: 'Low', desc: 'Can wait a few days', color: '#34C759' },
    { id: 'medium', label: 'Medium', desc: 'Needs attention soon', color: '#FF9500' },
    { id: 'high', label: 'Urgent', desc: 'Needs immediate fix', color: '#FF3B30' },
];

type Step = 'category' | 'details' | 'review';

export default function MaintenancePage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Form state
    const [step, setStep] = useState<Step>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubIssues, setSelectedSubIssues] = useState<string[]>([]);
    const [urgency, setUrgency] = useState<string>('medium');
    const [customDescription, setCustomDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('samakerr_token');
        if (!saved) { router.replace('/'); return; }
        setToken(saved);

        // Find company ID
        (async () => {
            try {
                const propSnap = await getDoc(doc(db, 'properties', saved));
                if (propSnap.exists()) {
                    const propData = propSnap.data();
                    if (propData.companyId) setCompanyId(propData.companyId);
                }
            } catch { /* ignore */ }
        })();
    }, [router]);

    const category = issueCategories.find(c => c.id === selectedCategory);

    const toggleSubIssue = (issue: string) => {
        setSelectedSubIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
        );
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setPhotos(prev => [...prev, ev.target!.result as string].slice(0, 4));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!token || !companyId || !selectedCategory) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'maintenance'), {
                companyId,
                propertyId: token,
                category: selectedCategory,
                subIssues: selectedSubIssues,
                urgency,
                description: customDescription,
                photoCount: photos.length,
                status: 'pending',
                createdAt: Date.now(),
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Failed to submit:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep('category');
        setSelectedCategory(null);
        setSelectedSubIssues([]);
        setUrgency('medium');
        setCustomDescription('');
        setPhotos([]);
        setSubmitted(false);
    };

    // Success screen
    if (submitted) {
        return (
            <main className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-inter px-8 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-[#34C759]/15 flex items-center justify-center mb-6"
                >
                    <CheckCircle2 size={40} className="text-[#34C759]" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[28px] font-bold text-[#1b1b1b] mb-3 tracking-tight"
                >
                    Report Submitted
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[15px] text-[#8a8886] mb-8 leading-relaxed"
                >
                    Your maintenance report has been sent to the property manager. They'll be notified immediately.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 w-full"
                >
                    <button onClick={resetForm} className="flex-1 py-4 rounded-[18px] border border-[#E5E5E5] text-[14px] font-bold text-[#1b1b1b] active:bg-[#f8f8f8]">
                        New Report
                    </button>
                    <button onClick={() => router.back()} className="flex-1 py-4 rounded-[18px] bg-[#1b1b1b] text-white text-[14px] font-bold active:scale-[0.98]">
                        Done
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-white flex flex-col font-inter pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="px-5 pt-[calc(env(safe-area-inset-top,40px)+16px)] pb-3 flex items-center gap-3 z-10"
            >
                <button
                    onClick={() => step === 'category' ? router.back() : setStep(step === 'review' ? 'details' : 'category')}
                    className="w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center active:bg-[#e4e4e4] transition-colors"
                >
                    <ChevronLeft size={24} strokeWidth={2} className="text-[#1b1b1b]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">Report Issue</h1>
                    <p className="text-[12px] text-[#8a8886] font-medium">
                        Step {step === 'category' ? '1' : step === 'details' ? '2' : '3'} of 3
                    </p>
                </div>
            </motion.div>

            {/* Progress Bar */}
            <div className="px-6 mb-6">
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <motion.div
                        animate={{ width: step === 'category' ? '33%' : step === 'details' ? '66%' : '100%' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="h-full bg-[#1b1b1b] rounded-full"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: Category Selection */}
                {step === 'category' && (
                    <motion.div
                        key="category"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 px-6 space-y-5"
                    >
                        <div className="px-1">
                            <h2 className="text-[26px] font-bold text-[#1b1b1b] tracking-tight leading-tight">What needs<br />fixing?</h2>
                            <p className="text-[14px] text-[#8a8886] mt-2 font-medium">Select the area that best describes the problem.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {issueCategories.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`rounded-[24px] p-5 flex flex-col items-start gap-3 text-left active:scale-[0.98] transition-all ${isSelected ? 'ring-2 ring-[#1b1b1b] ring-offset-2' : ''}`}
                                        style={{ backgroundColor: cat.color }}
                                    >
                                        <div className="w-11 h-11 rounded-[14px] bg-white/60 flex items-center justify-center">
                                            <Icon size={22} className="text-[#1b1b1b]" />
                                        </div>
                                        <span className="text-[15px] font-bold text-[#1b1b1b]">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedCategory && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pt-2"
                            >
                                <button
                                    onClick={() => setStep('details')}
                                    className="w-full bg-[#1b1b1b] text-white py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                                >
                                    Continue <ChevronRight size={18} strokeWidth={3} />
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* STEP 2: Details */}
                {step === 'details' && category && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 px-6 space-y-6"
                    >
                        {/* Sub-issues */}
                        <div>
                            <h2 className="text-[22px] font-bold text-[#1b1b1b] tracking-tight mb-1 px-1">
                                What's the problem?
                            </h2>
                            <p className="text-[13px] text-[#8a8886] mb-4 px-1 font-medium">Select all that apply.</p>

                            <div className="flex flex-wrap gap-2.5">
                                {category.subIssues.map((issue) => {
                                    const isSelected = selectedSubIssues.includes(issue);
                                    return (
                                        <button
                                            key={issue}
                                            onClick={() => toggleSubIssue(issue)}
                                            className={`px-4 py-3 rounded-[16px] text-[14px] font-semibold transition-all active:scale-[0.97] ${isSelected
                                                ? 'bg-[#1b1b1b] text-white'
                                                : 'bg-[#f5f5f5] text-[#1b1b1b] border border-[#E5E5E5]'
                                                }`}
                                        >
                                            {issue}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Description */}
                        <div>
                            <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-2 px-1">Tell us more</h3>
                            <textarea
                                value={customDescription}
                                onChange={(e) => setCustomDescription(e.target.value)}
                                placeholder="Describe the issue in your own words... Where exactly is it? How long has it been happening?"
                                rows={4}
                                className="w-full bg-[#f8f8f8] border border-[#E5E5E5] rounded-[20px] p-4 text-[14px] text-[#1b1b1b] placeholder-[#b1afad] outline-none resize-none focus:border-[#1b1b1b] transition-colors font-medium leading-relaxed"
                            />
                        </div>

                        {/* Photos */}
                        <div>
                            <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-2 px-1">Add Photos</h3>
                            <p className="text-[12px] text-[#8a8886] mb-3 px-1 font-medium">Photos help us understand the problem faster.</p>
                            <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {photos.map((photo, i) => (
                                    <div key={i} className="w-[90px] h-[90px] rounded-[18px] overflow-hidden relative shrink-0 bg-[#f5f5f5]">
                                        <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(i)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                                        >
                                            <X size={12} color="white" />
                                        </button>
                                    </div>
                                ))}
                                {photos.length < 4 && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-[90px] h-[90px] rounded-[18px] border-2 border-dashed border-[#d2d0ce] flex flex-col items-center justify-center gap-1 shrink-0 active:bg-[#f8f8f8]"
                                    >
                                        <Camera size={22} className="text-[#b1afad]" />
                                        <span className="text-[10px] text-[#b1afad] font-semibold">Add</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Urgency */}
                        <div>
                            <h3 className="text-[17px] font-bold text-[#1b1b1b] mb-3 px-1">How urgent is this?</h3>
                            <div className="grid grid-cols-3 gap-2.5">
                                {urgencyLevels.map((level) => {
                                    const isSelected = urgency === level.id;
                                    return (
                                        <button
                                            key={level.id}
                                            onClick={() => setUrgency(level.id)}
                                            className={`rounded-[18px] py-4 flex flex-col items-center gap-1.5 transition-all active:scale-[0.97] ${isSelected ? 'ring-2 ring-offset-2' : 'bg-[#f8f8f8]'}`}
                                            style={{
                                                backgroundColor: isSelected ? `${level.color}15` : undefined,
                                                ...(isSelected ? { ringColor: level.color } as any : {}),
                                            }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: level.color }}
                                            />
                                            <span className="text-[13px] font-bold text-[#1b1b1b]">{level.label}</span>
                                            <span className="text-[10px] text-[#8a8886] font-medium">{level.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Continue */}
                        <div className="pt-2">
                            <button
                                onClick={() => setStep('review')}
                                disabled={selectedSubIssues.length === 0 && !customDescription}
                                className="w-full bg-[#1b1b1b] text-white py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-30 disabled:active:scale-100"
                            >
                                Review Report <ChevronRight size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: Review & Submit */}
                {step === 'review' && category && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 px-6 space-y-5"
                    >
                        <div className="px-1">
                            <h2 className="text-[26px] font-bold text-[#1b1b1b] tracking-tight">Review your report</h2>
                            <p className="text-[14px] text-[#8a8886] mt-1 font-medium">Make sure everything looks right before sending.</p>
                        </div>

                        {/* Summary Card */}
                        <div className="rounded-[28px] border border-[#E5E5E5] p-5 space-y-4 shadow-sm">
                            {/* Category */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center" style={{ backgroundColor: category.color }}>
                                    <category.icon size={22} className="text-[#1b1b1b]" />
                                </div>
                                <div>
                                    <p className="text-[16px] font-bold text-[#1b1b1b]">{category.label}</p>
                                    <p className="text-[12px] text-[#8a8886] font-medium">
                                        {urgencyLevels.find(l => l.id === urgency)?.label} priority
                                    </p>
                                </div>
                                <div
                                    className="w-3 h-3 rounded-full ml-auto"
                                    style={{ backgroundColor: urgencyLevels.find(l => l.id === urgency)?.color }}
                                />
                            </div>

                            {/* Issues */}
                            {selectedSubIssues.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold text-[#8a8886] uppercase tracking-wider mb-2">Issues Selected</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSubIssues.map((issue) => (
                                            <span key={issue} className="bg-[#f5f5f5] rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#1b1b1b]">
                                                {issue}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {customDescription && (
                                <div>
                                    <p className="text-[11px] font-bold text-[#8a8886] uppercase tracking-wider mb-1.5">Description</p>
                                    <p className="text-[14px] text-[#1b1b1b] leading-relaxed font-medium">{customDescription}</p>
                                </div>
                            )}

                            {/* Photos */}
                            {photos.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold text-[#8a8886] uppercase tracking-wider mb-2">Photos ({photos.length})</p>
                                    <div className="flex gap-2">
                                        {photos.map((p, i) => (
                                            <div key={i} className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#f5f5f5]">
                                                <img src={p} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Important Note */}
                        <div className="bg-[#FFF6D4] rounded-[20px] p-4 flex items-start gap-3">
                            <AlertTriangle size={18} className="text-[#FF9500] shrink-0 mt-0.5" />
                            <p className="text-[13px] text-[#1b1b1b]/70 font-medium leading-relaxed">
                                Your property manager will be notified immediately and can start arranging repairs.
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-[#1b1b1b] text-white py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} /> Submit Report
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
