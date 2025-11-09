const socket = io();

// Prompt username & room
const username = prompt("Enter your username:") || "Player";
const room = prompt("Enter room name:") || "default";
socket.emit('joinRoom', { username, room });

const boardEl = document.getElementById('board');
const turnText = document.getElementById('turn');
const winnerOverlay = document.getElementById('winnerOverlay');
const winnerText = document.getElementById('winnerText');

let board = Array(8).fill(null).map(()=>Array(8).fill(null));
let pieces = []; // track pieces
let selectedPiece = null;
let currentTurn = 'red';
let myColor = null;

// Create board grid
for(let row=0; row<8; row++){
  for(let col=0; col<8; col++){
    const square = document.createElement('div');
    square.classList.add('square');
    (row+col)%2===1 ? square.classList.add('dark') : square.classList.add('light');
    square.dataset.row = row; square.dataset.col = col;
    boardEl.appendChild(square);
  }
}

// Helper: place a piece
function createPiece(color, row, col, king=false){
  const piece = document.createElement('div');
  piece.classList.add('piece', color);
  piece.style.top = `${row*12.5}%`;
  piece.style.left = `${col*12.5}%`;
  piece.color = color; piece.row = row; piece.col = col; piece.king = king;
  piece.textContent = king ? "👑" : "";
  piece.onclick = () => {
    if(piece.color === myColor && currentTurn===myColor){
      selectedPiece = piece;
      highlightMoves(piece);
    }
  }
  boardEl.appendChild(piece);
  pieces.push(piece);
}

// Highlight legal moves
function highlightMoves(piece){
  clearHighlights();
  const dirs=[];
  if(piece.color==='red'||piece.king) dirs.push([-1,-1],[-1,1]);
  if(piece.color==='black'||piece.king) dirs.push([1,-1],[1,1]);

  dirs.forEach(([dr,dc])=>{
    const r = piece.row + dr;
    const c = piece.col + dc;
    if(r>=0 && r<8 && c>=0 && c<8 && !getPiece(r,c)){
      const square = boardEl.children[r*8 + c];
      square.classList.add('highlight');
      square.onclick = ()=> movePiece(piece,r,c);
    }
  });
}

// Clear highlights
function clearHighlights(){
  document.querySelectorAll('.highlight').forEach(s=>{
    s.classList.remove('highlight');
    s.onclick=null;
  });
}

// Get piece at position
function getPiece(row,col){ return pieces.find(p=>p.row===row && p.col===col); }

// Move piece
function movePiece(piece,row,col){
  piece.row=row; piece.col=col;
  piece.style.top = `${row*12.5}%`;
  piece.style.left = `${col*12.5}%`;
  selectedPiece = null;
  clearHighlights();
  socket.emit('draftMove',{room, boardUpdate:{row, col, color:piece.color, king:piece.king}});
  switchTurn();
}

// Switch turn
function switchTurn(){
  currentTurn = currentTurn==='red'?'black':'red';
  updateTurnText();
}

// Update turn
function updateTurnText(){
  turnText.textContent = (myColor===currentTurn)? "Your Turn" : "Opponent's Turn";
}

// Socket events
socket.on('assignColor', color => {
  myColor = color;
  currentTurn = "red";
  updateTurnText();
  initPieces();
});

socket.on('updateBoard', data => {
  // Update positions from opponent
  const {row, col, color, king} = data;
  const piece = getPiece(row,col);
  if(piece){
    piece.row=row; piece.col=col;
    piece.style.top = `${row*12.5}%`;
    piece.style.left = `${col*12.5}%`;
  }
  switchTurn();
});

socket.on('gameOver', winnerColor => {
  winnerOverlay.style.display='flex';
  winnerText.textContent=`${winnerColor.toUpperCase()} Wins! 🎉`;
});

function initPieces(){
  // Only initialize pieces once
  if(pieces.length>0) return;
  for(let row=0; row<3; row++) for(let col=0; col<8; col++) if((row+col)%2===1) createPiece('black',row,col);
  for(let row=5; row<8; row++) for(let col=0; col<8; col++) if((row+col)%2===1) createPiece('red',row,col);
}

// Rematch & Exit
document.getElementById('rematchBtn').onclick = ()=>{ location.reload(); }
document.getElementById('exitBtn').onclick = ()=>{ window.close(); }
