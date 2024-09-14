import { cn } from "@/lib/utils";

export function SideBar({ className, scenes, sceneId, setSceneId }: {
  className?: string;
  scenes: { id: string, display_name: string }[];
  sceneId: string | null;
  setSceneId: (id: string) => void;
}) {
  return (
    <div className={cn("w-full h-full px-4 flex flex-col gap-4 snap-y", className)}>
      {scenes.map(item => (
        <button className={cn("w-full py-3 bg-gray-100 text-xl font-bold snap-start", sceneId === item.id && 'bg-blue-300')} key={item.id} onClick={() => setSceneId(item.id)}>
          {item.display_name}
        </button>
      ))}
    </div>
  );
}
