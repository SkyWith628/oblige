import os
import shutil
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__)

CLASSES = ["토너", "앰플", "크림", "선크림", "에센스"]
REJECT = "불량/제외"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "dataset", "raw")
REJECTED_DIR = os.path.join(BASE_DIR, "dataset", "rejected")


def get_unlabeled_images():
    images = []
    if not os.path.exists(RAW_DIR):
        return images
    for cls in sorted(os.listdir(RAW_DIR)):
        cls_path = os.path.join(RAW_DIR, cls)
        if not os.path.isdir(cls_path):
            continue
        for fname in sorted(os.listdir(cls_path)):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            label_path = os.path.join(cls_path, fname.rsplit(".", 1)[0] + ".txt")
            if not os.path.exists(label_path):
                images.append({"path": f"{cls}/{fname}", "suggested": cls})
    return images


def count_progress():
    total = labeled = 0
    if not os.path.exists(RAW_DIR):
        return {"total": 0, "labeled": 0, "remaining": 0}
    for cls in os.listdir(RAW_DIR):
        cls_path = os.path.join(RAW_DIR, cls)
        if not os.path.isdir(cls_path):
            continue
        for fname in os.listdir(cls_path):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                total += 1
                txt = os.path.join(cls_path, fname.rsplit(".", 1)[0] + ".txt")
                if os.path.exists(txt):
                    labeled += 1
    return {"total": total, "labeled": labeled, "remaining": total - labeled}


@app.route("/")
def index():
    images = get_unlabeled_images()
    progress = count_progress()
    current = images[0] if images else None
    return render_template("label.html",
                           current=current,
                           remaining=len(images),
                           progress=progress,
                           classes=CLASSES)


@app.route("/raw/<path:filepath>")
def serve_image(filepath):
    return send_from_directory(RAW_DIR, filepath)


@app.route("/save_label", methods=["POST"])
def save_label():
    data = request.json
    image_path = data["image_path"]   # "토너/abc.jpg"
    class_name = data["class_name"]
    bbox = data.get("bbox")           # [cx, cy, w, h] or null

    img_dir, img_file = image_path.split("/", 1)
    src_path = os.path.join(RAW_DIR, image_path)

    if class_name == REJECT:
        os.makedirs(REJECTED_DIR, exist_ok=True)
        shutil.move(src_path, os.path.join(REJECTED_DIR, img_file))
        return jsonify({"status": "rejected"})

    if class_name not in CLASSES:
        return jsonify({"status": "error", "msg": f"Unknown class: {class_name}"}), 400

    class_id = CLASSES.index(class_name)
    cx, cy, w, h = bbox if bbox else (0.5, 0.5, 0.9, 0.9)

    label_file = img_file.rsplit(".", 1)[0] + ".txt"
    label_path = os.path.join(RAW_DIR, img_dir, label_file)
    with open(label_path, "w") as f:
        f.write(f"{class_id} {cx:.4f} {cy:.4f} {w:.4f} {h:.4f}\n")

    return jsonify({"status": "saved"})


@app.route("/progress")
def progress():
    return jsonify(count_progress())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)
