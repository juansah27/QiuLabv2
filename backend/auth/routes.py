@auth_bp.route('/create-superuser', methods=['POST'])
def create_superuser():
    """
    Endpoint untuk membuat user admin (superuser)
    Data yang dibutuhkan:
    {
        "username": "username",
        "password": "password",
        "email": "email@example.com"
    }
    """
    try:
        data = request.get_json()
        
        # Validasi data
        if not all(key in data for key in ['username', 'password', 'email']):
            return jsonify({'error': 'Data tidak lengkap'}), 400
            
        # Cek apakah username sudah ada
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username sudah digunakan'}), 400
            
        # Cek apakah email sudah ada
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email sudah terdaftar'}), 400
            
        # Buat user baru dengan role admin
        new_user = User(
            username=data['username'],
            email=data['email'],
            role='admin'
        )
        new_user.set_password(data['password'])
        
        # Simpan ke database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Superuser berhasil dibuat',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'role': new_user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 