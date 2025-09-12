#Hey, please don't mess with this unless you know what you're doing!
#Made with love from Calder Smith 2025-26

import os
import json
from functools import wraps 
from flask import Flask, request, session, redirect, url_for, jsonify, Response
print("running webapp")
# Initialize the Flask application
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = 'This_is_my_key_plz_no_steal' 

# --- Configuration stuff ---
ADMIN_PASSWORD = "labisgonnarule" 
ARTICLES_FILE_PATH = os.path.join(app.static_folder, 'DATA/articles.json')

# --- Login Protection
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

# --- Routes ---
@app.route('/login')
def login_page():
    return app.send_static_file('login.html')

@app.route('/api/login', methods=['POST'])
def handle_login():
    password = request.json.get('password')
    if password == ADMIN_PASSWORD:
        session['logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Incorrect password'}), 401

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login_page'))

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('IMAGES/icon.ico')

# --- Page Serving Routes ---

@app.route('/')
def index_page():
    """Serves the main index.html homepage."""
    return app.send_static_file('index.html')


@app.route('/article.html')
def article_page():
    """Serves the article.html page."""
    return app.send_static_file('article.html')


@app.route('/author.html')
def author_page():
    """Serves the author.html page."""
    return app.send_static_file('author.html')

@app.route('/upload')
@login_required
def upload_page():
    """Serves the upload page (if logged in)."""
    return app.send_static_file('upload.html')

# ---API---

@app.route('/api/upload', methods=['POST'])
@login_required
def handle_upload():
    """Receives new article data and writes it to the JSON file."""
    new_article = request.json
    try:
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f:
            articles_list = json.load(f)
        
        articles_list.insert(0, new_article)
        
        with open(ARTICLES_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(articles_list, f, indent=2)
            
        return jsonify({'success': True, 'message': 'Article saved successfully!'})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/api/delete_article', methods=['POST'])
@login_required
def delete_article():
    """Receives an article ID and removes the corresponding article."""
    article_id_to_delete = request.json.get('id')

    if not article_id_to_delete:
        return jsonify({'success': False, 'message': 'Article ID is required.'}), 400

    try:
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f:
            articles_list = json.load(f)
        
        # Create a new list excluding the article to be deleted
        updated_articles_list = [
            article for article in articles_list if article.get('id') != article_id_to_delete
        ]

        # Check if an article was actually removed
        if len(updated_articles_list) == len(articles_list):
            return jsonify({'success': False, 'message': 'Article not found.'}), 404
        
        with open(ARTICLES_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_articles_list, f, indent=2)
            
        return jsonify({'success': True, 'message': 'Article deleted successfully!'})

    except Exception as e:
        print(f"An error occurred while deleting: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)


