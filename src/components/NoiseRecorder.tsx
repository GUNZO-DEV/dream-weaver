import { useState, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface NoiseEvent {
  id: string;
  timestamp: Date;
  type: 'snoring' | 'talking' | 'movement' | 'other';
  duration: number;
  intensity: number;
}

export const NoiseRecorder = forwardRef<HTMLDivElement>((_, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [antiSnore, setAntiSnore] = useState(true);
  const [noiseEvents, setNoiseEvents] = useState<NoiseEvent[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);

  // Simulate noise detection
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const level = Math.floor(Math.random() * 100);
      setCurrentLevel(level);

      // Simulate detecting a noise event
      if (level > 70 && Math.random() > 0.7) {
        const types: NoiseEvent['type'][] = ['snoring', 'talking', 'movement', 'other'];
        const newEvent: NoiseEvent = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: types[Math.floor(Math.random() * types.length)],
          duration: Math.floor(Math.random() * 30) + 5,
          intensity: level,
        };
        setNoiseEvents(prev => [newEvent, ...prev].slice(0, 10));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const getTypeIcon = (type: NoiseEvent['type']) => {
    switch (type) {
      case 'snoring': return '😴';
      case 'talking': return '💬';
      case 'movement': return '🛏️';
      default: return '🔊';
    }
  };

  const getTypeColor = (type: NoiseEvent['type']) => {
    switch (type) {
      case 'snoring': return 'text-warning';
      case 'talking': return 'text-primary';
      case 'movement': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      ref={ref}
      className="glass-card rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Noise Recording</h3>
          <p className="text-sm text-muted-foreground">Detect snoring & sleep talk</p>
        </div>
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-destructive animate-pulse' 
              : 'bg-primary/20 hover:bg-primary/30'
          }`}
        >
          {isRecording ? (
            <MicOff size={24} className="text-destructive-foreground" />
          ) : (
            <Mic size={24} className="text-primary" />
          )}
        </button>
      </div>

      {/* Live Level Meter */}
      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Live Level</span>
            <span className="text-sm font-medium text-foreground ml-auto">{currentLevel}dB</span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden flex gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className={`flex-1 rounded-sm ${
                  i < currentLevel / 5 
                    ? i < 10 ? 'bg-success' : i < 15 ? 'bg-warning' : 'bg-destructive'
                    : 'bg-secondary'
                }`}
                animate={{ opacity: i < currentLevel / 5 ? 1 : 0.3 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Anti-Snore Alert */}
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div>
            <p className="font-medium text-foreground">Anti-Snore Alert</p>
            <p className="text-xs text-muted-foreground">Gentle vibration when snoring</p>
          </div>
        </div>
        <Switch checked={antiSnore} onCheckedChange={setAntiSnore} />
      </div>

      {/* Recent Events */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Events</h4>
        {noiseEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isRecording ? 'Listening for sounds...' : 'Start recording to detect events'}
          </p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {noiseEvents.map((event) => (
              <motion.div
                key={event.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTypeIcon(event.type)}</span>
                  <div>
                    <p className={`font-medium capitalize ${getTypeColor(event.type)}`}>
                      {event.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()} • {event.duration}s
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {event.intensity}dB
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

NoiseRecorder.displayName = "NoiseRecorder";
