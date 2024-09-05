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
          "py-2 px-4 font-semibold flex items-center gap-4 border-2",
          currentMode && "bg-red-50 border-red-500"
        )}
        onClick={() => setEditorMode(!currentMode)}
      >
        {currentMode ? (
          <LucidePen className="h-4 w-4" />
        ) : (
          <LucideMusic className="h-4 w-4" />
        )}
        {currentMode ? "編集モード" : "再生モード"}
      </button>
      <h2 className="font-semibold">Rapidfire {version}</h2>
    </footer>
  );
}
