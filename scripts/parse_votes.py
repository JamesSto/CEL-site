import json
import csv

def parse_word_votes(input_file, output_file):
    """
    Parses a JSON file containing Discord channel history and extracts word vote data,
    writing the results to a CSV file.

    Args:
        input_file (str): The path to the input JSON file.
        output_file (str): The path to the output CSV file.
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        messages = json.load(f)

    parsed_data = []
    for message in messages:
        reactions = message.get('reactions', [])
        yes_emojis = ['<:word:1072980624727605278>', '🇼']
        no_emojis = ['🅱️']

        yes_votes = 0
        no_votes = 0
        
        for reaction in reactions:
            emoji_name = reaction.get('emoji')
            if emoji_name in yes_emojis:
                yes_votes = reaction.get('count', 0)
            elif emoji_name in no_emojis:
                no_votes = reaction.get('count', 0)

        if yes_votes > 0 and no_votes > 0:
            content = message.get('content', '')
            content = content.removeprefix('wordvote')
            content = content.removeprefix('Wordvote')
            content = content.removeprefix('vote')
            content = content.removeprefix('vot')
            content = content.removeprefix('Vote')
            content = content.strip()
            word = content.split()[0]
            if word[0] != word[0].lower():
                print(f"skipping due to uppercase first letter: {content}\n")
                continue
            if len(word) > 20:
                print(f"skipping due to word length > 20: {content}\n")
                continue
            if word in ['omg', 'boatymcboatface']:
                continue
            word = word.removesuffix(",").removesuffix("...").removesuffix(":")
            if not word.isalpha():
                print(f"skipping due to non-alphabetic characters: {content}\n")
                continue
            parsed_data.append({'word': word, 'yes_votes': yes_votes, 'no_votes': no_votes})

    if not parsed_data:
        print("No valid word vote messages found.")
        return

    # Sort data by yes_votes in descending order
    parsed_data.sort(key=lambda x: x['word'])

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['word', 'yes_votes', 'no_votes']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(parsed_data)
    
    print(f"Successfully parsed {len(parsed_data)} word votes and saved to {output_file}")

if __name__ == '__main__':
    parse_word_votes('channel_history.json', 'votes.csv')
