import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Calculator, Smartphone, Brain, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlarmCaptcha, CaptchaType } from "@/hooks/useAlarmCaptcha";

interface AlarmCaptchaProps {
  onDismiss: () => void;
}

const captchaIcons: Record<CaptchaType, React.ReactNode> = {
  math: <Calculator size={24} />,
  shake: <Smartphone size={24} />,
  barcode: <Bell size={24} />,
  memory: <Brain size={24} />,
  typing: <Type size={24} />,
};

export const AlarmCaptcha = ({ onDismiss }: AlarmCaptchaProps) => {
  const { currentChallenge, attempts, submitAnswer, settings } = useAlarmCaptcha();
  const [userAnswer, setUserAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'input'>('show');
  const [shakeCount, setShakeCount] = useState(0);

  // Handle memory challenge phases
  useEffect(() => {
    if (currentChallenge?.type === 'memory' && memoryPhase === 'show') {
      const timer = setTimeout(() => setMemoryPhase('input'), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentChallenge, memoryPhase]);

  // Handle shake detection (simulated with button clicks for web)
  useEffect(() => {
    if (currentChallenge?.type === 'shake') {
      const target = parseInt(currentChallenge.answer);
      if (shakeCount >= target) {
        onDismiss();
      }
    }
  }, [shakeCount, currentChallenge, onDismiss]);

  const handleSubmit = () => {
    const success = submitAnswer(userAnswer);
    if (success) {
      onDismiss();
    } else {
      setShowError(true);
      setUserAnswer("");
      setTimeout(() => setShowError(false), 1000);
    }
  };

  if (!currentChallenge) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Alarm Icon */}
        <motion.div
          className="w-20 h-20 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Bell size={36} className="text-accent-foreground" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          Wake Up!
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Complete the challenge to dismiss
        </p>

        {/* Challenge Card */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              {captchaIcons[currentChallenge.type]}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {currentChallenge.type.charAt(0).toUpperCase() + currentChallenge.type.slice(1)} Challenge
            </span>
          </div>

          {currentChallenge.type === 'math' && (
            <>
              <div className="text-4xl font-bold text-foreground text-center mb-4">
                {currentChallenge.question}
              </div>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter answer"
                className={`text-center text-2xl h-14 ${showError ? 'border-destructive animate-pulse' : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </>
          )}

          {currentChallenge.type === 'memory' && (
            <>
              {memoryPhase === 'show' ? (
                <motion.div
                  className="text-4xl font-bold text-primary text-center font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {currentChallenge.answer}
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
                    className={`text-center text-2xl h-14 font-mono ${showError ? 'border-destructive animate-pulse' : ''}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                  />
                </>
              )}
            </>
          )}

          {currentChallenge.type === 'typing' && (
            <>
              <div className="text-lg text-foreground text-center mb-4">
                {currentChallenge.question}
              </div>
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type the phrase..."
                className={`text-center h-14 ${showError ? 'border-destructive animate-pulse' : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </>
          )}

          {currentChallenge.type === 'shake' && (
            <>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-foreground">
                  {shakeCount} / {currentChallenge.answer}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the button below to simulate shaking
                </p>
              </div>
              <Button
                onClick={() => setShakeCount(prev => prev + 1)}
                className="w-full h-16 text-lg gradient-primary"
              >
                <Smartphone className="mr-2" size={24} />
                Shake!
              </Button>
            </>
          )}
        </div>

        {/* Submit Button (except for shake) */}
        {currentChallenge.type !== 'shake' && memoryPhase !== 'show' && (
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-semibold gradient-primary"
            disabled={!userAnswer}
          >
            Submit Answer
          </Button>
        )}

        {/* Attempts */}
        {attempts > 0 && (
          <motion.p
            className="text-destructive text-center mt-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Wrong answer! {3 - attempts} attempts remaining
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};
