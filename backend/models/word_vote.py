from db import db
import json
from datetime import datetime

class WordVote(db.Model):
    user_identifier = db.Column(db.String(100), nullable=False, index=True)
    word = db.Column(db.String(100), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    vote = db.Column(db.Integer(), nullable=False) # 1 for yes, 0 for no

    __table_args__ = (
        db.PrimaryKeyConstraint(
            user_identifier,
            word,
        ),
    )
