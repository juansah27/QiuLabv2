# Solusi Git Pull Conflict

Ada 2 masalah:
1. **Local changes** di `backend/otomasi/input_orders.txt` yang belum di-commit
2. **Untracked files** (script diagnostik) yang akan di-overwrite

## Solusi

### Option 1: Stash local changes dan remove untracked files (RECOMMENDED)

```bash
# Stash local changes
git stash push -m "Stash local changes before pull"

# Remove untracked files (script diagnostik)
rm check_monitoring_detailed.sh
rm check_monitoring_order.sh
rm test_full_query_performance.sh
rm test_sql_connection.sh

# Pull
git pull origin main

# Apply stash jika perlu (optional)
git stash pop
```

### Option 2: Commit local changes dan add untracked files

```bash
# Commit local changes
git add backend/otomasi/input_orders.txt
git commit -m "Update input_orders.txt"

# Add script diagnostik (jika mau di-commit)
git add check_monitoring_*.sh test_*.sh
git commit -m "Add diagnostic scripts for monitoring-order"

# Pull
git pull origin main
```

### Option 3: Force pull (HATI-HATI - akan overwrite local changes)

```bash
# Backup dulu
cp backend/otomasi/input_orders.txt backend/otomasi/input_orders.txt.backup

# Remove untracked files
rm check_monitoring_*.sh test_*.sh

# Reset dan pull
git reset --hard origin/main
git pull origin main
```

## Rekomendasi

Gunakan **Option 1** karena:
- Aman (tidak kehilangan data)
- Bisa restore local changes setelah pull
- Script diagnostik bisa dibuat ulang jika perlu


