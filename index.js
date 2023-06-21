require('dotenv').config()
var express = require('express');
const cors = require("cors");
var app = express();
// var server = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

const PORT = process.env.PORT || 3001

var players = {};
var bombs = {};
let index = -1// el primer player cerá 0 el siguiente 1
let isPlaying = false
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {};

app.use(cors({
  origin: '*'
}));
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  if(index===-1) {
    players = {};
    bombs = {};
    scores = {}
    index = -1
    isPlaying = false
  }
  ++index
  const totalLugares = Math.floor(400 / 64)
  const posX = (index) % totalLugares
  const pos = {x: 24+44*(posX), y: 360}

  players[socket.id] = {
    x: pos.x,
    y: pos.y,
    flipX: false,
    index: index,
    type: Object.keys(players).length?'normal':'server',
    playerId: socket.id,
  };
  scores[socket.id] = 0

  // send the players object to the new player
  socket.emit('currentData', {players, bombs, isPlaying});
  // send the star object to the new player
  //socket.emit('starLocation', star);
  // send the current scores
  //socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    delete bombs[socket.id];
    delete scores[socket.id];
    if(!Object.keys(players).length){
      index = -1
    }
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('gameStart', function (data) {
    // emit a message to all players about the player that moved
    if(!isPlaying){
      console.log('Game Start');
      isPlaying = true
      socket.broadcast.emit('gameStarted', {});
    }
    
  });
  socket.on('gameFinish', function (data) {
    // emit a message to all players about the player that moved
    if(isPlaying){
      console.log('Game Finish');
      isPlaying = false

      let results = Object.keys(scores).map( k => {
        return {id: k, name: players[k].index, score: scores[k]}
      })
      
      results.sort((a, b) => b.score - a.score)
      
      socket.broadcast.emit('gameFinished', results);
      socket.emit('gameFinished', results);
    }
  });
  socket.on('gameReset', function (data) {
    // emit a message to all players about the player that moved
    console.log("Game Reset")
    socket.broadcast.emit('gameReboot', {});
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].flipX = movementData.flipX;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('createdBomb', function (bombData) {
    bombs[socket.id] = {x: bombData.x, y: bombData.y, playerId: bombData.playerId}
    // emit a message to all players about the bomb
    socket.broadcast.emit('newBomb', bombs[socket.id]);
  });

  socket.on('bombMovement', function (bombData) {
    bombs[socket.id] = {x: bombData.x, y: bombData.y, playerId: bombData.playerId}
    socket.broadcast.emit('bombMoved', bombs[socket.id]);
  });

  socket.on('starCollected', function () {
    scores[socket.id] +=1
    // io.emit('starLocation', star);
    // io.emit('scoreUpdate', scores);
  });
});

server.listen(PORT, function () {
  console.log(`Listening on ${server.address().port}`);
});
