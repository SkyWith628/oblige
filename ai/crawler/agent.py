"""
크롤링은 단순 반복 작업이라 LLM 없이 직접 실행.
ChromeDriver는 한 번만 생성하고 모든 키워드에서 재사용한다.
"""
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

from crawler.google_crawler import crawl_google_images
from crawler.naver_crawler import crawl_naver_images
from crawler.cleaner import remove_duplicates, filter_bad_images

SEARCH_KEYWORDS = {
    "토너":   ["토너 공병", "스킨 공병", "toner empty bottle"],
    "앰플":   ["앰플 공병", "세럼 빈병", "ampoule empty bottle"],
    "크림":   ["크림 공병", "크림 빈병", "cream jar empty"],
    "선크림": ["선크림 공병", "자외선차단제 빈병", "sunscreen empty bottle"],
    "에센스": ["에센스 공병", "essence empty bottle"],
}


def _count(cls_name: str) -> int:
    path = f"dataset/raw/{cls_name}"
    if not os.path.exists(path):
        return 0
    return len([f for f in os.listdir(path)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))])


def _make_driver() -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options,
    )


def run_crawling_agent(target_per_class: int = 50):
    print(f"크롤링 시작 (목표: 클래스당 {target_per_class}장)\n")

    driver = _make_driver()
    try:
        for cls_name, keywords in SEARCH_KEYWORDS.items():
            current = _count(cls_name)
            print(f"[{cls_name}] 현재 {current}장 / 목표 {target_per_class}장")

            if current >= target_per_class:
                print(f"  → 이미 목표 달성, 건너뜀\n")
                continue

            needed = target_per_class - current
            per_keyword = max(10, needed // len(keywords) + 1)
            save_dir = f"dataset/raw/{cls_name}"

            for keyword in keywords:
                if _count(cls_name) >= target_per_class:
                    break

                print(f"  [Bing]  '{keyword}' 검색 중...")
                n = crawl_google_images(keyword, save_dir, per_keyword, driver)
                print(f"          → {n}장 저장")

                if _count(cls_name) >= target_per_class:
                    break

                print(f"  [네이버] '{keyword}' 검색 중...")
                n = crawl_naver_images(keyword, save_dir, per_keyword, driver)
                print(f"          → {n}장 저장")

            dup = remove_duplicates(save_dir)
            bad = filter_bad_images(save_dir)
            total = _count(cls_name)
            print(f"  정리: 중복 {dup}장, 불량 {bad}장 제거 → 최종 {total}장\n")
    finally:
        driver.quit()

    print("=" * 40)
    print("수집 완료 현황")
    print("=" * 40)
    for cls_name in SEARCH_KEYWORDS:
        print(f"  {cls_name}: {_count(cls_name)}장")
    print("\n다음 단계: python3 main.py label")
