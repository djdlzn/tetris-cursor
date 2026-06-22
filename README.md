# 테트리스 (교육용)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 동작하며, 입문자가 게임 로직과 DOM 렌더링을 학습하기 위한 프로젝트입니다.

## 실행 방법

### 로컬에서 실행

1. 이 저장소를 클론하거나 폴더를 에디터에서 엽니다.
2. `index.html`을 브라우저에서 엽니다.
   - 파일 탐색기에서 `index.html` 더블클릭
   - 또는 주소창에 경로 입력 (예: `file:///C:/DEV/tetris-cursor/index.html`)
3. **시작** 버튼을 누른 뒤 키보드로 플레이합니다.

> 설치·빌드 과정이 필요 없습니다.

### GitHub Pages에서 실행

배포가 완료되면 아래 주소 형식으로 접속합니다.

```
https://<GitHub-사용자명>.github.io/<저장소-이름>/
```

예: 사용자명이 `myuser`, 저장소가 `tetris-cursor`인 경우

```
https://myuser.github.io/tetris-cursor/
```

## 조작법

게임 **시작** 후 키보드를 사용합니다.

| 키 | 동작 |
|----|------|
| `←` (ArrowLeft) | 왼쪽 이동 |
| `→` (ArrowRight) | 오른쪽 이동 |
| `↓` (ArrowDown) | 한 칸 빠르게 내리기 (soft drop) |
| `↑` (ArrowUp) | 회전 (충돌 시 취소) |
| `Space` | 즉시 낙하 (hard drop) |

- **시작** 전에는 키 입력이 적용되지 않습니다.
- 모든 이동·회전은 `canMove()` 충돌 판정을 통과할 때만 적용됩니다.

## 구현 기능

| 기능 | 설명 |
|------|------|
| 게임 보드 | 10열 × 20행, CSS Grid 렌더링 |
| 테트로미노 | I, O, T, S, Z, J, L 7종 |
| 자동 낙하 | 0.8초 간격으로 1칸 하강 |
| 충돌 판정 | 벽·바닥·고정 블록 검사 (`canMove`) |
| 블록 고정 | 착지 시 보드에 합성 후 새 블록 스폰 |
| 줄 삭제 | 가득 찬 가로줄 제거 후 위 블록 하강 |
| 점수 | 삭제 줄 수에 따라 가산 (아래 표 참고) |
| 키보드 조작 | 좌우 이동, 회전, soft/hard drop |
| 게임 오버 | 새 블록 스폰 불가 시 종료 |
| 재시작 | 보드·점수·타이머·상태 초기화 |

### 점수 규칙

| 한 번에 삭제한 줄 | 점수 |
|------------------|------|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

### 게임 오버 · 재시작

1. 스폰 위치에 블록을 둘 수 없으면 **게임 오버**가 표시됩니다.
2. **재시작**으로 보드·점수·타이머·상태를 초기화합니다.
3. **시작**을 다시 눌러 플레이를 재개합니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 화면 구조 (보드, 점수, 버튼, 조작법) |
| `style.css` | 레이아웃 및 스타일 |
| `script.js` | 게임 로직 |
| `.nojekyll` | GitHub Pages Jekyll 처리 비활성화 |

## 품질 점검 방법

배포 전 아래 항목을 순서대로 확인합니다.

1. **파일 연결** — `index.html`을 열고 보드·스타일·동작이 정상인지 확인
2. **콘솔** — F12 → Console 탭에 에러가 없는지 확인
3. **게임 흐름** — 시작 → 낙하 → 이동/회전 → 줄 삭제 → 점수 증가
4. **게임 오버** — 보드를 쌓아 스폰 불가 상태에서 종료 메시지 확인
5. **재시작** — 재시작 → 시작 후 초기 상태로 복귀하는지 확인
6. **키보드** — 시작 전 입력 무시, Space 연타 시 hard drop 1회만 동작

## GitHub Pages 배포 방법

### 1. Git 저장소 준비

```bash
git init
git add index.html style.css script.js README.md .gitignore .nojekyll
git commit -m "Prepare Tetris game for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소-이름>.git
git push -u origin main
```

### 2. GitHub Pages 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` / `/ (root)`
4. **Save** 클릭

### 3. 배포 확인

- 1~2분 후 `https://<사용자명>.github.io/<저장소-이름>/` 접속
- 게임 보드 표시, **시작** 후 플레이 가능 여부 확인
- 브라우저 콘솔에 에러가 없는지 확인

## 라이선스

교육용 예제 프로젝트입니다.
