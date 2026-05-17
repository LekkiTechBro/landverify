# ─── Base ───────────────────────────────────────────────
FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

# ─── Development ────────────────────────────────────────
FROM base AS development
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
COPY . .
# hot-reload via uvicorn --reload mounted volume

# ─── Production ─────────────────────────────────────────
FROM base AS production
COPY . .

# Run as non-root
RUN addgroup --system appgroup && adduser --system --group appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
