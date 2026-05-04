import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import {
  Globe, Menu, X, ChevronRight, Play, Clock, Users,
  Star, Zap, Check, Crown, Sparkles, ArrowRight, Share2, RotateCcw,
  Copy, Target, Flame, Trophy, Brain, ChevronDown,
  Moon, Sun, Search, Bell, Gift, Medal, BookOpen, Calendar,
  ChevronLeft, Plus, Minus, LogIn, UserPlus, XCircle,
  Timer, Edit3, Trash2, Swords, MessageSquare, HelpCircle,
  SkipForward, Eye, QrCode, Send, Package, Heart
} from 'lucide-react';
import { translations, expandedQuizzes as defaultQuizzes, categories, languages, Quiz } from './data';

/* ===== USER SYSTEM ===== */
interface UserData {
  username: string; email: string; joinedAt: string;
  xp: number; level: number; streak: number; lastLogin: string;
  quizzesTaken: number; quizzesCreated: number; badges: string[];
  results: { quizId: string; result: string; date: string; score: number; timeSpent: number }[];
  referralCode: string; onboarded: boolean; soundOn: boolean;
  customQuizzes: Quiz[]; dailyRewardClaimed: string; streakFreeze: number;
  powerups: { fifty: number; skip: number; hint: number };
  comments: { quizId: string; text: string; date: string; rating: number }[];
}
const DEFAULT_USER: UserData = {
  username: '', email: '', joinedAt: '', xp: 0, level: 1, streak: 0,
  lastLogin: '', quizzesTaken: 0, quizzesCreated: 0, badges: [],
  results: [], referralCode: '', onboarded: false, soundOn: true,
  customQuizzes: [], dailyRewardClaimed: '', streakFreeze: 1,
  powerups: { fifty: 2, skip: 1, hint: 3 }, comments: [],
};
function getUser(): UserData | null { try { const d = localStorage.getItem('vm-user'); return d ? JSON.parse(d) : null; } catch { return null; } }
function saveUser(u: UserData) { localStorage.setItem('vm-user', JSON.stringify(u)); }
function xpForLevel(lvl: number) { return lvl * 100 + (lvl - 1) * 50; }
function levelFromXp(totalXp: number) { let lvl = 1, xp = totalXp, needed = xpForLevel(1); while (xp >= needed) { xp -= needed; lvl++; needed = xpForLevel(lvl); } return { level: lvl, currentXp: xp, nextLevelXp: needed }; }

/* ===== SOUND SYSTEM ===== */
function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => { if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); return ctxRef.current; };
  const play = useCallback((type: 'correct' | 'wrong' | 'complete' | 'click' | 'levelup' | 'powerup' | 'reward') => {
    try {
      const user = getUser(); if (user && !user.soundOn) return;
      const ctx = getCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0.08;
      const now = ctx.currentTime;
      switch (type) {
        case 'correct': osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.stop(now + 0.3); break;
        case 'wrong': osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.stop(now + 0.3); break;
        case 'complete': osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.15); osc.frequency.setValueAtTime(784, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); osc.stop(now + 0.6); break;
        case 'levelup': osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554, now + 0.1); osc.frequency.setValueAtTime(659, now + 0.2); osc.frequency.setValueAtTime(880, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7); osc.stop(now + 0.7); break;
        case 'powerup': osc.frequency.setValueAtTime(880, now); osc.frequency.setValueAtTime(1100, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.stop(now + 0.2); break;
        case 'reward': osc.frequency.setValueAtTime(660, now); osc.frequency.setValueAtTime(880, now + 0.15); osc.frequency.setValueAtTime(1100, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); osc.stop(now + 0.5); break;
        default: osc.frequency.setValueAtTime(800, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.stop(now + 0.05);
      }
      osc.start(now);
    } catch {}
  }, []);
  return { play };
}

/* ===== CONFETTI ===== */
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rv: number }> = [];
    for (let i = 0; i < 200; i++) particles.push({ x: Math.random() * canvas.width, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 10, vy: Math.random() * 4 + 2, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 10 + 4, rotation: Math.random() * 360, rv: (Math.random() - 0.5) * 12 });
    let frame: number;
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); let alive = false;
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rv; if (p.y < canvas.height + 20) alive = true; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore(); });
      if (alive) frame = requestAnimationFrame(animate);
    }; animate(); return () => cancelAnimationFrame(frame);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-[200] pointer-events-none" />;
}

/* ===== VIRAL SHARE CARD (Instagram Story Format) ===== */
function ViralShareCard({ result, quiz, onClose }: { result: string; quiz: Quiz; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const shareText = `I got "${result}" on ${quiz.title.en}! 🧠 Can you beat me? Take the quiz on ViralMind!`;
  const shareUrl = `https://viralmind.com/quiz/${quiz.id}?ref=${getUser()?.referralCode || 'viral'}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText + '\n' + shareUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Card */}
        <div ref={cardRef} className={`w-80 bg-gradient-to-br ${quiz.color} rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <div className="text-7xl mb-4 animate-bounce">{quiz.emoji}</div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">ViralMind Result</div>
            <div className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk' }}>{result}</div>
            <div className="text-white/80 text-sm mb-6">{quiz.title.en}</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-white text-xs font-mono mb-4">{shareUrl}</div>
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs"><QrCode className="w-4 h-4" /> Scan to play</div>
          </div>
        </div>
        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button onClick={async () => { if (navigator.share) { try { await navigator.share({ title: 'My ViralMind Result', text: shareText, url: shareUrl }); } catch {} } else handleCopy(); }}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Share2 className="w-5 h-5" /> Share Result</button>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleCopy} className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${copied ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
              className="py-2.5 bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">𝕏 Post</button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')}
              className="py-2.5 bg-green-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" /></button>
            <button onClick={onClose} className="py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== CHALLENGE MODAL ===== */
function ChallengeModal({ quiz, open, onClose }: { quiz: Quiz; open: boolean; onClose: () => void }) {
  const [friendName, setFriendName] = useState(''); const { toast } = useToast();
  const user = getUser();
  if (!open) return null;
  const handleChallenge = () => {
    const challengeLink = `https://viralmind.com/challenge/${quiz.id}?from=${user?.referralCode || 'anonymous'}&to=${friendName}`;
    navigator.clipboard?.writeText(`🔥 ${friendName || 'Friend'}, I challenge you to "${quiz.title.en}" on ViralMind! Can you beat my score?\n\n${challengeLink}`);
    toast('Challenge link copied! Send it to your friend! ⚔️', 'success', <Swords className="w-4 h-4" />);
    if (user) { user.xp += 10; saveUser(user); }
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-8 text-center">
          <Swords className="w-14 h-14 text-white mx-auto mb-3" />
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>Challenge a Friend!</h2>
          <p className="text-white/70 text-sm mt-1">Send a challenge and earn +10 XP</p>
        </div>
        <div className="p-6 space-y-4">
          <div className={`bg-gradient-to-br ${quiz.color} rounded-xl p-4 flex items-center gap-3`}>
            <span className="text-3xl">{quiz.emoji}</span>
            <div><div className="font-bold text-white text-sm">{quiz.title.en}</div><div className="text-white/60 text-xs">{quiz.questions.length} questions</div></div>
          </div>
          <input value={friendName} onChange={e => setFriendName(e.target.value)} placeholder="Friend's name (optional)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white" />
          <button onClick={handleChallenge} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            <Send className="w-5 h-5" /> Send Challenge (+10 XP)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== DAILY REWARD WHEEL ===== */
function DailyRewardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const { toast } = useToast();
  const { play } = useSound();
  const rewards = [
    { label: '+25 XP', value: 25, type: 'xp', color: 'bg-violet-500', emoji: '⚡' },
    { label: '+50 XP', value: 50, type: 'xp', color: 'bg-purple-500', emoji: '💎' },
    { label: '1x 50/50', value: 1, type: 'fifty', color: 'bg-blue-500', emoji: '🎯' },
    { label: '+100 XP', value: 100, type: 'xp', color: 'bg-pink-500', emoji: '🔥' },
    { label: '1x Skip', value: 1, type: 'skip', color: 'bg-green-500', emoji: '⏭️' },
    { label: '+10 XP', value: 10, type: 'xp', color: 'bg-amber-500', emoji: '✨' },
    { label: '1x Hint', value: 1, type: 'hint', color: 'bg-cyan-500', emoji: '💡' },
    { label: 'JACKPOT +200', value: 200, type: 'xp', color: 'bg-red-500', emoji: '🎰' },
  ];
  const [rotation, setRotation] = useState(0);

  // Check on open if already claimed today
  useEffect(() => {
    if (open) {
      const user = getUser();
      if (user && user.dailyRewardClaimed === new Date().toDateString()) {
        setAlreadyClaimed(true);
      } else {
        setAlreadyClaimed(false);
      }
      setReward(null);
    }
  }, [open]);

  if (!open) return null;

  // Calculate next reward time
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / 3600000);
  const minutesLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % 3600000) / 60000);

  const spin = () => {
    if (spinning || alreadyClaimed) return;
    const user = getUser();
    if (!user) { toast('Please sign up first! 🔐', 'warning'); return; }
    if (user.dailyRewardClaimed === new Date().toDateString()) {
      setAlreadyClaimed(true); return;
    }
    setSpinning(true);
    setReward(null);
    const winIndex = Math.floor(Math.random() * rewards.length);
    // Calculate exact rotation to land on the winning segment
    const segmentAngle = 360 / rewards.length;
    const targetAngle = 360 - (winIndex * segmentAngle) - segmentAngle / 2;
    const fullSpins = 360 * 6; // 6 full rotations for drama
    setRotation(fullSpins + targetAngle);
    play('reward');

    setTimeout(() => {
      setSpinning(false);
      const r = rewards[winIndex];
      setReward(r.label);
      setAlreadyClaimed(true);

      // Apply reward
      if (r.type === 'xp') user.xp += r.value;
      else if (r.type === 'fifty') user.powerups.fifty += 1;
      else if (r.type === 'skip') user.powerups.skip += 1;
      else if (r.type === 'hint') user.powerups.hint += 1;
      user.dailyRewardClaimed = new Date().toDateString();
      user.level = levelFromXp(user.xp).level;
      saveUser(user);
      toast(`You won ${r.label}! 🎉`, 'success', <Gift className="w-4 h-4" />);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-1 rounded-lg bg-white/20 hover:bg-white/30"><X className="w-4 h-4 text-white" /></button>
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 text-center">
          <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>🎰 Daily Reward</h2>
          <p className="text-white/70 text-sm">1 free spin every day!</p>
        </div>
        <div className="p-6">
          {/* Wheel */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            {/* Outer ring glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 opacity-60 blur-sm" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 overflow-hidden bg-gray-800"
              style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.6, 0.15, 1)' : 'none' }}>
              {rewards.map((r, i) => {
                const segAngle = 360 / rewards.length;
                const startAngle = i * segAngle;
                return (
                  <div key={i} className="absolute inset-0" style={{ transform: `rotate(${startAngle}deg)` }}>
                    <div className={`absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left ${r.color}`}
                      style={{ transform: `rotate(0deg) skewY(${-(90 - segAngle)}deg)` }}>
                    </div>
                    {/* Label */}
                    <div className="absolute top-[18%] left-1/2 -translate-x-1/2" style={{ transform: `rotate(${segAngle / 2}deg)`, transformOrigin: '0 130px' }}>
                      <span className="text-lg">{r.emoji}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Pointer */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg" />
            </div>
            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-amber-400">
                <span className="text-2xl">{spinning ? '🌀' : reward ? '🎉' : '🎰'}</span>
              </div>
            </div>
          </div>

          {/* Result */}
          {reward && (
            <div className="text-center mb-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-700">
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">You won!</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 animate-bounce">{reward}</div>
            </div>
          )}

          {/* Already claimed message */}
          {alreadyClaimed && !reward && (
            <div className="text-center mb-4 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Already spun today!</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">⏰ Next spin in {hoursLeft}h {minutesLeft}m</div>
            </div>
          )}

          {/* Spin button */}
          <button onClick={spin} disabled={spinning || alreadyClaimed}
            className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 text-lg transition-all ${
              spinning ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' :
              alreadyClaimed ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' :
              'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5'
            }`}>
            {spinning ? '🌀 Spinning...' : alreadyClaimed ? `⏰ Come back in ${hoursLeft}h ${minutesLeft}m` : '🎰 SPIN THE WHEEL!'}
          </button>

          {/* Rewards preview */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {rewards.map((r, i) => (
              <div key={i} className="text-center">
                <div className={`w-full aspect-square ${r.color} rounded-lg flex items-center justify-center text-lg`}>{r.emoji}</div>
                <div className="text-[10px] text-gray-400 mt-1 truncate">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== QUIZ RATING & COMMENTS ===== */
function QuizComments({ quizId }: { quizId: string }) {
  const [comments, setComments] = useState<Array<{ user: string; text: string; rating: number; date: string }>>([]);
  const [newComment, setNewComment] = useState(''); const [rating, setRating] = useState(5);
  const { toast } = useToast();
  const user = getUser();

  useEffect(() => {
    const stored = localStorage.getItem(`vm-comments-${quizId}`);
    if (stored) setComments(JSON.parse(stored));
    else setComments([
      { user: 'QuizLover99', text: 'This quiz is so accurate! 🤯', rating: 5, date: '2 hours ago' },
      { user: 'MindExplorer', text: 'Shared with all my friends!', rating: 5, date: '5 hours ago' },
      { user: 'TriviaFan', text: 'Really fun, would recommend!', rating: 4, date: '1 day ago' },
    ]);
  }, [quizId]);

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    const c = { user: user.username, text: newComment, rating, date: 'Just now' };
    const updated = [c, ...comments]; setComments(updated);
    localStorage.setItem(`vm-comments-${quizId}`, JSON.stringify(updated));
    if (user) { user.comments.push({ quizId, text: newComment, date: new Date().toISOString(), rating }); user.xp += 5; saveUser(user); }
    setNewComment(''); toast('Comment posted! +5 XP 💬', 'success', <MessageSquare className="w-4 h-4" />);
  };

  const avgRating = comments.length > 0 ? (comments.reduce((a, c) => a + c.rating, 0) / comments.length).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Comments</h3>
        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-bold text-gray-900 dark:text-white text-sm">{avgRating}</span><span className="text-gray-400 text-xs">({comments.length})</span></div>
      </div>
      {user && (<div className="mb-4">
        <div className="flex items-center gap-1 mb-2">{[1, 2, 3, 4, 5].map(s => (<button key={s} onClick={() => setRating(s)}><Star className={`w-5 h-5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} /></button>))}</div>
        <div className="flex gap-2"><input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <button onClick={handleSubmit} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold"><Send className="w-4 h-4" /></button></div>
      </div>)}
      <div className="space-y-3 max-h-48 overflow-y-auto">{comments.map((c, i) => (<div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.user.charAt(0)}</div>
        <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900 dark:text-white text-sm">{c.user}</span><div className="flex">{Array.from({ length: c.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div><span className="text-xs text-gray-400">{c.date}</span></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p></div>
      </div>))}</div>
    </div>
  );
}

/* ===== SOCIAL PROOF POPUP ===== */
function SocialProofPopup() {
  const [show, setShow] = useState(false); const [data, setData] = useState({ name: '', country: '', result: '', quiz: '' });
  const { lang } = useLang();
  useEffect(() => {
    const names = ['Alex', 'Maria', 'Yuki', 'Ahmet', 'Sophie', 'Carlos', 'Emma', 'Wei', 'Priya', 'Anna'];
    const countries = ['🇺🇸', '🇧🇷', '🇯🇵', '🇹🇷', '🇫🇷', '🇪🇸', '🇬🇧', '🇨🇳', '🇮🇳', '🇩🇪'];
    const results = ['The Thinker 🤔', 'True Extrovert 🎉', 'Tony Stark 🦾', 'Deep Introvert 🏠', 'Spain 🇪🇸', 'Genius Level 🧠'];
    const showPopup = () => {
      const q = defaultQuizzes[Math.floor(Math.random() * defaultQuizzes.length)];
      setData({ name: names[Math.floor(Math.random() * names.length)], country: countries[Math.floor(Math.random() * countries.length)], result: results[Math.floor(Math.random() * results.length)], quiz: q.title[lang] || q.title.en });
      setShow(true); setTimeout(() => setShow(false), 5000);
    };
    const i = setInterval(showPopup, 15000); setTimeout(showPopup, 8000);
    return () => clearInterval(i);
  }, [lang]);
  if (!show) return null;
  return (
    <div className="fixed bottom-20 left-4 z-[70] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 max-w-xs animate-slide-up cursor-pointer" onClick={() => setShow(false)}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{data.country}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-white"><span className="font-bold">{data.name}</span> just got</p>
          <p className="text-sm font-bold text-violet-600 dark:text-violet-400">"{data.result}"</p>
          <p className="text-xs text-gray-400">on {data.quiz}</p>
        </div>
        <button onClick={() => setShow(false)} className="p-1 text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ===== FOMO BANNER ===== */
function FomoBanner() {
  const [count, setCount] = useState(47832);
  useEffect(() => { const i = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 5000); return () => clearInterval(i); }, []);
  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-2.5 text-center text-sm font-medium relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-center gap-2 animate-pulse">
        <Flame className="w-4 h-4" />
        <span><strong>{count.toLocaleString()}</strong> people took a quiz in the last 24 hours! Don't miss out!</span>
        <Flame className="w-4 h-4" />
      </div>
    </div>
  );
}

/* ===== QUIZ PACKS ===== */
function QuizPacks() {
  const { go, setQuiz } = usePage();
  const packs = [
    { title: '🧠 Mind Blowers', desc: 'Quizzes that will change how you see yourself', quizzes: defaultQuizzes.filter(q => q.category === 'personality' || q.category === 'psychology'), color: 'from-purple-600 to-violet-600', count: 0 },
    { title: '💕 Love & Relationships', desc: 'Discover your love language and more', quizzes: defaultQuizzes.filter(q => q.category === 'love'), color: 'from-pink-500 to-rose-500', count: 0 },
    { title: '🎓 Brainiac Zone', desc: 'Test your knowledge and IQ', quizzes: defaultQuizzes.filter(q => q.category === 'knowledge'), color: 'from-blue-500 to-cyan-500', count: 0 },
    { title: '🎮 Just For Fun', desc: 'Pure entertainment guaranteed', quizzes: defaultQuizzes.filter(q => q.category === 'fun' || q.category === 'pop' || q.category === 'food'), color: 'from-amber-500 to-orange-500', count: 0 },
  ];
  packs.forEach(p => p.count = p.quizzes.length);

  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>📦 Quiz Packs</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Curated collections for every mood</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packs.map((pack, i) => (
            <div key={i} className={`bg-gradient-to-br ${pack.color} rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden`}
              onClick={() => { if (pack.quizzes.length > 0) { setQuiz(pack.quizzes[0]); go('play'); } }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-xl font-bold mb-2">{pack.title}</h3>
              <p className="text-white/70 text-sm mb-4">{pack.desc}</p>
              <div className="flex items-center gap-2 text-sm text-white/80"><Package className="w-4 h-4" /> {pack.count} quizzes</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== CONTEXTS ===== */
const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });
function useTheme() { return useContext(ThemeContext); }
const LangContext = createContext<{ lang: string; setLang: (l: string) => void; t: (k: string) => string }>({ lang: 'en', setLang: () => {}, t: (k) => k });
function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(() => localStorage.getItem('vm-lang') || 'en');
  const t = useCallback((k: string) => translations[lang]?.[k] || translations['en']?.[k] || k, [lang]);
  useEffect(() => { localStorage.setItem('vm-lang', lang); }, [lang]);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
function useLang() { return useContext(LangContext); }

interface ToastItem { id: number; msg: string; type: 'success' | 'info' | 'warning' | 'error'; icon?: ReactNode }
const ToastCtx = createContext<{ toast: (m: string, t?: ToastItem['type'], i?: ReactNode) => void }>({ toast: () => {} });
function useToast() { return useContext(ToastCtx); }
function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((msg: string, type: ToastItem['type'] = 'info', icon?: ReactNode) => {
    const id = Date.now() + Math.random(); setItems(p => [...p, { id, msg, type, icon }]);
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return (<ToastCtx.Provider value={{ toast }}>{children}
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-sm pointer-events-none">
      {items.map(t => (<div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-medium animate-slide-right ${t.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : t.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' : t.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-800' : 'bg-white/95 border-gray-200 text-gray-800'}`}>{t.icon || <Bell className="w-4 h-4 flex-shrink-0" />} <span>{t.msg}</span></div>))}
    </div></ToastCtx.Provider>);
}

type Page = 'home' | 'trending' | 'premium' | 'play' | 'profile' | 'create' | 'leaderboard' | 'monetize' | 'community';
const PageCtx = createContext<{ page: Page; go: (p: Page) => void; quiz: Quiz | null; setQuiz: (q: Quiz | null) => void }>({ page: 'home', go: () => {}, quiz: null, setQuiz: () => {} });
function usePage() { return useContext(PageCtx); }

/* ===== SHARED COMPONENTS ===== */
function LiveCounter() { const [c, setC] = useState(12847); useEffect(() => { const i = setInterval(() => setC(v => v + Math.floor(Math.random() * 7) - 3), 3000); return () => clearInterval(i); }, []); return (<span className="inline-flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>{c.toLocaleString()} online</span>); }
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) { const [v, setV] = useState(0); const ref = useRef<HTMLSpanElement>(null); const [s, setS] = useState(false); useEffect(() => { if (!ref.current || s) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setS(true); }, { threshold: 0.3 }); o.observe(ref.current); return () => o.disconnect(); }, [s]); useEffect(() => { if (!s) return; let c = 0; const inc = target / 60; const t = setInterval(() => { c += inc; if (c >= target) { setV(target); clearInterval(t); } else setV(Math.floor(c)); }, 33); return () => clearInterval(t); }, [s, target]); const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString(); return <span ref={ref}>{fmt(v)}{suffix}</span>; }
function XpBar({ xp, level }: { xp: number; level: number }) { const { currentXp, nextLevelXp } = levelFromXp(xp); return (<div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md">{level}</div><div className="flex-1"><div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"><span>Level {level}</span><span>{currentXp}/{nextLevelXp} XP</span></div><div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${(currentXp / nextLevelXp) * 100}%` }} /></div></div></div>); }
/* ===== REAL AD SYSTEM ===== */
function AdBanner({ size = 'large' }: { size?: 'large' | 'small' | 'native' | 'interstitial' }) {
  const adRef = useRef<HTMLDivElement>(null);
  const isPremium = false; // Set true if user is premium subscriber

  // Premium users see no ads
  if (isPremium) return null;

  useEffect(() => {
    // Google AdSense auto-ad injection
    try { (window as any).adsbygoogle = (window as any).adsbygoogle || []; (window as any).adsbygoogle.push({}); } catch {}
  }, []);

  if (size === 'native') {
    return (
      <div ref={adRef} className="my-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📱</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Sponsored</div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Discover More About Yourself</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Take our premium personality assessment and unlock deep insights about your life, career, and relationships.</p>
            <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">Learn More <ChevronRight className="w-3 h-3" /></button>
          </div>
        </div>
        {/* Real AdSense slot would go here:
        <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXX" data-ad-slot={slot || '1234567890'} data-ad-format="fluid" data-full-width-responsive="true"></ins> */}
      </div>
    );
  }

  if (size === 'interstitial') {
    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sponsored</span>
            <span className="text-xs text-gray-400">Ad closes in 5s</span>
          </div>
          <div className="h-64 bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mb-4">
            <div className="text-center"><span className="text-5xl block mb-2">🎯</span><p className="text-sm text-gray-600 dark:text-gray-400">Your ad here</p><p className="text-xs text-gray-400">300 x 250</p></div>
          </div>
          <button className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium">Continue to Results →</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${size === 'large' ? 'py-6' : 'py-3'} flex justify-center`}>
      <div ref={adRef} className={`${size === 'large' ? 'max-w-4xl' : 'max-w-2xl'} w-full`}>
        {/* Placeholder - Replace with real AdSense code */}
        <div className={`${size === 'large' ? 'h-24' : 'h-16'} w-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)' }} />
          <div className="text-center relative z-10">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Advertisement</span>
            <span className="text-xs text-gray-300 mt-0.5 block">{size === 'large' ? 'Leaderboard 728×90' : 'Banner 468×60'}</span>
          </div>
        </div>
        {/* Real AdSense: 
        <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXX" data-ad-slot={slot || '1234567890'} data-ad-format="auto" data-full-width-responsive="true"></ins> */}
      </div>
    </div>
  );
}

/* ===== AUTH MODAL ===== */
function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [err, setErr] = useState('');
  const { toast } = useToast();
  if (!open) return null;
  const handleSubmit = () => {
    if (mode === 'signup') { if (!name.trim() || !email.trim() || !email.includes('@')) { setErr('Please fill all fields correctly'); return; }
      const code = 'VM' + Math.random().toString(36).substring(2, 8).toUpperCase();
      saveUser({ ...DEFAULT_USER, username: name, email, joinedAt: new Date().toISOString(), lastLogin: new Date().toISOString(), streak: 1, referralCode: code });
      toast(`Welcome ${name}! 🎉 +50 XP bonus!`, 'success', <Sparkles className="w-4 h-4" />); onClose(); window.location.reload();
    } else { const existing = getUser(); if (existing && existing.email === email) { existing.lastLogin = new Date().toISOString(); existing.streak += 1; saveUser(existing); toast(`Welcome back! Streak: ${existing.streak} days 🔥`, 'success', <Flame className="w-4 h-4" />); onClose(); window.location.reload(); } else setErr('Account not found.'); }
  };
  return (<div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" /><div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 z-10"><X className="w-5 h-5 text-gray-400" /></button>
    <div className="bg-gradient-to-br from-violet-600 to-pink-500 p-8 text-center"><Brain className="w-12 h-12 text-white mx-auto mb-3" /><h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>{mode === 'signup' ? 'Join ViralMind' : 'Welcome Back'}</h2></div>
    <div className="p-6 space-y-4">{err && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl">{err}</div>}
      {mode === 'signup' && <input value={name} onChange={e => { setName(e.target.value); setErr(''); }} placeholder="Username" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white" />}
      <input value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white" />
      <button onClick={handleSubmit} className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">{mode === 'signup' ? <><UserPlus className="w-5 h-5" /> Create Account</> : <><LogIn className="w-5 h-5" /> Sign In</>}</button>
      <p className="text-center text-sm text-gray-500">{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}<button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr(''); }} className="text-violet-600 font-semibold hover:underline">{mode === 'signup' ? 'Sign In' : 'Sign Up'}</button></p></div>
  </div></div>);
}

/* ===== SEARCH MODAL ===== */
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState(''); const { lang } = useLang(); const { go, setQuiz } = usePage();
  const allQ = [...defaultQuizzes, ...(getUser()?.customQuizzes || [])];
  const results = q.length > 1 ? allQ.filter(qz => (qz.title[lang] || qz.title.en).toLowerCase().includes(q.toLowerCase())) : [];
  if (!open) return null;
  return (<div className="fixed inset-0 z-[80] flex items-start justify-center pt-24 px-4" onClick={onClose}><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" /><div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800"><Search className="w-5 h-5 text-gray-400" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search quizzes..." className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400" /><kbd className="hidden sm:block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs rounded font-mono">ESC</kbd></div>
    <div className="max-h-80 overflow-y-auto">{q.length <= 1 && <div className="p-8 text-center text-gray-400 text-sm">Type to search...</div>}{results.map(qz => (<button key={qz.id} onClick={() => { setQuiz(qz); go('play'); onClose(); setQ(''); }} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-b border-gray-50 dark:border-gray-800 last:border-0"><div className={`w-10 h-10 bg-gradient-to-br ${qz.color} rounded-xl flex items-center justify-center flex-shrink-0`}><span className="text-lg">{qz.emoji}</span></div><div className="flex-1 min-w-0"><div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{qz.title[lang] || qz.title.en}</div></div><ChevronRight className="w-4 h-4 text-gray-300" /></button>))}</div>
  </div></div>);
}

/* ===== ONBOARDING ===== */
function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0); const { go } = usePage();
  if (!open) return null;
  const steps = [{ e: '🧠', t: 'Welcome to ViralMind!', d: 'The world\'s #1 viral quiz platform.', c: 'from-violet-600 to-purple-600' }, { e: '🎯', t: 'Take Quizzes', d: '12+ categories: personality, love, career, and more!', c: 'from-pink-500 to-rose-500' }, { e: '⚡', t: 'Earn XP & Level Up', d: 'Collect badges and climb the leaderboard!', c: 'from-amber-500 to-orange-500' }, { e: '📤', t: 'Share & Go Viral', d: 'Challenge friends and share results!', c: 'from-emerald-500 to-teal-500' }];
  const s = steps[step];
  return (<div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/70 backdrop-blur-md" /><div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
    <div className={`bg-gradient-to-br ${s.c} p-10 text-center transition-all duration-500`}><div className="text-7xl mb-4 animate-bounce">{s.e}</div><h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>{s.t}</h2><p className="text-white/80">{s.d}</p></div>
    <div className="p-6"><div className="flex justify-center gap-2 mb-6">{steps.map((_, i) => (<div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-violet-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />))}</div>
      <div className="flex gap-3">{step > 0 && <button onClick={() => setStep(step - 1)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl">Back</button>}
        {step < steps.length - 1 ? <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl">Next</button> :
          <button onClick={() => { const u = getUser(); if (u) { u.onboarded = true; saveUser(u); } onClose(); go('trending'); }} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Start!</button>}</div></div>
  </div></div>);
}

/* ===== COOKIE BANNER ===== */
function CookieBanner() { const [show, setShow] = useState(() => !localStorage.getItem('vm-cookies')); if (!show) return null; return (<div className="fixed bottom-0 left-0 right-0 z-[90] p-4 animate-slide-up"><div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-700 flex flex-col sm:flex-row items-center gap-4"><span className="text-2xl">🍪</span><p className="text-sm text-gray-300 flex-1">We use cookies to enhance your experience.</p><div className="flex gap-2"><button onClick={() => { localStorage.setItem('vm-cookies', '1'); setShow(false); }} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold rounded-xl">Accept</button><button onClick={() => { localStorage.setItem('vm-cookies', '1'); setShow(false); }} className="px-5 py-2.5 bg-gray-800 text-gray-300 text-sm rounded-xl">Essential</button></div></div></div>); }

/* ===== LIVE FEED ===== */
function LiveFeed() {
  const { lang } = useLang();
  const [acts, setActs] = useState<Array<{ n: string; f: string; q: string; id: number }>>([]);
  useEffect(() => {
    const names = ['Alex', 'Maria', 'Yuki', 'Ahmet', 'Sophie', 'Carlos', 'Emma', 'Wei', 'Priya', 'Anna']; const flags = ['🇺🇸', '🇧🇷', '🇯🇵', '🇹🇷', '🇫🇷', '🇪🇸', '🇬🇧', '🇨🇳', '🇮🇳', '🇩🇪'];
    const gen = () => ({ n: names[Math.floor(Math.random() * names.length)], f: flags[Math.floor(Math.random() * flags.length)], q: defaultQuizzes[Math.floor(Math.random() * defaultQuizzes.length)].title[lang] || defaultQuizzes[0].title.en, id: Date.now() + Math.random() });
    setActs([gen(), gen(), gen()]); const i = setInterval(() => setActs(p => [gen(), ...p.slice(0, 4)]), 4000); return () => clearInterval(i);
  }, [lang]);
  return (<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span><h3 className="font-bold text-gray-900 dark:text-white text-sm">Live Activity</h3><span className="ml-auto text-xs text-gray-400"><LiveCounter /></span></div>
    <div className="space-y-3 max-h-44 overflow-hidden">{acts.map(a => (<div key={a.id} className="flex items-center gap-2 text-xs animate-fade-in"><span>{a.f}</span><span className="font-medium text-gray-700 dark:text-gray-300">{a.n}</span><span className="text-gray-400">played</span><span className="text-violet-600 dark:text-violet-400 font-medium truncate">{a.q}</span></div>))}</div>
  </div>);
}

/* ===== QUIZ CARD ===== */
function QuizCard({ quiz }: { quiz: Quiz }) {
  const { t, lang } = useLang(); const { go, setQuiz } = usePage();
  const fp = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString();
  // Social proof percentage
  const socialPct = Math.floor(Math.random() * 30) + 60;
  return (<div onClick={() => { setQuiz(quiz); go('play'); }} className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 transition-all duration-300 transform hover:-translate-y-1">
    <div className={`h-36 bg-gradient-to-br ${quiz.color} relative overflow-hidden`}>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-6xl transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">{quiz.emoji}</span></div>
      {quiz.plays > 10000000 && <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600"><Flame className="w-3 h-3" /> TRENDING</div>}
      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">{quiz.questions.length} Q</div>
      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium"><Eye className="w-3 h-3 inline mr-1" />{socialPct}% got this</div>
    </div>
    <div className="p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">{quiz.title[lang] || quiz.title.en}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{quiz.description[lang] || quiz.description.en}</p>
      <div className="flex items-center justify-between"><div className="flex items-center gap-3 text-xs text-gray-400"><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{fp(quiz.plays)}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.time}m</span></div>
        <button className="px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all">{t('quiz_play')}</button></div>
    </div>
  </div>);
}

/* ===== NAVBAR ===== */
function Navbar({ onSearch, onAuth, onReward }: { onSearch: () => void; onAuth: () => void; onReward: () => void }) {
  const { t, lang, setLang } = useLang(); const { dark, toggle } = useTheme(); const { go, page } = usePage();
  const [mob, setMob] = useState(false); const [langO, setLangO] = useState(false); const [scrolled, setScrolled] = useState(false); const [notifO, setNotifO] = useState(false);
  const user = getUser();
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  const cl = languages.find(l => l.code === lang);
  const nav = [{ k: 'home', p: 'home' as Page }, { k: 'trending', p: 'trending' as Page }, { k: 'quizzes', p: 'trending' as Page }, { k: 'premium', p: 'premium' as Page }];
  return (<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-transparent'}`}>
    <FomoBanner />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16 lg:h-20">
      <button onClick={() => go('home')} className="flex items-center gap-2 group"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg shadow-violet-500/20"><Brain className="w-6 h-6 text-white" /></div><span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>ViralMind</span></button>
      <div className="hidden md:flex items-center gap-1">{nav.map(n => (<button key={n.k} onClick={() => go(n.p)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${page === n.p ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t(`nav_${n.k}`)}</button>))}
        <button onClick={() => go('community')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${page === 'community' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Users className="w-4 h-4" /></button>
        <button onClick={() => go('leaderboard')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${page === 'leaderboard' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Trophy className="w-4 h-4" /></button>
        <button onClick={() => go('create')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${page === 'create' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Edit3 className="w-4 h-4" /></button></div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button onClick={onReward} className="p-2.5 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 relative" title="Daily Reward"><Gift className="w-5 h-5" /><span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">1</span></button>
        <button onClick={onSearch} className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Search className="w-5 h-5" /></button>
        <button onClick={toggle} className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">{dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}</button>
        <div className="relative"><button onClick={() => setNotifO(!notifO)} className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 relative"><Bell className="w-5 h-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
          {notifO && (<><div className="fixed inset-0 z-40" onClick={() => setNotifO(false)} /><div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 animate-fade-in"><div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-gray-900 dark:text-white flex items-center justify-between"><span>Notifications</span><span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">3</span></div>
            {[{ e: '🔥', t: 'Your quiz went viral! 10K shares', tm: '2m' }, { e: '⚔️', t: 'Maria challenged you!', tm: '1h' }, { e: '🎰', t: 'Daily reward available!', tm: '3h' }].map((n, i) => (<div key={i} className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0"><span className="text-xl">{n.e}</span><div className="flex-1"><p className="text-sm text-gray-700 dark:text-gray-300">{n.t}</p><p className="text-xs text-gray-400 mt-1">{n.tm} ago</p></div></div>))}</div></>)}</div>
        <div className="relative"><button onClick={() => setLangO(!langO)} className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Globe className="w-4 h-4" /><span className="hidden sm:inline">{cl?.flag}</span><ChevronDown className="w-3 h-3 hidden sm:block" /></button>
          {langO && (<><div className="fixed inset-0 z-40" onClick={() => setLangO(false)} /><div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 min-w-[150px] z-50 animate-fade-in">
            {languages.map(l => (<button key={l.code} onClick={() => { setLang(l.code); setLangO(false); }} className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${lang === l.code ? 'text-violet-600 font-medium bg-violet-50 dark:bg-violet-900/20' : 'text-gray-700 dark:text-gray-300'}`}>{l.flag} {l.name} {lang === l.code && <Check className="w-4 h-4 ml-auto" />}</button>))}</div></>)}</div>
        {user ? (<button onClick={() => go('profile')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">{user.username.charAt(0).toUpperCase()}</div><span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span></button>) : (<button onClick={onAuth} className="hidden sm:flex px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg items-center gap-2"><UserPlus className="w-4 h-4" /> {t('nav_signup')}</button>)}
        <button onClick={() => setMob(!mob)} className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">{mob ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div></div>
      {mob && (<div className="md:hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 mb-4 space-y-1 animate-fade-in">
        {[...nav, { k: 'community', p: 'community' as Page }, { k: 'leaderboard', p: 'leaderboard' as Page }, { k: 'create', p: 'create' as Page }].map(n => (<button key={n.k} onClick={() => { go(n.p as Page); setMob(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">{n.k === 'community' ? '🌍 Community' : n.k === 'leaderboard' ? '🏆 Leaderboard' : n.k === 'create' ? '✏️ Create' : t(`nav_${n.k}`)}</button>))}
        {!user && <button onClick={() => { onAuth(); setMob(false); }} className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold rounded-xl">{t('nav_signup')}</button>}
      </div>)}
    </div>
  </nav>);
}

/* ===== SECTIONS ===== */
function Hero() { const { t } = useLang(); const { go, setQuiz } = usePage(); return (<section className="relative min-h-screen flex items-center overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"><div className="absolute top-20 left-10 w-96 h-96 bg-violet-300 dark:bg-violet-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-pulse" /><div className="absolute top-40 right-10 w-96 h-96 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} /><div className="absolute bottom-20 left-1/3 w-96 h-96 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} /><div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} /></div>
  <div className="absolute inset-0 overflow-hidden pointer-events-none">{['🧠', '🎯', '💡', '🏆', '⭐', '🔥', '💜', '🎮', '🌟', '✨', '🎪', '🎭'].map((e, i) => (<div key={i} className="absolute text-2xl sm:text-4xl animate-bounce opacity-10 dark:opacity-20" style={{ left: `${(i * 8) % 90 + 5}%`, top: `${(i * 13 + 15) % 80 + 5}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + (i % 3)}s` }}>{e}</div>))}</div>
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full"><div className="grid lg:grid-cols-2 gap-12 items-center">
    <div className="text-center lg:text-left"><div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm border border-violet-100 dark:border-violet-800 mb-8 animate-fade-in"><Flame className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('hero_badge')}</span></div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-[1.1]" style={{ fontFamily: 'Space Grotesk' }}>{t('hero_title')}<br /><span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">{t('hero_highlight')}</span></h1>
      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0">{t('hero_desc')}</p>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 justify-center lg:justify-start"><button onClick={() => { setQuiz(defaultQuizzes[0]); go('play'); }} className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl transition-all transform hover:-translate-y-1 text-lg flex items-center justify-center gap-3"><Play className="w-5 h-5" />{t('hero_cta')}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button><button onClick={() => go('trending')} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all transform hover:-translate-y-1 text-lg">{t('hero_secondary')}</button></div>
      <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-500 dark:text-gray-400"><span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Free</span><span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> No signup</span><span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Instant results</span></div></div>
    <div className="space-y-4"><div className="grid grid-cols-2 gap-4">{[{ v: 50000000, l: t('hero_users'), i: Users, c: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' }, { v: 250000, l: t('hero_quizzes'), i: Target, c: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' }, { v: 195, l: t('hero_countries'), i: Globe, c: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }, { v: 5000000, l: t('hero_daily'), i: Zap, c: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }].map((s, idx) => (<div key={idx} className={`${s.bg} rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800`}><s.i className={`w-5 h-5 ${s.c} mb-2`} /><div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}><Counter target={s.v} suffix="+" /></div><div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.l}</div></div>))}</div><LiveFeed /></div>
  </div></div>
</section>); }

function DailyQuiz() { const { t, lang } = useLang(); const { go, setQuiz } = usePage(); const dq = defaultQuizzes[new Date().getDate() % defaultQuizzes.length]; const [tl, setTl] = useState(''); useEffect(() => { const u = () => { const n = new Date(), e = new Date(n); e.setHours(23, 59, 59, 999); const d = e.getTime() - n.getTime(); setTl(`${String(Math.floor(d / 3600000)).padStart(2, '0')}:${String(Math.floor((d % 3600000) / 60000)).padStart(2, '0')}:${String(Math.floor((d % 60000) / 1000)).padStart(2, '0')}`); }; u(); const i = setInterval(u, 1000); return () => clearInterval(i); }, []); return (<section className="py-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 rounded-3xl p-6 sm:p-10 overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" /><div className="relative flex flex-col md:flex-row items-center gap-6"><div className="text-7xl animate-float">{dq.emoji}</div><div className="flex-1 text-center md:text-left"><div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-3"><Calendar className="w-3.5 h-3.5" /> QUIZ OF THE DAY</div><h3 className="text-2xl sm:text-3xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>{dq.title[lang] || dq.title.en}</h3><p className="text-white/70 mb-4">{dq.description[lang] || dq.description.en}</p><div className="flex items-center gap-4 justify-center md:justify-start"><button onClick={() => { setQuiz(dq); go('play'); }} className="px-6 py-3 bg-white text-violet-600 font-bold rounded-xl hover:shadow-lg flex items-center gap-2"><Play className="w-4 h-4" /> {t('quiz_play')}</button><div className="flex items-center gap-2 text-white/80 text-sm font-mono"><Clock className="w-4 h-4" /> {tl}</div></div></div></div></div></div></section>); }
function TrendingSection() { const { t } = useLang(); const sorted = [...defaultQuizzes].sort((a, b) => b.plays - a.plays); return (<section className="py-16 sm:py-24 bg-white dark:bg-gray-950"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>{t('section_trending')}</h2><p className="text-gray-500 dark:text-gray-400 text-lg">{t('section_trending_desc')}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{sorted.map(q => <QuizCard key={q.id} quiz={q} />)}</div></div></section>); }
function CategoriesSection() { const { t } = useLang(); return (<section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>{t('section_categories')}</h2></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">{categories.map(c => (<button key={c.id} className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all transform hover:-translate-y-1"><span className="text-4xl block mb-3">{c.emoji}</span><span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{t(`cat_${c.id}`)}</span></button>))}</div></div></section>); }
function HowItWorks() { const { t } = useLang(); return (<section className="py-16 sm:py-24 bg-white dark:bg-gray-950"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-16"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>{t('section_how')}</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{[{ i: Target, t: t('step1_title'), d: t('step1_desc'), c: 'from-violet-500 to-purple-600' }, { i: Zap, t: t('step2_title'), d: t('step2_desc'), c: 'from-pink-500 to-rose-600' }, { i: Share2, t: t('step3_title'), d: t('step3_desc'), c: 'from-orange-500 to-amber-600' }].map((s, idx) => (<div key={idx} className="text-center group"><div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${s.c} rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}><s.i className="w-10 h-10 text-white" /></div><div className="text-sm font-bold text-violet-500 mb-2">STEP {idx + 1}</div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.t}</h3><p className="text-gray-500 dark:text-gray-400">{s.d}</p></div>))}</div></div></section>); }
function Testimonials() { const rs = [{ n: 'Sarah K.', c: '🇺🇸', t: 'Insanely addictive! Results are scarily accurate!', a: '👩‍💼' }, { n: 'Mehmet A.', c: '🇹🇷', t: 'Arkadaşlarımla çözüyoruz, çok eğlenceli!', a: '👨‍💻' }, { n: 'Yuki T.', c: '🇯🇵', t: 'Beautifully designed quizzes. Love it!', a: '👩‍🎨' }, { n: 'Carlos M.', c: '🇪🇸', t: 'La mejor plataforma de quizzes!', a: '👨‍🏫' }, { n: 'Emma L.', c: '🇬🇧', t: 'My Instagram is full of ViralMind quizzes!', a: '👩‍🔬' }, { n: 'Priya S.', c: '🇮🇳', t: 'The career quiz helped me make a big decision!', a: '👩‍⚕️' }]; return (<section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>💬 Loved by Millions</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{rs.map((r, i) => (<div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg"><div className="flex items-center gap-1 mb-3">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div><p className="text-gray-600 dark:text-gray-300 text-sm mb-4">"{r.t}"</p><div className="flex items-center gap-3"><span className="text-2xl">{r.a}</span><div><div className="font-semibold text-gray-900 dark:text-white text-sm">{r.n} {r.c}</div><div className="text-xs text-gray-400">Verified ✓</div></div></div></div>))}</div></div></section>); }
function BlogSection() { const posts = [{ e: '🧠', t: 'The Science Behind Personality Tests', d: 'How psychology research powers modern quiz design.', dt: 'Jan 15' }, { e: '📈', t: 'How Viral Quizzes Drive 10M+ Shares', d: 'The psychology of sharing and quiz results as social currency.', dt: 'Jan 12' }, { e: '💡', t: '10 Quiz Ideas That Will Go Viral in 2026', d: 'From AI personality matching to nostalgic decade quizzes.', dt: 'Jan 10' }]; return (<section className="py-16 bg-white dark:bg-gray-950"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>📝 Blog</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{posts.map((p, i) => (<article key={i} className="group bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg cursor-pointer hover:-translate-y-1"><span className="text-4xl block mb-4">{p.e}</span><h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600">{p.t}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{p.d}</p><div className="text-xs text-gray-400">{p.dt}</div></article>))}</div></div></section>); }
function PremiumSection() { const { t } = useLang(); const plans = [{ n: t('premium_free'), p: '$0', fs: [t('premium_feature_quizzes'), t('premium_feature_results'), t('premium_feature_share')], cta: t('premium_cta_free'), clr: 'border-gray-200 dark:border-gray-700', btn: 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white', pop: false }, { n: t('premium_pro'), p: '$9.99', fs: [t('premium_feature_quizzes'), t('premium_feature_results'), t('premium_feature_share'), t('premium_feature_noads'), t('premium_feature_create'), t('premium_feature_analytics'), t('premium_feature_ai')], cta: t('premium_cta_pro'), clr: 'border-violet-300 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-800', btn: 'bg-gradient-to-r from-violet-600 to-pink-500 text-white', pop: true }, { n: t('premium_business'), p: '$49.99', fs: [t('premium_feature_quizzes'), t('premium_feature_results'), t('premium_feature_share'), t('premium_feature_noads'), t('premium_feature_create'), t('premium_feature_analytics'), t('premium_feature_ai'), t('premium_feature_api'), t('premium_feature_priority'), t('premium_feature_branding')], cta: t('premium_cta_business'), clr: 'border-gray-200 dark:border-gray-700', btn: 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white', pop: false }]; return (<section className="py-16 sm:py-24 bg-gradient-to-b from-violet-50 to-white dark:from-gray-900 dark:to-gray-950"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-16"><div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4"><Crown className="w-4 h-4 text-violet-600" /><span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t('section_premium')}</span></div><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>{t('section_premium')}</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">{plans.map((p, i) => (<div key={i} className={`relative bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border-2 ${p.clr} shadow-sm hover:shadow-xl transition-all ${p.pop ? 'transform md:-translate-y-4' : ''}`}>{p.pop && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1"><Star className="w-3 h-3" /> {t('premium_popular')}</div>}<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{p.n}</h3><div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>{p.p}</span>{p.p !== '$0' && <span className="text-gray-400 text-sm">{t('premium_month')}</span>}</div><ul className="space-y-3 mb-8">{p.fs.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Check className="w-4 h-4 text-green-500 flex-shrink-0" />{f}</li>)}</ul><button className={`w-full py-3 px-6 font-bold rounded-xl transition-all ${p.btn}`}>{p.cta}</button></div>))}</div></div></section>); }
function ReferralSection() { const { toast } = useToast(); const user = getUser(); const code = user?.referralCode || 'VIRAL2026'; return (<section className="py-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"><div className="relative"><Gift className="w-12 h-12 text-white mx-auto mb-4" /><h3 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk' }}>Invite Friends! 🎁</h3><p className="text-white/80 mb-6 max-w-lg mx-auto">Both get 1 month Pro free!</p><div className="flex items-center justify-center gap-3 max-w-md mx-auto"><div className="flex-1 bg-white/20 rounded-xl px-4 py-3 text-white font-mono font-bold text-lg">{code}</div><button onClick={() => { navigator.clipboard?.writeText(code); toast('Copied! 📋', 'success', <Copy className="w-4 h-4" />); }} className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl">Copy</button></div></div></div></div></section>); }
function FAQ() { const [open, setOpen] = useState<number | null>(null); const faqs = [{ q: 'Is ViralMind free?', a: 'Yes! Unlimited quizzes for free.' }, { q: 'How do I earn XP?', a: 'Every quiz earns 10-35 XP. Daily streaks give bonus XP!' }, { q: 'Can I create quizzes?', a: 'Pro members can use our quiz builder.' }, { q: 'How does sharing work?', a: 'Share via Web Share API or copy to clipboard.' }, { q: 'What are power-ups?', a: '50/50 removes 2 wrong answers, Skip skips a question, Hint gives a clue!' }]; return (<section className="py-16 bg-white dark:bg-gray-950"><div className="max-w-3xl mx-auto px-4"><h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-12 text-center" style={{ fontFamily: 'Space Grotesk' }}>❓ FAQ</h2><div className="space-y-3">{faqs.map((f, i) => (<div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"><button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left"><span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{f.q}</span>{open === i ? <Minus className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />}</button>{open === i && <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm animate-fade-in">{f.a}</div>}</div>))}</div></div></section>); }
function CTASection() { const { t } = useLang(); const { go, setQuiz } = usePage(); return (<section className="py-16 sm:py-24"><div className="max-w-7xl mx-auto px-4"><div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 rounded-3xl p-8 sm:p-16 text-center overflow-hidden"><div className="relative"><Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-6" /><h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>{t('cta_title')}</h2><p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto">{t('cta_desc')}</p><button onClick={() => { setQuiz(defaultQuizzes[0]); go('play'); }} className="px-10 py-4 bg-white text-violet-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 inline-flex items-center gap-3"><Play className="w-5 h-5" />{t('cta_button')}<ArrowRight className="w-5 h-5" /></button></div></div></div></section>); }
function Footer() { const { t } = useLang(); const { go } = usePage(); return (<footer className="bg-gray-900 dark:bg-black text-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12"><div className="col-span-2"><div className="flex items-center gap-2 mb-4"><div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div><span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>ViralMind</span></div><p className="text-gray-400 text-sm mb-4 max-w-xs">{t('footer_desc')}</p><div className="flex gap-3">{['𝕏', '📘', '📸', '🎵', '▶️'].map((s, i) => <button key={i} className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-sm">{s}</button>)}</div></div>{[{ t: t('footer_product'), i: [t('footer_features'), t('footer_pricing')] }, { t: t('footer_company'), i: [t('footer_about'), t('footer_careers')] }, { t: t('footer_legal'), i: [t('footer_privacy'), t('footer_terms')] }].map((c, i) => (<div key={i}><h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">{c.t}</h4><ul className="space-y-2">{c.i.map((x, j) => <li key={j}><a href="#" className="text-gray-300 hover:text-white text-sm">{x}</a></li>)}</ul></div>))}</div>
    <div className="mb-8"><button onClick={() => go('monetize')} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white font-bold flex items-center justify-center gap-3 hover:shadow-lg transition-all"><span className="text-xl">💰</span> Learn How to Earn Money <ArrowRight className="w-5 h-5" /></button></div>
    <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"><p className="text-gray-500 text-sm">© 2026 ViralMind. {t('footer_rights')}</p><p className="text-gray-500 text-sm">{t('footer_made')}</p></div></div></footer>); }

/* ===== QUIZ PLAY (with Power-ups, Challenge, Viral Share, Comments, Timer, Keyboard, Sound) ===== */
function QuizPlayPage() {
  const { t, lang } = useLang(); const { go, quiz } = usePage(); const { toast } = useToast(); const { play } = useSound();
  const [cq, setCq] = useState(0); const [ans, setAns] = useState<number[]>([]); const [result, setResult] = useState(false);
  const [sel, setSel] = useState<number | null>(null); const [showConfetti, setShowConfetti] = useState(false);
  const [timer, setTimer] = useState(15); const [startTime] = useState(Date.now());
  const [shareCardOpen, setShareCardOpen] = useState(false); const [challengeOpen, setChallengeOpen] = useState(false);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const user = getUser();

  if (!quiz) return <div className="min-h-screen flex items-center justify-center pt-20"><button onClick={() => go('home')} className="px-6 py-3 bg-violet-600 text-white rounded-xl">Go Home</button></div>;
  const q = quiz.questions[cq]; const prog = ((cq + (result ? 1 : 0)) / quiz.questions.length) * 100;

  useEffect(() => { if (result || sel !== null) return; if (timer <= 0) { handleAns(-1); return; } const i = setInterval(() => setTimer(t => t - 1), 1000); return () => clearInterval(i); }, [timer, result, sel]);
  useEffect(() => { if (result || sel !== null) return; const h = (e: KeyboardEvent) => { const num = parseInt(e.key); if (num >= 1 && num <= q.options.length) handleAns(num - 1); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [result, sel, cq]);

  // Power-ups
  const useFifty = () => { if (!user || user.powerups.fifty <= 0) { toast('No 50/50 power-ups left!', 'warning'); return; }
    const wrong: number[] = []; q.options.forEach((_, i) => { const r = q.results[i][lang] || q.results[i].en; if (r.includes('❌') || r.includes('Wrong') || r.includes('Yanlış')) wrong.push(i); });
    const toEliminate = wrong.slice(0, 2); setEliminated(toEliminate); user.powerups.fifty--; saveUser(user); play('powerup'); toast('50/50 used! 2 wrong answers removed! 🎯', 'success');
  };
  const useSkip = () => { if (!user || user.powerups.skip <= 0) { toast('No skip power-ups left!', 'warning'); return; }
    user.powerups.skip--; saveUser(user); play('powerup'); toast('Question skipped! ⏭️', 'success');
    const na = [...ans, -1]; setAns(na);
    if (cq < quiz.questions.length - 1) { setCq(cq + 1); setSel(null); setTimer(15); setEliminated([]); } else finishQuiz(na);
  };
  const useHint = () => { if (!user || user.powerups.hint <= 0) { toast('No hints left!', 'warning'); return; }
    user.powerups.hint--; saveUser(user); play('powerup');
    const correctIdx = q.results.findIndex(r => { const rt = r[lang] || r.en; return rt.includes('✅') || rt.includes('Correct') || rt.includes('Doğru'); });
    if (correctIdx >= 0) toast(`💡 Hint: The answer starts with "${(q.options[correctIdx][lang] || q.options[correctIdx].en).charAt(0)}"`, 'info');
  };

  const handleAns = (i: number) => {
    setSel(i); const na = [...ans, i]; setAns(na);
    if (i >= 0) { const r = q.results[i][lang] || q.results[i].en; play(r.includes('✅') || r.includes('Correct') || r.includes('Doğru') ? 'correct' : 'wrong'); }
    setTimeout(() => { if (cq < quiz.questions.length - 1) { setCq(cq + 1); setSel(null); setTimer(15); setEliminated([]); } else finishQuiz(na); }, 700);
  };

  const finishQuiz = (finalAns: number[]) => {
    setResult(true); setShowConfetti(true); play('complete');
    setTimeout(() => setShowConfetti(false), 5000);
    if (user) {
      const xpGain = 10 + quiz.questions.length * 5; const oldLevel = levelFromXp(user.xp).level;
      user.xp += xpGain; user.quizzesTaken++; const newLevel = levelFromXp(user.xp).level; user.level = newLevel;
      user.results.push({ quizId: quiz.id, result: getResultText(finalAns), date: new Date().toISOString(), score: Math.floor(Math.random() * 30) + 70, timeSpent: Math.floor((Date.now() - startTime) / 1000) });
      if (user.quizzesTaken === 1 && !user.badges.includes('first_quiz')) user.badges.push('first_quiz');
      if (user.quizzesTaken >= 5 && !user.badges.includes('social')) user.badges.push('social');
      if (user.quizzesTaken >= 10 && !user.badges.includes('explorer')) user.badges.push('explorer');
      saveUser(user); toast(`+${xpGain} XP! 🎉`, 'success', <Zap className="w-4 h-4" />);
      if (newLevel > oldLevel) setTimeout(() => { toast(`Level Up! Level ${newLevel}! ⬆️`, 'success', <Star className="w-4 h-4" />); play('levelup'); }, 1000);
    }
  };

  const getResultText = (answers: number[]) => { const counts: Record<string, number> = {}; answers.forEach((a, qi) => { if (a < 0) return; const r = quiz.questions[qi].results[a]; const rt = r[lang] || r.en; counts[rt] = (counts[rt] || 0) + 1; }); let max = '', mc = 0; Object.entries(counts).forEach(([k, v]) => { if (v > mc) { mc = v; max = k; } }); return max; };
  const retake = () => { setCq(0); setAns([]); setResult(false); setSel(null); setTimer(15); setEliminated([]); };
  const rec = defaultQuizzes.filter(q => q.id !== quiz.id).slice(0, 3);
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const resultText = getResultText(ans);

  return (<div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16">
    <ConfettiCanvas active={showConfetti} />
    <div className="max-w-2xl mx-auto px-4">
      <button onClick={() => go('trending')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="mb-8"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('quiz_question')} {cq + 1} {t('quiz_of')} {quiz.questions.length}</span><div className="flex items-center gap-3">{!result && <div className={`flex items-center gap-1 text-sm font-mono font-bold ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}><Timer className="w-4 h-4" />{timer}s</div>}<span className="text-sm font-medium text-violet-600 dark:text-violet-400">{Math.round(prog)}%</span></div></div><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${prog}%` }} /></div></div>

      {!result ? (<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className={`h-24 bg-gradient-to-br ${quiz.color} flex items-center justify-center`}><span className="text-5xl">{quiz.emoji}</span></div>
        <div className="p-6 sm:p-8">
          {/* Power-ups */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button onClick={useFifty} disabled={!user || user.powerups.fifty <= 0 || eliminated.length > 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${user && user.powerups.fifty > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}><HelpCircle className="w-4 h-4" /> 50/50 ({user?.powerups.fifty || 0})</button>
            <button onClick={useSkip} disabled={!user || user.powerups.skip <= 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${user && user.powerups.skip > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}><SkipForward className="w-4 h-4" /> Skip ({user?.powerups.skip || 0})</button>
            <button onClick={useHint} disabled={!user || user.powerups.hint <= 0} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${user && user.powerups.hint > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}><Eye className="w-4 h-4" /> Hint ({user?.powerups.hint || 0})</button>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">{q.question[lang] || q.question.en}</h2>
          <div className="space-y-3">{q.options.map((o, i) => {
            const isEliminated = eliminated.includes(i);
            return (<button key={i} onClick={() => sel === null && !isEliminated && handleAns(i)} disabled={sel !== null || isEliminated}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${isEliminated ? 'border-gray-100 dark:border-gray-700 opacity-20 line-through cursor-not-allowed' : sel === i ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-md scale-[1.02]' : sel !== null ? 'border-gray-100 dark:border-gray-700 opacity-40' : 'border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'}`}>
              <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${sel === i ? 'bg-violet-500 text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{String.fromCharCode(65 + i)}</div><span className={`font-medium flex-1 ${sel === i ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>{o[lang] || o.en}</span><kbd className="hidden sm:block w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs rounded flex items-center justify-center font-mono">{i + 1}</kbd></div></button>);
          })}</div>
          <p className="text-center text-xs text-gray-400 mt-4">💡 Press 1-{q.options.length} on keyboard</p>
        </div>
      </div>) : (<div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className={`h-40 bg-gradient-to-br ${quiz.color} flex flex-col items-center justify-center`}><Trophy className="w-14 h-14 text-white/80 mb-2 animate-bounce" /><span className="text-white font-bold text-lg">{t('quiz_result')}</span></div>
          <div className="p-6 sm:p-8 text-center">
            <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>{resultText}</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{quiz.title[lang] || quiz.title.en}</p>
            <div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-lg font-bold text-gray-900 dark:text-white">{totalTime}s</div><div className="text-xs text-gray-400">Time</div></div><div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-lg font-bold text-gray-900 dark:text-white">{quiz.questions.length}</div><div className="text-xs text-gray-400">Questions</div></div><div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3"><div className="text-lg font-bold text-violet-600">+{10 + quiz.questions.length * 5}</div><div className="text-xs text-gray-400">XP</div></div></div>
            {/* Viral Share Card Button */}
            <button onClick={() => setShareCardOpen(true)} className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 mb-3"><Share2 className="w-5 h-5" /> Share Viral Card 📸</button>
            {/* Challenge Button */}
            <button onClick={() => setChallengeOpen(true)} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 mb-3"><Swords className="w-5 h-5" /> Challenge a Friend! ⚔️</button>
            <div className="flex flex-col sm:flex-row gap-3 justify-center"><button onClick={retake} className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold rounded-xl"><RotateCcw className="w-4 h-4" />{t('quiz_retake')}</button><button onClick={() => go('trending')} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"><ArrowRight className="w-4 h-4" />{t('quiz_try_others')}</button></div>
          </div>
        </div>
        <QuizComments quizId={quiz.id} />
        <div><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎯 You might also like</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{rec.map(q => <QuizCard key={q.id} quiz={q} />)}</div></div>
      </div>)}
      <div className="mt-8"><AdBanner size="small" /></div>
    </div>
    {shareCardOpen && <ViralShareCard result={resultText} quiz={quiz} onClose={() => setShareCardOpen(false)} />}
    {challengeOpen && <ChallengeModal quiz={quiz} open={challengeOpen} onClose={() => setChallengeOpen(false)} />}
  </div>);
}

/* ===== TRENDING PAGE ===== */
function TrendingPage() { const { t, lang } = useLang(); const { go, setQuiz } = usePage(); const [filter, setFilter] = useState('all'); const sorted = [...defaultQuizzes].sort((a, b) => b.plays - a.plays); const fp = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString(); return (<div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-8"><h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>{t('trending_title')}</h1></div><div className="flex justify-center gap-2 mb-8">{[{ k: 'all', l: t('trending_filter_all') }, { k: 'today', l: t('trending_filter_today') }, { k: 'week', l: t('trending_filter_week') }].map(f => (<button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.k ? 'bg-violet-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>{f.l}</button>))}</div><div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">{sorted.map((q, i) => (<button key={q.id} onClick={() => { setQuiz(q); go('play'); }} className="w-full flex items-center gap-4 p-4 sm:p-5 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors group"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-gray-100' : i === 2 ? 'bg-orange-100' : 'bg-gray-50 dark:bg-gray-800'}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div><div className={`w-12 h-12 bg-gradient-to-br ${q.color} rounded-xl flex items-center justify-center flex-shrink-0`}><span className="text-2xl">{q.emoji}</span></div><div className="flex-1 text-left min-w-0"><h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-violet-600 transition-colors">{q.title[lang] || q.title.en}</h3><div className="flex items-center gap-3 text-xs text-gray-400 mt-1"><span className="flex items-center gap-1"><Users className="w-3 h-3" />{fp(q.plays)}</span></div></div><div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/20 text-violet-600 rounded-xl flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all"><Play className="w-4 h-4" /></div></button>))}</div><AdBanner size="large" /><div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{sorted.map(q => <QuizCard key={q.id} quiz={q} />)}</div></div></div>); }

/* ===== LEADERBOARD (Real working system) ===== */
function getLeaderboard(): Array<{ name: string; xp: number; level: number; country: string; avatar: string; quizzes: number; isUser: boolean }> {
  // Bot players (simulated community - stays in localStorage for consistency)
  const stored = localStorage.getItem('vm-leaderboard-bots');
  let bots: Array<{ name: string; xp: number; level: number; country: string; avatar: string; quizzes: number }>;
  if (stored) {
    bots = JSON.parse(stored);
    // Simulate bot activity: each bot gains 0-15 XP randomly per visit
    bots.forEach(b => {
      const gain = Math.floor(Math.random() * 16);
      b.xp += gain;
      b.level = levelFromXp(b.xp).level;
      b.quizzes += Math.random() < 0.3 ? 1 : 0;
    });
    localStorage.setItem('vm-leaderboard-bots', JSON.stringify(bots));
  } else {
    bots = [
      { name: 'QuizKing99', xp: 48200, level: 42, country: '🇺🇸', avatar: '👑', quizzes: 312 },
      { name: 'BrainStorm', xp: 45100, level: 40, country: '🇬🇧', avatar: '🧠', quizzes: 298 },
      { name: 'MindMaster', xp: 42800, level: 38, country: '🇯🇵', avatar: '🎯', quizzes: 276 },
      { name: 'QuizQueen', xp: 39500, level: 36, country: '🇧🇷', avatar: '👸', quizzes: 254 },
      { name: 'TriviaGod', xp: 37200, level: 35, country: '🇩🇪', avatar: '⚡', quizzes: 241 },
      { name: 'PuzzlePro', xp: 35800, level: 34, country: '🇫🇷', avatar: '🧩', quizzes: 228 },
      { name: 'SmartCookie', xp: 33100, level: 32, country: '🇹🇷', avatar: '🍪', quizzes: 215 },
      { name: 'NerdAlert', xp: 31400, level: 31, country: '🇮🇳', avatar: '🤓', quizzes: 203 },
      { name: 'QuizWhiz', xp: 29800, level: 30, country: '🇨🇦', avatar: '🧙', quizzes: 192 },
      { name: 'BrainiacX', xp: 27500, level: 28, country: '🇪🇸', avatar: '🦸', quizzes: 178 },
      { name: 'Trivialist', xp: 25200, level: 26, country: '🇮🇹', avatar: '📚', quizzes: 165 },
      { name: 'QuizNinja', xp: 22800, level: 24, country: '🇰🇷', avatar: '🥷', quizzes: 148 },
      { name: 'MindReader', xp: 19500, level: 21, country: '🇲🇽', avatar: '🔮', quizzes: 132 },
      { name: 'BrainWave', xp: 16200, level: 18, country: '🇸🇪', avatar: '🌊', quizzes: 115 },
      { name: 'QuizStar', xp: 12800, level: 15, country: '🇳🇱', avatar: '⭐', quizzes: 94 },
    ];
    localStorage.setItem('vm-leaderboard-bots', JSON.stringify(bots));
  }

  // Add current user to leaderboard
  const user = getUser();
  const all = bots.map(b => ({ ...b, isUser: false }));
  if (user && user.username) {
    all.push({
      name: user.username,
      xp: user.xp,
      level: levelFromXp(user.xp).level,
      country: '🏠',
      avatar: '😎',
      quizzes: user.quizzesTaken,
      isUser: true,
    });
  }

  // Sort by XP descending
  all.sort((a, b) => b.xp - a.xp);
  return all;
}

function LeaderboardPage() {
  const [tab, setTab] = useState<'all' | 'weekly'>('all');
  const [leaderboard, setLeaderboard] = useState(getLeaderboard);
  const user = getUser();

  // Refresh leaderboard periodically
  useEffect(() => {
    const i = setInterval(() => setLeaderboard(getLeaderboard()), 10000);
    return () => clearInterval(i);
  }, []);

  const userRank = leaderboard.findIndex(u => u.isUser) + 1;
  const top3 = leaderboard.slice(0, 3);

  return (<div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16"><div className="max-w-4xl mx-auto px-4">
    <div className="text-center mb-8"><h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>🏆 Global Leaderboard</h1>
      <p className="text-gray-500 dark:text-gray-400">Play quizzes to climb the ranks! Updated live.</p>
    </div>

    <div className="flex justify-center gap-2 mb-8">
      {[{ k: 'all' as const, l: '🌍 All Time' }, { k: 'weekly' as const, l: '📅 This Week' }].map(f => (
        <button key={f.k} onClick={() => setTab(f.k)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === f.k ? 'bg-violet-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>{f.l}</button>
      ))}
    </div>

    {/* Podium for Top 3 */}
    {top3.length >= 3 && (
      <div className="flex items-end justify-center gap-3 sm:gap-6 mb-8">
        {[top3[1], top3[0], top3[2]].map((u, i) => {
          const heights = ['h-24 sm:h-28', 'h-32 sm:h-36', 'h-20 sm:h-24'];
          const colors = ['from-gray-300 to-gray-400', 'from-yellow-300 to-amber-400', 'from-orange-300 to-orange-400'];
          const medals = ['🥈', '🥇', '🥉'];
          return (
            <div key={i} className="text-center flex flex-col items-center">
              <div className={`text-3xl sm:text-4xl mb-1 ${u.isUser ? 'animate-bounce' : ''}`}>{u.avatar}</div>
              <div className={`font-bold text-sm truncate max-w-[80px] sm:max-w-[100px] ${u.isUser ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>{u.name}</div>
              <div className="text-xs text-gray-400 mb-1">{u.xp.toLocaleString()} XP</div>
              <div className={`${heights[i]} w-20 sm:w-24 bg-gradient-to-t ${colors[i]} rounded-t-xl flex items-start justify-center pt-2 sm:pt-3 relative`}>
                <span className="text-xl sm:text-2xl">{medals[i]}</span>
                {u.isUser && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">YOU!</span>}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Your Position Banner */}
    {user && userRank > 0 && (
      <div className={`mb-6 rounded-2xl p-4 sm:p-5 border ${userRank <= 3 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700' : 'bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border-violet-200 dark:border-violet-700'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${userRank <= 3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700'}`}>#{userRank}</div>
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">{user.username.charAt(0).toUpperCase()}</div>
          <div className="flex-1"><div className="font-bold text-gray-900 dark:text-white">{user.username} <span className="text-violet-500 text-xs">(You)</span></div><div className="text-xs text-gray-400">{user.quizzesTaken} quizzes • Level {levelFromXp(user.xp).level} • Streak: {user.streak}d 🔥</div></div>
          <div className="text-right"><div className="text-lg font-black text-violet-600 dark:text-violet-400" style={{ fontFamily: 'Space Grotesk' }}>{user.xp.toLocaleString()}</div><div className="text-xs text-gray-400">XP</div></div>
        </div>
        {userRank > 3 && <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">🎯 {(leaderboard[userRank - 2]?.xp || 0) - user.xp} XP more to reach #{userRank - 1}! Keep playing!</div>}
      </div>
    )}

    {/* Full Ranking List */}
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {leaderboard.map((entry, i) => (
        <div key={i} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors ${entry.isUser ? 'bg-violet-50/80 dark:bg-violet-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
          <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' : i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600' : i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
          </div>
          <span className={`text-xl sm:text-2xl ${entry.isUser ? 'animate-pulse' : ''}`}>{entry.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm truncate ${entry.isUser ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
              {entry.name} {entry.country} {entry.isUser && <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
            </div>
            <div className="text-xs text-gray-400">{entry.quizzes} quizzes • Lvl {entry.level}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-sm font-black ${entry.isUser ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>{entry.xp.toLocaleString()}</div>
            <div className="text-[10px] text-gray-400">XP</div>
          </div>
        </div>
      ))}
    </div>

    {/* Not signed up message */}
    {!user && (
      <div className="mt-6 text-center bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-700">
        <Trophy className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Join the Competition!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Sign up and take quizzes to appear on the leaderboard</p>
      </div>
    )}
  </div></div>);
}

/* ===== COMMUNITY QUIZ STORE (shared localStorage) ===== */
function getCommunityQuizzes(): (Quiz & { author: string; createdAt: string; likes: number; plays: number })[] {
  try { const d = localStorage.getItem('vm-community-quizzes'); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveCommunityQuiz(quiz: Quiz & { author: string; createdAt: string; likes: number }) {
  const all = getCommunityQuizzes();
  all.unshift(quiz as any);
  localStorage.setItem('vm-community-quizzes', JSON.stringify(all));
}
function likeCommunityQuiz(quizId: string) {
  const all = getCommunityQuizzes();
  const q = all.find(x => x.id === quizId);
  if (q) { q.likes++; localStorage.setItem('vm-community-quizzes', JSON.stringify(all)); }
}
function incrementCommunityPlays(quizId: string) {
  const all = getCommunityQuizzes();
  const q = all.find(x => x.id === quizId);
  if (q) { q.plays = (q.plays || 0) + 1; localStorage.setItem('vm-community-quizzes', JSON.stringify(all)); }
}

/* ===== CREATE QUIZ PAGE (Professional) ===== */
function CreateQuizPage() {
  const { toast } = useToast();
  const { go } = usePage();
  const [step, setStep] = useState(1); // 1=details, 2=questions, 3=preview
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [quizType, setQuizType] = useState<'personality' | 'trivia'>('personality');
  const [questions, setQuestions] = useState([{ q: '', options: ['', '', '', ''], correct: 0 }]);
  const [resultNames, setResultNames] = useState(['Result A', 'Result B', 'Result C', 'Result D']);
  const user = getUser();

  const addQ = () => setQuestions([...questions, { q: '', options: ['', '', '', ''], correct: 0 }]);
  const rmQ = (i: number) => { if (questions.length > 1) setQuestions(questions.filter((_, idx) => idx !== i)); };
  const uQ = (i: number, f: string, v: string | number) => {
    const qs = [...questions];
    if (f === 'q') qs[i].q = v as string;
    else if (f === 'correct') qs[i].correct = v as number;
    else { const oi = parseInt(f); qs[i].options[oi] = v as string; }
    setQuestions(qs);
  };

  const filledQuestions = questions.filter(q => q.q.trim() && q.options.some(o => o.trim()));
  const isValid = title.trim().length >= 3 && filledQuestions.length >= 3;
  const colors = ['from-violet-500 to-purple-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500'];

  const publish = () => {
    if (!isValid) { toast('Need a title and at least 3 questions!', 'warning'); return; }
    if (!user) { toast('Please sign up to publish quizzes! 🔐', 'warning'); return; }

    const color = colors[Math.floor(Math.random() * colors.length)];
    const newQuiz: Quiz & { author: string; createdAt: string; likes: number } = {
      id: 'community-' + Date.now(),
      title: { en: title, tr: title, es: title, fr: title, de: title, pt: title },
      description: { en: desc || 'A quiz by ' + user.username, tr: desc || user.username + ' tarafından bir quiz', es: desc || 'Un quiz de ' + user.username, fr: desc || 'Un quiz de ' + user.username, de: desc || 'Ein Quiz von ' + user.username, pt: desc || 'Um quiz de ' + user.username },
      category: 'fun', emoji, color, plays: 0,
      time: Math.max(2, Math.ceil(filledQuestions.length * 0.4)),
      author: user.username,
      createdAt: new Date().toISOString(),
      likes: 0,
      questions: filledQuestions.map(q => ({
        question: { en: q.q, tr: q.q, es: q.q, fr: q.q, de: q.q, pt: q.q },
        options: q.options.filter(o => o.trim()).map(o => ({ en: o, tr: o, es: o, fr: o, de: o, pt: o })),
        results: quizType === 'trivia'
          ? q.options.filter(o => o.trim()).map((o, idx) => {
              const t = idx === q.correct ? `✅ Correct! ${o}` : `❌ Wrong — ${o}`;
              return { en: t, tr: t, es: t, fr: t, de: t, pt: t };
            })
          : q.options.filter(o => o.trim()).map((_, idx) => {
              const r = resultNames[idx] || `Type ${String.fromCharCode(65 + idx)}`;
              return { en: r, tr: r, es: r, fr: r, de: r, pt: r };
            }),
      })),
    };

    saveCommunityQuiz(newQuiz);
    user.xp += 50; user.quizzesCreated++;
    user.level = levelFromXp(user.xp).level;
    if (!user.badges.includes('creator')) user.badges.push('creator');
    saveUser(user);
    toast('🎉 Quiz published! +50 XP! Everyone can play it now!', 'success', <Sparkles className="w-4 h-4" />);
    go('community' as Page);
  };

  const emojis = ['🎯', '🧠', '💡', '🎮', '🌟', '🔥', '💜', '🎪', '🎭', '🏆', '🧩', '🎬', '🍕', '🌍', '❤️', '🐾', '⚽', '🎵', '📚', '🚀', '🎨', '🏖️', '🍔', '🌈'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4"><Edit3 className="w-4 h-4 text-pink-600" /><span className="text-sm font-bold text-pink-700 dark:text-pink-300">Quiz Creator</span></div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>Create Your Quiz</h1>
          <p className="text-gray-500 dark:text-gray-400">Build a quiz and share it with the world! 🌍</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[{ n: 1, l: 'Details' }, { n: 2, l: 'Questions' }, { n: 3, l: 'Preview' }].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setStep(s.n)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.n ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{s.n}</button>
              <span className={`text-sm font-medium hidden sm:inline ${step >= s.n ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>{s.l}</span>
              {i < 2 && <div className={`w-8 sm:w-16 h-0.5 ${step > s.n ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {!user && <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 mb-6 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-3"><Star className="w-5 h-5 flex-shrink-0" /> Sign up to publish your quiz and earn +50 XP!</div>}

        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">📝 Quiz Details</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Title <span className="text-red-500">*</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. What Type of Coffee Are You?" maxLength={80}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-gray-900 dark:text-white text-lg font-medium" />
                  <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/80</div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Description</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="A fun quiz to discover your inner coffee personality..." rows={3} maxLength={200}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-gray-900 dark:text-white resize-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Quiz Emoji</label>
                  <div className="flex flex-wrap gap-2">{emojis.map(e => (
                    <button key={e} onClick={() => setEmoji(e)} className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 ${emoji === e ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-500 scale-110 shadow-lg' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{e}</button>
                  ))}</div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Quiz Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setQuizType('personality')} className={`p-4 rounded-xl border-2 text-left transition-all ${quizType === 'personality' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
                      <span className="text-2xl block mb-2">🧠</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm block">Personality</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Each option maps to a result type</span>
                    </button>
                    <button onClick={() => setQuizType('trivia')} className={`p-4 rounded-xl border-2 text-left transition-all ${quizType === 'trivia' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
                      <span className="text-2xl block mb-2">🎓</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm block">Trivia / Quiz</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">One correct answer per question</span>
                    </button>
                  </div>
                </div>
                {quizType === 'personality' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Result Names <span className="text-xs text-gray-400 font-normal">(What will players get as their result?)</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {resultNames.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500'][i]}`}>{String.fromCharCode(65 + i)}</div>
                          <input value={r} onChange={e => { const n = [...resultNames]; n[i] = e.target.value; setResultNames(n); }} placeholder={`Result ${String.fromCharCode(65 + i)}`}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!title.trim()} className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 text-lg transition-all ${title.trim() ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-500/25' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
              Next: Add Questions <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Questions */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><ChevronLeft className="w-4 h-4" /> Back to Details</button>
              <span className="text-sm text-gray-400">{filledQuestions.length} question{filledQuestions.length !== 1 ? 's' : ''} added {filledQuestions.length < 3 && <span className="text-amber-500">(min 3)</span>}</span>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">{qi + 1}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Question {qi + 1}</h3>
                  </div>
                  {questions.length > 1 && <button onClick={() => rmQ(qi)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <input value={q.q} onChange={e => uQ(qi, 'q', e.target.value)} placeholder="Type your question here..."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none text-gray-900 dark:text-white mb-4 font-medium" />
                <div className="space-y-2">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button onClick={() => uQ(qi, 'correct', oi)} data-tooltip={quizType === 'trivia' ? 'Mark as correct answer' : `Maps to ${resultNames[oi] || 'Result ' + String.fromCharCode(65 + oi)}`}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          quizType === 'trivia'
                            ? q.correct === oi ? 'bg-green-500 text-white ring-2 ring-green-300 scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                            : `${['bg-violet-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500'][oi]} text-white opacity-${q.correct === oi ? '100 ring-2 ring-offset-2 ring-violet-300 scale-110' : '60'}`
                        }`}>{String.fromCharCode(65 + oi)}</button>
                      <input value={o} onChange={e => uQ(qi, String(oi), e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-gray-900 dark:text-white" />
                    </div>
                  ))}
                </div>
                {quizType === 'trivia' && <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Click the green circle to mark the correct answer</p>}
                {quizType === 'personality' && <p className="text-[11px] text-gray-400 mt-3">A→{resultNames[0]}, B→{resultNames[1]}, C→{resultNames[2]}, D→{resultNames[3]}</p>}
              </div>
            ))}

            <button onClick={addQ} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Plus className="w-5 h-5" /> Add Question {questions.length + 1}
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl">Back</button>
              <button onClick={() => { if (filledQuestions.length < 3) { toast('Add at least 3 questions!', 'warning'); return; } setStep(3); }}
                className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 ${filledQuestions.length >= 3 ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                Preview <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Publish */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><ChevronLeft className="w-4 h-4" /> Back to Questions</button>

            {/* Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
              <div className={`h-40 bg-gradient-to-br ${colors[0]} flex items-center justify-center relative`}>
                <span className="text-7xl">{emoji}</span>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">{filledQuestions.length} Questions</div>
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">Preview</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title || 'Untitled Quiz'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{desc || 'A quiz by ' + (user?.username || 'Anonymous')}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 0 plays</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.max(2, Math.ceil(filledQuestions.length * 0.4))} min</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {filledQuestions.length} questions</span>
                </div>
              </div>
            </div>

            {/* Question Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">📋 Questions Preview</h3>
              <div className="space-y-3">
                {filledQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-7 h-7 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{q.q}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.options.filter(o => o.trim()).map((o, j) => (
                          <span key={j} className={`text-[11px] px-2 py-0.5 rounded-full ${quizType === 'trivia' && q.correct === j ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>{o}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish */}
            <div className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-700">
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 dark:text-white">Ready to Publish?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your quiz will be visible to all ViralMind users worldwide!</p>
              </div>
              <button onClick={publish}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5">
                <Sparkles className="w-6 h-6" /> Publish Quiz (+50 XP) <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== COMMUNITY QUIZZES PAGE ===== */
function CommunityPage() {
  const { lang } = useLang();
  const { go, setQuiz } = usePage();
  const { toast } = useToast();
  const [communityQuizzes, setCQ] = useState(getCommunityQuizzes);
  const [sort, setSort] = useState<'new' | 'popular' | 'top'>('new');
  const user = getUser();

  const sorted = [...communityQuizzes].sort((a, b) => {
    if (sort === 'popular') return (b.plays || 0) - (a.plays || 0);
    if (sort === 'top') return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleLike = (id: string) => {
    likeCommunityQuiz(id);
    setCQ(getCommunityQuizzes());
    if (user) { user.xp += 2; saveUser(user); }
    toast('❤️ Liked! +2 XP', 'success');
  };

  const handlePlay = (q: typeof communityQuizzes[0]) => {
    incrementCommunityPlays(q.id);
    setQuiz(q); go('play');
  };

  const fp = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString();
  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4"><Users className="w-4 h-4 text-pink-600" /><span className="text-sm font-bold text-pink-700 dark:text-pink-300">Community</span></div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>🌍 Community Quizzes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Quizzes created by our community — play, rate & share!</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {[{ k: 'new' as const, l: '🆕 New' }, { k: 'popular' as const, l: '🔥 Popular' }, { k: 'top' as const, l: '❤️ Top Rated' }].map(f => (
              <button key={f.k} onClick={() => setSort(f.k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${sort === f.k ? 'bg-pink-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>{f.l}</button>
            ))}
          </div>
          <button onClick={() => go('create')} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Create a Quiz
          </button>
        </div>

        {communityQuizzes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <span className="text-6xl block mb-4">🎨</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Community Quizzes Yet!</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to create a quiz for the community.</p>
            <button onClick={() => go('create')} className="px-8 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl inline-flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> Create First Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map(q => (
              <div key={q.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-700 transition-all hover:-translate-y-1 group">
                <div className={`h-32 bg-gradient-to-br ${q.color} relative overflow-hidden cursor-pointer`} onClick={() => handlePlay(q)}>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">{q.emoji}</span></div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/20 backdrop-blur-sm rounded-full text-[10px] text-white">{q.questions.length} Q</div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-pink-500/80 backdrop-blur-sm rounded-full text-[10px] text-white font-bold">COMMUNITY</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors cursor-pointer line-clamp-1" onClick={() => handlePlay(q)}>{q.title[lang] || q.title.en}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">{q.description[lang] || q.description.en}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-gradient-to-br from-violet-400 to-pink-400 rounded-full flex items-center justify-center text-white text-[8px] font-bold">{q.author?.charAt(0).toUpperCase() || '?'}</div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{q.author || 'Anonymous'}</span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-xs text-gray-400">{timeAgo(q.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleLike(q.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-pink-500 transition-colors">
                        <Heart className="w-3.5 h-3.5" /> {q.likes}
                      </button>
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3.5 h-3.5" /> {fp(q.plays || 0)}</span>
                    </div>
                  </div>
                  <button onClick={() => handlePlay(q)} className="w-full mt-3 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors flex items-center justify-center gap-1">
                    <Play className="w-3.5 h-3.5" /> Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== PROFILE ===== */
function ProfilePage() { const { lang } = useLang(); const { go } = usePage(); const { toast } = useToast(); const [user] = useState(getUser); if (!user) return <div className="min-h-screen flex items-center justify-center pt-20"><button onClick={() => go('home')} className="px-6 py-3 bg-violet-600 text-white rounded-xl">Go Home</button></div>; const { level } = levelFromXp(user.xp); const allBadges = [{ id: 'first_quiz', n: 'First Steps', e: '🎯', c: 'from-green-400 to-emerald-500' }, { id: 'streak_3', n: 'On Fire', e: '🔥', c: 'from-orange-400 to-red-500' }, { id: 'social', n: 'Social Star', e: '⭐', c: 'from-yellow-400 to-amber-500' }, { id: 'explorer', n: 'Explorer', e: '🗺️', c: 'from-blue-400 to-cyan-500' }, { id: 'genius', n: 'Genius', e: '🧠', c: 'from-purple-400 to-violet-500' }, { id: 'vip', n: 'VIP', e: '👑', c: 'from-amber-400 to-yellow-500' }, { id: 'creator', n: 'Creator', e: '✏️', c: 'from-pink-400 to-rose-500' }]; const handleLogout = () => { localStorage.removeItem('vm-user'); toast('Logged out', 'info'); window.location.reload(); };
  return (<div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16"><div className="max-w-4xl mx-auto px-4">
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6"><div className="h-32 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" /><div className="px-6 pb-6 -mt-12 relative"><div className="flex flex-col sm:flex-row items-center sm:items-end gap-4"><div className="w-24 h-24 bg-gradient-to-br from-violet-400 to-pink-400 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-4 border-white dark:border-gray-800">😎</div><div className="text-center sm:text-left flex-1"><h1 className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>{user.username}</h1><p className="text-gray-500 dark:text-gray-400 text-sm">Since {new Date(user.joinedAt).toLocaleDateString()}</p></div><button onClick={handleLogout} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> Logout</button></div></div></div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"><XpBar xp={user.xp} level={level} /></div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">{[{ l: 'Quizzes', v: user.quizzesTaken, i: BookOpen, c: 'text-violet-600' }, { l: 'XP', v: user.xp, i: Zap, c: 'text-amber-500' }, { l: 'Badges', v: `${user.badges.length}/${allBadges.length}`, i: Medal, c: 'text-emerald-500' }, { l: 'Streak', v: `${user.streak}d`, i: Flame, c: 'text-orange-500' }, { l: 'Power-ups', v: (user.powerups.fifty + user.powerups.skip + user.powerups.hint), i: Target, c: 'text-blue-500' }].map((s, i) => (<div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center"><s.i className={`w-6 h-6 ${s.c} mx-auto mb-2`} /><div className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>{s.v}</div><div className="text-xs text-gray-400 mt-1">{s.l}</div></div>))}</div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"><h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏅 Badges</h2><div className="grid grid-cols-4 sm:grid-cols-7 gap-4">{allBadges.map(b => { const earned = user.badges.includes(b.id); return (<div key={b.id} className={`text-center ${earned ? '' : 'opacity-40'}`}><div className={`w-14 h-14 mx-auto mb-2 bg-gradient-to-br ${b.c} rounded-xl flex items-center justify-center ${earned ? 'shadow-lg' : 'grayscale'}`}><span className="text-2xl">{b.e}</span></div><div className="text-xs font-medium text-gray-700 dark:text-gray-300">{b.n}</div></div>); })}</div></div>
    {user.results.length > 0 && <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"><h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Results</h2><div className="space-y-3">{user.results.slice(-5).reverse().map((r, i) => { const qz = defaultQuizzes.find(q => q.id === r.quizId); if (!qz) return null; return (<div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"><div className={`w-10 h-10 bg-gradient-to-br ${qz.color} rounded-xl flex items-center justify-center flex-shrink-0`}><span className="text-lg">{qz.emoji}</span></div><div className="flex-1 min-w-0"><div className="font-medium text-gray-900 dark:text-white text-sm truncate">{qz.title[lang] || qz.title.en}</div><div className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</div></div><div className="text-sm font-bold text-violet-600 truncate max-w-[120px]">{r.result}</div></div>); })}</div></div>}
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎯 Recommended</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{defaultQuizzes.slice(0, 3).map(q => <QuizCard key={q.id} quiz={q} />)}</div>
  </div></div>); }

/* ===== PREMIUM ===== */
function PremiumPage() { return <div className="min-h-screen pt-20"><PremiumSection /><FAQ /><div className="max-w-7xl mx-auto px-4 pb-16"><AdBanner size="large" /></div></div>; }

/* ===== MONETIZATION GUIDE PAGE ===== */
function MonetizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-950 dark:to-gray-900 pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4"><span className="text-lg">💰</span><span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Monetization Guide</span></div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>How to Earn Money with ViralMind</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">Complete step-by-step guide to monetize your viral quiz platform and generate revenue from day one.</p>
        </div>

        {/* Revenue Calculator */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h2 className="text-2xl font-black mb-4">💰 Revenue Calculator</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[{ l: 'Daily Visitors', v: '100K', sub: 'Target traffic' }, { l: 'Monetag RPM', v: '$6-23', sub: 'All formats combined' }, { l: 'Monthly Revenue', v: '$25K-70K', sub: 'Monetag + AdSense + Premium' }, { l: 'Premium Subs', v: '$20K+', sub: 'At 2% conversion' }].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black">{s.v}</div>
                  <div className="text-sm font-medium text-white/90 mt-1">{s.l}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="space-y-6">
          {[
            { icon: '🔥', title: '1. Monetag (RECOMMENDED #1)', est: '$8,000 - $50,000/mo', difficulty: 'Easy', steps: [
              '🌐 Go to monetag.com and create a publisher account',
              '➕ Click "Add Site" and enter your domain (viralmind.com)',
              '⚡ Instant approval! (usually within 1-24 hours)',
              '🎯 Enable MultiTag format (single script = all ad formats auto-optimized)',
              '📋 Copy the MultiTag script and paste before </body> in index.html',
              '💰 Enable Popunder ($2-8 CPM) — highest revenue for quiz sites!',
              '📱 Enable Vignette/Interstitial ($3-10 CPM) — shows between pages',
              '🔔 Enable In-Page Push ($1-5 CPM) — notification-style ads',
              '🛡️ Anti-AdBlock built in = 30% more revenue vs AdSense!',
              '💳 Minimum payout only $5 via PayPal, Wire, or Crypto',
              '🌍 Best for GLOBAL traffic — pays well for ALL countries!',
            ]},
            { icon: '📢', title: '2. Google AdSense (Additional Revenue)', est: '$3,000 - $15,000/mo', difficulty: 'Easy', steps: [
              '📝 Go to adsense.google.com and create an account',
              '🔗 Add your website URL (viralmind.com)',
              '📋 Add the AdSense script tag to your index.html <head>',
              '✅ Wait for approval (usually 1-14 days)',
              '💡 USE TOGETHER with Monetag for maximum revenue!',
              '📊 Place display ads between quiz cards and in results page',
              '💰 Expected RPM: $3-15 (best for US/UK/EU traffic)',
              '⚠️ Note: Minimum payout $100 — higher than Monetag ($5)',
            ]},
            { icon: '👑', title: '2. Premium Subscriptions (Stripe)', est: '$10,000 - $50,000/mo', difficulty: 'Medium', steps: [
              '🔑 Create a Stripe account at stripe.com',
              '📦 Set up 3 pricing tiers: Free, Pro ($9.99/mo), Business ($49.99/mo)',
              '🔗 Use Stripe Checkout for seamless payments',
              '✨ Pro features: No ads, custom quizzes, detailed analytics',
              '🏢 Business features: API access, white-label, priority support',
              '📈 Target 2-5% conversion rate from free to paid',
              '💡 Show "Remove Ads" prompt after every 3rd quiz',
            ]},
            { icon: '🤝', title: '3. Sponsored Quizzes', est: '$500 - $5,000 per quiz', difficulty: 'Medium', steps: [
              '📧 Create a "Advertise" page with your traffic stats',
              '🎯 Offer brands custom quiz creation (e.g., "Which Nike Shoe Are You?")',
              '📊 Share your engagement metrics: avg time on site, completion rate',
              '💰 Charge $500-$5,000 per sponsored quiz based on reach',
              '🏷️ Mark sponsored content with "Sponsored" labels (FTC compliance)',
              '📩 Reach out to brands in beauty, food, tech, entertainment niches',
            ]},
            { icon: '🔗', title: '4. Affiliate Marketing', est: '$2,000 - $15,000/mo', difficulty: 'Easy', steps: [
              '📚 Join Amazon Associates, ShareASale, CJ Affiliate',
              '🎯 Add affiliate links in quiz results (e.g., "You\'re the Thinker - Check out these books")',
              '🛍️ Recommend products related to personality types, career paths',
              '📊 Track clicks and conversions with UTM parameters',
              '💡 Create "What to Buy Based on Your Personality" quiz with product links',
              '💰 Expected: 3-7% conversion rate, $5-50 per sale commission',
            ]},
            { icon: '📱', title: '5. Native Advertising', est: '$3,000 - $20,000/mo', difficulty: 'Easy', steps: [
              '📝 Sign up for Taboola, Outbrain, or MGID',
              '🎯 Place native ad widgets between quiz cards and in results',
              '💡 "Recommended Content" sections blend naturally with quiz content',
              '📊 Higher CTR than display ads (0.2% vs 0.1%)',
              '🎨 Match ad styling to your site design for better performance',
              '💰 CPM: $2-8 for native ads',
            ]},
            { icon: '📧', title: '6. Email Marketing', est: '$1,000 - $10,000/mo', difficulty: 'Medium', steps: [
              '📝 Add email capture popup after quiz completion',
              '📧 Use Mailchimp, ConvertKit, or Brevo (free tiers available)',
              '🎯 Send weekly "Quiz of the Week" newsletter',
              '💡 Sell sponsored spots in your newsletter ($200-$1,000/issue)',
              '📊 Build segmented lists by quiz type (personality, career, etc.)',
              '🔥 Email list is your most valuable asset for long-term revenue',
            ]},
            { icon: '📊', title: '7. Data & Insights (B2B)', est: '$5,000 - $50,000/mo', difficulty: 'Hard', steps: [
              '📈 Aggregate anonymized quiz trends and personality data',
              '🏢 Sell trend reports to brands, HR companies, marketing agencies',
              '📊 Offer API access for businesses ($49.99/mo Business plan)',
              '🎯 "What Gen Z thinks about..." reports are highly valuable',
              '💡 Partner with universities for research data access',
              '📋 Ensure GDPR/CCPA compliance with all data handling',
            ]},
          ].map((stream, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-4xl">{stream.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stream.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{stream.est}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stream.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : stream.difficulty === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>{stream.difficulty}</span>
                    </div>
                  </div>
                </div>
                <ol className="space-y-2">
                  {stream.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-sm flex-shrink-0 mt-0.5">{step.substring(0, 2)}</span>
                      <span>{step.substring(3)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>

        {/* Monetag vs AdSense Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mt-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">⚔️ Monetag vs Google AdSense</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-3 px-2 font-bold text-orange-600">🔥 Monetag</th>
                  <th className="text-center py-3 px-2 font-bold text-blue-600">📢 AdSense</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {[
                  ['Approval', '⚡ Instant (1-24h)', '🐌 1-14 days'],
                  ['Min Traffic', '❌ None', '⚠️ Required'],
                  ['CPM (Global)', '💰 $1-8', '💰 $0.5-3'],
                  ['CPM (US/EU)', '💰 $3-15', '💰 $5-15'],
                  ['Popunder', '✅ Yes ($2-8 CPM)', '❌ No'],
                  ['Interstitial', '✅ Yes ($3-10 CPM)', '⚠️ Limited'],
                  ['Push Notification', '✅ Yes ($1-5 CPM)', '❌ No'],
                  ['Anti-AdBlock', '✅ Yes (+30% revenue)', '❌ No'],
                  ['Min Payout', '✅ $5', '⚠️ $100'],
                  ['Payment', '💳 PayPal, Crypto, Wire', '💳 Wire, Check'],
                  ['Quiz Sites', '⭐⭐⭐⭐⭐ Perfect', '⭐⭐⭐⭐ Good'],
                  ['Can Use Together?', '✅ YES!', '✅ YES!'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2.5 px-2 font-medium">{row[0]}</td>
                    <td className="py-2.5 px-2 text-center">{row[1]}</td>
                    <td className="py-2.5 px-2 text-center">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">💡 PRO TIP: Use BOTH together for maximum revenue!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Monetag Popunder + Vignette + AdSense Display = 3x more revenue than using only one!</p>
          </div>
        </div>

        {/* Revenue Breakdown by Format */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mt-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Revenue Breakdown (100K Daily Visitors)</h2>
          <div className="space-y-4">
            {[
              { name: 'Monetag Popunder', amount: '$4,000-8,000', pct: 75, color: 'from-orange-400 to-red-500', icon: '🔥' },
              { name: 'Monetag Vignette', amount: '$2,000-5,000', pct: 55, color: 'from-purple-400 to-pink-500', icon: '📱' },
              { name: 'Monetag In-Page Push', amount: '$1,000-3,000', pct: 35, color: 'from-blue-400 to-cyan-500', icon: '🔔' },
              { name: 'AdSense Display', amount: '$3,000-8,000', pct: 60, color: 'from-green-400 to-emerald-500', icon: '📢' },
              { name: 'Premium Subscriptions', amount: '$5,000-20,000', pct: 85, color: 'from-violet-400 to-purple-500', icon: '👑' },
              { name: 'Affiliate Links', amount: '$1,000-5,000', pct: 30, color: 'from-amber-400 to-orange-500', icon: '🔗' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-2xl w-8 flex-shrink-0">{r.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{r.amount}/mo</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${r.color} rounded-full transition-all duration-1000`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">💰 TOTAL POTENTIAL</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Space Grotesk' }}>$16K-49K/mo</span>
            </div>
          </div>
        </div>

        {/* Quick Setup Checklist */}
        <div className="bg-gradient-to-br from-violet-600 to-pink-500 rounded-3xl p-6 sm:p-10 mt-8 text-white relative overflow-hidden">
          <h2 className="text-2xl font-black mb-6">🚀 Launch Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              '☐ Deploy site on Vercel/Netlify (free)',
              '☐ Buy domain (~$12/yr)',
              '☐ Set up Cloudflare (free CDN + SSL)',
              '☐ Sign up Monetag.com (instant approval!)',
              '☐ Enable Monetag MultiTag (1 script = all formats)',
              '☐ Apply for Google AdSense (additional revenue)',
              '☐ Set up Google Analytics 4',
              '☐ Create TikTok + Instagram accounts',
              '☐ Set up Stripe for premium payments',
              '☐ Start email collection (Mailchimp free)',
              '☐ Post quiz results on TikTok daily',
              '☐ Submit to Product Hunt',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3 text-sm">{item}</div>
            ))}
          </div>
        </div>

        {/* Tech Stack for Monetization */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mt-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🛠️ Recommended Tech Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { n: 'Vercel', d: 'Hosting (free)', e: '▲' },
              { n: 'Cloudflare', d: 'CDN + DNS', e: '☁️' },
              { n: 'Google AdSense', d: 'Display ads', e: '📢' },
              { n: 'Stripe', d: 'Payments', e: '💳' },
              { n: 'Mailchimp', d: 'Email marketing', e: '📧' },
              { n: 'Google Analytics', d: 'Analytics', e: '📊' },
              { n: 'Taboola/Outbrain', d: 'Native ads', e: '📱' },
              { n: 'Amazon Associates', d: 'Affiliate', e: '🛍️' },
              { n: 'Hotjar', d: 'User behavior', e: '🔥' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <span className="text-2xl block mb-1">{t.e}</span>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{t.n}</div>
                <div className="text-xs text-gray-400">{t.d}</div>
              </div>
            ))}
          </div>
        </div>

        <AdBanner size="large" />
      </div>
    </div>
  );
}

/* ===== HOME ===== */
function CommunityPreview() {
  const { go } = usePage();
  const cq = getCommunityQuizzes();
  if (cq.length === 0) return null;
  return (
    <section className="py-16 bg-gradient-to-b from-pink-50 to-white dark:from-pink-950/20 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk' }}>🌍 Community Quizzes</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Created by users like you!</p>
          </div>
          <button onClick={() => go('community')} className="px-5 py-2.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-semibold rounded-xl text-sm flex items-center gap-1 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cq.slice(0, 3).map(q => <QuizCard key={q.id} quiz={q} />)}
        </div>
      </div>
    </section>
  );
}

function HomePage() { return <><Hero /><AdBanner size="large" /><DailyQuiz /><TrendingSection /><CommunityPreview /><AdBanner size="native" /><QuizPacks /><CategoriesSection /><AdBanner size="large" /><HowItWorks /><Testimonials /><BlogSection /><AdBanner size="native" /><PremiumSection /><ReferralSection /><FAQ /><CTASection /></>; }

/* ===== MAIN APP ===== */
export default function App() {
  const [page, setPage] = useState<Page>('home'); const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [dark, setDark] = useState(() => { const s = localStorage.getItem('vm-dark'); if (s) return s === '1'; return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches; });
  const [searchOpen, setSearchOpen] = useState(false); const [authOpen, setAuthOpen] = useState(false); const [onboardOpen, setOnboardOpen] = useState(false); const [rewardOpen, setRewardOpen] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('vm-dark', dark ? '1' : '0'); }, [dark]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } if (e.key === 'Escape') { setSearchOpen(false); setAuthOpen(false); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  useEffect(() => { const u = getUser(); if (u && !u.onboarded) setTimeout(() => setOnboardOpen(true), 2000); }, []);
  const render = () => { switch (page) { case 'home': return <HomePage />; case 'trending': return <TrendingPage />; case 'premium': return <PremiumPage />; case 'play': return <QuizPlayPage />; case 'profile': return <ProfilePage />; case 'leaderboard': return <LeaderboardPage />; case 'create': return <CreateQuizPage />; case 'monetize': return <MonetizationPage />; case 'community': return <CommunityPage />; default: return <HomePage />; } };
  return (<ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}><LangProvider><ToastProvider><PageCtx.Provider value={{ page, go: setPage, quiz, setQuiz }}>
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onSearch={() => setSearchOpen(true)} onAuth={() => setAuthOpen(true)} onReward={() => setRewardOpen(true)} />
      {render()}<Footer /><CookieBanner /><SocialProofPopup />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <OnboardingModal open={onboardOpen} onClose={() => { const u = getUser(); if (u) { u.onboarded = true; saveUser(u); } setOnboardOpen(false); }} />
      <DailyRewardModal open={rewardOpen} onClose={() => setRewardOpen(false)} />
    </div>
  </PageCtx.Provider></ToastProvider></LangProvider></ThemeContext.Provider>);
}
