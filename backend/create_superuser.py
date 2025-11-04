#!/usr/bin/env python
"""
Script untuk membuat superuser (admin)
"""
import sys
import os
import argparse

# Tambahkan direktori root ke sys.path agar bisa mengimport app
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app import create_app, db
from auth.models import User

def create_superuser(username, password, email):
    """
    Fungsi untuk membuat superuser dengan role admin
    """
    try:
        # Buat aplikasi dengan konfigurasi
        app = create_app()
        
        with app.app_context():
            # Cek apakah username sudah ada
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                print(f"Error: Username '{username}' sudah digunakan")
                return False
                
            # Cek apakah email sudah ada
            existing_email = User.query.filter_by(email=email).first()
            if existing_email:
                print(f"Error: Email '{email}' sudah terdaftar")
                return False
                
            # Buat user baru dengan role admin
            new_user = User(
                username=username,
                email=email,
                role='admin'
            )
            new_user.set_password(password)
            
            # Simpan ke database
            db.session.add(new_user)
            db.session.commit()
            
            print(f"Superuser '{username}' berhasil dibuat dengan role admin")
            return True
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Parse argumen dari command line
    parser = argparse.ArgumentParser(description="Buat superuser dengan role admin")
    parser.add_argument("username", help="Username untuk superuser")
    parser.add_argument("password", help="Password untuk superuser")
    parser.add_argument("email", help="Email untuk superuser")
    
    args = parser.parse_args()
    
    # Buat superuser
    create_superuser(args.username, args.password, args.email) 