import { cn } from "@/lib/utils";
import { LucidePause, LucidePlay, LucideSquare, LucideTriangleRight } from "lucide-react";
import { Slider } from "./ui/slider";
import {
  getAccentColor,
  getAudioTypeIcon,
  getBackgroundColor,
} from "@/lib/colortype";
import { SoundInstance } from "@/App";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";
import { usePerformanceCounter } from "@/lib/usePerformanceCounter";
import { useListen } from "@/lib/useListen";

type DispatchedPlay = {
  id: string;
  sound: SoundInstance;
  total_duration: number;
};

type DispatchCurrent = {
  id: string;
  pos: number;
  phase: "playing" | "paused" | "loading";
};



const formatTime = (v: number) => `${Math.floor(v / 60 / 1000)}:${('0' + Math.floor((v / 1000) % 60)).slice(-2)}`;

export function NowPlay() {

  const [dispatches, setDispatches] = useState<DispatchedPlay[]>([]);

  useEffect(() => {
    const unlisten = listen<DispatchedPlay[]>("dispatches", (event) => {
      setDispatches(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="grid grid-cols-1 p-6 gap-2">
      {dispatches.map(item => (
        <DispatchedItem key={item.id} item={item} />
      ))}
    </div>
  );
}

const DispatchedItem = ({ item }: { item: DispatchedPlay }) => {

  const [current, setCurrent] = useState<DispatchCurrent & { currentAt: number }>(
    { id: item.id, pos: 0, phase: "loading", currentAt: performance.now() }
  );

  useListen<DispatchCurrent>('dispatch_current', async event => {
    if (event.payload.id !== item.id) return;
    setSeek(null);
    setCurrent({
      ...event.payload,
      currentAt: performance.now()
    });
  });

  useEffect(() => {
    invoke<DispatchCurrent>("get_dispatched_current", { id: item.id }).then((current) => {
      setSeek(null);
      setCurrent({
        ...current,
        currentAt: performance.now()
      });
    });
  }, []);

  const counter = usePerformanceCounter();

  const pos = Math.max(current.phase === "playing" ? counter - current.currentAt + current.pos : current.pos, 0);
  const progress = (pos / item.total_duration);
  const [seek, setSeek] = useState<number | null>(null);

  const seekedPos = seek === null ? pos : seek / 100 * item.total_duration;
  const sliderDisabled = current.phase === "loading";

  return (
    <div
      className={cn(
        "px-4 py-2 font-semibold flex items-center gap-6",
        getBackgroundColor(item.sound.variant)
      )}
    >
      <div>
        {getAudioTypeIcon({ type: item.sound.variant, className: "h-6 w-6" })}
      </div>
      <span className="text-xl w-72">{item.sound.display_name}</span>
      <div className="flex-1 w-full">
          <Slider accent={getAccentColor(item.sound.variant)} 
            onValueChange={v => setSeek(v[0])}
            onValueCommit={v => {
              invoke("seek_dispatched_play", { id: item.id, pos: v[0] / 100 * item.total_duration });
            }}
            thumb={!sliderDisabled}
            disabled={sliderDisabled}
            value={[
              seek === null ? progress * 100 : seek,
          ]} />
      </div>
      <span>{current.phase === "loading" ? "-:--" : formatTime(seekedPos)} / {formatTime(item.total_duration)}</span>
      <div className="flex gap-2">
        <button className={cn("p-2", current.phase === "loading" && "invisible")} onClick={() => {
            invoke("pause_dispatched_play", { id: item.id, paused: current.phase === "playing" });
            }}>
          {
            current.phase === "playing" ? 
              <LucidePause className="h-6 w-6" /> : <LucidePlay className="h-6 w-6" />
          }
        </button>
        <button className="p-2" onClick={() => {
           invoke("stop_dispatched_play", { id: item.id, fade: false });
        }}>
          <LucideSquare className="h-6 w-6 fill-black" />
        </button>
        <button className="p-2" onClick={() => {
            invoke("stop_dispatched_play", { id: item.id, fade: true });
            }}>
          <LucideTriangleRight className="h-6 w-6 hue-rotate-90 -scale-x-100" />
        </button>
      </div>
    </div>
  );
};
