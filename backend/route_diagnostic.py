from app import app
from flask import jsonify

@app.route('/api/route-list', methods=['GET'])
def list_routes():
    """Endpoint untuk melihat semua rute yang tersedia"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': [m for m in rule.methods],
            'path': str(rule)
        })
    return jsonify({
        'status': 'success',
        'routes': routes
    })

if __name__ == '__main__':
    # Cetak semua rute yang tersedia
    print("\n=== Daftar Rute yang Terdaftar ===")
    print("%-30s %-30s %s" % ("Endpoint", "Metode", "Path"))
    print("-" * 80)
    
    for rule in app.url_map.iter_rules():
        methods = ', '.join(sorted([m for m in rule.methods if m not in ('HEAD', 'OPTIONS')]))
        print("%-30s %-30s %s" % (rule.endpoint, methods, rule))
    
    print("\nTotal: %d rute" % len(list(app.url_map.iter_rules())))
    print("\nJalankan aplikasi untuk melihat semua rute di endpoint: /api/route-list")
