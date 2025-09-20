import os
import face_recognition
import numpy as np
import json
from PIL import Image, ImageDraw
os.makedirs("data", exist_ok=True)
DATA_DIR = "data"
dataset_path_encodings_map = {}
dataset_path_locations_map = {}
images_dir=os.path.join(DATA_DIR,"images")
images_paths=os.listdir(images_dir)

dataset_path_encodings_map = {}
dataset_path_locations_map = {}
faces_count=0
def normalize_face_locations(face_locations, width, height):
    normalized = []
    for (top, right, bottom, left) in face_locations:
        norm_top = top / height
        norm_right = right / width
        norm_bottom = bottom / height
        norm_left = left / width
        normalized.append((norm_top, norm_right, norm_bottom, norm_left))
    return normalized
def images_to_vecs(images_paths):
  global faces_count,face_locations,face_encodings,dataset_path_encodings_map,dataset_path_locations_map
  for image_path in images_paths:
      path=os.path.join(images_dir,image_path)
      image = face_recognition.load_image_file(path)
      height, width = image.shape[:2]
      face_locations = face_recognition.face_locations(image)
      face_encodings = face_recognition.face_encodings(image, face_locations)
      normalized_locations = normalize_face_locations(face_locations, width, height)
      dataset_path_encodings_map[image_path] = [encoding.tolist() for encoding in face_encodings]
      dataset_path_locations_map[image_path] = normalized_locations
      faces_count+=len(face_encodings)

  print(f"Processed {len(images_paths)} images: {faces_count} faces detected.")

images_to_vecs(images_paths)
with open(os.path.join(DATA_DIR, "encodings_map.json"), "w") as f:
    json.dump(dataset_path_encodings_map, f)

with open(os.path.join(DATA_DIR, "locations_map.json"), "w") as f:
    json.dump(dataset_path_locations_map, f)

print("Saved embeddings and locations to JSON!")