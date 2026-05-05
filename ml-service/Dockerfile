FROM python:3.12-slim-bookworm
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py train_model.py ./
# Train artifacts — run `python train_model.py` locally first so these exist:
COPY model.pkl encoder.pkl ./

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Render sets PORT at runtime; default 8000 for local Docker.
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
