import sqlite3

db_path = 'backend/instance/app.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Buat tabel baru
cursor.execute('''
    CREATE TABLE IF NOT EXISTS monitoring_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_ref_id TEXT,
        remark TEXT
    )
''')

# 2. Copy data
cursor.execute('''
    INSERT INTO monitoring_new (id, system_ref_id, remark)
    SELECT id, entity_id, remark FROM monitoring
''')

# 3. Hapus tabel lama
cursor.execute('DROP TABLE monitoring')

# 4. Rename tabel baru
cursor.execute('ALTER TABLE monitoring_new RENAME TO monitoring')

conn.commit()
conn.close()
print('Migrasi kolom system_ref_id ke entity_id selesai.')