import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/20/solid";

interface VoteDisplayProps {
  yesVotes: number;
  noVotes: number;
}

export default function VoteDisplay({ yesVotes, noVotes }: VoteDisplayProps) {
  return (
    <div className="vote-display">
      <span className="vote-count yes-votes">
        <HandThumbUpIcon className="vote-icon" />
        {yesVotes}
      </span>
      <span className="vote-count no-votes">
        <HandThumbDownIcon className="vote-icon" />
        {noVotes}
      </span>
    </div>
  );
}