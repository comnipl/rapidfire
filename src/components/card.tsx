import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";
import { getAccentColor, getAudioTypeIcon } from "@/lib/colortype";
import { AudioPlayType } from "@/lib/type";
import { LucideRepeat } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

export type CardType = {
  type: AudioPlayType;
  title: string;
  isEditorMode: boolean;
  isRepeat: boolean;
  setIsRepeat: Dispatch<SetStateAction<boolean>>;
  volume: number;
  setVolume: (value: number) => void;
};

export function Card({
  title,
  type,
  isEditorMode,
  isRepeat,
  setIsRepeat,
  volume,
  setVolume,
}: CardType) {
  return (
    <div className="p-4 h-fit gap-4 border-2 border-neutral-200 flex flex-col justify-between hover:bg-neutral-100">
      <h2 className="text-xl font-semibold text-center">{title}</h2>
      <div className="mx-auto w-fit p-4 bg-slate-300 rounded-full">
        {getAudioTypeIcon({ type, className: "h-6 w-6" })}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Slider
            className={cn(
              getAccentColor("bgm"),
              "duration-200",
              !isEditorMode && "bg-neutral-200"
            )}
            min={0}
            step={1}
            max={100}
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            disabled={!isEditorMode}
          />
        </div>
        <input
          type="number"
          max={100}
          min={0}
          step={1}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-12 font-semibold"
          disabled={!isEditorMode}
        />
        <button
          className={cn(
            "p-2 w-fit disabled:text-neutral-500",
            isRepeat && "bg-blue-200"
          )}
          onClick={() => setIsRepeat(!isRepeat)}
          disabled={!isEditorMode}
        >
          <LucideRepeat className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
