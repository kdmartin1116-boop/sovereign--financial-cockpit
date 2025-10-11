from flask import Blueprint, request, jsonify
from datetime import datetime

generator_bp = Blueprint('generator_bp', __name__)

@generator_bp.route('/generate-tender-letter', methods=['POST'])
def generate_tender_letter():
    data = request.get_json()
    user_name = data.get('userName')
    user_address = data.get('userAddress')
    creditor_name = data.get('creditorName')
    creditor_address = data.get('creditorAddress')
    bill_file_name = data.get('billFileName')

    if not all([user_name, user_address, creditor_name, creditor_address, bill_file_name]):
          return jsonify({"error": "Missing required data for tender letter generation."} ), 400      
    today = datetime.now().strftime("%B %d, %Y")

    tender_letter_content = f"""
*** DISCLAIMER: This letter is based on pseudo-legal theories associated with the \"sovereign citizen\" movement. These theories are not recognized in mainstream commercial law and may have adverse legal consequences. Use at your own risk. ***

[Your Name: {user_name}]
[Your Address: {user_address}]

{today}

TO: {creditor_name}
    {creditor_address}

SUBJECT: Private Administrative Process - Tender of Payment for Instrument {bill_file_name}

Dear Sir/Madam,

This correspondence serves as a formal tender of payment, presented in good faith, for the instrument identified as \"{bill_file_name}\". This instrument, having been properly endorsed and accepted for value, is hereby presented as a valid and lawful tender for the discharge and settlement of any alleged obligation or account associated therewith.

Be advised that this tender is made in accordance with the principles of commercial law and equity. Under Uniform Commercial Code (UCC) 3-603, a tender of payment of an obligation to pay an instrument made to a person entitled to enforce the instrument, if refused, discharges the obligation of the obligor to pay interest on the obligation after the due date and discharges any party with a right of recourse against the obligor to the extent of the amount of the tender.

Your refusal to accept this lawful tender of payment will be considered a dishonor of a commercial instrument and a refusal of a valid tender. All rights, remedies, and recourse, both at law and in equity, are expressly reserved without prejudice, pursuant to UCC 1-308.

This is a private administrative process. Your acceptance of this tender, or your failure to return the instrument with specific objections within [e.g., 3, 7, 10] days, will be deemed as acceptance of this tender and agreement to the discharge of the obligation.

Sincerely,

By: {user_name}
Authorized Representative / Agent
All Rights Reserved. Without Prejudice. UCC 1-308.
"""
    return jsonify({"letterContent": tender_letter_content.strip()}), 200

@generator_bp.route('/generate-ptp-letter', methods=['POST'])
def generate_ptp_letter():
    data = request.get_json(force=True)
    user_name = data.get('userName')
    user_address = data.get('userAddress')
    creditor_name = data.get('creditorName')
    creditor_address = data.get('creditorAddress')
    account_number = data.get('accountNumber')
    promise_amount = data.get('promiseAmount')
    promise_date = data.get('promiseDate')

    if not all([user_name, user_address, creditor_name, creditor_address, account_number, promise_amount, promise_date]):
        return jsonify({"error": "Missing required data for Promise to Pay letter generation."} ), 400

    today = datetime.now().strftime("%B %d, %Y")
    # Format promise_date for display
    formatted_promise_date = datetime.strptime(promise_date, '%Y-%m-%d').strftime("%B %d, %Y")

    ptp_letter_content = f"""
[Your Name: {user_name}]
[Your Address: {user_address}]

{today}

TO: {creditor_name}
    {creditor_address}

SUBJECT: Promise to Pay - Account: {account_number}

Dear {creditor_name},

This letter serves as my formal commitment to pay the outstanding amount on the account referenced above.

I, {user_name}, hereby promise to pay the amount of ${promise_amount} on or before {formatted_promise_date}.

This payment is being made to settle the account. Please update your records accordingly upon receipt of the payment. I request that you provide written confirmation of the payment being received and the account being settled.

Thank you for your understanding in this matter.

Sincerely,

{user_name}
"""
    return jsonify({"letterContent": ptp_letter_content.strip()}), 200


@generator_bp.route('/generate-remedy', methods=['POST'])
def generate_remedy():
    violation = request.form['violation']
    jurisdiction = request.form['jurisdiction']

    # Python implementation of remedygenerator.sh
    output = f"Generating remedy for violation: {violation} in jurisdiction: {jurisdiction}\n(Remedy generation logic is not yet implemented)"
    return jsonify({'output': output})
