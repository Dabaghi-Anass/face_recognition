FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt update && apt install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    wget \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN pip install --upgrade pip
RUN pip install wheel setuptools pip --upgrade
RUN pip install -r requirements.txt
RUN ln -s $(python -c "import site; print(site.getsitepackages()[0])")/face-recognition-models \
       $(python -c "import site; print(site.getsitepackages()[0])")/face_recognition_models
RUN mkdir -p /app/images
RUN python preprocessing.py

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
