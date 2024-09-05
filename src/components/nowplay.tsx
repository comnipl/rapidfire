import { cn } from "@/lib/utils";
import { LucidePause, LucideSquare, LucideTriangleRight } from "lucide-react";
import { Slider } from "./ui/slider";
import {
  getAccentColor,
  getAudioTypeIcon,
  getBackgroundColor,
} from "@/lib/colortype";
import { SoundInstance } from "@/App";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

type DispatchedPlay = {
  id: string;
  sound: SoundInstance;
  last_played_when: number;
  last_played_from: number;
  total_duration: number;
};
const formatTime = (v: number) => `${Math.floor(v / 60)}:${('0' + Math.round(v % 60)).slice(-2)}`;
export function NowPlay() {

  const [dispatches, setDispatches] = useState<DispatchedPlay[]>([]);
  const [passed, setPassed] = useState<number>(Date.now() / 1000);

  useEffect(() => {

    const unlisten = listen<DispatchedPlay[]>("dispatches", (event) => {
      setDispatches(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPassed(Date.now() / 1000);
    },50)
    return () => clearInterval(id)
  },[]) 

  return (
    <div className="grid grid-cols-1 p-6 gap-2">
      {dispatches.map((item, i) => (
        <div
          className={cn(
            "px-4 py-2 font-semibold flex items-center gap-6",
            getBackgroundColor(item.sound.variant)
          )}
          key={i}
        >
          <div>
            {getAudioTypeIcon({ type: item.sound.variant, className: "h-6 w-6" })}
          </div>
          <span className="text-xl w-72">{item.sound.display_name}</span>
          <div className="flex-1 w-full">
            <Slider className={cn("text-black", getAccentColor(item.sound.variant))} disabled value={[
              ((passed - item.last_played_when) / item.total_duration) * 100
            ]} />
          </div>
          <span>{formatTime(passed - item.last_played_when)} / {formatTime(item.total_duration)}</span>
          <div className="flex gap-2">
            <button className="p-2">
              <LucidePause className="h-6 w-6" />
            </button>
            <button className="p-2">
              <LucideTriangleRight className="h-6 w-6 hue-rotate-90 -scale-x-100" />
            </button>
            <button className="p-2">
              <LucideSquare className="h-6 w-6 fill-black" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
