import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/20/solid";
import { submitVote, removeVote, type WordData } from "./lexiconLoader";
import { useState } from "react";

interface VoteDisplayProps {
  word: string;
  lexiconEntry?: WordData;
  onVoteSubmitted?: (vote: 'yes' | 'no') => void;
  onVoteRemoved?: () => void;
}

export default function VoteDisplay({ word, lexiconEntry, onVoteSubmitted, onVoteRemoved }: VoteDisplayProps) {
  const userVote = lexiconEntry?.userVote;

  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: 'yes' | 'no') => {
    if (isVoting) return;
    
    // If clicking on current vote, remove it
    if (userVote === vote) {
      setIsVoting(true);
      try {
        await removeVote(word);
        onVoteRemoved?.();
      } catch (error) {
        console.error('Failed to remove vote:', error);
      } finally {
        setIsVoting(false);
      }
      return;
    }

    // Otherwise, submit new vote
    setIsVoting(true);
    try {
      await submitVote(word, vote);
      onVoteSubmitted?.(vote);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="vote-display">
      <span className="vote-count">
        <button 
          className={`vote-thumb yes-votes ${isVoting ? 'voting' : ''} ${userVote === 'yes' ? 'user-voted' : ''}`}
          onClick={() => handleVote('yes')}
          disabled={isVoting}
          title={userVote === 'yes' ? "Click to remove your yes vote" : userVote === 'no' ? "Change to yes vote" : "Vote yes - this is a common English word"}
        >
          <HandThumbUpIcon />
        </button>
      </span>
      <span className="vote-count">
        <button 
          className={`vote-thumb no-votes ${isVoting ? 'voting' : ''} ${userVote === 'no' ? 'user-voted' : ''}`}
          onClick={() => handleVote('no')}
          disabled={isVoting}
          title={userVote === 'no' ? "Click to remove your no vote" : userVote === 'yes' ? "Change to no vote" : "Vote no - this is not a common English word"}
        >
          <HandThumbDownIcon />
        </button>
      </span>
    </div>
  );
}
