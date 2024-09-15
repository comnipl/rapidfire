import { LucideCircleOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api";
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
      <div className="flex gap-4">
        <div
          className={cn(
            "bg-yellow-200 p-6 text-2xl font-bold",
            isVolumeFull && "hidden"
          )}
        >
          音量が100%ではありません
        </div>
        <button className="aspect-square p-4 bg-red-700" onClick={() => {
          invoke("panic_button");
        }}>
          <LucideCircleOff className="text-white h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
