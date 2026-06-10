# jk-eng

엔지니어링(engineering) 관련 프론트엔드·백엔드 모노레포입니다.

## 구조

```
jk-eng/
├── frontend/   # Next.js (React)
└── backend/    # Node.js (Express + TypeScript)
```

## 사전 요구사항

- Node.js 20+
- npm
- Docker Desktop (공유 로그인 DB)

## 시작하기

### 0. 공유 로그인 DB 실행

jk-op / jk-ins / jk-eng이 동일한 PostgreSQL 컨테이너(`jk-auth-postgres`)를 공유합니다.
세 레포 중 **어느 것의 `docker/auth-db`에서 실행해도 되며**, 한 번만 기동하면 됩니다.

```bash
cd docker/auth-db   # 이 레포(jk-eng) 루트 기준
docker compose up -d
```

> 레포를 나란히 클론해 둔 경우에도, 각 레포 안의 `docker/auth-db`로 이동하면 됩니다.  
> 절대 경로는 환경마다 다를 수 있으므로, 항상 **현재 레포 루트에서** 위 명령을 실행하세요.

DB: `jk_auth` (포트 5432)  
테이블: `users`, `user_app_access`

### 1. 환경 변수 설정

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

API: http://localhost:4000  
헬스체크: http://localhost:4000/health  
인증 API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

앱: http://localhost:3000  
로그인: http://localhost:3000/login

**개발자 계정:** `admin` / `admin123`

## 스크립트

| 위치 | 명령 | 설명 |
|------|------|------|
| `frontend/` | `npm run dev` | 개발 서버 |
| `frontend/` | `npm run build` | 프로덕션 빌드 |
| `backend/` | `npm run dev` | 개발 서버 (hot reload) |
| `backend/` | `npm run build` | TypeScript 컴파일 |
| `backend/` | `npm start` | 컴파일된 서버 실행 |
