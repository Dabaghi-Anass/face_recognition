import os
import io
import json
import uuid
import face_recognition

from fastapi import FastAPI, UploadFile, File, Depends, Query, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from utils import find_matches


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
embeddings_map = {}
locations_map = {}
IMAGES_DIR = os.path.join(DATA_DIR, "images")
ENCODINGS_FILE = os.path.join(DATA_DIR, "encodings_map.json")
LOCATIONS_FILE = os.path.join(DATA_DIR, "locations_map.json")


def load_embeddings():
    global embeddings_map
    if os.path.exists(ENCODINGS_FILE):
        with open(ENCODINGS_FILE, "r") as f:
            embeddings_map = json.load(f)


def load_locations():
    global locations_map
    if os.path.exists(LOCATIONS_FILE):
        with open(LOCATIONS_FILE, "r") as f:
            locations_map = json.load(f)
def load_ctx():
    global embeddings_map,locations_map
    load_embeddings()
    load_locations()

@app.on_event("startup")
def startup_event():
    load_embeddings()
    load_locations()
    os.makedirs(IMAGES_DIR, exist_ok=True)


@app.post("/embed")
async def add_to_dataset(file: UploadFile = File(...)):
    """Save uploaded image and update dataset"""
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(IMAGES_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Process image → embeddings
    image = face_recognition.load_image_file(file_path)
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)

    if face_encodings:
        embeddings_map[unique_filename] = [enc.tolist() for enc in face_encodings]
        locations_map[unique_filename] = face_locations

        with open(ENCODINGS_FILE, "w") as f:
            json.dump(embeddings_map, f)
        with open(LOCATIONS_FILE, "w") as f:
            json.dump(locations_map, f)
        load_ctx()
    return {"status": "ok", "faces_detected": len(face_encodings)}


@app.get("/health")
async def health():
    return {"status": "ok", "message":"server is healthy"}

@app.get("/images")
async def all_images():
    files = os.listdir(IMAGES_DIR)
    return {"images": files}
@app.get("/download/{file_name}")
async def download_image(file_name: str):
  file_path = os.path.join(IMAGES_DIR, file_name)
  if os.path.exists(file_path):
      
    return FileResponse(file_path, filename=file_name)
  return {"error": "File not found"}


@app.get("/reload")
async def reload():
    load_embeddings()
    load_locations()
    return {"message", "db reloaded succefully"}


@app.post("/similar")
async def get_similars(files: list[UploadFile] = File(...)):
    """Find similar images and return matching files"""
    input_images = [await f.read() for f in files]
    matches = find_matches(input_images, embeddings_map, locations_map)
    
    return {"matches": matches}

app.mount("/", StaticFiles(directory="public", html=True), name="static")