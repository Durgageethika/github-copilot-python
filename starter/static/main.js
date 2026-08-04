// Client-side rendering and interaction for the Flask-backed Sudoku
let hintsUsed = 0;
let seconds = 0;
let timerInterval = null;
const SIZE = 9;
let puzzle = [];

// --- Simple sound manager using Web Audio API ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, duration = 0.06, type = 'sine', when = 0) {
  try {
    ensureAudioCtx();
    const now = audioCtx.currentTime + when;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + duration + 0.02);
  } catch (err) {
    // silence failures (e.g., AudioContext not allowed)
    console.debug('Audio error', err);
  }
}

function playMoveSound() {
  // Pleasant short two-tone click
  playTone(880, 0.04, 'sine');
  playTone(1320, 0.04, 'sine', 0.05);
}

function playErrorSound() {
  // Low buzzy tone
  playTone(220, 0.12, 'sawtooth');
}

function playHintSound() {
  playTone(1100, 0.05, 'triangle');
  playTone(1400, 0.06, 'triangle', 0.06);
}

function playWinSound() {
  playTone(880, 0.06, 'sine');
  playTone(1320, 0.06, 'sine', 0.06);
  playTone(1760, 0.08, 'sine', 0.12);
}


function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      // Add alternating 3x3 box background class based on box coordinates
      const boxRow = Math.floor(i / 3);
      const boxCol = Math.floor(j / 3);
      if ((boxRow + boxCol) % 2 === 0) {
        input.classList.add('box-alt');
      }
    input.addEventListener('input', (e) => {

    const val = e.target.value.replace(/[^1-9]/g, '');

    e.target.value = val;

    e.target.classList.remove('cell-anim');
    e.target.offsetWidth;
    e.target.classList.add('cell-anim');

    setTimeout(() => {
      e.target.classList.remove('cell-anim');
    }, 300);

    validateBoard();

    // Play a move sound when the user enters a valid number
    if (val !== '') {
      playMoveSound();
    }

  });
      input.addEventListener('focus', (e) => {
        e.target.classList.add('cell-focus');
      });
      input.addEventListener('blur', (e) => {
        e.target.classList.remove('cell-focus');
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

function startTimer() {

    clearInterval(timerInterval);

    seconds = 0;

    updateTimer();

    timerInterval = setInterval(() => {

        seconds++;

        updateTimer();

    }, 1000);

}

function updateTimer() {

    const min = String(Math.floor(seconds / 60)).padStart(2, '0');

    const sec = String(seconds % 60).padStart(2, '0');

    document.getElementById("timer").innerText =
        `Time: ${min}:${sec}`;

}

async function newGame() {

  const difficulty = document.getElementById('difficulty').value;

  const res = await fetch('/new?difficulty=' + difficulty);

  const data = await res.json();

  renderPuzzle(data.puzzle);

  document.getElementById('message').innerText = '';
  hintsUsed = 0;
  startTimer();

  // small sound on new game
  try { playTone(600, 0.04, 'sine'); playTone(800, 0.04, 'sine', 0.05); } catch (e) {}

}

async function getHint() {

    const res = await fetch("/hint");

    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    hintsUsed++;

    const index = data.row * SIZE + data.col;

    const inputs = document
        .getElementById("sudoku-board")
        .getElementsByTagName("input");

    inputs[index].value = data.value;

    inputs[index].disabled = true;

    inputs[index].classList.add("prefilled");
    inputs[index].classList.add("reveal");
    setTimeout(() => inputs[index].classList.remove("reveal"), 400);

    // play hint sound
    try { playHintSound(); } catch (e) {}

}

function validateBoard() {

    const inputs = document
        .getElementById("sudoku-board")
        .getElementsByTagName("input");

    for (let i = 0; i < inputs.length; i++) {

        if (!inputs[i].disabled) {

            inputs[i].classList.remove("incorrect");

        }

    }

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const index = row * SIZE + col;

            const current = inputs[index];

            if (current.disabled) continue;

            const value = current.value;

            if (value === "") continue;

            // Check row
            for (let c = 0; c < SIZE; c++) {

                if (c === col) continue;

                const other = inputs[row * SIZE + c];

                if (other.value === value) {

                    current.classList.add("incorrect");

                    other.classList.add("incorrect");

                }

            }

            // Check column
            for (let r = 0; r < SIZE; r++) {

                if (r === row) continue;

                const other = inputs[r * SIZE + col];

                if (other.value === value) {

                    current.classList.add("incorrect");

                    other.classList.add("incorrect");

                }

            }

            // Check 3×3 box
            const startRow = Math.floor(row / 3) * 3;

            const startCol = Math.floor(col / 3) * 3;

            for (let r = startRow; r < startRow + 3; r++) {

                for (let c = startCol; c < startCol + 3; c++) {

                    if (r === row && c === col) continue;

                    const other = inputs[r * SIZE + c];

                    if (other.value === value) {

                        current.classList.add("incorrect");

                        other.classList.add("incorrect");

                    }

                }

            }

        }

    }

}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    saveScore();
    msg.innerText = 'Congratulations! You solved it!';
    clearInterval(timerInterval);
    try { playWinSound(); } catch (e) {}
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
    try { playErrorSound(); } catch (e) {}
  }
}

function saveScore() {

    const player =
        document.getElementById("player-name").value || "Anonymous";

    const difficulty =
        document.getElementById("difficulty").value;

    let scores =
        JSON.parse(localStorage.getItem("scores")) || [];

    scores.push({

        player: player,

        time: seconds,

        difficulty: difficulty,

        hints: hintsUsed

    });

    scores.sort((a, b) => a.time - b.time);

    scores = scores.slice(0, 10);

    localStorage.setItem("scores", JSON.stringify(scores));

    loadLeaderboard();

}

function loadLeaderboard() {

    const tbody =
        document.querySelector("#leaderboard tbody");

    tbody.innerHTML = "";

    const scores =
        JSON.parse(localStorage.getItem("scores")) || [];

    scores.forEach((score, index) => {

        tbody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${score.player}</td>
            <td>${score.time}s</td>
            <td>${score.difficulty}</td>
            <td>${score.hints}</td>
        </tr>`;
    });

}

// Wire buttons
window.addEventListener('load', () => {

    document.getElementById('new-game').addEventListener('click', newGame);

    document.getElementById('hint-button').addEventListener('click', getHint);

    document.getElementById('check-solution').addEventListener('click', checkSolution);

    newGame();
    loadLeaderboard();
    document.getElementById("dark-mode")
.addEventListener("click", () => {

    document.body.classList.toggle("dark");

});

});