require('dotenv').config()
var express = require('express');
var app = express();
// var server = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

const PORT = process.env.PORT || 3001

var players = {};
var bombs = {};
let index = -1// el primer player cerá 0 el siguiente 1

var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    flipX: false,
    index: ++index,
    // type: Object.keys(players).length?'normal':'server',
    playerId: socket.id,
  };

  // send the players object to the new player
  socket.emit('currentData', {players, bombs});
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
    if(!Object.keys(players).length){
      index = -1
    }
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
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

  // socket.on('starCollected', function () {
  //   if (players[socket.id].team === 'red') {
  //     scores.red += 10;
  //   } else {
  //     scores.blue += 10;
  //   }
  //   star.x = Math.floor(Math.random() * 700) + 50;
  //   star.y = Math.floor(Math.random() * 500) + 50;
  //   io.emit('starLocation', star);
  //   io.emit('scoreUpdate', scores);
  // });
});

server.listen(PORT, function () {
  console.log(`Listening on ${server.address().port}`);
});
