import "./App.css";
import { Header } from "./components/header";
import { NowPlay } from "./components/nowplay";
import { SideBar } from "./components/sidebar";
import { Footer } from "./components/footer";
import { useCallback, useEffect, useState } from "react";
import { Card } from "./components/card";
import { AudioPlayType } from "./lib/type";
import { invoke } from "@tauri-apps/api";
import { useListenState } from "./lib/useListenState";
import { mockProject } from "./lib/mocks";

export type Project = {
  display_name: string,
  scenes: SoundScene[],
};

export type SoundScene = {
  id: string,
  display_name: string,
  sounds: SoundInstance[],
};

export type SoundInstance = {
  id: string,
  display_name: string,
  path: string,
  volume: number,
  looped: boolean,
  variant: AudioPlayType,
};


function App() {

  const project = useListenState<Project, Project>(
    "project",
    useCallback(async (value) => value, []),
    {
      display_name: "Loading...",
      scenes: [],
    },
    useCallback(async () => invoke<Project>("get_project"), []),
    mockProject,
  );

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const [isEditorMode, setEditorMode] = useState<boolean>(false);

  const scenes = project.scenes.map(scene => ({
    id: scene.id,
    display_name: scene.display_name,
  }));

  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    invoke<string>("version").then((response) =>
      setVersion(response)
    );
  }, []);


  const sounds = project.scenes.find(scene => scene.id === selectedSceneId)?.sounds || [];

  return (
    <div className="flex h-dvh flex-col">
      <Header title={project.display_name} />
      <div className="flex-1 flex overflow-y-hidden">
        <SideBar scenes={scenes} className="w-64 overflow-y-scroll" sceneId={selectedSceneId} setSceneId={id => setSelectedSceneId(id)} />
        <div className="col-span-10 bg-neutral-50 flex flex-wrap items-start content-start overflow-y-scroll flex-1 p-3 pr-8">
          {sounds.map(s => (
            <Card
              id={s.id}
              sceneId={selectedSceneId!}
              key={s.id}
              title={s.display_name}
              type={s.variant}
              isEditorMode={isEditorMode}
              isRepeat={s.looped}
              setIsRepeat={looped => {
                invoke("patch_sound_looped", {payload: { scene_id: selectedSceneId , sound_id: s.id, looped }});
              }}
              volume={s.volume}
              setVolume={volume => {
                invoke("patch_sound_volume", {payload: { scene_id: selectedSceneId , sound_id: s.id, volume }});
              }}
            />
          ))}
        </div>
      </div>
      <NowPlay />
      <Footer
        currentMode={isEditorMode}
        setEditorMode={setEditorMode}
        version={version}
      />
    </div>
  );
}

export default App;
