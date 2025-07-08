import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/20/solid";

interface VoteDisplayProps {
  yesVotes: number;
  noVotes: number;
}

export default function VoteDisplay({ yesVotes, noVotes }: VoteDisplayProps) {
  return (
    <div className="vote-display">
      <span className="vote-count">
        <span className="vote-thumb yes-votes">
          <HandThumbUpIcon />
        </span>
        <span className="vote-number">{yesVotes}</span>
      </span>
      <span className="vote-count">
        <span className="vote-thumb no-votes">
          <HandThumbDownIcon />
        </span>
        <span className="vote-number">{noVotes}</span>
      </span>
    </div>
  );
}