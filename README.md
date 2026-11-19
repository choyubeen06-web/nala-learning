# NALA — Vercel 배포 패키지

학생 공간 · 관리자 탭 · 이론 수업 · 화상 멘토링(Google Meet)을 하나로 합친 프로토타입입니다.

```
nala-vercel/
├── index.html        # 앱 전체 (정적 페이지)
├── api/state.js      # 공유 저장소 API (Vercel 서버리스 함수 + Upstash Redis)
└── package.json
```

## 1. 배포하기 (둘 중 하나)

### 방법 A — Vercel CLI (가장 빠름)
Node.js가 설치된 컴퓨터에서 이 폴더로 이동한 뒤:

```bash
npx vercel          # 처음 한 번: 로그인 → 프로젝트 생성 (질문은 모두 기본값 Enter)
npx vercel --prod   # 운영 주소로 배포
```

빌드 설정은 필요 없어요. Framework Preset은 **Other**로 두면 됩니다.

### 방법 B — GitHub 연결
1. 이 폴더를 GitHub 저장소로 올립니다.
2. vercel.com → **Add New… → Project** → 저장소 선택 → **Deploy**.
3. 이후에는 `git push`할 때마다 자동으로 다시 배포돼요.

## 2. 실시간 연동 켜기 (관리자 ↔ 학생 기기 간)

저장소를 연결하지 않으면 데이터가 **각 브라우저에만** 저장돼요. 이 경우 관리자가 짠 계획이 다른 기기의 학생 화면에 뜨지 않아요.

1. Vercel 프로젝트 → **Storage** 탭 → **Upstash for Redis** (Marketplace) → 무료 플랜으로 생성 → 이 프로젝트에 연결.
   - 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경 변수가 자동으로 추가돼요.
2. **Deployments → 최신 배포 → Redeploy** 로 한 번 다시 배포합니다.
3. 사이트를 열면 처음 한 번 “Start with demo data / Start empty” 화면이 나와요. 하나를 고르면 그때부터 모든 기기가 같은 데이터를 봐요.
   왼쪽 아래 상태가 **Live sync on** 이면 연결된 거예요. 다른 기기의 변경은 몇 초 안에 반영돼요.

> 이미 다른 Upstash Redis가 있다면 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 변수 이름도 인식해요.
> 여러 사이트가 같은 Redis를 쓴다면 `NALA_KEY` 변수로 저장 키를 구분할 수 있어요 (기본값 `nala:docs`).

## 3. 배포 후 할 일
- **Google Meet 링크 등록:** Admin → Learners → Profile에서 학생별 고정 화상방 링크를 넣거나, 세션마다 링크를 넣으세요.
- **수업 영상:** Admin → Lesson library에서 YouTube 링크를 넣으면 Vercel에서는 수업 화면 안에서 바로 재생돼요.

## 4. 운영 전 주의
- **로그인 기능이 없어요.** 사이트 주소를 아는 사람은 누구나 학생·관리자 화면을 열고 데이터를 바꿀 수 있어요. 실제 학생과 운영하기 전에는 계정 로그인(예: Clerk, Auth.js)과 역할별 권한, 보호자 동의 절차가 필요해요.
- 실제 학생 개인정보는 넣지 말고, 데모나 내부 테스트 용도로 쓰세요.
