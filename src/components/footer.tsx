import { cn } from "@/lib/utils";
import { LucideMusic, LucidePen } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type FooterType = {
  currentMode: boolean;
  setEditorMode: Dispatch<SetStateAction<boolean>>;
  version: string;
};
export function Footer({ currentMode, setEditorMode, version }: FooterType) {
  return (
    <footer className="flex justify-between p-6 pt-0 items-center">
      <button
        className={cn(
          "p-4 font-semibold text-lg flex items-center gap-4 border-4",
          currentMode && "bg-red-50 border-red-500"
        )}
        onClick={() => setEditorMode(!currentMode)}
      >
        {currentMode ? (
          <LucidePen className="h-6 w-6" />
        ) : (
          <LucideMusic className="h-6 w-6" />
        )}
        {currentMode ? "編集モード" : "再生専用モード"}
      </button>
      <h2 className="text-xl font-semibold">Rapidfire {version}</h2>
    </footer>
  );
}
