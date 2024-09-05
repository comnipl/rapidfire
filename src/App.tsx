import "./App.css";
import { Header } from "./components/header";

function App() {
  const prjData = {
    title: "Rapidfire"
  }
  return (
    <div className="flex h-">
      <Header title={prjData.title} />
    </div>
  );
}

export default App;

