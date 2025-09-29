import io
import os
import random
import face_recognition
from typing import Dict, List
import numpy as np


def random_color():
    h = random.randint(0, 360)        # Hue: 0–360
    s = random.randint(40, 100)       # Saturation: 40–100%
    l = random.randint(30, 70)        # Lightness: 30–70%
    return f"hsl({h}, {s}%, {l}%)"


def find_matches(input_images: List[bytes], 
                dataset_path_encodings_map: Dict, 
                dataset_path_locations_map: Dict):
    SIMILARITY_THRESHOLD = 0.93
    input_search_images_encoding_map = {}

    # Encode input binary images
    for idx, img_bytes in enumerate(input_images):
        image = face_recognition.load_image_file(io.BytesIO(img_bytes))
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        if face_encodings:
            input_search_images_encoding_map[f"input_{idx}"] = face_encodings[0]

    similar_images = {}
    for img_key in input_search_images_encoding_map:
        color = random_color()
        img_emb = np.array(input_search_images_encoding_map[img_key])
        img_emb_norm = img_emb / np.linalg.norm(img_emb)

        for ref_image_path in dataset_path_encodings_map:
            if ref_image_path not in similar_images:
                similar_images[ref_image_path] = []

            for i, embedding in enumerate(dataset_path_encodings_map[ref_image_path]):
                embedding = np.array(embedding)
                embedding_norm = embedding / np.linalg.norm(embedding)

                cos_sim = np.dot(img_emb_norm, embedding_norm)
                if cos_sim >= SIMILARITY_THRESHOLD:

                    similar_images[ref_image_path].append([cos_sim,dataset_path_locations_map[ref_image_path][i], color])

    # Filter: keep only images with number of matches == number of input images
    filtered_images = {
        path: matches
        for path, matches in similar_images.items()
        if len(matches) == len(input_search_images_encoding_map)
    }
    
    return filtered_images

