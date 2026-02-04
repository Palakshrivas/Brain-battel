const socket = io();

// DOM elements
const playerNameInput = document.getElementById('player-name');
const startGameButton = document.getElementById('start-game');
const gameModeSection = document.getElementById('game-mode-section');
const hostButton = document.getElementById('host-button');
const guestButton = document.getElementById('guest-button');
const numPlayersInput = document.getElementById('num-players');
const gameIdInput = document.getElementById('game-id');
const readyButton = document.getElementById('ready-button');
const waitingSection = document.getElementById('waiting-section');
const gameSection = document.getElementById('game-section');
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answer');
const submitButton = document.getElementById('submit');
const scoresList = document.getElementById('scores');
const winnerSection = document.getElementById('winner-section');
const winnerText = document.getElementById('winner');
const restartButton = document.getElementById('restart');
const chatbox = document.getElementById('chatbox');
const messagesDiv = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');
const exitGameButton = document.getElementById('exit-game');
const toggleThemeButton = document.getElementById('toggle-theme');

let playerName = "";
let gameId = "";
let isHost = false;

// Theme Toggle Button - Switch between light and dark mode
toggleThemeButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  const themeColor = isDarkMode ? '#121212' : '#ffffff';
  document.getElementById('theme-color').setAttribute('content', themeColor);
});

// Handle starting game as Host
hostButton.addEventListener('click', () => {
  // Show the name input field and number of players input for the host
  gameModeSection.style.display = 'none';
  document.getElementById('player-name-section').style.display = 'block';
  numPlayersInput.style.display = 'inline-block';
  startGameButton.style.display = 'inline-block';
  isHost = true;
  gameId = '';
});

// Handle starting game as Guest
guestButton.addEventListener('click', () => {
  // Show the name input field and game ID input for the guest
  gameModeSection.style.display = 'none';
  document.getElementById('player-name-section').style.display = 'block';
  gameIdInput.style.display = 'inline-block';
  startGameButton.style.display = 'inline-block';
  isHost = false;
  numPlayersInput.style.display = 'none';
});

// Handle "Start Game" button click for Host or Guest
startGameButton.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();

  if (!playerName) {
    alert("Please enter your name.");
    return;
  }

  if (isHost) {
    const numPlayers = numPlayersInput.value.trim();
    if (!numPlayers) {
      alert("Please enter the number of players.");
      return;
    }
    socket.emit('createGame', playerName, numPlayers);
  } else {
    gameId = gameIdInput.value.trim();
    if (!gameId) {
      alert("Please enter a Game ID.");
      return;
    }
    socket.emit('joinGame', playerName, gameId);
  }
});

// Host creates the game and receives the game ID
socket.on('gameCreated', (id) => {
  gameId = id;
  document.getElementById('game-id-display').textContent = `Game ID: ${gameId}`;
  waitingSection.style.display = 'block';
  document.getElementById('player-name-section').style.display = 'none';
});

// Guest joins the game
socket.on('gameJoined', (id) => {
  gameId = id;
  document.getElementById('game-id-display').textContent = `Joined Game ID: ${gameId}`;
  gameSection.style.display = 'block';
  document.getElementById('player-name-section').style.display = 'none';
});

// Game join failed (Invalid Game ID or Game Full)
socket.on('joinFailed', (message) => {
  alert(message);
  gameModeSection.style.display = 'block';
  document.getElementById('player-name-section').style.display = 'none';
});

// Host and guest get the "Ready" button
readyButton.addEventListener('click', () => {
  socket.emit('readyToStart', gameId);
});

// Game is ready to start
socket.on('gameReady', () => {
  gameSection.style.display = 'block';
  waitingSection.style.display = 'none';
});

// Display the puzzle
socket.on('puzzle', (puzzle) => {
  questionDiv.textContent = puzzle.question;
});

// Handle answer submission
submitButton.addEventListener('click', () => {
  const answer = answerInput.value;
  socket.emit('submit', answer, gameId);
  answerInput.value = '';  // Clear the input field
});

// Update scores
socket.on('updateScores', (players) => {
  scoresList.innerHTML = '';
  for (const player of players) {
    const li = document.createElement('li');
    li.textContent = `${player.name}: ${player.score}`;
    scoresList.appendChild(li);
  }
});

// Handle incorrect answers
socket.on('incorrect', () => {
  alert('Incorrect answer! Try again.');
});

// Show game over and winner
socket.on('gameOver', (winner) => {
  winnerText.textContent = `Winner: ${winner.name}`;
  winnerSection.style.display = 'block';
  gameSection.style.display = 'none';
});

// Restart the game
restartButton.addEventListener('click', () => {
  socket.emit('restart');
  winnerSection.style.display = 'none';
  gameModeSection.style.display = 'block';
  document.getElementById('player-name-section').style.display = 'none';
});

// Chatbox functionality
sendMessageButton.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('chatMessage', message);
    chatInput.value = '';  // Clear input field
  }
});

socket.on('chatMessage', (message) => {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messagesDiv.appendChild(messageElement);
});

// Handle player exit
exitGameButton.addEventListener('click', () => {
  socket.emit('exitGame');
  gameModeSection.style.display = 'block';
  gameSection.style.display = 'none';
});
