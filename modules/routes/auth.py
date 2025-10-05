from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from modules.database import create_user, get_user_by_username

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if get_user_by_username(database_path, username):
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = generate_password_hash(password)
    user_id = create_user(database_path, username, hashed_password)

    if user_id:
        return jsonify({"message": "User registered successfully"}), 201
    return jsonify({"error": "Failed to register user"}), 500


@auth_bp.route("/api/login", methods=["POST"])
def login():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = get_user_by_username(database_path, username)

    if user and check_password_hash(user.password_hash, password):
        login_user(user)  # Log in the user
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid username or password"}), 401


@auth_bp.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200


@auth_bp.route("/api/status", methods=["GET"])
def status():
    if current_user.is_authenticated:
        return jsonify({"is_authenticated": True, "username": current_user.username}), 200
    return jsonify({"is_authenticated": False}), 200
