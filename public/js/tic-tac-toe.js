const socket = io();

// Prompt username & room
const username = prompt("Enter your username:") || "Player";
const room = prompt("Enter room name:") || "default";
socket.emit('joinRoom', { username, room });

const boardEl = document.getElementById('board');
const turnText = document.getElementById('turn');
const winnerOverlay = document.getElementById('winnerOverlay');
const winnerText = document.getElementById('winnerText');

let board = ["","","","","","","","",""];
let currentTurn = "X";
let mySymbol = null;

// Initialize board
function createBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    if (board[i] !== "") cell.classList.add(board[i]);
    cell.textContent = board[i];
    cell.onclick = () => makeMove(i);
    boardEl.appendChild(cell);
  }
}
createBoard();

// Make a move
function makeMove(index) {
  if (mySymbol !== currentTurn) return; // only if it's your turn
  if (board[index] !== "") return;
  board[index] = mySymbol;
  currentTurn = mySymbol === "X" ? "O" : "X";
  socket.emit('ticTacToeMove', { room, board, turn: currentTurn });
  createBoard();
  updateTurn();
  checkWin();
}

// Update turn text
function updateTurn() {
  if (!mySymbol) {
    turnText.textContent = "Waiting for opponent...";
    return;
  }
  turnText.textContent = (mySymbol === currentTurn) ? "Your Turn" : "Opponent's Turn";
}

// Check for win or draw
function checkWin() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const pattern of winPatterns) {
    const [a,b,c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      winnerOverlay.style.display = 'flex';
      winnerText.textContent = `${board[a]} Wins!`;
      return;
    }
  }
  if (!board.includes("") && winnerOverlay.style.display === 'none') {
    winnerOverlay.style.display = 'flex';
    winnerText.textContent = `Draw!`;
  }
}

// Rematch
document.getElementById('rematchBtn').onclick = () => {
  board = ["","","","","","","","",""];
  currentTurn = "X";
  winnerOverlay.style.display = 'none';
  createBoard();
  updateTurn();
  socket.emit('ticTacToeMove', { room, board, turn: currentTurn });
}

// Socket events
socket.on('symbolAssignment', symbol => { mySymbol = symbol; updateTurn(); });
socket.on('updateBoard', (newBoard, turn) => { 
  board = newBoard; 
  currentTurn = turn; 
  createBoard(); 
  updateTurn(); 
});
