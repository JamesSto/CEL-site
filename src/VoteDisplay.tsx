import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/20/solid";
import { submitVote } from "./lexiconLoader";
import { useState } from "react";

interface VoteDisplayProps {
  word: string;
  yesVotes: number;
  noVotes: number;
  userVote?: 'yes' | 'no' | '';
  onVoteSubmitted?: (vote: 'yes' | 'no') => void;
}

export default function VoteDisplay({ word, yesVotes, noVotes, userVote, onVoteSubmitted }: VoteDisplayProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (vote: 'yes' | 'no') => {
    if (isVoting || userVote === vote) return; // Prevent voting for same choice

    setIsVoting(true);
    try {
      await submitVote(word, vote);
      onVoteSubmitted?.(vote);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      // TODO: Show user-friendly error message
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
          disabled={isVoting || userVote === 'yes'}
          title={userVote === 'yes' ? "You voted yes" : userVote === 'no' ? "Change to yes vote" : "Vote yes - this is a common English word"}
        >
          <HandThumbUpIcon />
        </button>
        <span className="vote-number">{yesVotes}</span>
      </span>
      <span className="vote-count">
        <button 
          className={`vote-thumb no-votes ${isVoting ? 'voting' : ''} ${userVote === 'no' ? 'user-voted' : ''}`}
          onClick={() => handleVote('no')}
          disabled={isVoting || userVote === 'no'}
          title={userVote === 'no' ? "You voted no" : userVote === 'yes' ? "Change to no vote" : "Vote no - this is not a common English word"}
        >
          <HandThumbDownIcon />
        </button>
        <span className="vote-number">{noVotes}</span>
      </span>
    </div>
  );
}