import { motion } from "framer-motion";

interface SleepStage {
  type: "deep" | "light" | "rem" | "awake";
  duration: number;
}

interface SleepStageBarProps {
  stages: SleepStage[];
  totalDuration: number;
}

const stageColors = {
  deep: "bg-sleep-deep",
  light: "bg-sleep-light",
  rem: "bg-sleep-rem",
  awake: "bg-sleep-awake",
};

const stageLabels = {
  deep: "Deep",
  light: "Light",
  rem: "REM",
  awake: "Awake",
};

export const SleepStageBar = ({ stages, totalDuration }: SleepStageBarProps) => {
  return (
    <div className="w-full">
      <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.duration / totalDuration) * 100;
          return (
            <motion.div
              key={index}
              className={`${stageColors[stage.type]} first:rounded-l-lg last:rounded-r-lg`}
              initial={{ width: 0 }}
              animate={{ width: `${widthPercentage}%` }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(stageLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stageColors[key as keyof typeof stageColors]}`} />
            <span className="text-[12px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
