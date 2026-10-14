// src/services/demoAuth.js
//
// 공개 데모용 닉네임 로그인.
// 원래는 백엔드 users 테이블(GET /api/check-nickname, POST /api/login)이
// 닉네임을 등록하고 user_id 를 돌려줬지만, 데모에서는 서버 없이
// 브라우저 localStorage 에 같은 규칙으로 보관한다.
//
//   - 닉네임마다 1부터 증가하는 user_id 를 부여하고 계속 같은 값을 재사용한다
//     (백엔드 get_or_create_user 와 동일한 동작)
//   - 즐겨찾기는 사용자별 키 news_bookmarks_{user_id} 에 저장된다
//   - 기기/브라우저 사이 동기화는 되지 않는다 (서버가 없으므로)

const USER_REGISTRY_KEY = "demo_users";

function readRegistry() {
  try {
    const raw = localStorage.getItem(USER_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  try {
    localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    /* 저장 공간이 막혀 있어도 로그인 자체는 진행한다 */
  }
}

/** 이미 이 브라우저에서 쓴 적 있는 닉네임인지 (GET /api/check-nickname 대응) */
export function isExistingNickname(username) {
  const name = String(username || "").trim();
  if (!name) return false;
  return Object.prototype.hasOwnProperty.call(readRegistry(), name);
}

/** 닉네임으로 로그인/가입 (POST /api/login 대응) */
export function loginWithNickname(username) {
  const name = String(username || "").trim();
  if (!name) throw new Error("닉네임을 입력해주세요.");

  const registry = readRegistry();
  const isNew = !Object.prototype.hasOwnProperty.call(registry, name);

  if (isNew) {
    const maxId = Object.values(registry).reduce(
      (max, id) => (Number(id) > max ? Number(id) : max),
      0
    );
    registry[name] = maxId + 1;
    writeRegistry(registry);
  }

  const userId = registry[name];
  localStorage.setItem("user_id", String(userId));
  localStorage.setItem("username", name);

  return { user_id: userId, username: name, isNew };
}
