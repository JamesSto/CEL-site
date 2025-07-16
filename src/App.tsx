import { useEffect, useState, useRef } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { distance } from "fastest-levenshtein";
import VoteDisplay from "./VoteDisplay";
import {
  loadLexiconData,
  type WordData,
  CEL_VOTE_WORTH,
} from "./lexiconLoader";
import "./App.css";

const NUM_AUTOCOMPLETES = 10;
const NUM_SUGGESTIONS = 5;

function App() {
  const [lexicon, setLexicon] = useState<Map<string, WordData> | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Create firstLetterMap from lexicon
  const firstLetterMap = lexicon
    ? (() => {
        const map = new Map<string, Set<string>>();
        for (const word of lexicon.keys()) {
          const firstLetter = word[0];
          if (!map.has(firstLetter)) {
            map.set(firstLetter, new Set());
          }
          map.get(firstLetter)!.add(word);
        }
        return map;
      })()
    : null;

  const updateLocalVote = (word: string, vote: "yes" | "no") => {
    if (!lexicon) return;

    const normalizedWord = word.toLowerCase().trim();
    const currentData = lexicon.get(normalizedWord);

    if (currentData) {
      // Update existing word - handle vote changes
      let newYesVotes = currentData.yesVotes;
      let newNoVotes = currentData.noVotes;

      // Remove old vote if user had one
      if (currentData.userVote === "yes") {
        newYesVotes = Math.max(0, newYesVotes - 1);
      } else if (currentData.userVote === "no") {
        newNoVotes = Math.max(0, newNoVotes - 1);
      }

      // Add new vote
      if (vote === "yes") {
        newYesVotes += 1;
      } else {
        newNoVotes += 1;
      }

      const newData = {
        ...currentData,
        yesVotes: newYesVotes,
        noVotes: newNoVotes,
        userVote: vote,
      };
      setLexicon(new Map(lexicon.set(normalizedWord, newData)));
    } else {
      // Add new word that wasn't in lexicon
      const newData = {
        word: normalizedWord,
        yesVotes: vote === "yes" ? 1 : 0,
        noVotes: CEL_VOTE_WORTH + (vote === "no" ? 1 : 0),
        userVote: vote,
        isInOriginalCEL: false,
      };
      setLexicon(new Map(lexicon.set(normalizedWord, newData)));
    }
  };

  const removeLocalVote = (word: string) => {
    if (!lexicon) return;

    const normalizedWord = word.toLowerCase().trim();
    const currentData = lexicon.get(normalizedWord);

    if (currentData && currentData.userVote) {
      // Remove user's vote
      let newYesVotes = currentData.yesVotes;
      let newNoVotes = currentData.noVotes;

      if (currentData.userVote === "yes") {
        newYesVotes = Math.max(0, newYesVotes - 1);
      } else if (currentData.userVote === "no") {
        newNoVotes = Math.max(0, newNoVotes - 1);
      }

      // Remove word from lexicon if it has no votes and wasn't in original CEL
      if (
        newYesVotes === 0 &&
        newNoVotes === 0 &&
        !currentData.isInOriginalCEL
      ) {
        const newLexicon = new Map(lexicon);
        newLexicon.delete(normalizedWord);
        setLexicon(newLexicon);
      } else {
        const newData = {
          ...currentData,
          yesVotes: newYesVotes,
          noVotes: newNoVotes,
          userVote: "" as const,
        };
        setLexicon(new Map(lexicon.set(normalizedWord, newData)));
      }
    }
  };

  useEffect(() => {
    loadLexiconData()
      .then(({ lexicon }) => {
        setLexicon(lexicon);
        inputRef.current?.focus();
      })
      .catch((e) => console.error("Couldn't load lexicon data:", e));
  }, []);

  const getWordValidation = (word: string) => {
    const wordData = lexicon?.get(word);
    if (!wordData) return false;
    return wordData.yesVotes >= wordData.noVotes / 2;
  };

  const prefix = input.toLowerCase();
  const isValid = prefix === "" ? null : getWordValidation(prefix)

  const matches =
    !lexicon || !input
      ? []
      : Array.from(lexicon.keys())
          .filter((word) => word.startsWith(prefix) && word !== prefix)
          .slice(0, NUM_AUTOCOMPLETES)
          .sort();

  const suggestions =
    !lexicon || !firstLetterMap || !input || matches.length > 3 || isValid
      ? []
      : Array.from(firstLetterMap.get(prefix[0]) ?? [])
          .filter((word) => !matches.includes(word) && word !== prefix) // Remove words already in matches and current input
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
            <h1>Common English Lexicon</h1>
            <div className="brand-desc">
              The internet's list of common English words
            </div>
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

            {input && !lexicon && (
              <div className="loading-state">
                <ArrowPathIcon className="spin" />
                Loading dictionary...
              </div>
            )}

            {input && lexicon && (
              <>
                <table className="matches-table">
                  <tbody>
                    <tr>
                      <td className="check-column">
                        <span
                          className={isValid ? "check valid" : "check invalid"}
                        >
                          {isValid ? <CheckIcon /> : <XMarkIcon />}
                        </span>
                      </td>
                      <td>
                        <a
                          href={makeScrabbleLink(input)}
                          target="_blank"
                          rel="noopener"
                        >
                          {input}
                        </a>
                      </td>
                      <td className="vote-column">
                        <VoteDisplay
                          word={prefix}
                          lexiconEntry={lexicon?.get(prefix)}
                          onVoteSubmitted={(vote) =>
                            updateLocalVote(prefix, vote)
                          }
                          onVoteRemoved={() => removeLocalVote(prefix)}
                        />
                      </td>
                    </tr>
                    {matches.map((word) => (
                      <tr key={word}>
                        <td className="check-column">
                          <span
                            className={
                              getWordValidation(word)
                                ? "check valid"
                                : "check invalid"
                            }
                          >
                            {getWordValidation(word) ? (
                              <CheckIcon />
                            ) : (
                              <XMarkIcon />
                            )}
                          </span>
                        </td>
                        <td>
                          <a
                            href={makeScrabbleLink(word)}
                            target="_blank"
                            rel="noopener"
                          >
                            {word}
                          </a>
                        </td>
                        <td className="vote-column">
                          <VoteDisplay
                            word={word}
                            lexiconEntry={lexicon?.get(word)}
                            onVoteSubmitted={(vote) =>
                              updateLocalVote(word, vote)
                            }
                            onVoteRemoved={() => removeLocalVote(word)}
                          />
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
                            <td className="check-column">
                              <span
                                className={
                                  getWordValidation(word)
                                    ? "check valid"
                                    : "check invalid"
                                }
                              >
                                {getWordValidation(word) ? (
                                  <CheckIcon />
                                ) : (
                                  <XMarkIcon />
                                )}
                              </span>
                            </td>
                            <td>
                              <a
                                href={makeScrabbleLink(word)}
                                target="_blank"
                                rel="noopener"
                              >
                                {word}
                              </a>
                            </td>
                            <td className="vote-column">
                              <VoteDisplay
                                word={word}
                                lexiconEntry={lexicon?.get(word)}
                                onVoteSubmitted={(vote) =>
                                  updateLocalVote(word, vote)
                                }
                                onVoteRemoved={() => removeLocalVote(word)}
                              />
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
                This lists comes from the{" "}
                <a href="https://github.com/Fj00/CEL">Common English Lexicon</a>
                , an amazing word list created by created by Eric Smith and
                Kenji Matsumoto. It's a subset of the Scrabble word list that
                contains words that are in common English usage, unlike the
                Scrabble dictionary (mostly) contains esoterica.
              </dd>
              <dd>
                It also gathers many initial votes from Squaredle Discord users,
                who vote on whether a word should be required or "bonus" for the{" "}
                <a href="https://squaredle.app/">Squaredle</a> game.
              </dd>
              <dd>
                Both these sources and other user votes are combined to decide
                whether a word should be considered "common" or not.
              </dd>
              <dt>What's this for?</dt>
              <dd>
                Anyone who wants to ask "Is this really a word", and only get a
                yes if it's a word that's in common English usage. Maybe you
                want to play Scrabble and not run the risk of a challenge
                failing because that random 4 letters someone put down is an{" "}
                <a href="https://www.merriam-webster.com/dictionary/cuif">
                  obscure alternate spelling of a Scottish insult</a>. Or
                  Bananagrams, or Quiddler, or any number of games.
              </dd>
              <dt>Why doesn't it have [word]?</dt>
              <dd>
                Great question! Making a list like this inevitably has a million
                judgment calls.{" "}
                <a href="https://github.com/Fj00/CEL?tab=readme-ov-file#background">
                  See the background page on the CEL
                </a>{" "}
                for more details of just some of the choices.
              </dd>
            </dl>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
