# jk-eng

엔지니어링(engineering) 관련 프론트엔드·백엔드 모노레포입니다.

## 구조

```
jk-eng/
├── package.json   # 루트 — npm install / npm run dev
├── backend/       # Express API
└── frontend/      # Next.js
```

## 사전 요구사항

- Node.js 20+
- npm
- Docker Desktop (공유 PostgreSQL)

## 공유 데이터베이스

**jk-op / jk-ins / jk-eng은 PostgreSQL 데이터베이스 하나(`jk_auth`)를 공유합니다.**  
로그인(`users`, `user_app_access`)뿐 아니라, 이후 추가하는 업무 테이블도 모두 이 DB에 넣습니다.

| 항목            | 값                                          |
| --------------- | ------------------------------------------- |
| 컨테이너        | `jk-auth-postgres` (한 번만 실행)           |
| DB 이름         | `jk_auth`                                   |
| 접속 URL        | `postgresql://jk:jk@localhost:5432/jk_auth` |
| 프로젝트별 구분 | `APP_CODE` — `op` / `ins` / `eng`           |

세 백엔드의 `backend/.env`에 **동일한 `DATABASE_URL`** 이 설정되어 있어야 합니다.

## 시작하기

이 레포를 클론한 뒤, **레포 루트에서** 아래 순서대로 각 폴더로 이동해 실행합니다.

### 0. 공유 DB 실행

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

### 1. 설치 및 실행 (레포 루트)

```bash
npm install          # backend + frontend 한 번에 설치
npm run dev          # API(4000) + 웹(3000) 동시 실행
```

`npm run dev` 실행 시 `.env` 파일이 없으면 자동으로 example에서 복사됩니다.

| 서비스      | URL                          |
| ----------- | ---------------------------- |
| 웹 (로그인) | http://localhost:3000/login  |
| API         | http://localhost:4000        |
| 헬스체크    | http://localhost:4000/health |

**개발자 계정:** `admin` / `admin123`

## Git 브랜치

| 브랜치 | 용도             |
| ------ | ---------------- |
| `main` | 배포 기준 브랜치 |

`main`에 push하거나 PR을 열면 GitHub Actions CI가 빌드를 실행합니다.
| `develop` | 통합 개발 브랜치 |
| `dev/jin` | jin 개발 브랜치 |
| `dev/jun` | jun 개발 브랜치 |
| `dev/park` | park 개발 브랜치 |

```bash
git checkout dev/jin          # 본인 브랜치로 전환
# ... 작업 후 ...
git add .
git commit -m "feat: 변경 내용"
git push origin dev/jin
```

`main`, `develop`을 제외한 브랜치에 **push하면 GitHub Actions가 `develop` 대상 PR을 생성하고, 충돌이 없으면 squash merge까지 진행**합니다.  
충돌이 있으면 PR만 열리고 머지는 되지 않습니다.

> **GitHub Actions 설정 (필수)**  
> Settings → Actions → General → Workflow permissions에서
>
> - **Read and write permissions** 선택
> - **Allow GitHub Actions to create and approve pull requests** 체크
>
> Private 레포 + Free 플랜에서는 **Allow auto-merge**를 쓸 수 없으므로, 워크플로가 merge API로 직접 머지합니다.

## 스크립트 (레포 루트)

| 명령                 | 설명                            |
| -------------------- | ------------------------------- |
| `npm install`        | backend + frontend 의존성 설치  |
| `npm run dev`        | API + 웹 개발 서버 동시 실행    |
| `npm run build`      | backend + frontend 빌드         |
| `npm run setup`      | `.env` 파일 수동 생성           |
| `npm run db:migrate` | jk-eng 업무 테이블 마이그레이션 |

## 첨부파일 저장 (배포 대비)

업무에서 올리는 파일은 **DB에 바이너리를 저장하지 않습니다.**  
메타데이터는 PostgreSQL, 실제 파일은 **서버 디스크**에 저장됩니다.

| 구분      | 저장 위치                                 | 내용                               |
| --------- | ----------------------------------------- | ---------------------------------- |
| 파일 메타 | `eng_stored_files`                        | 원본 파일명, 저장 경로, MIME, 용량 |
| 실제 파일 | `UPLOAD_DIR/eng/{entityType}/{entityId}/` | jpg, png, pdf 등                   |

### 로컬 개발

- 기본 저장 경로: `backend/uploads/` (`.gitignore` 대상)
- 조회/다운로드: `GET /api/files/:id` (관리자 JWT 필요)
- `/uploads/eng/` **직접 URL 접근 불가** (API 경유)

### 가비아 클라우드 배포 시

1. **PostgreSQL** — `DATABASE_URL` 설정
2. **파일 저장소** — Git 밖 영구 디렉터리 지정
   ```env
   UPLOAD_DIR=/var/data/jk-eng/uploads
   ```
3. **백업** — DB와 `UPLOAD_DIR`을 **함께** 백업
4. **프론트** — `NEXT_PUBLIC_API_URL`을 배포 API 주소로 설정

배포 후 마이그레이션: `npm run db:migrate` (또는 API 기동 시 자동 실행)
