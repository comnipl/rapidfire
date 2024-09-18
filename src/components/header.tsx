import { LucideCircleOff, LucideTriangleAlert } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { useListenState } from "@/lib/useListenState";

type HeaderProps = {
  title: string;
};

type VolumeWarningPayload = {
  is_full: boolean;
};

export function Header({ title }: HeaderProps) {

  const isVolumeFull = useListenState<VolumeWarningPayload, boolean>(
    "volume_warning",
    useCallback(async (payload) => payload.is_full, []),
    true,
    useCallback(async () => {
      const response = await invoke<VolumeWarningPayload>("get_volume_warning");
      return response.is_full;
    }, []),
    false,
  );

  return (
    <header className="flex justify-between h-fit w-full py-2 px-6 items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex gap-4 items-center">
        <div
          className={cn(
            "bg-yellow-200 text-yellow-800 px-4 py-2 text-base font-bold flex items-center justify-center rounded shadow-lg shadow-yellow-200/50",
            isVolumeFull && "hidden"
          )}
        >
          <LucideTriangleAlert className="h-5 mr-1" />
          <p className="m-0">音量が100%ではありません</p>
        </div>
        <button className="aspect-square p-4 bg-red-700 rounded" onClick={() => {
          invoke("panic_button");
        }}>
          <LucideCircleOff className="text-white h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
