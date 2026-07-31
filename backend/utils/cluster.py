# utils/cluster.py
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans


def cluster_news_groups(news_list, n_clusters=5):
    """
    [뉴스 군집화 - 그룹 통째로 반환]
    뉴스 목록을 TF-IDF + K-Means로 묶은 뒤,
    기사가 많이 몰린 군집 순서대로 [[기사,기사,...], [기사,...], ...] 형태로 리턴합니다.
    """
    if not news_list:
        return []

    # 기사 수가 군집 수보다 적으면 각자 1개씩 홀로 서는 그룹으로 처리
    if len(news_list) < n_clusters:
        return [[news] for news in news_list]

    # 1. 뉴스 제목 벡터화
    titles = [news['title'] for news in news_list]
    vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 3))
    tfidf_matrix = vectorizer.fit_transform(titles)

    # 2. K-Means 군집화
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
    cluster_labels = kmeans.fit_predict(tfidf_matrix)

    for idx, label in enumerate(cluster_labels):
        news_list[idx]['cluster_id'] = int(label)

    # 3. 군집별 보도량 카운트 후 내림차순 정렬
    unique_labels, counts = np.unique(cluster_labels, return_counts=True)
    sorted_cluster_indices = np.argsort(-counts)

    # 4. 큰 군집부터 그룹 통째로 담기
    groups = []
    for cluster_idx in sorted_cluster_indices:
        label = unique_labels[cluster_idx]
        members = [news for news in news_list if news.get('cluster_id') == label]
        if members:
            groups.append(members)
        if len(groups) >= n_clusters:
            break

    return groups


def cluster_and_get_top_news(news_list, n_clusters=5):
    """
    [기존 호환용] 각 군집의 대표 기사 1개씩만 뽑아 납작한 리스트로 리턴.
    /api/news/top5 가 이 함수를 그대로 씁니다.
    """
    groups = cluster_news_groups(news_list, n_clusters=n_clusters)
    return [group[0] for group in groups if group]