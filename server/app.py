import os
from socket import SocketIO
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def hello():
    return 'Hello fine shyts'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)