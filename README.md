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

jk-op / jk-ins / jk-eng 프로젝트가 동일한 PostgreSQL 컨테이너(`jk-auth-postgres`)를 사용합니다.
어느 프로젝트에서든 한 번만 실행하면 됩니다.

```bash
cd docker/auth-db
docker compose up -d
```

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

## 스크립트

| 위치 | 명령 | 설명 |
|------|------|------|
| `frontend/` | `npm run dev` | 개발 서버 |
| `frontend/` | `npm run build` | 프로덕션 빌드 |
| `backend/` | `npm run dev` | 개발 서버 (hot reload) |
| `backend/` | `npm run build` | TypeScript 컴파일 |
| `backend/` | `npm start` | 컴파일된 서버 실행 |
