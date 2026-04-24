import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calculator,
  Smartphone,
  Brain,
  Type,
  Volume2,
  AlarmClock,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaptchaType, CaptchaChallenge } from "@/hooks/useAlarmCaptcha";

interface FullScreenAlarmProps {
  onDismiss: () => void;
  onSnooze: () => void;
  alarmLabel?: string;
  captchaType?: CaptchaType;
  difficulty?: number;
  captchaEnabled?: boolean;
}

const captchaIcons: Record<CaptchaType, React.ReactNode> = {
  math: <Calculator size={20} />,
  shake: <Smartphone size={20} />,
  barcode: <Bell size={20} />,
  memory: <Brain size={20} />,
  typing: <Type size={20} />,
};

// --- Challenge generators ---
const generateMathChallenge = (difficulty: number): CaptchaChallenge => {
  let a: number, b: number, operation: string, answer: number;
  switch (difficulty) {
    case 1:
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      operation = "+";
      answer = a + b;
      break;
    case 2:
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      operation = Math.random() > 0.5 ? "+" : "-";
      answer = operation === "+" ? a + b : a - b;
      break;
    case 3:
    default:
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * 10) + 2;
      const ops = ["+", "-", "×"];
      operation = ops[Math.floor(Math.random() * ops.length)];
      if (operation === "+") answer = a + b;
      else if (operation === "-") answer = a - b;
      else answer = a * b;
      break;
  }
  return { type: "math", question: `${a} ${operation} ${b} = ?`, answer: answer.toString(), difficulty };
};

const generateMemoryChallenge = (difficulty: number): CaptchaChallenge => {
  const length = difficulty + 3;
  const sequence = Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
  return { type: "memory", question: `Remember: ${sequence}`, answer: sequence, difficulty };
};

const generateTypingChallenge = (difficulty: number): CaptchaChallenge => {
  const phrases: Record<number, string[]> = {
    1: ["I am awake", "Good morning", "Rise and shine"],
    2: ["I am fully awake now", "Time to start the day", "No more snoozing"],
    3: ["I promise to get out of bed right now", "Sleep is for the weak and I am strong", "Carpe diem my friend"],
  };
  const phrase = phrases[difficulty]?.[Math.floor(Math.random() * 3)] ?? "I am awake";
  return { type: "typing", question: `Type: "${phrase}"`, answer: phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ""), difficulty };
};

const generateShakeChallenge = (difficulty: number): CaptchaChallenge => {
  const shakeCount = difficulty * 10 + 10;
  return { type: "shake", question: `Shake your phone ${shakeCount} times`, answer: shakeCount.toString(), difficulty };
};

const generateChallenge = (type: CaptchaType, difficulty: number): CaptchaChallenge => {
  switch (type) {
    case "math": return generateMathChallenge(difficulty);
    case "memory": return generateMemoryChallenge(difficulty);
    case "typing": return generateTypingChallenge(difficulty);
    case "shake": return generateShakeChallenge(difficulty);
    default: return generateMathChallenge(difficulty);
  }
};

export const FullScreenAlarm = ({
  onDismiss,
  onSnooze,
  alarmLabel = "Alarm",
  captchaType = "math",
  difficulty = 2,
  captchaEnabled = true,
}: FullScreenAlarmProps) => {
  const [now, setNow] = useState(new Date());
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [challenge, setChallenge] = useState<CaptchaChallenge>(() => generateChallenge(captchaType, difficulty));
  const [userAnswer, setUserAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState<"show" | "input">("show");
  const [shakeCount, setShakeCount] = useState(0);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memory phase timer
  useEffect(() => {
    if (challenge.type === "memory" && memoryPhase === "show") {
      const timer = setTimeout(() => setMemoryPhase("input"), 3000);
      return () => clearTimeout(timer);
    }
  }, [challenge, memoryPhase]);

  // Shake completion
  useEffect(() => {
    if (challenge.type === "shake" && shakeCount >= parseInt(challenge.answer)) {
      onDismiss();
    }
  }, [shakeCount, challenge, onDismiss]);

  const triggerHaptic = useCallback((pattern: number | number[] = 30) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const handleDismissPress = useCallback(() => {
    triggerHaptic(50);
    if (!captchaEnabled) {
      onDismiss();
      return;
    }
    setChallenge(generateChallenge(captchaType, difficulty));
    setUserAnswer("");
    setAttempts(0);
    setMemoryPhase("show");
    setShakeCount(0);
    setShowCaptcha(true);
  }, [captchaEnabled, captchaType, difficulty, onDismiss, triggerHaptic]);

  const handleSubmit = useCallback(() => {
    triggerHaptic(40);
    const isCorrect = userAnswer.toLowerCase().trim() === challenge.answer.toLowerCase();
    if (isCorrect) {
      triggerHaptic([50, 30, 50]);
      onDismiss();
    } else {
      triggerHaptic([100, 50, 100]);
      setShowError(true);
      setUserAnswer("");
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setChallenge(generateChallenge(captchaType, difficulty));
          return 0;
        }
        return next;
      });
      setTimeout(() => setShowError(false), 1000);
    }
  }, [userAnswer, challenge, captchaType, difficulty, onDismiss]);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-background overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-destructive/20"
            style={{ width: 200 + i * 120, height: 200 + i * 120 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Pulsing background overlay */}
      <motion.div
        className="absolute inset-0 bg-destructive/5"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Top section - time & label */}
      <div className="relative z-10 flex flex-col items-center pt-16 sm:pt-20">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="flex items-center gap-2 mb-4"
        >
          <Volume2 size={18} className="text-destructive" />
          <span className="text-sm font-semibold tracking-wide uppercase text-destructive">
            Alarm Ringing
          </span>
        </motion.div>

        <motion.div
          className="text-7xl sm:text-8xl font-extralight tracking-tight text-foreground tabular-nums"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          {timeStr}
        </motion.div>

        <p className="text-muted-foreground text-base mt-2">{dateStr}</p>

        <div className="flex items-center gap-2 mt-4">
          <AlarmClock size={16} className="text-primary" />
          <span className="text-primary font-medium text-lg">{alarmLabel}</span>
        </div>
      </div>

      {/* Center - animated bell */}
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          className="w-28 h-28 rounded-full bg-destructive/15 flex items-center justify-center"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: [-12, 12, -12] }}
            transition={{ duration: 0.15, repeat: Infinity }}
          >
            <Bell size={48} className="text-destructive" />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom section - actions */}
      <AnimatePresence mode="wait">
        {!showCaptcha ? (
          <motion.div
            key="actions"
            className="relative z-10 w-full px-6 pb-12 sm:pb-16 flex flex-col items-center gap-4 max-w-sm mx-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            {/* Snooze — large, instant feedback, no captcha gate */}
            <Button
              onPointerDown={() => triggerHaptic([30, 50, 30])}
              onClick={onSnooze}
              variant="secondary"
              className="w-full h-20 text-xl font-semibold rounded-2xl bg-secondary hover:bg-secondary/80 active:scale-[0.98] transition-transform touch-manipulation"
              aria-label="Snooze alarm for 5 minutes"
            >
              <Moon size={24} className="mr-2" />
              Snooze (5 min)
            </Button>

            {/* Dismiss — opens captcha or dismisses immediately if disabled */}
            <Button
              onPointerDown={() => triggerHaptic(50)}
              onClick={handleDismissPress}
              variant="destructive"
              className="w-full h-20 text-xl font-semibold rounded-2xl active:scale-[0.98] transition-transform touch-manipulation"
              aria-label="Dismiss alarm"
            >
              Dismiss Alarm
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="captcha"
            className="relative z-10 w-full px-6 pb-12 sm:pb-16 max-w-sm mx-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            {/* Challenge card */}
            <div className="rounded-2xl bg-card border border-border p-6 mb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {captchaIcons[challenge.type]}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)} Challenge
                </span>
              </div>

              {challenge.type === "math" && (
                <>
                  <div className="text-4xl font-bold text-foreground text-center mb-4">
                    {challenge.question}
                  </div>
                  <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter answer"
                    className={`text-center text-2xl h-14 ${showError ? "border-destructive animate-pulse" : ""}`}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                  />
                </>
              )}

              {challenge.type === "memory" && (
                <>
                  {memoryPhase === "show" ? (
                    <motion.div
                      className="text-4xl font-bold text-primary text-center font-mono py-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {challenge.answer}
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-center text-muted-foreground mb-4">
                        Enter the sequence you saw
                      </p>
                      <Input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Enter sequence"
                        className={`text-center text-2xl h-14 font-mono ${showError ? "border-destructive animate-pulse" : ""}`}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        autoFocus
                      />
                    </>
                  )}
                </>
              )}

              {challenge.type === "typing" && (
                <>
                  <div className="text-lg text-foreground text-center mb-4">
                    {challenge.question}
                  </div>
                  <Input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type the phrase..."
                    className={`text-center h-14 ${showError ? "border-destructive animate-pulse" : ""}`}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoFocus
                  />
                </>
              )}

              {challenge.type === "shake" && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-foreground">
                      {shakeCount} / {challenge.answer}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Tap the button to simulate shaking</p>
                  </div>
                  <Button
                    onClick={() => setShakeCount((prev) => prev + 1)}
                    className="w-full h-16 text-lg bg-primary hover:bg-primary/90"
                  >
                    <Smartphone className="mr-2" size={24} />
                    Shake!
                  </Button>
                </>
              )}
            </div>

            {/* Submit (except shake & memory-show) */}
            {challenge.type !== "shake" && memoryPhase !== "show" && (
              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90"
                disabled={!userAnswer}
              >
                Submit Answer
              </Button>
            )}

            {attempts > 0 && (
              <motion.p
                className="text-destructive text-center mt-3 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Wrong answer! {3 - attempts} attempts remaining
              </motion.p>
            )}

            {/* Back to snooze */}
            <Button
              variant="ghost"
              onClick={() => setShowCaptcha(false)}
              className="w-full mt-2 text-muted-foreground"
            >
              Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
