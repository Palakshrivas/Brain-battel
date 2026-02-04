const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Game state
let games = {};

// Questions for the game
let questions = [
  { question: 'Enter next to start', answer: 'next' },
  { question: 'REGULAR is to RALUGER as 90210 is to:', answer: '01209' },
  { question: 'If HISTORY = HIORSTY, then 4623581 = ?', answer: '12345678' },
  { question: 'I am an odd number. Take away one letter, and I become even. What am I?', answer: 'seven' },
  { question: 'I am a three-digit number. My tens digit is five more than my ones digit...', answer: '194' },
  { question: 'Forward, I am heavy. But backward, I’m not. What am I?', answer: 'ton' }
];

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add the player to the game
  let currentGame = null;

  // Host creates a new game
  socket.on('createGame', (playerName, numPlayers) => {
    const gameId = Math.random().toString(36).substr(2, 6);
    currentGame = gameId;
    games[gameId] = {
      host: { id: socket.id, name: playerName },
      players: [{ id: socket.id, name: playerName, score: 0 }],
      numPlayers: parseInt(numPlayers),
      isReady: false
    };

    socket.emit('gameCreated', gameId);
    console.log(`Game created with ID: ${gameId}`);
  });

  // Guest joins the game
  socket.on('joinGame', (playerName, gameId) => {
    if (!games[gameId]) {
      socket.emit('joinFailed', 'Invalid Game ID.');
      return;
    }

    const game = games[gameId];
    if (game.players.length >= game.numPlayers) {
      socket.emit('joinFailed', 'Game is full.');
      return;
    }

    game.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.emit('gameJoined', gameId);

    // If all players are ready, start the game
    if (game.players.length === game.numPlayers) {
      io.emit('gameReady');
    }
  });

  // Player is ready to start the game
  socket.on('readyToStart', (gameId) => {
    const game = games[gameId];
    game.isReady = true;
    io.emit('gameReady');
  });

  // Handle puzzle submissions
  socket.on('submit', (answer, gameId) => {
    const game = games[gameId];
    const player = game.players.find(player => player.id === socket.id);
    const currentQuestion = questions[player.score];

    if (answer === currentQuestion.answer) {
      player.score++;
      if (player.score < questions.length) {
        socket.emit('puzzle', questions[player.score]);
      } else {
        io.emit('gameOver', game.players.reduce((prev, current) => (prev.score > current.score ? prev : current)));
      }
    } else {
      socket.emit('incorrect');
    }
  });

  // Handle exit
  socket.on('exitGame', () => {
    if (currentGame) {
      const game = games[currentGame];
      game.players = game.players.filter(player => player.id !== socket.id);
      delete games[currentGame];
    }
    socket.emit('gameExited');
  });

  // Handle chat message
  socket.on('chatMessage', (message) => {
    io.emit('chatMessage', `${socket.id}: ${message}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (currentGame) {
      const game = games[currentGame];
      game.players = game.players.filter(player => player.id !== socket.id);
    }
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
