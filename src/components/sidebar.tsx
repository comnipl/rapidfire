import { cn } from "@/lib/utils";

export function SideBar({ className, scenes, sceneId, setSceneId }: {
  className?: string;
  scenes: { id: string, display_name: string }[];
  sceneId: string | null;
  setSceneId: (id: string) => void;
}) {
  return (
    <div className={cn("w-full h-full px-4 flex flex-col shadow-inner py-4 gap-2 bg-[#f8fafc]", className)}>
      {scenes.map(item => (
        <SceneCard scene={item} isSelected={sceneId === item.id} onClick={() => setSceneId(item.id)} />
      ))}
    </div>
  );
}

export function SceneCard({ scene, isSelected, onClick }: {
  scene: { id: string, display_name: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button className={cn(
      "w-full text-left py-2.5 px-3 rounded text-slate-700 transition-all duration-500 ease-out-expo flex items-center",
      !isSelected && 'hover:bg-pink-100',
      isSelected && 'bg-pink-400 pl-5 font-semibold shadow-lg shadow-pink-400/50 text-white',
    )} onClick={onClick}>
      {scene.display_name}
    </button>
  );
}
