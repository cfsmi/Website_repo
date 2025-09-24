# Hey, please don't mess with this unless you know what you're doing!
# Made with love from Calder Smith 2025-26
# This is where the magic happens (and by magic I mean bugs)
import shutil
import os
import json
import logging
import re
from functools import wraps
from flask import Flask, request, session, redirect, url_for, jsonify

# Telling werkzeug to be quiet because nobody asked for its opinion
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.ERROR)

print("running webapp")  # The most informative print statement ever
# Initialize the Flask application (aka the thing that makes everything work)
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = 'This_is_my_key_plz_no_steal_LOL'  # Security through obscurity at its finest

# --- Configuration stuff ---
ADMIN_PASSWORD = "labisgonnarule"
DATA_FOLDER = os.path.join(app.static_folder, 'DATA')
ARTICLES_FILE_PATH = os.path.join(DATA_FOLDER, 'articles.json')
destination_folder = os.path.join(app.static_folder, 'BACKUPS')
LOG_FILE_PATH = os.path.join(DATA_FOLDER, 'log.txt')
VISIT_COUNTER_FILE = os.path.join(DATA_FOLDER, 'visit_counter.txt')

# --- Create DATA and BACKUPS directory if they don't exist for some reason---
os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(destination_folder, exist_ok=True)

# --- Set up structured logging for OUR application ---
# This logger is separate from Werkzeug's and will continue to work as before.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE_PATH),
        logging.StreamHandler()
    ]
)

logging.info("Starting up...")

# --- Visit Counter Functions (because we're nosy like that) ---
def get_visit_count():
    """Gets the visit count, or 0 if the file decided to disappear"""
    try:
        with open(VISIT_COUNTER_FILE, 'r') as f:
            return int(f.read())
    except (IOError, ValueError):
        return 0  # Starting from scratch, like my motivation today

def increment_visit_count():
    """Adds one to the counter because math is hard"""
    count = get_visit_count() + 1
    with open(VISIT_COUNTER_FILE, 'w') as f:
        f.write(str(count))  # Writing numbers to files, peak programming

# --- Centralized Request Processor ---
@app.before_request
def process_request():
    """This function runs before each request to increment the visit counter for pages."""
    page_endpoints = ['index_page', 'login_page', 'delete_page', 'art_page', 'article_page', 'author_page', 'upload_page']
    if request.endpoint in page_endpoints:
        increment_visit_count()

# --- Helper to get user IP address (for totally legitimate reasons, aka finding out which idiot greifed the site) ---
def get_ip():
    """Gets the user's IP because we need to know who to blame when things break"""
    unproxyip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    return unproxyip or request.remote_addr  # Fallback for when proxies are being sneaky

# --- Login Protection ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            logging.warning(f"Unauthorized access attempt to {request.path} from IP: {get_ip()}")
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required.'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

# --- THE GREAT WALL OF ROUTES ---
@app.route('/login')
def login_page(): return app.send_static_file('login.html')
@app.route('/delete')
def delete_page(): return app.send_static_file('delete.html')
@app.route('/')
def index_page(): return app.send_static_file('index.html')
@app.route('/article.html')
def article_page(): return app.send_static_file('article.html')
@app.route('/author.html')
def author_page(): return app.send_static_file('author.html')
@app.route('/art')
def art_page(): return app.send_static_file('art.html')
@app.route('/upload')
@login_required
def upload_page(): return app.send_static_file('upload.html')
@app.route('/log')
def log_page(): return app.send_static_file('log.html')
@app.route('/videos')
def videos_page(): return app.send_static_file('videos.html')
@app.route('/edit')
@login_required
def edit_page(): return app.send_static_file('edit-article.html')
@app.route('/edit-article')
@login_required
def edit_article_page(): return app.send_static_file('edit.html')
# --- API Routes ---
@app.route('/api/login', methods=['POST'])
def handle_login():
    password = request.json.get('password')
    ip = get_ip()
    if password == ADMIN_PASSWORD:
        session['logged_in'] = True
        logging.info(f"Successful login for admin from IP: {ip}")
        return jsonify({'success': True})
    logging.warning(f"Failed login attempt from IP: {ip}")
    return jsonify({'success': False, 'message': 'Incorrect password'}), 401

@app.route('/logout')
def logout():
    ip = get_ip()
    if 'logged_in' in session:
        session.pop('logged_in', None)
        logging.info(f"User logged out from IP: {ip}")
    return redirect(url_for('login_page'))

@app.route('/api/upload', methods=['POST'])
@login_required
def handle_upload():
    new_article = request.json
    article_id = new_article.get('id', 'N/A')
    ip = get_ip()
    try:
        logging.info(f"Article upload attempt: ID '{article_id}' from IP: {ip}")
        shutil.copy(ARTICLES_FILE_PATH, destination_folder)
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f: articles_list = json.load(f)
        articles_list.insert(0, new_article)
        with open(ARTICLES_FILE_PATH, 'w', encoding='utf-8') as f: json.dump(articles_list, f, indent=2)
        logging.info(f"Successfully added article ID '{article_id}'")
        return jsonify({'success': True, 'message': 'Article saved successfully!'})
    except Exception as e:
        logging.error(f"Error during article upload from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/api/delete_article', methods=['POST'])
@login_required
def delete_article():
    article_id_to_delete = request.json.get('id')
    ip = get_ip()
    if not article_id_to_delete:
        logging.warning(f"Delete article request with no ID from IP: {ip}")
        return jsonify({'success': False, 'message': 'Article ID is required.'}), 400
    try:
        logging.info(f"Article delete attempt: ID '{article_id_to_delete}' from IP: {ip}")
        shutil.copy(ARTICLES_FILE_PATH, destination_folder)
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f: articles_list = json.load(f)
        original_length = len(articles_list)
        updated_articles_list = [article for article in articles_list if article.get('id') != article_id_to_delete]
        if len(updated_articles_list) == original_length:
            logging.warning(f"Article ID '{article_id_to_delete}' not found for deletion from IP: {ip}")
            return jsonify({'success': False, 'message': 'Article not found.'}), 404
        with open(ARTICLES_FILE_PATH, 'w', encoding='utf-8') as f: json.dump(updated_articles_list, f, indent=2)
        logging.info(f"Successfully deleted article ID '{article_id_to_delete}'")
        return jsonify({'success': True, 'message': 'Article deleted successfully!'})
    except Exception as e:
        logging.error(f"Error during article deletion from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/api/logs')
def get_logs():
    try:
        with open(LOG_FILE_PATH, 'r', encoding='utf-8') as f: log_lines = f.read().strip().split('\n')
        log_pattern = re.compile(r'^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) \[(?P<level>\w+)\] (?P<message>.+)$')
        logs = []
        for line in log_lines:
            match = log_pattern.match(line)
            if match:
                log_data = match.groupdict()
                level = 'WARN' if log_data['level'] == 'WARNING' else log_data['level']
                logs.append({'timestamp': log_data['timestamp'], 'level': level, 'message': log_data['message']})
        return jsonify(logs)
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:
        logging.error(f"Error reading or parsing log file: {e}")
        return jsonify({'success': False, 'message': 'Could not retrieve logs.'}), 500

@app.route('/api/visits')
def get_visits_api():
    count = get_visit_count()
    return jsonify({'visits': count})

@app.route('/api/check-login')
def check_login():
    return jsonify({'logged_in': 'logged_in' in session})


@app.route('/api/update-article', methods=['POST'])
@login_required
def update_article():
    article_data = request.json
    article_id = article_data.get('id')
    ip = get_ip()
    if not article_id:
        return jsonify({'success': False, 'message': 'Article ID is required.'}), 400
    try:
        logging.info(f"Article update attempt: ID '{article_id}' from IP: {ip}")
        shutil.copy(ARTICLES_FILE_PATH, destination_folder)
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f: articles_list = json.load(f)
        for i, article in enumerate(articles_list):
            if article.get('id') == article_id:
                articles_list[i] = article_data
                break
        else:
            return jsonify({'success': False, 'message': 'Article not found.'}), 404
        with open(ARTICLES_FILE_PATH, 'w', encoding='utf-8') as f: json.dump(articles_list, f, indent=2)
        logging.info(f"Successfully updated article ID '{article_id}'")
        return jsonify({'success': True, 'message': 'Article updated successfully!'})
    except Exception as e:
        logging.error(f"Error during article update from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/api/articles')
def get_articles():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    search = request.args.get('search', '').lower()
    try:
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f: articles_list = json.load(f)
        if search:
            articles_list = [a for a in articles_list if search in a.get('title', '').lower() or search in a.get('content', '').lower() or search in a.get('author', '').lower()]
        total = len(articles_list)
        start = (page - 1) * per_page
        end = start + per_page
        articles = articles_list[start:end]
        return jsonify({'articles': articles, 'total': total, 'page': page, 'per_page': per_page})
    except FileNotFoundError: #for when like my father, they cant be found
        return jsonify({'articles': [], 'total': 0, 'page': page, 'per_page': per_page})
    except Exception as e:
        logging.error(f"Error retrieving articles: {e}")
        return jsonify({'success': False, 'message': 'Could not retrieve articles.'}), 500

@app.route('/api/article/<article_id>')
def get_article(article_id):
    try:
        with open(ARTICLES_FILE_PATH, 'r', encoding='utf-8') as f: articles_list = json.load(f)
        article = next((a for a in articles_list if a.get('id') == article_id), None)
        if not article:
            return jsonify({'success': False, 'message': 'Article not found.'}), 404
        return jsonify({'success': True, 'article': article})
    except Exception as e:
        logging.error(f"Error retrieving article: {e}")
        return jsonify({'success': False, 'message': 'Could not retrieve article.'}), 500

@app.route('/api/upload-image', methods=['POST'])
@login_required
def upload_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image file provided.'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected.'}), 400
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        import uuid
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(app.static_folder, 'IMAGES', filename)
        file.save(filepath)
        return jsonify({'success': True, 'url': f'/IMAGES/{filename}'})
    return jsonify({'success': False, 'message': 'Invalid file type.'}), 400


@app.route('/api/upload-video', methods=['POST'])
@login_required
def upload_video():
    """Handles video uploads because apparently we're YouTube now"""
    if 'video' not in request.files:
        return jsonify({'success': False, 'message': 'No video file provided.'}), 400
    
    file = request.files['video']
    thumbnail_file = request.files.get('thumbnail')  #video drip
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected.'}), 400
    
    # Checking if it's actually a video and not someone's homework
    if not file.filename.lower().endswith(('.mp4', '.webm', '.ogg', '.mov', '.avi')):
        return jsonify({'success': False, 'message': 'Invalid video format.'}), 400
    
    ip = get_ip()
    try:
        import uuid
        # UUID because we're fancy like that
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        videos_dir = os.path.join(app.static_folder, 'VIDEOS')
        os.makedirs(videos_dir, exist_ok=True)  # Making directories like a responsible adult
        filepath = os.path.join(videos_dir, filename)
        file.save(filepath)  # Saving the video to its new home
        
        # Handle thumbnail if someone was thoughtful enough to provide one
        thumbnail_url = None
        if thumbnail_file and thumbnail_file.filename:
            thumbnail_filename = f"{uuid.uuid4().hex}_{thumbnail_file.filename}"
            thumbnail_path = os.path.join(app.static_folder, 'IMAGES', thumbnail_filename)
            thumbnail_file.save(thumbnail_path)
            thumbnail_url = f'/IMAGES/{thumbnail_filename}'
        
        # Building the video data like we're assembling IKEA furniture
        video_data = {
            'id': str(uuid.uuid4()),
            'title': title,
            'description': description,
            'url': f'/VIDEOS/{filename}',
            'thumbnail': thumbnail_url,
            'date': __import__('datetime').datetime.now().strftime('%B %d, %Y')  # Because importing at the top is overrated
        }
        
        videos_file = os.path.join(DATA_FOLDER, 'videos.json')
        try:
            with open(videos_file, 'r', encoding='utf-8') as f:
                videos = json.load(f)
        except FileNotFoundError:
            videos = []  # Starting fresh like a new year's resolution
        
        videos.insert(0, video_data)  # New videos go to the front of the line
        
        with open(videos_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, indent=2)  # Pretty printing because we have standards at dumbprogrammerco
        
        logging.info(f"Successfully uploaded video: {title} from IP: {ip}")
        return jsonify({'success': True, 'message': 'Video uploaded successfully!'})
    except Exception as e:
        logging.error(f"Error during video upload from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/upload-art')
@login_required
def upload_art_page(): return app.send_static_file('upload-art.html')

@app.route('/api/upload-artwork', methods=['POST'])
@login_required
def upload_artwork():
    artwork_data = request.json
    ip = get_ip()
    try:
        logging.info(f"Artwork upload attempt from IP: {ip}")
        artwork_file = os.path.join(DATA_FOLDER, 'artwork.json')
        
        try:
            with open(artwork_file, 'r', encoding='utf-8') as f:
                artworks = json.load(f)
        except FileNotFoundError:
            artworks = []
        
        artworks.insert(0, artwork_data)
        
        with open(artwork_file, 'w', encoding='utf-8') as f:
            json.dump(artworks, f, indent=2)
        
        logging.info(f"Successfully uploaded artwork: {artwork_data.get('title', 'N/A')}")
        return jsonify({'success': True, 'message': 'Artwork uploaded successfully!'})
    except Exception as e:
        logging.error(f"Error during artwork upload from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500

@app.route('/api/artworks')
def get_artworks():
    try:
        artwork_file = os.path.join(DATA_FOLDER, 'artwork.json')
        with open(artwork_file, 'r', encoding='utf-8') as f:
            artworks = json.load(f)
        return jsonify({'artworks': artworks})
    except FileNotFoundError:
        return jsonify({'artworks': []})
    except Exception as e:
        logging.error(f"Error retrieving artworks: {e}")
        return jsonify({'success': False, 'message': 'Could not retrieve artworks.'}), 500

@app.route('/api/videos')
def get_videos():
    try:
        videos_file = os.path.join(DATA_FOLDER, 'videos.json')
        with open(videos_file, 'r', encoding='utf-8') as f:
            videos = json.load(f)
        return jsonify({'videos': videos})
    except FileNotFoundError:
        return jsonify({'videos': []})
    except Exception as e:
        logging.error(f"Error retrieving videos: {e}")
        return jsonify({'success': False, 'message': 'Could not retrieve videos.'}), 500

@app.route('/api/upload-youtube-video', methods=['POST'])
@login_required
def upload_youtube_video():
    video_data = request.json
    ip = get_ip()
    try:
        logging.info(f"YouTube video upload attempt from IP: {ip}")
        videos_file = os.path.join(DATA_FOLDER, 'videos.json')
        
        try:
            with open(videos_file, 'r', encoding='utf-8') as f:
                videos = json.load(f)
        except FileNotFoundError:
            videos = []
        
        videos.insert(0, video_data)
        
        with open(videos_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, indent=2)
        
        logging.info(f"Successfully uploaded YouTube video: {video_data.get('title', 'N/A')}")
        return jsonify({'success': True, 'message': 'Video uploaded successfully!'})
    except Exception as e:
        logging.error(f"Error during YouTube video upload from IP {ip}: {e}")
        return jsonify({'success': False, 'message': 'An error occurred on the server.'}), 500



if __name__ == '__main__':
    app.run(debug=True, port=5000)

