import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { Bell, Calculator, Smartphone, Brain, Type, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaptchaType, CaptchaChallenge } from "@/hooks/useAlarmCaptcha";

interface AlarmCaptchaProps {
  onDismiss: () => void;
  captchaType?: CaptchaType;
  difficulty?: number;
   persistentSound?: boolean;
}

const captchaIcons: Record<CaptchaType, React.ReactNode> = {
  math: <Calculator size={24} />,
  shake: <Smartphone size={24} />,
  barcode: <Bell size={24} />,
  memory: <Brain size={24} />,
  typing: <Type size={24} />,
};

const generateMathChallenge = (difficulty: number): CaptchaChallenge => {
  let a: number, b: number, operation: string, answer: number;
  
  switch (difficulty) {
    case 1:
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      operation = '+';
      answer = a + b;
      break;
    case 2:
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      operation = Math.random() > 0.5 ? '+' : '-';
      answer = operation === '+' ? a + b : a - b;
      break;
    case 3:
    default:
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * 10) + 2;
      const ops = ['+', '-', '×'];
      operation = ops[Math.floor(Math.random() * ops.length)];
      if (operation === '+') answer = a + b;
      else if (operation === '-') answer = a - b;
      else answer = a * b;
      break;
  }

  return {
    type: 'math',
    question: `${a} ${operation} ${b} = ?`,
    answer: answer.toString(),
    difficulty,
  };
};

const generateMemoryChallenge = (difficulty: number): CaptchaChallenge => {
  const length = difficulty + 3;
  const sequence = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  return {
    type: 'memory',
    question: `Remember: ${sequence}`,
    answer: sequence,
    difficulty,
  };
};

const generateTypingChallenge = (difficulty: number): CaptchaChallenge => {
  const phrases = {
    1: ['I am awake', 'Good morning', 'Rise and shine'],
    2: ['I am fully awake now', 'Time to start the day', 'No more snoozing'],
    3: ['I promise to get out of bed right now', 'Sleep is for the weak and I am strong', 'Carpe diem my friend'],
  };
  const phrase = phrases[difficulty as 1 | 2 | 3][Math.floor(Math.random() * 3)];
  return {
    type: 'typing',
    question: `Type: "${phrase}"`,
    answer: phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
    difficulty,
  };
};

const generateShakeChallenge = (difficulty: number): CaptchaChallenge => {
  const shakeCount = difficulty * 10 + 10;
  return {
    type: 'shake',
    question: `Shake your phone ${shakeCount} times`,
    answer: shakeCount.toString(),
    difficulty,
  };
};

const generateChallenge = (type: CaptchaType, difficulty: number): CaptchaChallenge => {
  switch (type) {
    case 'math':
      return generateMathChallenge(difficulty);
    case 'memory':
      return generateMemoryChallenge(difficulty);
    case 'typing':
      return generateTypingChallenge(difficulty);
    case 'shake':
      return generateShakeChallenge(difficulty);
    default:
      return generateMathChallenge(difficulty);
  }
};

export const AlarmCaptcha = ({ 
  onDismiss, 
  captchaType = 'math',
   difficulty = 2,
   persistentSound = true
}: AlarmCaptchaProps) => {
  const [currentChallenge, setCurrentChallenge] = useState<CaptchaChallenge>(() => 
    generateChallenge(captchaType, difficulty)
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'input'>('show');
  const [shakeCount, setShakeCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
   const [isRinging, setIsRinging] = useState(true);
 
   // Prevent dismissing by clicking outside - alarm is persistent!
   // User MUST complete the CAPTCHA

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
    const isCorrect = userAnswer.toLowerCase().trim() === currentChallenge.answer.toLowerCase();
    
    if (isCorrect) {
      onDismiss();
    } else {
      setShowError(true);
      setUserAnswer("");
      setAttempts(prev => prev + 1);
      // Generate new challenge after 3 wrong attempts
      if (attempts >= 2) {
        setCurrentChallenge(generateChallenge(captchaType, difficulty));
        setAttempts(0);
      }
      setTimeout(() => setShowError(false), 1000);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Prevent closing by tapping background
      onClick={(e) => e.stopPropagation()}
    >
       {/* Pulsing background effect to indicate urgency */}
       <motion.div
         className="absolute inset-0 bg-destructive/10"
         animate={{ opacity: [0.1, 0.2, 0.1] }}
         transition={{ duration: 2, repeat: Infinity }}
       />
 
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-md w-full mx-4 relative z-10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Alarm Icon */}
        <motion.div
          className="w-24 h-24 rounded-full bg-destructive/20 mx-auto mb-6 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, -5, 5, -5, 0]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 0.15, repeat: Infinity }}
          >
            <Bell size={40} className="text-destructive" />
          </motion.div>
        </motion.div>
 
        {/* Ringing indicator */}
        {isRinging && (
          <motion.div 
            className="flex items-center justify-center gap-2 mb-4"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Volume2 size={18} className="text-destructive" />
            <span className="text-sm text-destructive font-medium">Alarm Ringing</span>
          </motion.div>
        )}

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
