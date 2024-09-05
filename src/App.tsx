import "./App.css";
import { Header } from "./components/header";
import { NowPlay } from "./components/nowplay";
import { SideBar } from "./components/sidebar";
import { Footer } from "./components/footer";
import { useState } from "react";
import { Card } from "./components/card";
import { AudioPlayType } from "./lib/type";

type ProjectData = {
  title: string;
  type: AudioPlayType;
};
const projectData: ProjectData[] = [
  {
    title: "なんかかっこいいBGM",
    type: "bgm",
  },
];

function App() {
  const [isEditorMode, setEditorMode] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);

  const prjData = {
    title: "Rapidfire",
  };
  return (
    <div className="flex h-dvh flex-col">
      <Header title={prjData.title} />
      <div className="flex-1 grid grid-cols-12">
        <SideBar className="col-span-2" />
        <div className="col-span-10 bg-neutral-50 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
          {projectData.map((item, i) => (
            <Card
              key={i}
              title={item.title}
              type={item.type}
              isEditorMode={isEditorMode}
              isRepeat={isRepeat}
              setIsRepeat={setIsRepeat}
              volume={volume}
              setVolume={setVolume}
            />
          ))}
        </div>
      </div>
      <NowPlay />
      <Footer
        currentMode={isEditorMode}
        setEditorMode={setEditorMode}
        version="v0.1.0"
      />
    </div>
  );
}

export default App;
