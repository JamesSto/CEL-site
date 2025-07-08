from flask import Flask, jsonify, request

app = Flask(__name__)

# In-memory store for user votes (will be replaced with SQLite later)
user_votes = {}

@app.route('/api/user_votes')
def get_user_votes():
    print("GET /api/user_votes - Endpoint hit!")
    return jsonify(user_votes)

@app.route('/api/vote', methods=['POST'])
def submit_vote():
    data = request.get_json()
    word = data.get('word', 'unknown')
    vote_type = data.get('vote', 'unknown')  # 'yes' or 'no'
    
    print(f"POST /api/vote - Vote received: word='{word}', vote='{vote_type}'")
    
    # TODO: Store vote in database and update in-memory store
    # For now, just acknowledge the request
    return jsonify({"status": "success", "message": f"Vote for '{word}' recorded"})

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
