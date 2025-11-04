import click
from flask.cli import with_appcontext
from models.user import User
from app import db

@click.command('create-superuser')
@click.argument('username')
@click.argument('password')
@click.argument('email')
@with_appcontext
def create_superuser_command(username, password, email):
    """
    Command untuk membuat superuser dengan role admin dari CLI.
    
    Contoh penggunaan:
    $ flask create-superuser ladyqiu "@Wanipiro27" ladyqiu@example.com
    """
    try:
        # Cek apakah username sudah ada
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            click.echo(f"Error: Username '{username}' sudah digunakan")
            return
            
        # Cek apakah email sudah ada
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            click.echo(f"Error: Email '{email}' sudah terdaftar")
            return
            
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
        
        click.echo(f"Superuser '{username}' berhasil dibuat dengan role admin")
    except Exception as e:
        db.session.rollback()
        click.echo(f"Error: {str(e)}")

def register_commands(app):
    """Register CLI commands with the app"""
    app.cli.add_command(create_superuser_command) 