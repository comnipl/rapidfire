import { cn } from "@/lib/utils";
import { LucidePause, LucideSquare, LucideTriangleRight } from "lucide-react";
import { Slider } from "./ui/slider";
import {
  getAccentColor,
  getAudioTypeIcon,
  getBackgroundColor,
} from "@/lib/colortype";
import { AudioPlayType } from "@/lib/type";

type NowPlayType = {
  title: string;
  type: AudioPlayType;
};
const nowPlay: NowPlayType[] = [
  {
    title: "Rapidfire BGM",
    type: "bgm",
  },
  {
    title: "Rapidfire Effect",
    type: "effect",
  },
  {
    title: "Rapidfire Voice",
    type: "voice",
  },
];
export function NowPlay() {
  return (
    <div className="grid grid-cols-1 grid-rows-3 p-6 gap-2">
      {nowPlay.map((item, i) => (
        <div
          className={cn(
            "px-4 py-2 font-semibold flex items-center gap-6",
            getBackgroundColor(item.type)
          )}
          key={i}
        >
          <div>
            {getAudioTypeIcon({ type: item.type, className: "h-6 w-6" })}
          </div>
          <span className="text-xl w-72 bg-white/80">{item.title}</span>
          <div className="flex-1 w-full">
            <Slider className={cn("text-black", getAccentColor(item.type))} />
          </div>
          <span>1:20 / 3:40</span>
          <div className="flex gap-2">
            <button className="p-2 bg-white/80">
              <LucidePause className="h-8 w-8" />
            </button>
            <button className="p-2 bg-white/80">
              <LucideTriangleRight className="h-8 w-8 hue-rotate-90 -scale-x-100" />
            </button>
            <button className="p-2 bg-white/80">
              <LucideSquare className="h-8 w-8 fill-black" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
