# server/database.py
from flask_sqlalchemy import SQLAlchemy
# Create the db object, but DO NOT initialize it yet.
# We will initialize it later inside app.py.
db = SQLAlchemy()