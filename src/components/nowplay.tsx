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

type Dispatched = {
  id: string,
  dispatched: DispatchedPlay;
  current: DispatchCurrent;
  currentAt: number;
};


const formatTime = (v: number) => `${Math.floor(v / 60 / 1000)}:${('0' + Math.ceil((v / 1000) % 60)).slice(-2)}`;

export function NowPlay() {

  const [dispatches, setDispatches] = useState<Dispatched[]>([]);
  const counter = usePerformanceCounter();

  useEffect(() => {
    const unlisten = listen<DispatchedPlay[]>("dispatches", (event) => {
      
      const currentAt = performance.now();
      setDispatches(prev => 
        event.payload.map<Dispatched>(i => {
          const found = prev.find(j => j.id === i.id);
          if (found) {
            return {
              ...found,
              dispatched: i
            };
          }
          return {
            id: i.id,
            dispatched: i,
            current: {
              id: i.id,
              pos: 0,
              phase: "loading"
            },
            currentAt,
          };
        })
      );
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const unlisten = listen<DispatchCurrent>("dispatch_current", (event) => {
      console.log("dispatch_current", event.payload);
      const currentAt = performance.now();
      setDispatches(prev => 
        prev.map<Dispatched>(i => {
          if (i.id === event.payload.id) {
            return {
              ...i,
              current: event.payload,
              currentAt
            };
          }
          return i;
        })
      );
    });

    return () => {
      unlisten.then((f) => f());
    };
  });

  return (
    <div className="grid grid-cols-1 p-6 gap-2">
      {dispatches.map(item => (
        <DispatchedItem key={item.id} item={item} counter={counter} />
      ))}
    </div>
  );
}

const DispatchedItem = ({ item, counter }: { item: Dispatched, counter: number }) => {

  const pos = item.current.phase === "playing" ? counter - item.currentAt + item.current.pos : item.current.pos;

  return (
    <div
      className={cn(
        "px-4 py-2 font-semibold flex items-center gap-6",
        getBackgroundColor(item.dispatched.sound.variant)
      )}
    >
      <div>
        {getAudioTypeIcon({ type: item.dispatched.sound.variant, className: "h-6 w-6" })}
      </div>
      <span className="text-xl w-72">{item.dispatched.sound.display_name}</span>
      <div className="flex-1 w-full">
        <Slider accent={getAccentColor(item.dispatched.sound.variant)} thumb={false} disabled value={[
          (pos / item.dispatched.total_duration) * 100
        ]} />
      </div>
      <span>{formatTime(pos)} / {formatTime(item.dispatched.total_duration)}</span>
      <div className="flex gap-2">
        {/*
          <button className="p-2">
            <LucidePause className="h-6 w-6" />
          </button>
        */}
        <button className="p-2" onClick={() => {
            invoke("pause_dispatched_play", { id: item.id, paused: item.current.phase === "playing" });
            }}>
          {
            item.current.phase === "playing" ? 
            <LucidePause className="h-6 w-6" /> : <LucidePlay className="h-6 w-6" />
          }
        </button>
        <button className="p-2" onClick={() => {
            invoke("stop_dispatched_play", { id: item.id, fade: true });
            }}>
          <LucideTriangleRight className="h-6 w-6 hue-rotate-90 -scale-x-100" />
        </button>
        <button className="p-2" onClick={() => {
           invoke("stop_dispatched_play", { id: item.id, fade: false });
        }}>
          <LucideSquare className="h-6 w-6 fill-black" />
        </button>
      </div>
    </div>
  );
};
