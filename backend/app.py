import sys
from collections import defaultdict

from flask import Flask, jsonify, request, Response
from sqlalchemy import func

from db import db
from models.word_vote import WordVote

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///user_votes.db"
db.init_app(app)


@app.route('/user_votes')
def get_user_votes():
    user_identifier = request.args.get('user_identifier')
    print(f"GET /user_votes - Endpoint hit! user_identifier={user_identifier}")
    
    if not user_identifier:
        print("GET /user_votes - Error: Missing user_identifier parameter")
        return jsonify({"status": "error", "message": "Missing required parameter: user_identifier"}), 400
    
    # Get aggregated vote counts from database
    results = db.session.query(
        WordVote.word,
        func.sum(WordVote.vote).label('yes_count'),
        func.count(WordVote.vote).label('total_count')
    ).group_by(WordVote.word).all()
    
    # Get user's specific votes
    user_specific_votes = {}
    user_vote_results = WordVote.query.filter_by(user_identifier=user_identifier).all()
    for vote in user_vote_results:
        user_specific_votes[vote.word] = 'yes' if vote.vote == 1 else 'no'

    # Convert to CSV format: word,yes_votes,no_votes,user_vote
    csv_lines = ["word,yes_votes,no_votes,user_vote"]
    for word, yes_count, total_count in results:
        no_count = total_count - yes_count
        user_vote = user_specific_votes.get(word, '')
        csv_lines.append(f"{word},{yes_count},{no_count},{user_vote}")
    
    # Add any words that user voted on but aren't in aggregated data
    aggregated_words = {word for word, _, _ in results}
    for word, user_vote in user_specific_votes.items():
        if word not in aggregated_words:
            csv_lines.append(f"{word},0,0,{user_vote}")
    
    csv_content = "\n".join(csv_lines)
    print(f"Returning CSV data for {len(results)} words (user-specific: {len(user_specific_votes)})")
    
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
        
        old_vote_value = None
        if existing_vote:
            # Store old vote value before updating
            old_vote_value = existing_vote.vote
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
        
        return jsonify({"status": "success", "message": f"Vote for '{word}' recorded"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving vote: {e}")
        return jsonify({"status": "error", "message": "Failed to save vote"}), 500

@app.route('/vote', methods=['DELETE'])
def remove_vote():
    data = request.get_json()
    
    # Validation
    if not data:
        print("DELETE /api/vote - Error: No JSON data provided")
        return jsonify({"status": "error", "message": "No JSON data provided"}), 400
    
    word = data.get('word')
    user_identifier = data.get('user_identifier')
    
    if not word:
        print("DELETE /api/vote - Error: Missing 'word' field")
        return jsonify({"status": "error", "message": "Missing required field: word"}), 400
    
    if not user_identifier:
        print("DELETE /api/vote - Error: Missing 'user_identifier' field")
        return jsonify({"status": "error", "message": "Missing required field: user_identifier"}), 400
    
    if not word.strip():
        print("DELETE /api/vote - Error: Empty word provided")
        return jsonify({"status": "error", "message": "Word cannot be empty"}), 400
    
    print(f"DELETE /api/vote - Vote removal requested: user='{user_identifier}', word='{word}'")
    
    try:
        # Find existing vote
        existing_vote = WordVote.query.filter_by(
            user_identifier=user_identifier, 
            word=word
        ).first()
        
        if not existing_vote:
            print(f"No vote found to remove: user={user_identifier}, word='{word}'")
            return jsonify({"status": "error", "message": "No vote found to remove"}), 404
        
        # Store old vote value before deleting
        old_vote_value = existing_vote.vote
        
        # Delete the vote
        db.session.delete(existing_vote)
        db.session.commit()
        
        print(f"Vote removed: user={user_identifier}, word='{word}', old_vote={old_vote_value}")
        return jsonify({"status": "success", "message": f"Vote for '{word}' removed"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing vote: {e}")
        return jsonify({"status": "error", "message": "Failed to remove vote"}), 500

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        with app.app_context():
            db.create_all()
        sys.exit(0)
    
    app.run(host="0.0.0.0", debug=True, port=8000)
