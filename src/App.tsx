import "./App.css";
import { Header } from "./components/header";
import { SideBar } from "./components/sidebar";

function App() {
  const prjData = {
    title: "Rapidfire"
  }
  return (
    <div className="flex h-dvh flex-col">
      <Header title={prjData.title} />
      <div className="flex-1 grid grid-cols-12 bg-black">
        <SideBar className="col-span-2" />
      </div>
    </div>
  );
}

export default App;

