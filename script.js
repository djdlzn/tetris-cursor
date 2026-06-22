// ─── 상수 ───────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;

const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// ─── DOM 참조 ───────────────────────────────────────────
const boardElement = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const gameStatusElement = document.getElementById("game-status");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// ─── 게임 상태 ──────────────────────────────────────────
let score = 0;
let isPlaying = false;
let isGameOver = false;
let lockedBoard = createEmptyBoard();
let activePiece = null;
let boardCellElements = [];
let dropIntervalId = null;

// ─── 보드 유틸 ──────────────────────────────────────────

/**
 * 빈 보드 데이터(2차원 배열)를 만듭니다.
 */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => createEmptyRow());
}

/**
 * 빈 행 하나를 만듭니다.
 */
function createEmptyRow() {
  return Array(COLS).fill(null);
}

/**
 * 보드 데이터를 복사합니다.
 */
function copyBoard(boardData) {
  return boardData.map((row) => [...row]);
}

/**
 * 행이 가득 찼는지 확인합니다.
 */
function isRowFull(row) {
  return row.every((cell) => cell !== null);
}

/**
 * 칸이 보드 안에 있는지 확인합니다 (렌더링·고정용).
 */
function isCellInsideBoard(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// ─── DOM 초기화 ─────────────────────────────────────────

/**
 * 보드 DOM에 10x20 칸을 생성합니다.
 */
function initBoardElement() {
  boardElement.innerHTML = "";
  boardCellElements = [];

  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardElement.appendChild(cell);
    boardCellElements.push(cell);
  }
}

// ─── 블록 생성 ──────────────────────────────────────────

/**
 * shape 배열을 복사합니다 (원본 PIECES 오염 방지).
 */
function copyShape(shape) {
  return shape.map((row) => [...row]);
}

/**
 * 새 테트로미노 블록을 생성합니다.
 * @param {string} [type] - 블록 종류 (I, O, T, S, Z, J, L). 생략 시 무작위.
 */
function createPiece(type) {
  const pieceType = type ?? PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const { shape } = PIECES[pieceType];
  const pieceWidth = shape[0].length;

  return {
    type: pieceType,
    shape: copyShape(shape),
    row: 0,
    col: Math.floor((COLS - pieceWidth) / 2),
  };
}

/**
 * shape를 시계 방향 90도 회전합니다.
 */
function rotateShape(shape) {
  const rowCount = shape.length;
  const colCount = shape[0].length;
  const rotated = Array.from({ length: colCount }, () => Array(rowCount).fill(0));

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      rotated[col][rowCount - 1 - row] = shape[row][col];
    }
  }

  return rotated;
}

// ─── 충돌 판정 ──────────────────────────────────────────

/**
 * 이동 가능 여부를 판정합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {number} deltaCol - 열 이동량
 * @param {number} deltaRow - 행 이동량
 * @param {Array<Array<string|null>>} matrix - 고정된 블록이 있는 보드
 */
function canMove(piece, deltaCol, deltaRow, matrix) {
  const nextRow = piece.row + deltaRow;
  const nextCol = piece.col + deltaCol;

  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow++) {
    for (let shapeCol = 0; shapeCol < piece.shape[shapeRow].length; shapeCol++) {
      if (piece.shape[shapeRow][shapeCol] !== 1) {
        continue;
      }

      const targetRow = nextRow + shapeRow;
      const targetCol = nextCol + shapeCol;

      if (targetCol < 0 || targetCol >= COLS || targetRow >= ROWS) {
        return false;
      }

      if (targetRow < 0) {
        continue;
      }

      if (matrix[targetRow][targetCol] !== null) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 스폰 위치에 블록을 둘 수 있는지 확인합니다.
 */
function canSpawnPiece(piece, matrix) {
  return canMove(piece, 0, 0, matrix);
}

// ─── 보드 합성 · 라인 삭제 ──────────────────────────────

/**
 * 보드 데이터에 블록을 합성합니다.
 */
function drawPiece(boardData, piece) {
  const mergedBoard = copyBoard(boardData);

  piece.shape.forEach((shapeRow, shapeRowIndex) => {
    shapeRow.forEach((cell, shapeColIndex) => {
      if (cell !== 1) {
        return;
      }

      const targetRow = piece.row + shapeRowIndex;
      const targetCol = piece.col + shapeColIndex;

      if (isCellInsideBoard(targetRow, targetCol)) {
        mergedBoard[targetRow][targetCol] = piece.type;
      }
    });
  });

  return mergedBoard;
}

/**
 * 가득 찬 줄을 삭제하고 위 블록을 내립니다.
 * @returns {{ board: Array<Array<string|null>>, linesCleared: number }}
 */
function clearFullLines(boardData) {
  let linesCleared = 0;
  const remainingRows = [];

  for (const row of boardData) {
    if (isRowFull(row)) {
      linesCleared++;
    } else {
      remainingRows.push(row);
    }
  }

  while (remainingRows.length < ROWS) {
    remainingRows.unshift(createEmptyRow());
  }

  return { board: remainingRows, linesCleared };
}

// ─── 렌더링 ─────────────────────────────────────────────

/**
 * 합성용 보드 데이터를 만듭니다.
 */
function buildDisplayBoard() {
  return activePiece ? drawPiece(lockedBoard, activePiece) : lockedBoard;
}

/**
 * 보드 데이터를 화면(CSS grid 칸)에 반영합니다.
 */
function renderBoard(boardData) {
  boardData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellIndex = rowIndex * COLS + colIndex;
      const cellElement = boardCellElements[cellIndex];
      cellElement.className = cell ? `cell block-${cell}` : "cell";
    });
  });
}

/**
 * 보드와 현재 블록을 함께 화면에 그립니다.
 */
function refreshDisplay() {
  renderBoard(buildDisplayBoard());
}

// ─── 점수 · 상태 메시지 ─────────────────────────────────

/**
 * 삭제된 줄 수에 따라 점수를 올립니다.
 */
function addScore(linesCleared) {
  if (linesCleared <= 0) {
    return;
  }

  score += LINE_SCORES[linesCleared] ?? linesCleared * 100;
  updateScoreDisplay();
}

/**
 * 점수 표시를 갱신합니다.
 */
function updateScoreDisplay() {
  scoreElement.textContent = String(score);
}

/**
 * 게임 상태 메시지를 표시합니다.
 */
function showGameStatus(message) {
  gameStatusElement.textContent = message;
  gameStatusElement.classList.remove("hidden");
}

/**
 * 게임 상태 메시지를 숨깁니다.
 */
function hideGameStatus() {
  gameStatusElement.textContent = "";
  gameStatusElement.classList.add("hidden");
}

// ─── 블록 조작 ──────────────────────────────────────────

/**
 * 게임이 진행 중이고 조작 가능한 블록이 있는지 확인합니다.
 */
function isActiveGameplay() {
  return isPlaying && activePiece !== null;
}

/**
 * 현재 블록을 이동합니다. 충돌 판정을 통과할 때만 적용합니다.
 */
function tryMovePiece(deltaCol, deltaRow) {
  if (!activePiece || !canMove(activePiece, deltaCol, deltaRow, lockedBoard)) {
    return false;
  }

  activePiece.col += deltaCol;
  activePiece.row += deltaRow;
  return true;
}

/**
 * 현재 블록을 회전합니다. 충돌 시 회전을 취소합니다.
 */
function tryRotatePiece() {
  if (!activePiece) {
    return false;
  }

  const previousShape = copyShape(activePiece.shape);
  activePiece.shape = rotateShape(activePiece.shape);

  if (!canMove(activePiece, 0, 0, lockedBoard)) {
    activePiece.shape = previousShape;
    return false;
  }

  return true;
}

/**
 * 이동 후 화면을 갱신합니다.
 */
function applyMoveAndRefresh(deltaCol, deltaRow) {
  tryMovePiece(deltaCol, deltaRow);
  refreshDisplay();
}

/**
 * 현재 블록을 한 칸 아래로 내리거나, 불가능하면 고정합니다.
 */
function moveDownOrLock() {
  if (canMove(activePiece, 0, 1, lockedBoard)) {
    activePiece.row += 1;
  } else {
    lockPiece();
  }
}

/**
 * 현재 블록을 바닥 또는 장애물까지 즉시 내립니다.
 */
function hardDrop() {
  if (!isActiveGameplay()) {
    return;
  }

  while (canMove(activePiece, 0, 1, lockedBoard)) {
    activePiece.row += 1;
  }

  lockPiece();
  refreshDisplay();
}

// ─── 게임 흐름 ──────────────────────────────────────────

/**
 * 현재 블록을 보드에 고정하고 다음 블록을 준비합니다.
 */
function lockPiece() {
  const boardWithPiece = drawPiece(lockedBoard, activePiece);
  const { board: clearedBoard, linesCleared } = clearFullLines(boardWithPiece);

  lockedBoard = clearedBoard;
  addScore(linesCleared);

  activePiece = createPiece();

  if (!canSpawnPiece(activePiece, lockedBoard)) {
    handleGameOver();
  }
}

/**
 * 현재 블록을 한 칸 아래로 내립니다.
 */
function dropPiece() {
  if (!isActiveGameplay()) {
    return;
  }

  moveDownOrLock();
  refreshDisplay();
}

/**
 * 게임 오버 처리합니다.
 */
function handleGameOver() {
  isPlaying = false;
  isGameOver = true;
  stopDropTimer();
  activePiece = null;
  startBtn.disabled = true;
  restartBtn.disabled = false;
  showGameStatus("게임 오버");
  refreshDisplay();
}

/**
 * 게임을 초기 상태로 되돌립니다.
 */
function resetGame() {
  stopDropTimer();
  score = 0;
  isPlaying = false;
  isGameOver = false;
  lockedBoard = createEmptyBoard();
  activePiece = createPiece();
  updateScoreDisplay();
  hideGameStatus();
  refreshDisplay();
  startBtn.disabled = false;
  restartBtn.disabled = true;
}

/**
 * 게임을 시작합니다.
 */
function startGame() {
  if (isGameOver) {
    return;
  }

  isPlaying = true;
  startBtn.disabled = true;
  restartBtn.disabled = false;
  startDropTimer();
  refreshDisplay();
}

// ─── 타이머 ─────────────────────────────────────────────

/**
 * 자동 낙하 타이머를 시작합니다.
 */
function startDropTimer() {
  stopDropTimer();
  dropIntervalId = setInterval(dropPiece, DROP_INTERVAL_MS);
}

/**
 * 자동 낙하 타이머를 중지합니다.
 */
function stopDropTimer() {
  if (dropIntervalId !== null) {
    clearInterval(dropIntervalId);
    dropIntervalId = null;
  }
}

// ─── 입력 ───────────────────────────────────────────────

/**
 * 키보드 입력을 처리합니다.
 */
function handleKeyDown(event) {
  if (!isActiveGameplay()) {
    return;
  }

  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      applyMoveAndRefresh(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      applyMoveAndRefresh(1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      dropPiece();
      break;
    case "ArrowUp":
      event.preventDefault();
      tryRotatePiece();
      refreshDisplay();
      break;
    case "Space":
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      hardDrop();
      break;
    default:
      break;
  }
}

/**
 * 키보드 조작을 등록합니다. (한 번만 호출)
 */
function initKeyboardControls() {
  document.addEventListener("keydown", handleKeyDown);
}

/**
 * 버튼 이벤트를 등록합니다.
 */
function initButtonControls() {
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", resetGame);
}

// ─── 초기화 ─────────────────────────────────────────────

function initGame() {
  initBoardElement();
  initKeyboardControls();
  initButtonControls();
  activePiece = createPiece();
  refreshDisplay();
}

initGame();
