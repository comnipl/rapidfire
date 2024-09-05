import { LucideMicVocal, LucideMusic, LucideSparkles } from "lucide-react";
import { AudioPlayType } from "./type";

export const getBackgroundColor = (type: AudioPlayType) => {
  switch (type) {
    case "bgm":
      return "bg-blue-100";
    case "effect":
      return "bg-yellow-100";
    case "voice":
      return "bg-red-100";
  }
};

export const getAccentColor = (type: AudioPlayType) => {
  switch (type) {
    case "bgm":
      return "bg-blue-400";
    case "effect":
      return "bg-yellow-400";
    case "voice":
      return "bg-red-400";
  }
};

type GetAudioTypeIcon = {
  type: AudioPlayType;
  className?: string;
};
export const getAudioTypeIcon = ({ type, className }: GetAudioTypeIcon) => {
  switch (type) {
    case "bgm":
      return <LucideMusic className={className} />;
    case "effect":
      return <LucideSparkles className={className} />;
    case "voice":
      return <LucideMicVocal className={className} />;
  }
};
