# Stage 1: Dependencies
FROM python:3.9 AS python-deps
WORKDIR /deps

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc \
    && rm -rf /var/lib/apt/lists/*

# Copy hanya file requirements
COPY requirements.txt .
 
# Install dependensi ke folder vendor
RUN pip install --no-cache-dir --target=/deps/vendor -r requirements.txt \
    && pip install --no-cache-dir --target=/deps/vendor waitress gunicorn

# Stage 2: Runtime
FROM python:3.9

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependensi dari stage 1
COPY --from=python-deps /deps/vendor /usr/local/lib/python3.9/site-packages/

# Tambahkan non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy aplikasi
COPY . .

# Buat direktori dan atur izin
RUN mkdir -p /app/instance /app/logs /app/uploads \
    && chown -R appuser:appuser /app

# Ganti ke user non-root
USER appuser

# Variabel lingkungan
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000
ENV PYTHONPATH=/usr/local/lib/python3.9/site-packages

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Port aplikasi
EXPOSE 5000

# Menjalankan aplikasi
CMD ["python", "run_prod.py"] 