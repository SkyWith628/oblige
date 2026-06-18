import os
import cv2
import hashlib


def remove_duplicates(directory: str) -> int:
    seen = set()
    removed = 0
    for fname in os.listdir(directory):
        if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        fpath = os.path.join(directory, fname)
        with open(fpath, "rb") as f:
            h = hashlib.md5(f.read()).hexdigest()
        if h in seen:
            os.remove(fpath)
            removed += 1
        else:
            seen.add(h)
    return removed


def filter_bad_images(directory: str) -> int:
    removed = 0
    for fname in os.listdir(directory):
        if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            continue
        fpath = os.path.join(directory, fname)
        try:
            img = cv2.imread(fpath)
            if img is None:
                os.remove(fpath)
                removed += 1
                continue
            h, w = img.shape[:2]
            if h < 100 or w < 100:
                os.remove(fpath)
                removed += 1
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.Laplacian(gray, cv2.CV_64F).var()
            if blur < 50:
                os.remove(fpath)
                removed += 1
        except Exception:
            os.remove(fpath)
            removed += 1
    return removed
