from flask import Flask, request, jsonify
import subprocess
import os

app = Flask(__name__)

@app.route('/scan-contract', methods=['POST'])
def scan_contract():
    file = request.files['contract']
    tag = request.form['tag']
    filepath = os.path.join('uploads', file.filename)
    file.save(filepath)

    result = subprocess.run(['bash', 'clausescanner.sh', f'--contract={filepath}', f'--tags={tag}'], capture_output=True, text=True)
    return jsonify({'output': result.stdout})

@app.route('/endorse-bill', methods=['POST'])
def endorse_bill():
    file = request.files['bill']
    text = request.form['text']
    qualifier = request.form['qualifier']
    x = request.form.get('x', '50')
    y = request.form.get('y', '700')

    filepath = os.path.join('uploads', file.filename)
    file.save(filepath)

    result = subprocess.run([
        'python', 'endorsecoupon.py',
        f'--bill={filepath}',
        f'--endorsement={text}',
        f'--qualifier={qualifier}',
        f'--x={x}',
        f'--y={y}'
    ], capture_output=True, text=True)

    return jsonify({'output': result.stdout})

@app.route('/generate-remedy', methods=['POST'])
def generate_remedy():
    violation = request.form['violation']
    jurisdiction = request.form['jurisdiction']
    result = subprocess.run(['bash', 'remedygenerator.sh', f'--violation={violation}', f'--jurisdiction={jurisdiction}'], capture_output=True, text=True)
    return jsonify({'output': result.stdout})

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True)