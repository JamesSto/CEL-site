import sys
from collections import defaultdict

from flask import Flask, jsonify, request, Response
from sqlalchemy import func

from db import db
from models.word_vote import WordVote

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///user_votes.db"
db.init_app(app)

# In-memory store for user votes (loaded from database, acts as write-through cache)
# Format: {'word': {'y': count, 'n': count}}
user_votes = defaultdict(lambda: {'y': 0, 'n': 0})

def load_user_votes_from_db():
    """Load all votes from database into memory on startup using SQL aggregation"""
    global user_votes
    print("Loading user votes from database...")
    
    try:
        # Query to get vote counts grouped by word
        results = db.session.query(
            WordVote.word,
            func.sum(WordVote.vote).label('yes_count'),
            func.count(WordVote.vote).label('total_count')
        ).group_by(WordVote.word).all()
        
        user_votes = defaultdict(lambda: {'y': 0, 'n': 0})
        for word, yes_count, total_count in results:
            no_count = total_count - yes_count
            user_votes[word] = {'y': yes_count, 'n': no_count}
        
        print(f"Loaded {len(user_votes)} words with votes from database")
        
    except Exception as e:
        print(f"Error loading votes from database: {e}")
        user_votes = {}

def update_user_votes_cache(word, old_vote=None, new_vote=None):
    """Update in-memory cache when votes change"""
    global user_votes
    
    # No need to check if word exists - defaultdict handles it
    
    # Remove old vote
    if old_vote is not None:
        if old_vote == 1:
            user_votes[word]['y'] = max(0, user_votes[word]['y'] - 1)
        else:
            user_votes[word]['n'] = max(0, user_votes[word]['n'] - 1)
    
    # Add new vote
    if new_vote is not None:
        if new_vote == 1:
            user_votes[word]['y'] += 1
        else:
            user_votes[word]['n'] += 1

@app.route('/user_votes')
def get_user_votes():
    print("GET /user_votes - Endpoint hit!")
    
    # Convert to CSV format: word,yes_votes,no_votes
    csv_lines = ["word,yes_votes,no_votes"]
    for word, votes in user_votes.items():
        csv_lines.append(f"{word},{votes['y']},{votes['n']}")
    
    csv_content = "\n".join(csv_lines)
    print(f"Returning CSV data for {len(user_votes)} words")
    
    return Response(csv_content, mimetype='text/csv')

@app.route('/vote', methods=['POST'])
def submit_vote():
    data = request.get_json()
    
    # Validation
    if not data:
        print("POST /api/vote - Error: No JSON data provided")
        return jsonify({"status": "error", "message": "No JSON data provided"}), 400
    
    word = data.get('word')
    vote_type = data.get('vote')
    user_identifier = data.get('user_identifier')
    
    if not word:
        print("POST /api/vote - Error: Missing 'word' field")
        return jsonify({"status": "error", "message": "Missing required field: word"}), 400
    
    if not vote_type:
        print("POST /api/vote - Error: Missing 'vote' field")
        return jsonify({"status": "error", "message": "Missing required field: vote"}), 400
    
    if not user_identifier:
        print("POST /api/vote - Error: Missing 'user_identifier' field")
        return jsonify({"status": "error", "message": "Missing required field: user_identifier"}), 400
    
    if vote_type not in ['yes', 'no']:
        print(f"POST /api/vote - Error: Invalid vote type '{vote_type}'")
        return jsonify({"status": "error", "message": "Vote must be 'yes' or 'no'"}), 400
    
    if not word.strip():
        print("POST /api/vote - Error: Empty word provided")
        return jsonify({"status": "error", "message": "Word cannot be empty"}), 400
    
    print(f"POST /api/vote - Vote received: user='{user_identifier}', word='{word}', vote='{vote_type}'")
    
    # Convert vote to integer (1 for yes, 0 for no)
    vote_value = 1 if vote_type == 'yes' else 0
    
    try:
        # Check if vote already exists for this user/word combination
        existing_vote = WordVote.query.filter_by(
            user_identifier=user_identifier, 
            word=word
        ).first()
        
        if existing_vote:
            # Update existing vote
            existing_vote.vote = vote_value
            existing_vote.timestamp = db.func.now()
            print(f"Updated existing vote: user={user_identifier}, word='{word}', vote={vote_value}")
        else:
            # Create new vote
            new_vote = WordVote(
                user_identifier=user_identifier,
                word=word,
                vote=vote_value
            )
            db.session.add(new_vote)
            print(f"Created new vote: user={user_identifier}, word='{word}', vote={vote_value}")
        
        db.session.commit()
        
        # Update in-memory cache
        old_vote_value = existing_vote.vote if existing_vote else None
        update_user_votes_cache(word, old_vote_value, vote_value)
        
        return jsonify({"status": "success", "message": f"Vote for '{word}' recorded"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving vote: {e}")
        return jsonify({"status": "error", "message": "Failed to save vote"}), 500

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        with app.app_context():
            db.create_all()
        sys.exit(0)
    
    # Load votes from database into memory on startup
    with app.app_context():
        load_user_votes_from_db()
    
    app.run(host="0.0.0.0", debug=True, port=8000)
