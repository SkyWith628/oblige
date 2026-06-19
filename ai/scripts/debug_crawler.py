"""
크롤러 진단 스크립트
실행: python3 debug_crawler.py
어떤 셀렉터가 이미지를 찾는지 확인합니다.
"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

KEYWORD = "토너 공병"

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1280,800")
options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                     "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

print("=" * 50)
print("Bing 이미지 검색 진단")
print("=" * 50)
query = KEYWORD.replace(" ", "+")
driver.get(f"https://www.bing.com/images/search?q={query}&form=HDRSC2")
time.sleep(3)

for _ in range(3):
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
    time.sleep(0.8)

all_imgs = driver.find_elements(By.TAG_NAME, "img")
print(f"전체 img 태그 수: {len(all_imgs)}")

classes = {}
for img in all_imgs:
    cls = img.get_attribute("class") or "(없음)"
    src = img.get_attribute("src") or ""
    if src.startswith("http"):
        classes[cls] = classes.get(cls, 0) + 1

print("\nhttp src를 가진 img 클래스별 수량:")
for cls, cnt in sorted(classes.items(), key=lambda x: -x[1])[:10]:
    print(f"  [{cnt}개] class='{cls}'")

print("\n" + "=" * 50)
print("네이버 이미지 검색 진단")
print("=" * 50)
import requests
query2 = requests.utils.quote(KEYWORD)
driver.get(f"https://search.naver.com/search.naver?where=image&query={query2}")
time.sleep(3)

for _ in range(3):
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.END)
    time.sleep(0.8)

all_imgs2 = driver.find_elements(By.TAG_NAME, "img")
print(f"전체 img 태그 수: {len(all_imgs2)}")

classes2 = {}
for img in all_imgs2:
    cls = img.get_attribute("class") or "(없음)"
    src = img.get_attribute("src") or ""
    if src.startswith("http"):
        classes2[cls] = classes2.get(cls, 0) + 1

print("\nhttp src를 가진 img 클래스별 수량:")
for cls, cnt in sorted(classes2.items(), key=lambda x: -x[1])[:10]:
    print(f"  [{cnt}개] class='{cls}'")

driver.quit()
print("\n진단 완료. 위 클래스명을 crawler/google_crawler.py, naver_crawler.py에 적용하세요.")
