import requests
import xml.etree.ElementTree as ET
from konlpy.tag import Okt  # 한국어 형태소 분석기 추가

def get_dynamic_keywords():
    """
    구글 뉴스(한국) 실시간 주요 뉴스 RSS와 KoNLPy 형태소 분석기를 결합하여
    가장 핫한 고유명사/주제어만 정밀하게 추출합니다.
    """
    url = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    keywords = set()
    okt = Okt() # 형태소 분석기 엔진 시동
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        
        # '전날', '입성' 처럼 명사이긴 하지만 검색어로 쓰기엔 애매한 단어들을 차단망에 추가!
        stop_words = {
            '단독', '종합', '속보', '특보', '포토', '기자', '뉴스', '오늘', '내일', '어제', 
            '전날', '입성', '올해', '내년', '시간', '오전', '오후', '하루', '개월', '이유', 
            '누구', '무엇', '어디', '관련', '진행', '예정', '준비', '시작', '종료', '최초',
            '대비', '연속', '돌파', '대신', '수행', '모두'
        }
        
        for item in root.findall(".//item"):
            title = item.find("title")
            if title is not None and title.text:
                text = title.text.strip()
                
                # 💥 [핵심 변경] 정규식이 아니라 AI 형태소 분석기로 '명사(Nouns)'만 빼냅니다.
                nouns = okt.nouns(text)
                
                # 추출된 명사 중 2글자 이상이고, 불용어(stop_words)에 없는 진짜 키워드만 필터링
                valid_words = [w for w in nouns if len(w) >= 2 and w not in stop_words]
                
                keywords.update(valid_words)
                
        # Set을 List로 변환
        keyword_list = list(keywords)
        
        if not keyword_list:
            print("⚠️ [트렌드 탐색기] 키워드 추출 실패. 기본 키워드로 전환합니다.")
            return ["정치", "경제", "IT/과학", "사회/세계", "문화/트렌드", "라이프"]
            
        # 💡 [여기서 개수 조절!] 뽑고 싶은 핫 키워드 개수를 10에서 15 등으로 변경하세요.
        target_count = 10 
        final_keywords = keyword_list[:target_count]
        
        print(f"🔥 [AI 트렌드 탐색 성공] 추출된 정밀 핫 키워드: {final_keywords}")
        return final_keywords
        
    except Exception as e:
        print(f"❌ 실시간 키워드 탐색 에러 발생: {e}")
        return ["정치", "경제", "IT/과학", "사회/세계", "문화/트렌드", "라이프"]