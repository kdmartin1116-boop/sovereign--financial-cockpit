from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from modules.database import get_profile, save_profile

profile_bp = Blueprint("profile_bp", __name__)


@profile_bp.route("/api/profile", methods=["GET"])
@login_required
def get_profile_route():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    try:
        profile = get_profile(database_path)
        if profile:
            return jsonify(profile)
        return jsonify({"error": "Profile not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve profile: {str(e)}"}), 500


@profile_bp.route("/api/profile", methods=["POST"])
@login_required
def save_profile_route():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    data = request.get_json()
    name = data.get("name")
    address = data.get("address")
    email = data.get("email")
    phone = data.get("phone")

    try:
        save_profile(database_path, name, address, email, phone)
        return jsonify({"message": "Profile saved successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to save profile: {str(e)}"}), 500
