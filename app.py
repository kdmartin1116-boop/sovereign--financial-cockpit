from flask import Flask, render_template, send_from_directory
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# --- Blueprints ---
from routes.document_routes import document_bp
from routes.generator_routes import generator_bp

# Disable default static serving
app = Flask(__name__, static_folder=None, template_folder='templates')

# Register Blueprints
app.register_blueprint(document_bp)
app.register_blueprint(generator_bp)

# New route to serve files from the dist directory
@app.route('/static/dist/<path:filename>')
def serve_dist_files(filename):
    return send_from_directory(app.root_path + '/static/dist', filename)

# Explicitly serve the main static folder (for style.css etc.)
@app.route('/static/<path:filename>', endpoint='static')
def serve_static_files(filename):
    return send_from_directory(app.root_path + '/static', filename)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(host='127.0.0.1', port=8000, debug=True)