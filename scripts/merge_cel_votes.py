import csv
import os
from pathlib import Path

def merge_cel_votes():
    """
    Merges the CEL word list with Discord vote data into a single CSV file.
    Creates a union of both lists with vote data where available, 0,0 for words without votes.
    """
    
    # File paths
    cel_file = Path(__file__).parent.parent / 'public' / 'cel.txt'
    votes_file = Path(__file__).parent / 'votes.csv'
    output_file = Path(__file__).parent.parent / 'public' / 'cel_votes.csv'
    
    # Read CEL words
    cel_words = set()
    try:
        with open(cel_file, 'r', encoding='utf-8') as f:
            for line in f:
                word = line.strip().lower()
                if word:  # Skip empty lines
                    cel_words.add(word)
        print(f"Loaded {len(cel_words)} words from CEL")
    except FileNotFoundError:
        print(f"CEL file not found: {cel_file}")
        return
    
    # Read vote data
    vote_data = {}
    try:
        with open(votes_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                word = row['word'].strip().lower()
                yes_votes = int(row['yes_votes'])
                no_votes = int(row['no_votes'])
                
                # Handle duplicate words by keeping the entry with more total votes
                if word in vote_data:
                    existing_total = vote_data[word]['yes_votes'] + vote_data[word]['no_votes']
                    new_total = yes_votes + no_votes
                    if new_total > existing_total:
                        vote_data[word] = {'yes_votes': yes_votes, 'no_votes': no_votes}
                else:
                    vote_data[word] = {'yes_votes': yes_votes, 'no_votes': no_votes}
        print(f"Loaded {len(vote_data)} words from vote data")
    except FileNotFoundError:
        print(f"Vote data file not found: {votes_file}")
        vote_data = {}
    
    # Create union of words
    all_words = cel_words.union(set(vote_data.keys()))
    print(f"Total unique words: {len(all_words)}")
    
    # Prepare merged data
    merged_data = []
    for word in sorted(all_words):
        if word in vote_data:
            yes_votes = vote_data[word]['yes_votes']
            no_votes = vote_data[word]['no_votes']
        else:
            yes_votes = 0
            no_votes = 0
        
        merged_data.append({
            'word': word,
            'yes_votes': yes_votes,
            'no_votes': no_votes
        })
    
    # Write merged data to output file
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['word', 'yes_votes', 'no_votes']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(merged_data)
        
        print(f"Successfully merged data and saved to {output_file}")
        print(f"Total words in merged file: {len(merged_data)}")
        
        # Show some statistics
        cel_only = len(cel_words - set(vote_data.keys()))
        votes_only = len(set(vote_data.keys()) - cel_words)
        both = len(cel_words.intersection(set(vote_data.keys())))
        
        print(f"Words in CEL only: {cel_only}")
        print(f"Words in vote data only: {votes_only}")
        print(f"Words in both: {both}")
        
        # Print words unique to vote data, split by net votes
        vote_only_words = set(vote_data.keys()) - cel_words
        if vote_only_words:
            net_yes_words = []
            net_no_words = []
            
            for word in vote_only_words:
                yes = vote_data[word]['yes_votes']
                no = vote_data[word]['no_votes']
                if yes > no:
                    net_yes_words.append((word, yes, no))
                else:
                    net_no_words.append((word, yes, no))
            
            print(f"\nWords unique to Discord vote data with net YES votes ({len(net_yes_words)}):")
            for word, yes, no in sorted(net_yes_words):
                print(f"  {word}: {yes} yes, {no} no")
            
            print(f"\nWords unique to Discord vote data with net NO votes ({len(net_no_words)}):")
            for word, yes, no in sorted(net_no_words):
                print(f"  {word}: {yes} yes, {no} no")
        
        # Print CEL words with net NO votes in Discord
        cel_words_with_no_votes = []
        for word in cel_words:
            if word in vote_data:
                yes = vote_data[word]['yes_votes']
                no = vote_data[word]['no_votes']
                if no > yes:
                    cel_words_with_no_votes.append((word, yes, no))
        
        if cel_words_with_no_votes:
            print(f"\nCEL words with net NO votes in Discord ({len(cel_words_with_no_votes)}):")
            for word, yes, no in sorted(cel_words_with_no_votes):
                print(f"  {word}: {yes} yes, {no} no")
        
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == '__main__':
    merge_cel_votes()