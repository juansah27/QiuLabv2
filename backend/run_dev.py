import os
import sys

# Set environment ke development
os.environ["FLASK_ENV"] = "development"

# Import aplikasi setelah set environment
from app import app
import config

if __name__ == "__main__":
    print(f"Menjalankan aplikasi dalam mode DEVELOPMENT")
    print(f"Server akan tersedia di: {config.SERVER_URL}")
    print(f"API akan tersedia di: {config.SERVER_URL}/api")
    print(f"Debug mode: {config.DEBUG}")
    
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    ) 