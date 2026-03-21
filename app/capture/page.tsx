"use client";

import { useState, useRef, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Image as ImageIcon, CheckCircle2, ChevronLeft, Upload, Loader2, ArrowRight, Wand2, X, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage, rtdb } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as rtdbRef, set } from 'firebase/database';

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Room {
    id: string;
    name: string;
    boundingBox: BoundingBox;
    photos?: string[];
}

function CaptureFlowContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const propertyId = searchParams.get('id') || 'demo';
    const imagesPerRoom = parseInt(searchParams.get('imagesPerRoom') || '1');

    // States
    const [step, setStep] = useState<'loading' | 'error' | 'intro' | 'interactive_plan' | 'camera' | 'uploading' | 'processing' | 'success'>('loading');

    const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadProgressMsg, setUploadProgressMsg] = useState('');

    const [roomPhotos, setRoomPhotos] = useState<Record<string, File[]>>({});
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPropertyData = async () => {
            if (propertyId === 'demo') {
                setBlueprintUrl('https://via.placeholder.com/800x600?text=Demo+Floorplan');      
                setRooms([
                    { id: 'room1', name: 'Kitchen', boundingBox: { x: 10, y: 10, width: 30, height: 30 } },
                    { id: 'room2', name: 'Living Room', boundingBox: { x: 45, y: 10, width: 45, height: 40 } }
                ]);
                setStep('intro');
                return;
            }

            try {
                const docRef = doc(db, 'properties', propertyId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.blueprintUrl && data.rooms && data.rooms.length > 0) {
                        setBlueprintUrl(data.blueprintUrl);
                        setRooms(data.rooms);
                        setStep('intro');
                    } else {
                        setErrorMsg('No floorplan uploaded. Please upload the floorplan on the Desktop Portal first.');
                        setStep('error');
                    }
                } else {
                    setErrorMsg('Property not found.');
                    setStep('error');
                }
            } catch (err) {
                console.error("Error fetching property:", err);
                setErrorMsg('Failed to load property data.');
                setStep('error');
            }
        };

        fetchPropertyData();
    }, [propertyId]);

    const handleRoomClick = (roomId: string) => {
        setActiveRoomId(roomId);
        setStep('camera');
    };

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && activeRoomId) {
            const newFiles = Array.from(e.target.files);
            setRoomPhotos(prev => ({
                ...prev,
                [activeRoomId]: [...(prev[activeRoomId] || []), ...newFiles]
            }));
        }
    };

    const finishRoom = () => {
        setActiveRoomId(null);
        setStep('interactive_plan');
    };

    const submitAll = async () => {
        setStep('uploading');
        try {
            const updatedRooms = [...rooms];
            let totalPhotosToUpload = 0;
            let photosUploaded = 0;

            Object.keys(roomPhotos).forEach(roomId => {
                totalPhotosToUpload += roomPhotos[roomId].length;
            });

            for (let i = 0; i < updatedRooms.length; i++) {
                const room = updatedRooms[i];
                const files = roomPhotos[room.id] || [];
                const uploadedUrls: string[] = [];

                for (let j = 0; j < files.length; j++) {
                    setUploadProgressMsg(`Uploading ${room.name} (${j + 1}/${files.length})...`);
                    const file = files[j];
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('propertyId', propertyId);
                    formData.append('type', `room_${room.id}`);

                    const uploadRes = await fetch('/api/upload-media', {
                        method: 'POST',
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        throw new Error('Failed to upload image to GCP');
                    }

                    const { url } = await uploadRes.json();
                    uploadedUrls.push(url);
                    photosUploaded++;
                }
                updatedRooms[i].photos = uploadedUrls;
            }

            setUploadProgressMsg('Saving map to database...');
            // 1. Update Firestore with the new room URLs
            await updateDoc(doc(db, 'properties', propertyId), {
                rooms: updatedRooms
            });

            setUploadProgressMsg('Signaling Cloud AI Pipeline...');
            // 2. Write to RTDB to trigger the desktop orchestrator instantly
            await set(rtdbRef(rtdb, `orchestration/${propertyId}/trigger`), Date.now());

            setStep('success');

        } catch (error) {
            console.error("Upload failed:", error);
            setErrorMsg("Upload failed. Please check your connection and try again.");
            setStep('error');
        }
    };

    const completedRooms = Object.keys(roomPhotos).filter(id => roomPhotos[id]?.length >= imagesPerRoom).length;
    const isReadyToSubmit = rooms.length > 0 && completedRooms > 0;

    return (
        <main className="min-h-[100dvh] bg-[#0A0A0A] flex flex-col font-outfit relative overflow-hidden text-white selection:bg-[#0A58CA]/30">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#0A58CA] opacity-10 rounded-full blur-[120px] pointer-events-none" />
            
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-20 relative bg-black/20 backdrop-blur-md">
                <button
                    onClick={() => {
                        if (step === 'camera') setStep('interactive_plan');
                        else if (step === 'interactive_plan') setStep('intro');
                        else router.back();
                    }}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/70 active:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[16px] font-semibold text-white tracking-wide">
                    {step === 'camera' && activeRoomId ? rooms.find(r => r.id === activeRoomId)?.name : 'Asset Capture'}
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto relative z-10 p-6 flex flex-col">
                <AnimatePresence mode="wait">

                    {/* STEP: LOADING */}
                    {step === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-white/70"
                        >
                            <Loader2 size={40} className="animate-spin mb-6 text-[#0A58CA]" />   
                            <p className="text-[16px] font-medium tracking-wide">Syncing Blueprint...</p>
                        </motion.div>
                    )}

                    {/* STEP: ERROR */}
                    {step === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                        >
                            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                <X size={40} />
                            </div>
                            <h2 className="text-[24px] font-bold text-white mb-3">Sync Error</h2>
                            <p className="text-[15px] text-white/60 mb-10 leading-relaxed">{errorMsg}</p>
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-[16px] active:scale-[0.98] transition-all"
                            >
                                Return to Dashboard
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 1: INTRO */}
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col items-center text-center pt-8"
                        >
                            <div className="w-24 h-24 bg-[#0A58CA]/10 border border-[#0A58CA]/30 text-[#0A58CA] rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(10,88,202,0.2)]">
                                <Map size={48} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[32px] font-bold text-white mb-4 leading-tight tracking-tight">
                                Blueprint Loaded
                            </h2>
                            <p className="text-[16px] text-white/60 leading-relaxed max-w-[300px] mb-12">      
                                The AI has successfully segmented the property blueprint. You must capture <strong className="text-white">{imagesPerRoom} photos</strong> per mapped room.
                            </p>

                            <button
                                onClick={() => setStep('interactive_plan')}
                                className="w-full max-w-[320px] bg-[#0A58CA] hover:bg-[#084298] text-white py-4 rounded-xl font-bold text-[16px] shadow-[0_4px_24px_rgba(10,88,202,0.4)] active:scale-[0.98] transition-all mt-auto mb-8 flex items-center justify-center gap-3"        
                            >
                                Open Interactive Map <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: INTERACTIVE PLAN */}
                    {step === 'interactive_plan' && blueprintUrl && (
                        <motion.div
                            key="interactive_plan"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl mb-6 shadow-xl flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-[16px] text-white tracking-wide">Room Capture</h3>
                                    <p className="text-[13px] text-white/50 font-medium">{completedRooms} of {rooms.length} mapped</p>
                                </div>
                                <div className="text-[12px] bg-[#0A58CA]/20 text-[#0A58CA] px-4 py-1.5 rounded-full font-bold tracking-widest border border-[#0A58CA]/30">
                                    {imagesPerRoom} PICS / ROOM
                                </div>
                            </div>

                            {/* The Clickable Map */}
                            <div className="relative w-full aspect-square bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-2 border-white/10 overflow-hidden">
                                <img src={blueprintUrl} alt="Blueprint" className="w-full h-full object-contain pointer-events-none opacity-90" />

                                {/* Overlay hitboxes */}
                                {rooms.map((room) => {
                                    const photoCount = roomPhotos[room.id]?.length || 0;
                                    const isDone = photoCount >= imagesPerRoom;

                                    return (
                                        <button
                                            key={room.id}
                                            onClick={() => handleRoomClick(room.id)}
                                            className={`absolute border-[3px] transition-all group flex flex-col items-center justify-center overflow-hidden ${
                                                isDone
                                                    ? 'bg-[#34C759]/30 border-[#34C759]'
                                                    : photoCount > 0
                                                        ? 'bg-[#f59e0b]/30 border-[#f59e0b]' 
                                                        : 'bg-[#0A58CA]/30 border-[#0A58CA] hover:bg-[#0A58CA]/50 animate-pulse'
                                            }`}
                                            style={{
                                                left: `${room.boundingBox.x}%`,
                                                top: `${room.boundingBox.y}%`,
                                                width: `${room.boundingBox.width}%`,
                                                height: `${room.boundingBox.height}%`,
                                                animationDuration: '3s'
                                            }}
                                        >
                                            <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-md text-white text-[11px] font-bold text-center flex items-center gap-1.5 shadow-2xl">       
                                                {isDone && <CheckCircle2 size={14} className="text-[#34C759]" />}
                                                {room.name}
                                            </div>
                                            {!isDone && (
                                                <div className="mt-2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                                                    {photoCount}/{imagesPerRoom}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-8 pb-4">
                                <button
                                    onClick={submitAll}
                                    disabled={!isReadyToSubmit}
                                    className="w-full bg-white text-black py-4.5 rounded-xl font-bold text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 disabled:bg-white/20 disabled:text-white"
                                >
                                    Push to Cloud Pipeline <Upload size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CAMERA FOR SPECIFIC ROOM */}
                    {step === 'camera' && activeRoomId && (
                        <motion.div
                            key="camera"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            {(() => {
                                const activeRoom = rooms.find(r => r.id === activeRoomId);       
                                const currentPhotos = roomPhotos[activeRoomId] || [];
                                const isGoalMet = currentPhotos.length >= imagesPerRoom;

                                return (
                                    <>
                                        <div className="mb-8 flex justify-between items-end">  
                                            <div>
                                                <h2 className="text-[28px] font-bold text-white leading-tight mb-2 tracking-tight">
                                                    {activeRoom?.name}
                                                </h2>
                                                <p className="text-[14px] text-white/50 font-medium">       
                                                    Capture varying angles of the space.
                                                </p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-[16px] font-black border ${isGoalMet ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30' : 'bg-[#0A58CA]/10 text-[#0A58CA] border-[#0A58CA]/30'}`}>   
                                                {currentPhotos.length} / {imagesPerRoom}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {currentPhotos.map((file, i) => (
                                                <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 overflow-hidden relative border border-white/10 shadow-xl group">
                                                    <img src={URL.createObjectURL(file)} alt={`Room photo ${i}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                                    <button
                                                        onClick={() => {
                                                            setRoomPhotos(prev => ({
                                                                ...prev,
                                                                [activeRoomId]: prev[activeRoomId].filter((_, idx) => idx !== i)
                                                            }));
                                                        }}
                                                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-red-500 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => cameraInputRef.current?.click()}  
                                                className="aspect-[4/5] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-white/50 hover:bg-white/10 hover:border-white/40 hover:text-white active:scale-[0.98] transition-all shadow-inner"
                                            >
                                                <Camera size={36} className="mb-3 opacity-80" strokeWidth={1.5} />
                                                <span className="text-[14px] font-bold tracking-wider uppercase">Shoot</span>
                                            </button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                multiple
                                                className="hidden"
                                                ref={cameraInputRef}
                                                onChange={handlePhotoCapture}
                                            />
                                        </div>

                                        <div className="mt-auto pt-6 pb-4">
                                            <button
                                                onClick={finishRoom}
                                                className={`w-full py-4.5 rounded-xl font-bold text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg ${
                                                    isGoalMet ? 'bg-[#34C759] text-black shadow-[#34C759]/20' : 'bg-white/10 text-white border border-white/20'
                                                }`}
                                            >
                                                {isGoalMet ? 'Save Room & Map' : 'Return to Map'}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}

                    {/* STEP 4: UPLOADING / SIGNALING */}
                    {step === 'uploading' && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                        >
                            <div className="relative mb-8">
                                <div className="w-24 h-24 border-4 border-white/10 border-t-[#0A58CA] rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Upload size={24} className="text-[#0A58CA] animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-[24px] font-bold text-white mb-3">Syncing to Cloud</h2>
                            <p className="text-[15px] text-white/60 mb-2 font-medium tracking-wide">
                                {uploadProgressMsg}
                            </p>
                        </motion.div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                        >
                            <div className="w-28 h-28 bg-[#34C759]/10 border border-[#34C759]/30 rounded-full flex items-center justify-center mb-8 text-[#34C759] shadow-[0_0_60px_rgba(52,199,89,0.2)]">
                                <CheckCircle2 size={56} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[32px] font-bold text-white mb-4 tracking-tight leading-tight">Sync Complete</h2>
                            <p className="text-[16px] text-white/60 mb-10 leading-relaxed font-medium">
                                The images are secured in the cloud. The Desktop Portal has been signaled to begin the AI orchestration process.
                            </p>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-white text-black py-4.5 rounded-xl font-bold text-[16px] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
                            >
                                Close Scanner
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function CapturePage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-[#0A0A0A]" />}>
            <CaptureFlowContent />
        </Suspense>
    );
}