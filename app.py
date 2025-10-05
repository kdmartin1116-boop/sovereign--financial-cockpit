import json
import os
import sys

from flask import Flask, render_template, send_from_directory, url_for
from flask_login import LoginManager

from config import Config
from modules.database import get_user_by_id, init_db

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from modules.auto_tender import annotate_image_coupon, annotate_pdf_coupon
from modules.routes.auth import auth_bp
from modules.routes.credit_report import credit_report_bp
from modules.routes.disputes import disputes_bp
from modules.routes.endorsement import endorsement_bp
from modules.routes.legal import legal_bp
from modules.routes.profile import profile_bp
from modules.routes.vehicle import vehicle_bp
from routes.document_routes import document_bp
from routes.generator_routes import generator_bp

# Disable default static serving and use custom static routes
app = Flask(__name__, static_folder=None, template_folder="templates")
print("--- app.py from Gemini CLI is running ---")
app.config.from_object(Config)

login_manager = LoginManager()
login_manager.login_view = "auth_bp.login"  # type: ignore
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    database_path = app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    return get_user_by_id(database_path, user_id)


app.register_blueprint(profile_bp)
app.register_blueprint(credit_report_bp)
app.register_blueprint(disputes_bp)
app.register_blueprint(vehicle_bp)
app.register_blueprint(document_bp)
app.register_blueprint(endorsement_bp)
app.register_blueprint(legal_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(generator_bp)


# New route to serve files from the dist directory
@app.route("/static/dist/<path:filename>")
def serve_dist_files(filename):
    return send_from_directory(app.root_path + "/static/dist", filename)


# Explicitly serve the main static folder (for style.css etc.)
@app.route("/static/<path:filename>", endpoint="static")
def serve_static_files(filename):
    return send_from_directory(app.root_path + "/static", filename)


@app.route("/")
def index():
    if not app.debug:
        manifest_path = os.path.join(app.root_path, "static", "dist", ".vite", "manifest.json")
        try:
            with open(manifest_path) as f:
                manifest = json.load(f)
                # The key in the manifest is the source file name, e.g., 'static/main.js'
                script_entry = manifest.get("static/main.js")
                if script_entry:
                    script_file = script_entry["file"]
                    # compute the URL for dev/static serving if needed
                    _ = url_for("serve_dist_files", filename=script_file)
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            pass  # Fallback to None if manifest not found or invalid

    return render_template("index.html")


@app.route("/tender")
def tender():
    # This is an example route. In a real application, you would get the
    # file paths and other data from a user request.
    input_file = "uploads/hw.pdf"  # Should be a PDF or image
    output_file = "tendered_bill.pdf"
    annotations = {
        "Pay to the order of: GENERIC CREDIT CARD": (100, 2000),
        "Amount: $250.00": (100, 2080),
        "Tendered under UCC §3-104 and §3-603(b).": (100, 2160),
        "Refusal to accept without written cause may result in discharge of obligation.": (
            100,
            2240,
        ),
    }
    signature = "/s/ john-doe:smith, beneficiary"
    signature_coordinates = (100, 2340)

    # Check the file type and call the appropriate function
    if input_file.lower().endswith(".pdf"):
        annotate_pdf_coupon(input_file, output_file, annotations, signature, signature_coordinates)
    elif input_file.lower().endswith((".png", ".jpg", ".jpeg")):
        annotate_image_coupon(
            input_file, output_file, annotations, signature, signature_coordinates
        )
    else:
        return "Unsupported file type. Please use a PDF or image."

    return f"File {input_file} has been tendered and saved as {output_file}"
    return f"File {input_file} has been tendered and saved as {output_file}"


if __name__ == "__main__":
    init_db(app)
    os.makedirs("uploads", exist_ok=True)
    app.run(host="127.0.0.1", port=8001)
