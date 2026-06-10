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

## 시작하기

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
