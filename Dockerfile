FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir cmake
RUN pip install --no-cache-dir dlib==19.24.0  # precompiled wheel
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/images
RUN python preprocessing.py

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
