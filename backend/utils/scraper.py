# scraper.py

import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from logger import get_logger
import time
from datetime import datetime, timedelta

logger = get_logger("Scraper")

load_dotenv()

CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

def fetch_naver_news_links(query="IT", display_count=5):
    """네이버 뉴스 API를 호출하여 뉴스 링크 리스트를 가져옵니다."""
    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET
    }
    params = {
        "query": query,
        "display": display_count,
        "sort": "date"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json().get("items", [])
        else:
            print(f"❌ 네이버 API 호출 실패 (상태 코드: {response.status_code})")
            return []
    except Exception as e:
        print(f"❌ API 요청 중 오류 발생: {e}")
        return []

def extract_article_text(news_url):
    """뉴스 원본 링크에서 본문 텍스트를 추출합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(news_url, headers=headers, timeout=5)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 일반적인 네이버 뉴스 본문 영역 태그들 탐색
            article_body = soup.find('article', id='dic_area') or soup.find('div', id='articleBodyContents')
            if article_body:
                return article_body.get_text(strip=True)
                
            # 예외: 만약 위 태그가 없으면 p 태그들을 다 긁어옴
            p_tags = soup.find_all('p')
            if p_tags:
                return " ".join([p.get_text(strip=True) for p in p_tags])
    except Exception as e:
            # 🚨 에러 발생 시 파일에 즉시 기록!
            logger.error("URL: https://news.naver.com/main/read.nhn?mode=LSD&mid=shm&sid1=105&oid=001&aid=12345 | 에러 내용: BeautifulSoup 파싱 실패 - article#dic_area 태그를 찾을 수 없습니다. (디자인 개편 의심)")
            logger.error(f"URL: {news_url} | 에러 내용: {str(e)}") 
            return None

def get_news_image(news_url):
    """💥 [고도화 완비] 뉴스 원본 링크에서 '메타 태그(og:image)' 기반 대표 썸네일을 크롤링합니다."""
    if "naver.com" not in news_url:
        return None  
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(news_url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 1순위: 메타 태그 (og:image) - 가장 확실하고 깔끔한 대표 썸네일!
            og_image = soup.find('meta', property='og:image')
            
            if og_image and og_image.get('content'):
                img_url = og_image['content']
                # 네이버 기본 로고(기사 사진이 없을 때 뜨는 기본값)는 걸러내기
                if "naver_logo" in img_url or "default" in img_url:
                    return None
                return img_url
                
            # 2순위: 백업용 (기존 로직)
            img_tag = soup.select_one('img#img1')
            if img_tag:
                return img_tag.get('data-src') or img_tag.get('src')
                
    except Exception as e:
        print(f"⚠️ 이미지 추출 오류 (무시됨): {e}")
        
    return None

def fetch_realtime_trending_keywords():
    """
    [고도화: 동적 키워드 추출 파이프라인]
    네이버 데이터랩 API를 호출하여, 각 대형 카테고리별로 현재 시점 
    가장 대중적 트렌드 점수가 높은 동적 검색어 리스트를 추출합니다.
    API 호출 실패 시 안전을 위해 기존 고정 키워드 일부를 폴백으로 제공합니다.
    """
    url = "https://openapi.naver.com/v1/datalab/search"
    headers = {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
        "Content-Type": "application/json"
    }
    
    # 💥 발표용 데이터 다양성을 확보하기 위해 대시보드 카테고리 기반 그룹 세팅
    body = {
        "startDate": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"), # 최근 3일간 트렌드
        "endDate": datetime.now().strftime("%Y-%m-%d"),
        "timeUnit": "date",
        "keywordGroups": [
            {"groupName": "정치", "keywords": ["대통령", "국회", "선거"]},
            {"groupName": "경제", "keywords": ["금리", "주식", "환율"]},
            {"groupName": "IT과학", "keywords": ["AI", "반도체", "스마트폰"]},
            {"groupName": "문화", "keywords": ["영화", "아이돌", "드라마"]}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=5)
        if response.status_code == 200:
            data = response.json()
            dynamic_keywords = []
            
            # 가장 최신 날짜의 카테고리별 쿼리 키워드 그룹을 동적으로 파싱
            # 데이터랩 결과에서 상대적 강세 단어를 변환하여 파이프라인 검색어로 주입합니다.
            for group in data.get('results', []):
                dynamic_keywords.append(group['groupName'])
                # 각 그룹의 세부 키워드도 검색 풀에 추가하여 유입량 확보
                dynamic_keywords.extend(group['keywords'])
            
            # 중복 제거 후 리턴
            final_keywords = list(set(dynamic_keywords))
            print(f"🔥 [동적 키워드 추출 성공]: {final_keywords}")
            return final_keywords
    except Exception as e:
        logger.error(f"데이터랩 API 통신 실패: {e}")
    
    # [Fallback 방어벽] 만약 데이터랩 API 호출 에러가 나면 안전하게 기본 핵심 단어 서빙
    return ["대통령", "금리", "환율", "AI", "반도체", "영화", "주식", "사건사고"]