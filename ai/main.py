import argparse
import os
from dotenv import load_dotenv

load_dotenv()


def cmd_crawl(args):
    from crawler.agent import run_crawling_agent
    run_crawling_agent(target_per_class=args.count)


def cmd_label(args):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    from labeler.app import app
    print("라벨링 UI: http://localhost:5000")
    app.run(debug=True, port=5000)


def cmd_prepare(args):
    """라벨링 완료된 데이터를 train/val 폴더로 분할."""
    import shutil, random

    raw_dir = "dataset/raw"
    ratio = 0.8

    for cls_name in os.listdir(raw_dir):
        cls_path = os.path.join(raw_dir, cls_name)
        if not os.path.isdir(cls_path):
            continue

        pairs = []
        for fname in os.listdir(cls_path):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            label = os.path.join(cls_path, fname.rsplit(".", 1)[0] + ".txt")
            if os.path.exists(label):
                pairs.append((os.path.join(cls_path, fname), label))

        if not pairs:
            continue

        random.shuffle(pairs)
        split = int(len(pairs) * ratio)
        splits = [("train", pairs[:split]), ("val", pairs[split:])]

        for split_name, split_pairs in splits:
            img_dir = f"dataset/images/{split_name}"
            lbl_dir = f"dataset/labels/{split_name}"
            os.makedirs(img_dir, exist_ok=True)
            os.makedirs(lbl_dir, exist_ok=True)

            for img_src, lbl_src in split_pairs:
                dst_img = os.path.join(img_dir, os.path.basename(img_src))
                dst_lbl = os.path.join(lbl_dir, os.path.basename(lbl_src))
                # 이미 존재하면 덮어쓰지 않음 (중복 실행 안전)
                if not os.path.exists(dst_img):
                    shutil.copy(img_src, dst_img)
                if not os.path.exists(dst_lbl):
                    shutil.copy(lbl_src, dst_lbl)

        print(f"{cls_name}: train {len(splits[0][1])}장 / val {len(splits[1][1])}장")

    print("\n데이터 분할 완료. 이제 YOLO 학습을 시작하세요:")
    print("  python3 main.py train")


def cmd_train(args):
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")
    model.train(
        data="dataset/dataset.yaml",
        epochs=args.epochs,
        imgsz=640,
        batch=16,
        name="cosmetic_bottle",
        patience=20,
    )
    print("\n학습 완료! 모델 저장 위치: runs/detect/cosmetic_bottle/weights/best.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="화장품 공병 인식 시스템")
    sub = parser.add_subparsers(dest="cmd")

    p_crawl = sub.add_parser("crawl", help="이미지 자동 크롤링")
    p_crawl.add_argument("--count", type=int, default=50, help="클래스당 목표 수량")
    p_crawl.set_defaults(func=cmd_crawl)

    p_label = sub.add_parser("label", help="라벨링 UI 실행")
    p_label.set_defaults(func=cmd_label)

    p_prep = sub.add_parser("prepare", help="train/val 데이터 분할")
    p_prep.set_defaults(func=cmd_prepare)

    p_train = sub.add_parser("train", help="YOLO 모델 학습")
    p_train.add_argument("--epochs", type=int, default=100)
    p_train.set_defaults(func=cmd_train)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()
