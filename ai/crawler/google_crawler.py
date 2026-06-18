"""
Bing 이미지 검색 크롤러.
Google은 headless 브라우저를 차단하므로 Bing으로 대체.
driver를 인자로 받아 외부에서 생명주기를 관리한다.
"""
import os
import time
import uuid
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys


def crawl_google_images(keyword: str, save_dir: str, max_count: int, driver) -> int:
    """Bing 이미지 검색으로 이미지를 수집한다. driver는 호출자가 관리."""
    os.makedirs(save_dir, exist_ok=True)

    query = keyword.replace(" ", "+")
    driver.get(f"https://www.bing.com/images/search?q={query}&form=HDRSC2")
    time.sleep(3)

    for _ in range(8):
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
        time.sleep(0.8)

    img_elements = driver.find_elements(By.CSS_SELECTOR, "img.mimg")
    print(f"    [Bing] 수집 대상 이미지: {len(img_elements)}개")

    if not img_elements:
        print(f"    [경고] Bing 이미지 요소를 찾지 못했습니다. 키워드: {keyword}")
        return 0

    saved = 0
    for img in img_elements:
        if saved >= max_count:
            break
        try:
            src = img.get_attribute("src") or img.get_attribute("data-src")
            if not src or src.startswith("data:") or not src.startswith("http"):
                continue
            resp = requests.get(src, timeout=5)
            if resp.status_code == 200 and len(resp.content) > 5000:
                ext = "png" if resp.content[:8].startswith(b"\x89PNG") else "jpg"
                fpath = os.path.join(save_dir, f"{uuid.uuid4()}.{ext}")
                with open(fpath, "wb") as f:
                    f.write(resp.content)
                saved += 1
        except Exception:
            continue

    return saved
