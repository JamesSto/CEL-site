import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [lexicon, setLexicon] = useState<Set<string> | null>(null);
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/cel.txt")
      .then((r) => r.text())
      .then((t) => {
        const set = new Set(
          t
            .split("\n")
            .map((w) => w.trim().toLowerCase())
            .filter(Boolean),
        );
        setLexicon(set);
        inputRef.current?.focus();
      })
      .catch((e) => console.error("Couldn’t load CEL:", e));
  }, []);

  useEffect(() => {
    if (!lexicon) return;
    if (input === "") setIsValid(null);
    else setIsValid(lexicon.has(input.toLowerCase()));
  }, [input, lexicon]);

  return (
    <>
      <header className="site-header">
        <div className="site-max">
          <h1 className="brand">Common&nbsp;English&nbsp;Lexicon&nbsp;Checker</h1>
        </div>
      </header>

      <main className="hero">
        <div className="site-max content">
          <p className="tagline">
            Check if your word is in the Common English Lexicon
          </p>

          <div className="input-container">
            <input
              ref={inputRef}
              className="word-input"
              type="text"
              placeholder="Type a word…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />

            {isValid !== null && (
              <p className={`badge ${isValid ? "valid" : "invalid"}`}>
                {isValid ? "✓ Found" : "✕ Not in CEL"}
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-max">
          <small>
            Word list from the{" "}
            <a
              href="https://github.com/Fj00/CEL"
              target="_blank"
              rel="noopener noreferrer"
            >
              CEL&nbsp;project
            </a>
            . Site demo built with Vite + React.
          </small>
        </div>
      </footer>
    </>
  );
}

export default App;
