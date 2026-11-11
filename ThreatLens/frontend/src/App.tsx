import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to server...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Server response was not successful");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Unable to connect to ThreatLens server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-5xl font-bold text-cyan-400">
        ThreatLens
      </h1>

      <p className="mt-4 text-slate-300">
        Intelligent Cyber Threat Detection Platform
      </p>

      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Backend Connection
        </h2>

        <p className="mt-3 text-cyan-300">
          {loading ? "Connecting..." : message}
        </p>
      </div>
    </div>
  );
}

export default App;