import { useEffect, useState, useRef } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { distance } from "fastest-levenshtein";
import "./App.css";

const NUM_AUTOCOMPLETES = 10;
const NUM_SUGGESTIONS = 5;

function App() {
  const [lexicon, setLexicon] = useState<Set<string> | null>(null);
  const [firstLetterMap, setFirstLetterMap] = useState<Map<string, Set<string>> | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}cel.txt`)
      .then((r) => r.text())
      .then((t) => {
        const words = t
          .split("\n")
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean);

        // Create main lexicon
        const set = new Set(words);
        setLexicon(set);

        // Create first-letter map
        const letterMap = new Map<string, Set<string>>();
        words.forEach(word => {
          const firstLetter = word[0];
          if (!letterMap.has(firstLetter)) {
            letterMap.set(firstLetter, new Set());
          }
          letterMap.get(firstLetter)!.add(word);
        });
        setFirstLetterMap(letterMap);

        inputRef.current?.focus();
      })
      .catch((e) => console.error("Couldn't load CEL:", e));
  }, []);

  // Calculate values directly instead of using state/effects
  const prefix = input.toLowerCase();
  const isValid = input === "" ? null : lexicon?.has(prefix) ?? false;

  const matches =
    !lexicon || !input
      ? []
      : Array.from(lexicon)
        .filter((word) => word.startsWith(prefix))
        .slice(0, NUM_AUTOCOMPLETES)
        .sort();

  const suggestions =
    !lexicon || !firstLetterMap || !input || matches.length > 3 || isValid
      ? []
      : Array.from(firstLetterMap.get(prefix[0]) ?? [])
        .filter(word => !matches.includes(word)) // Remove words already in matches
        .map((word) => ({
          word,
          distance: distance(prefix, word) / prefix.length,
        }))
        .filter(({ distance }) => distance < 0.4)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NUM_SUGGESTIONS)
        .map(({ word }) => word);

  const makeScrabbleLink = (word: string) =>
    `https://scrabble.merriam.com/finder/${word}`;

  return (
    <>
      <header className="site-header">
        <div className="site-max header-inner">
          <a href="/" className="brand">
            <h1>
              Common English Lexicon
            </h1>
            <div className="brand-desc">The internet's list of common English words</div>
          </a>
        </div>
      </header>
      
      <main className="hero">
        <div className="site-max content">
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
              <>
                <table className="matches-table">
                  <tbody>
                    <tr>
                      <td>
                        <a href={makeScrabbleLink(input)} target="_blank" rel="noopener">
                          {input}
                        </a>
                      </td>
                      <td className="check-column">
                        <span className={isValid ? "check valid" : "check invalid"}>
                          {isValid ? <CheckIcon /> : <XMarkIcon />}
                        </span>
                      </td>
                    </tr>
                    {matches.map((word) => (
                      <tr key={word}>
                        <td>
                          <a href={makeScrabbleLink(word)} target="_blank" rel="noopener">
                            {word}
                          </a>
                        </td>
                        <td className="check-column">
                          <span className="check valid">
                            <CheckIcon />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {suggestions.length > 0 && (
                  <div className="suggestions">
                    <h3>Maybe you meant</h3>
                    <table className="matches-table suggestions-table">
                      <tbody>
                        {suggestions.map((word) => (
                          <tr key={word}>
                            <td>
                              <a href={makeScrabbleLink(word)} target="_blank" rel="noopener">
                                {word}
                              </a>
                            </td>
                            <td className="check-column">
                              <span className="check valid">
                                <CheckIcon />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
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
              <dt>Why doesn't it have [word]?</dt>
              <dd>
                Great question! Making a list like this inevitably has a million judgment calls. <a href="https://github.com/Fj00/CEL?tab=readme-ov-file#background">See the background page for more details</a>
              </dd>
            </dl>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
