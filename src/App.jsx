import React, { useState, useEffect, useRef, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactComponent from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import SolidGauge from 'highcharts/modules/solid-gauge';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format, addDays, differenceInDays } from 'date-fns';
import { jsPDF } from 'jspdf';

// Defensive exports
const HighchartsReact = HighchartsReactComponent.default || HighchartsReactComponent;

// Destructure Lucide icons defensively
const {
  Plus,
  CheckCircle2,
  Trophy,
  Calendar: CalendarIcon,
  ChevronLeft,
  Trash2,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  Hexagon,
  Award,
  Layers,
  LayoutGrid: Layout,
  X,
  Download,
  FileText
} = Lucide;

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  const hMore = HighchartsMore.default || HighchartsMore;
  const sGauge = SolidGauge.default || SolidGauge;

  if (typeof hMore === 'function') hMore(Highcharts);
  if (typeof sGauge === 'function') sGauge(Highcharts);
}

const STORAGE_KEY = 'tailwind-premium-v5';

const quotes = [
  "Small progress is still progress.",
  "Stay consistent, stay unstoppable.",
  "Success starts with daily habits.",
  "Every day counts.",
  "Keep going, no matter what.",
  "Discipline creates freedom.",
  "Focus on progress, not perfection.",
  "One step at a time.",
  "Great things take time.",
  "Build habits, build success.",
  "Stay committed to your goals.",
  "Push yourself every day.",
  "Consistency beats motivation.",
  "Progress over excuses.",
  "Keep showing up.",
  "Hard work pays off.",
  "Your effort matters.",
  "Believe in your journey.",
  "Growth happens daily.",
  "Stay focused, stay strong.",
  "Make today count.",
  "Small wins matter.",
  "Trust the process.",
  "Effort creates results.",
  "Success is built daily.",
  "Keep improving yourself.",
  "Be better than yesterday.",
  "Stay hungry for success.",
  "One day or day one.",
  "Action creates change.",
  "Stay dedicated always.",
  "Progress never stops.",
  "Build your future today.",
  "Keep your momentum going.",
  "Work hard, stay humble.",
  "Stay patient and consistent.",
  "You are getting stronger.",
  "Keep moving forward.",
  "Do it every day.",
  "Make it happen.",
  "Stay disciplined always.",
  "Never skip your goal.",
  "Success loves consistency.",
  "Be proud of your effort.",
  "Keep your streak alive.",
  "Show up for yourself.",
  "Stay committed daily.",
  "Your goals need action.",
  "Keep pushing forward.",
  "You've got this!"
];

function PremiumStat({ value, label, icon: Icon, colorClass }) {
  if (!Icon) return null;
  return (
    <div className="bg-white border border-[#E4E7EC] p-5 sm:p-6 rounded-2xl flex items-center gap-5 sm:gap-6 shadow-sm hover:shadow-md transition-shadow group flex-1">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${colorClass} group-hover:rotate-6 transition-transform flex-shrink-0`}>
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl sm:text-3xl font-black text-[#0B0E1E] leading-none mb-1 tracking-tighter truncate">{value}</div>
        <div className="text-[10px] font-extrabold text-[#98A2B3] uppercase tracking-[0.2em] truncate">{label}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [challenges, setChallenges] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    // Migrate old data: ensure missedDays array exists
    const parsed = JSON.parse(saved);
    return parsed.map(c => ({
      ...c,
      missedDays: c.missedDays || []
    }));
  });

  const [activeId, setActiveId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quote, setQuote] = useState("");
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  const addChallenge = (title, duration, startDate) => {
    const newChallenge = {
      id: Date.now().toString(),
      title,
      duration: parseInt(duration),
      startDate: startDate || format(new Date(), 'yyyy-MM-dd'),
      completedDays: [],
      missedDays: []
    };
    setChallenges(prev => [newChallenge, ...prev]);
    setIsCreating(false);
  };

  const deleteChallenge = (id) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const toggleDay = (cId, day) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === cId) {
        const has = c.completedDays.includes(day);
        if (!has) triggerSuccess();
        return {
          ...c,
          completedDays: has ? c.completedDays.filter(d => d !== day) : [...c.completedDays, day],
          // Remove from missedDays if marking as completed
          missedDays: has ? c.missedDays : c.missedDays.filter(d => d !== day)
        };
      }
      return c;
    }));
  };

  const toggleMissed = (cId, day) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === cId) {
        const isMissed = (c.missedDays || []).includes(day);
        return {
          ...c,
          missedDays: isMissed
            ? c.missedDays.filter(d => d !== day)
            : [...(c.missedDays || []), day],
          // Remove from completedDays if marking as missed
          completedDays: isMissed ? c.completedDays : c.completedDays.filter(d => d !== day)
        };
      }
      return c;
    }));
  };

  const triggerSuccess = () => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setShowConfetti(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#0A58FF', '#FF3D71'] });
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const activeChallenge = challenges.find(c => c.id === activeId);
  const totalCompleted = challenges.reduce((sum, c) => sum + c.completedDays.length, 0);
  const totalPossible = challenges.reduce((sum, c) => sum + c.duration, 0);
  const globalPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-10 sm:mb-16">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B0E1E] text-white rounded-[1rem] sm:rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
            <Hexagon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B0E1E] leading-none">Challenge Tracker</h1>
          </div>
        </div>
        {!activeId && (
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2 group text-xs sm:text-base px-5 sm:px-6 py-3 sm:py-3.5">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">Launch Mission</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </nav>

      <AnimatePresence mode="wait">
        {activeChallenge ? (
          <motion.div key="detail" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
            <ChallengeDetail challenge={activeChallenge} onBack={() => setActiveId(null)} onToggle={toggleDay} onToggleMissed={toggleMissed} onDelete={deleteChallenge} isMobile={isMobile} />
          </motion.div>
        ) : challenges.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="mx-auto max-w-lg w-full text-center bg-white border-2 border-dashed border-[#E4E7EC] rounded-[2.5rem] p-10 sm:p-24 shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F0F4FF] rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 sm:mb-8 shadow-inner">
                <Layers size={32} className="sm:w-10 sm:h-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B0E1E] mb-3 sm:mb-4">No Active Missions</h2>
              <p className="text-[#475467] text-sm sm:text-base font-medium mb-8 sm:mb-10 max-w-xs mx-auto">Build consistency through a 25, 50, or 100-day journey.</p>
              <button onClick={() => setIsCreating(true)} className="btn-primary w-full max-w-xs text-base sm:text-lg py-4 sm:py-5 shadow-2xl">
                Initialize Journey
              </button>
            </div>
          </div>
        ) : (
          <motion.div key="hub" className="space-y-8 sm:space-y-12">
            {/* Summary Highlights */}
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="card-premium p-4 sm:p-10 bg-white lg:col-span-2 overflow-hidden">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#98A2B3] mb-4 sm:mb-6 text-center lg:text-left">Global Intensity Score</p>
                <div className="h-64  sm:h-72">
                  {HighchartsReact && <HighchartsReact highcharts={Highcharts} options={getGaugeOptions(globalPercentage, 100, isMobile)} />}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-6">
                <PremiumStat value={challenges.length} label="Missions" icon={Layout} colorClass="bg-blue-50 text-blue-600" />
                <PremiumStat value={totalCompleted} label="Check-ins" icon={Zap} colorClass="bg-red-50 text-red-600" />
                <PremiumStat value={challenges.filter(c => c.completedDays.length === c.duration).length} label="Achieved" icon={Award} colorClass="bg-amber-50 text-amber-600" />
              </div>
            </div>

            {/* List Section */}
            <div>
              <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.25em] text-[#98A2B3] mb-6 sm:mb-8 px-2 sm:px-0">Current Architectures</h3>
              <div className="grid md:grid-cols-2 gap-6 sm:gap-10">
                {challenges.map(c => (
                  <ChallengeCard key={c.id} challenge={c} onClick={() => setActiveId(c.id)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && <CreateModal onClose={() => setIsCreating(false)} onSubmit={addChallenge} />}
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-white/10 backdrop-blur-[2px] p-4">
            <div className="card-premium p-8 sm:p-12 bg-white text-center shadow-3xl border-b-8 border-primary max-w-sm w-full">
              <div className="flex items-center justify-center mb-5 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary">
                  <Trophy size={28} className="sm:w-8 sm:h-8" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 text-[#0B0E1E]">Elite Move!</h3>
              <p className="text-base sm:text-lg italic font-medium opacity-70">"{quote}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChallengeCard({ challenge, onClick }) {
  const pct = Math.round((challenge.completedDays.length / challenge.duration) * 100);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="card-premium p-6 sm:p-10 cursor-pointer bg-white group border-2 border-transparent hover:border-primary/10"
    >
      <div className="flex justify-between items-start mb-8 sm:mb-10">
        <h3 className="text-xl sm:text-2xl font-black text-[#0B0E1E] leading-tight tracking-tight max-w-[80%] line-clamp-2">{challenge.title}</h3>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/5 whitespace-nowrap">
          {challenge.duration}D
        </span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-end justify-between">
          <div className="text-[10px] sm:text-[11px] font-black text-[#98A2B3] uppercase tracking-wider">Matrix</div>
          <div className="text-lg sm:text-xl font-black text-primary">{pct}%</div>
        </div>
        <div className="h-2 sm:h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-primary" />
        </div>
      </div>
    </motion.div>
  );
}

function ChallengeDetail({ challenge, onBack, onToggle, onToggleMissed, onDelete, isMobile }) {
  const days = Array.from({ length: challenge.duration }, (_, i) => i + 1);
  const pct = Math.round((challenge.completedDays.length / challenge.duration) * 100);
  const missedCount = (challenge.missedDays || []).length;

  // Popup state: which day tile is showing the action popup
  const [popupDay, setPopupDay] = useState(null);
  const popupRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupDay(null);
      }
    };
    if (popupDay !== null) {
      document.addEventListener('pointerdown', handleClickOutside);
      return () => document.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [popupDay]);

  const handleDayClick = useCallback((day, future) => {
    if (future) return;
    setPopupDay(prev => prev === day ? null : day);
  }, []);

  const handleComplete = useCallback((day) => {
    onToggle(challenge.id, day);
    setPopupDay(null);
  }, [onToggle, challenge.id]);

  const handleMissed = useCallback((day) => {
    onToggleMissed(challenge.id, day);
    setPopupDay(null);
  }, [onToggleMissed, challenge.id]);

  // PDF Report Generation
  const generatePDF = useCallback(() => {
    // Explicitly set A4 format
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header accent bar
    doc.setFillColor(10, 88, 255);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(11, 14, 30);
    doc.text('Challenge Report', margin, y + 8);
    y += 14;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(152, 162, 179);
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(228, 231, 236);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Challenge Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 14, 30);
    doc.text(challenge.title, margin, y);
    y += 8;

    // Compact Stats Grid (2 Columns)
    const col2X = pageWidth / 2 + 5;
    
    doc.setFontSize(8);
    
    let leftY = y;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('DURATION', margin, leftY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(`${challenge.duration} Days`, margin + 35, leftY + 4);
    leftY += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('START DATE', margin, leftY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(format(new Date(challenge.startDate), 'MMM d, yyyy'), margin + 35, leftY + 4);
    leftY += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('END DATE', margin, leftY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(format(addDays(new Date(challenge.startDate), challenge.duration - 1), 'MMM d, yyyy'), margin + 35, leftY + 4);
    leftY += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('COMPLETION', margin, leftY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(`${pct}%`, margin + 35, leftY + 4);

    let rightY = y;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('COMPLETED', col2X, rightY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(`${challenge.completedDays.length}`, col2X + 30, rightY + 4);
    rightY += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('MISSED', col2X, rightY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(`${missedCount}`, col2X + 30, rightY + 4);
    rightY += 6;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(152, 162, 179); doc.text('REMAINING', col2X, rightY + 4);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 14, 30); doc.text(`${challenge.duration - challenge.completedDays.length - missedCount}`, col2X + 30, rightY + 4);

    y = Math.max(leftY, rightY) + 8;

    // Progress Bar
    doc.setDrawColor(228, 231, 236);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 5, 2.5, 2.5, 'F');

    if (pct > 0) {
      doc.setFillColor(10, 88, 255);
      const barWidth = Math.max(5, ((pageWidth - 2 * margin) * pct) / 100);
      doc.roundedRect(margin, y, barWidth, 5, 2.5, 2.5, 'F');
    }
    y += 12;

    // Day-by-Day Log Section — Calendar Grid View
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 14, 30);
    doc.text('Day-by-Day Matrix', margin, y);
    y += 8;

    // Calendar grid config optimized to fit exactly 15 rows (105 days) on one page
    const cols = 7;
    const cellW = (pageWidth - 2 * margin) / cols;
    
    // Total vertical space left = ~297 - y(90) - legend(10) = ~197 max.
    const cellH = 12.2; 
    const gap = 1;

    days.forEach((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellX = margin + col * cellW;
      const cellY = y + row * (cellH + gap);

      // Page overflow for > 100 days
      if (cellY + cellH > 282) {
        doc.addPage();
        const rowsDrawn = row;
        y = 15 - rowsDrawn * (cellH + gap);
      }

      const actualCellY = y + row * (cellH + gap);
      const done = challenge.completedDays.includes(d);
      const missed = (challenge.missedDays || []).includes(d);
      const dayDate = addDays(new Date(challenge.startDate), d - 1);
      const dateStr = format(dayDate, 'MMM d');

      // Cell background
      if (done) {
        doc.setFillColor(10, 88, 255);
        doc.roundedRect(cellX + 0.5, actualCellY, cellW - 1, cellH, 2, 2, 'F');
      } else if (missed) {
        doc.setFillColor(255, 61, 113);
        doc.roundedRect(cellX + 0.5, actualCellY, cellW - 1, cellH, 2, 2, 'F');
      } else {
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(228, 231, 236);
        doc.roundedRect(cellX + 0.5, actualCellY, cellW - 1, cellH, 2, 2, 'FD');
      }

      const centerX = cellX + cellW / 2;

      // Day number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(done || missed ? 255 : 11, done || missed ? 255 : 14, done || missed ? 255 : 30);
      doc.text(`${d}`, centerX, actualCellY + 4.5, { align: 'center' });

      // Date below day number
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(done || missed ? 220 : 152, done || missed ? 220 : 162, done || missed ? 220 : 179);
      doc.text(dateStr, centerX, actualCellY + 7.5, { align: 'center' });

      // Tick / Cross icon
      if (done) {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.6);
        const ix = centerX;
        const iy = actualCellY + 10;
        doc.line(ix - 2, iy - 0.5, ix - 0.5, iy + 1);
        doc.line(ix - 0.5, iy + 1, ix + 2, iy - 1.5);
      } else if (missed) {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.6);
        const ix = centerX;
        const iy = actualCellY + 10;
        doc.line(ix - 1.5, iy - 1.5, ix + 1.5, iy + 1.5);
        doc.line(ix + 1.5, iy - 1.5, ix - 1.5, iy + 1.5);
      }
    });

    // Legend below grid
    const totalRowsFor100 = Math.ceil(Math.min(days.length, 105) / cols);
    let legendY = y + totalRowsFor100 * (cellH + gap) + 4;
    
    // Only wrap to next page if the grid ended right at the bottom
    if (legendY > 288) {
      doc.addPage();
      legendY = 20;
    }

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');

    // Completed legend
    doc.setFillColor(10, 88, 255);
    doc.roundedRect(margin, legendY, 5, 5, 1, 1, 'F');
    doc.setTextColor(100, 100, 100);
    doc.text('Completed', margin + 7, legendY + 3.5);

    // Missed legend
    doc.setFillColor(255, 61, 113);
    doc.roundedRect(margin + 30, legendY, 5, 5, 1, 1, 'F');
    doc.text('Missed', margin + 37, legendY + 3.5);

    // Remaining legend
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(228, 231, 236);
    doc.roundedRect(margin + 55, legendY, 5, 5, 1, 1, 'FD');
    doc.text('Remaining', margin + 62, legendY + 3.5);

    legendY += 12;

    // Motivational quote
    if (legendY > 285) {
      doc.addPage();
      legendY = 20;
    }
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(152, 162, 179);
    doc.text(`"${randomQuote}"`, pageWidth / 2, legendY, { align: 'center' });

    // Footer accent bar
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFillColor(10, 88, 255);
      doc.rect(0, 292, pageWidth, 5, 'F');
    }

    doc.save(`${challenge.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`);
  }, [challenge, pct, missedCount, days]);

  return (
    <div className="space-y-8 sm:space-y-12 pb-10">
      <div className="flex justify-between items-center bg-white/50 p-1.5 sm:p-2 rounded-2xl">
        <button onClick={onBack} className="flex items-center gap-2 sm:gap-3 font-bold text-xs sm:text-sm text-[#475467] hover:text-[#0B0E1E] transition-colors pl-2">
          <ChevronLeft size={18} />
          <span>Exit</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={generatePDF} className="flex items-center gap-1.5 sm:gap-2 text-primary font-extrabold text-[10px] sm:text-xs hover:bg-primary/5 px-3 sm:px-4 py-2 rounded-xl transition-colors">
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button onClick={() => window.confirm('Permanently delete?') && onDelete(challenge.id)} className="text-accent font-extrabold text-[10px] sm:text-xs opacity-40 hover:opacity-100 transition-opacity pr-2">
            DELETE MISSION
          </button>
        </div>
      </div>

      <div className="card-premium p-4 sm:p-14 bg-white flex flex-col md:flex-row gap-8 sm:gap-12 items-center overflow-hidden">
        <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6 w-full">
          <div>
            <span className="bg-primary/5 text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-[2px] px-3 py-1 sm:py-1.5 rounded-full border border-primary/10">Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0B0E1E] leading-tight">{challenge.title}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#F8FAFF] text-[#475467] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold border border-[#E4E7EC]">
              <CalendarIcon size={14} className="sm:w-4 sm:h-4" /> {format(new Date(challenge.startDate), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-primary/5 text-primary rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold border border-primary/10">
              <Target size={14} className="sm:w-4 sm:h-4" /> {challenge.completedDays.length} / {challenge.duration}
            </div>
            {missedCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold border border-red-100">
                <X size={14} className="sm:w-4 sm:h-4" /> {missedCount} Missed
              </div>
            )}
          </div>
        </div>
        <div className="w-full sm:w-64 h-64  sm:h-64 flex-shrink-0">
          {HighchartsReact && <HighchartsReact highcharts={Highcharts} options={getGaugeOptions(pct, 100, isMobile)} />}
        </div>
      </div>

      <div className="card-premium p-6 sm:p-12 bg-white">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 sm:gap-3">
            <Layout className="text-primary w-5 h-5 sm:w-6 sm:h-6" /> Log
          </h3>
          <div className="text-[9px] sm:text-[11px] font-black text-[#98A2B3] uppercase tracking-widest bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#E4E7EC]/50">Check-in Log</div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2.5 sm:gap-4">
          {days.map(d => {
            const done = challenge.completedDays.includes(d);
            const missed = (challenge.missedDays || []).includes(d);
            const date = addDays(new Date(challenge.startDate), d - 1);
            const future = differenceInDays(date, new Date()) > 0;
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isPopupOpen = popupDay === d;

            return (
              <div key={d} className="relative">
                <motion.div
                  whileTap={!future ? { scale: 0.95 } : {}}
                  onClick={() => handleDayClick(d, future)}
                  className={`
                     aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border-2 relative overflow-hidden group select-none
                     ${done ? 'bg-primary border-primary text-white shadow-lg' : ''}
                     ${missed ? 'bg-accent border-accent text-white shadow-lg' : ''}
                     ${!done && !missed ? 'bg-white border-[#E4E7EC]' : ''}
                     ${future ? 'opacity-30 border-dashed cursor-not-allowed grayscale bg-slate-50' : ''}
                     ${isToday && !done && !missed ? 'border-primary ring-4 ring-primary/10 shadow-lg' : ''}
                     ${isPopupOpen ? 'ring-4 ring-primary/30 z-10' : ''}
                   `}
                >
                  <span className={`text-base sm:text-lg font-black leading-none ${done || missed ? 'text-white' : future ? 'text-slate-300' : 'text-[#0B0E1E]'}`}>{d}</span>
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase text-center w-full mt-0.5 sm:mt-1 ${done || missed ? 'text-white/70' : 'text-[#98A2B3]'}`}>{format(date, 'MMM d')}</span>

                  {done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5 sm:mt-1">
                      <CheckCircle2 size={12} strokeWidth={3} className="text-white sm:w-3.5 sm:h-3.5" />
                    </motion.div>
                  )}

                  {missed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5 sm:mt-1">
                      <X size={12} strokeWidth={3} className="text-white sm:w-3.5 sm:h-3.5" />
                    </motion.div>
                  )}

                  {isToday && !done && !missed && (
                    <div className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-primary"></span>
                    </div>
                  )}
                </motion.div>

                {/* Action Popup */}
                <AnimatePresence>
                  {isPopupOpen && (
                    <motion.div
                      ref={popupRef}
                      initial={{ opacity: 0, scale: 0.85, y: 4, x: "-50%" }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                      exit={{ opacity: 0, scale: 0.85, y: 4, x: "-50%" }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 bottom-full mb-2 z-50 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-[#E4E7EC] p-1.5 sm:p-2 flex gap-1.5 sm:gap-2 min-w-max"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComplete(d); }}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold transition-all ${done ? 'bg-primary text-white' : 'bg-blue-50 text-primary hover:bg-primary hover:text-white'}`}
                      >
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        <span>{done ? 'Undo' : 'Complete'}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMissed(d); }}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold transition-all ${missed ? 'bg-accent text-white' : 'bg-red-50 text-red-500 hover:bg-accent hover:text-white'}`}
                      >
                        <X size={14} strokeWidth={2.5} />
                        <span>{missed ? 'Undo' : 'Missed'}</span>
                      </button>
                      {/* Popup arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2.5 h-2.5 bg-white border-r border-b border-[#E4E7EC] rotate-45 -mt-[5px]"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#E4E7EC]/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-primary"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded bg-accent"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider">Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border-2 border-primary ring-2 ring-primary/20"></div>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState('30');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#0B0E1E]/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="card-premium w-full max-w-lg p-8 sm:p-14 bg-white relative z-10 shadow-3xl">
        <h2 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-10 tracking-tight text-[#0B0E1E]">New Journey</h2>
        <div className="space-y-8 sm:space-y-10">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#98A2B3] mb-3 block">Challenge Focus</label>
            <input type="text" placeholder="e.g. Morning Meditation" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-[#E4E7EC] focus:border-primary outline-none py-2 transition-colors" autoFocus />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#98A2B3] mb-3 block">Duration</label>
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              {['25', '50', '100'].map(p => (
                <button key={p} onClick={() => setDays(p)} className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm transition-all border-2 ${days === p ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-transparent text-[#475467]'}`}>{p}D</button>
              ))}
            </div>
            <input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-full text-lg font-bold text-center bg-[#F8FAFF] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E4E7EC]" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#98A2B3] mb-3 block">Start Date</label>
            <div className="relative">
              <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-lg font-bold bg-[#F8FAFF] p-3 sm:p-4 pl-11 rounded-xl sm:rounded-2xl border border-[#E4E7EC] text-[#0B0E1E] focus:border-primary outline-none transition-colors appearance-none"
              />
            </div>
          </div>
          <button disabled={!title} onClick={() => onSubmit(title, days, startDate)} className="btn-primary w-full py-4 text-base sm:text-lg shadow-2xl flex items-center justify-center gap-2 group">
            <span>Initialize System</span>
            <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getGaugeOptions(value, max = 100, isMobile = false) {
  return {
    chart: {
      type: 'solidgauge',
      backgroundColor: 'transparent',
      height: isMobile ? 250 : null,
      spacing: [0, 0, 0, 0]
    },
    title: null,
    credits: { enabled: false },
    tooltip: { enabled: false },
    pane: {
      center: ['50%', '50%'],
      size: isMobile ? '70%' : '100%',
      startAngle: 0,
      endAngle: 360,
      background: {
        backgroundColor: '#F3F4F6',
        innerRadius: '80%',
        outerRadius: '100%',
        shape: 'circle',
        borderWidth: 0
      }
    },
    yAxis: {
      min: 0,
      max: max,
      stops: [
        [0.1, '#0A58FF'], // Bright Blue
        [0.5, '#4facfe'], // Medium Blue
        [0.9, '#00f2fe']  // Cyan
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      labels: { enabled: false }
    },
    plotOptions: {
      solidgauge: {
        rounded: true,
        dataLabels: {
          y: isMobile ? -16 : -24,
          borderWidth: 0,
          useHTML: true,
          format: `<div style="text-align:center"><span style="font-size:${isMobile ? '28px' : '38px'};color:#0B0E1E;font-weight:900;display:block;line-height:1">{y}%</span>` +
            `<span style="font-size:${isMobile ? '8px' : '9px'};color:#98A2B3;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-top:6px;display:block">Intensity</span></div>`
        }
      }
    },
    series: [{
      name: 'Progress',
      data: [value],
      innerRadius: '80%',
      outerRadius: '100%',
      dataLabels: {
        borderWidth: 0
      }
    }]
  };
}
