from datetime import datetime

from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from modules.database import add_dispute, get_all_disputes, update_dispute_status

disputes_bp = Blueprint("disputes_bp", __name__)


@disputes_bp.route("/api/disputes", methods=["GET"])
@login_required
def get_disputes_route():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    try:
        disputes = get_all_disputes(database_path)
        return jsonify(disputes)
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve disputes: {str(e)}"}), 500


@disputes_bp.route("/api/disputes", methods=["POST"])
@login_required
def add_dispute_route():
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    data = request.get_json()
    account_name = data.get("account_name")
    account_number = data.get("account_number")
    date_sent = datetime.now().strftime("%Y-%m-%d")
    status = "Sent"

    try:
        add_dispute(database_path, account_name, account_number, date_sent, status)
        return jsonify({"message": "Dispute tracked successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to add dispute: {str(e)}"}), 500


@disputes_bp.route("/api/disputes/<int:dispute_id>", methods=["PUT"])
@login_required
def update_dispute_route(dispute_id):
    database_path = current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
    data = request.get_json()
    status = data.get("status")

    try:
        update_dispute_status(database_path, dispute_id, status)
        return jsonify({"message": "Dispute status updated successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to update dispute status: {str(e)}"}), 500
