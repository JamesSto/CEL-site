import { useEffect, useState, useRef } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import "./App.css";

function App() {
  const [lexicon, setLexicon] = useState<Set<string> | null>(null);
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
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

  useEffect(() => {
    if (!lexicon || !input) {
      setMatches([]);
      return;
    }

    const prefix = input.toLowerCase();
    const results = Array.from(lexicon)
      .filter((word) => word.startsWith(prefix))
      .slice(0, 10)
      .sort();

    setMatches(results);
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

            {input && (
              <table className="matches-table">
                <tbody>
                  <tr>
                    <td>{input}</td>
                    <td className="check-column">
                      <span className={isValid ? "check valid" : "check invalid"}>
                        {isValid ? <CheckIcon /> : <XMarkIcon />}
                      </span>
                    </td>
                  </tr>
                  {matches.map((word) => (
                    <tr key={word}>
                      <td>{word}</td>
                      <td className="check-column">
                        <span className="check valid">
                          <CheckIcon />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-max">
          <div className="faq">
            <h2>FAQ</h2>
            <dl>
              <dt>What is this list?</dt>
              <dd>
                This checks the{" "}
                <a href="https://github.com/Fj00/CEL">Common English Lexicon</a>, an
                amazing word list created by created by Eric Smith and Kenji
                Matsumoto. It's a subset of the Scrabble word list that contains
                words that are in common English usage, unlike the Scrabble
                dictionary (mostly) contains esoterica.
              </dd>

              <dt>What's this for?</dt>
              <dd>
                Anyone who wants to ask "Is this really a word", and only get a
                yes if it's a word that's in common English usage. Maybe you want
                to play Scrabble and not run the risk of a challenge failing
                because that random 4 letters someone put down is an{" "}
                <a href="https://www.merriam-webster.com/dictionary/cuif">
                  obscure alternate spelling of a Scottish insult
                </a>
                .
              </dd>
              <dt>How was it made?</dt>
              <dd>
                <a href="https://github.com/Fj00/CEL">
                  Check out the Github page to learn more
                </a>
                . I'm unaffiliated with the project, just a fan who wanted this
                site to exist.
              </dd>
            </dl>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
