const express = require('express');
const shortid = require('shortid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {});
// ----------------------------------------------
const { filter_rooms_info, free_colours } = require('./utils/utils');
const { create_game_board, findLastEmptyCell, alternatePlayer, verticalCheck, horizontalCheck, diagonalCheck1, diagonalCheck2, filter_player_name } = require('./utils/game');
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

const PLAYER_COLOURS = ['red', 'yellow', 'black', 'green'];
var GAME_ROOMS = {};
var count = 0;

io.on('connection', socket => {

  socket.on('create-game', player_name => {
    socket.room_id = shortid.generate();
    socket.player_name = player_name;
    GAME_ROOMS[socket.room_id] = {
      id: socket.room_id,
      players: [socket],
      names: [socket.player_name],
      active: false
    };
    socket.join(socket.room_id);
    socket.emit('config-game', PLAYER_COLOURS);
  });

  socket.on('back-to-start', () => {
    delete GAME_ROOMS[socket.room_id];
    socket.join(socket.room_id);
    socket.room_id = '';
    socket.emit('start-screen');
  });

  socket.on('game-mode', ({ game_mode, colour, room_name }) => {
    const room = GAME_ROOMS[socket.room_id];
    room.mode = game_mode;
    room.name = room_name;
    room.colours = [colour];
    room.timer = [];

    room.active = true;
    room.board = [];
    if (game_mode === 'one-player') {
      room.capacity = 1;
      room.board_size = [6, 7];
      room.times = [0, 0];
      socket.emit('next-player');
    } else if (game_mode === 'two-player') {
      room.capacity = 2;
      room.board_size = [6, 7];
      room.times = [0, 0];
      socket.emit('waiting', 1);
    } else if (game_mode === 'four-player') {
      room.capacity = 4;
      room.board_size = [9, 10];
      room.times = [0, 0, 0, 0];
      socket.emit('waiting', 3);
    }
  });

  socket.on('back-to-config', () => {
    socket.emit('config-game', PLAYER_COLOURS);
  });

  socket.on('show-rooms', player_name => {
    socket.player_name = player_name;
    socket.emit('view-rooms', {
      rooms: filter_rooms_info(GAME_ROOMS),
      colours: free_colours(GAME_ROOMS, PLAYER_COLOURS)
    });
  });

  socket.on('join-game', ({ room_id, colour }) => {
    socket.room_id = room_id;
    const room = GAME_ROOMS[room_id];

    room.colours.push(colour);
    room.players.push(socket);
    room.names.push(socket.player_name);

    room.leaderboard = {};
    socket.join(room_id);
    const available = room.capacity - room.players.length;
    if (available === 0) {
      room.board = create_game_board(room.board_size[0], room.board_size[1]);
      room.current_player = room.colours[0];
      io.to(room_id).emit('start-game', {
        board_size: room.board_size,
        current_player: room.current_player,
        players: room.names
      });

      for (var i in room.players) {
        room.players[i].emit('set-colour', {
          colour: room.colours[i],
          player: room.players[i].player_name
        });
      }
      alternateTimer(room, room.names[0]);
    } else {
      io.to(room_id).emit('waiting', available);
    }
  });

  socket.on('add-next-player', next_player_name => {
    const room = GAME_ROOMS[socket.room_id];
    const other_colour = (room.colours[0] === PLAYER_COLOURS[0]) ? PLAYER_COLOURS[1] : PLAYER_COLOURS[0];

    room.names.push(next_player_name);
    room.current_player = room.colours[0];
    room.colours.push(other_colour);
    room.board = create_game_board(room.board_size[0], room.board_size[1]);
    room.leaderboard = {};

    io.to(socket.room_id).emit('start-game', {
      board_size: room.board_size,
      current_player: room.colours[0],
      players: room.names,
    });

    socket.emit('set-colour', {
      colour: room.colours[0],
      player: room.names[0]
    });
    alternateTimer(room, room.names[0]);
  });

  socket.on('add-player', ({ col, colour }) => {
    const room = GAME_ROOMS[socket.room_id];
    var play = colour;

    if (play === room.current_player) {
      const coords = findLastEmptyCell(col, play, room.board_size[0], room.board);

      if (coords !== null) {
        io.to(socket.room_id).emit('update-board', { coords: coords, play: play });

        let game_over_states = [
          horizontalCheck(room.board_size[0], room.board_size[1], room.board),
          verticalCheck(room.board_size[0], room.board_size[1], room.board),
          diagonalCheck1(room.board_size[0], room.board_size[1], room.board),
          diagonalCheck2(room.board_size[0], room.board_size[1], room.board)
        ];

        let is_game_over = game_over_states.find((check) => { return check.success });

        if (is_game_over != undefined) {
          reset_timer(room);
          io.to(socket.room_id).emit('game-over', { winner: play, rows: is_game_over.rows, cols: is_game_over.cols });
        } else {
          alternateTimer(room, room.names[room.colours.indexOf(colour)]);
          room.current_player = alternatePlayer(room.colours, play);
          io.to(socket.room_id).emit('change-current', room.current_player);

          if (room.mode === 'one-player') {
            let index = (colour === room.colours[0]) ? 1 : 0;
            socket.emit('set-colour', {
              colour: room.colours[index],
              player: room.names[index],
            });
          }
        }
      }
    }
  });

  socket.on('update-streak', winner => {
    const room = GAME_ROOMS[socket.room_id];
    if (JSON.stringify(room.leaderboard) != JSON.stringify({})) {
      room.leaderboard[room.names[room.colours.indexOf(winner)]] += 1;
    } else {
      for (var name of room.names) {
        room.leaderboard[name] = 0;
      }
      room.leaderboard[room.names[room.colours.indexOf(winner)]] = 1;
    }
    console.log(room.leaderboard);
    io.to(socket.room_id).emit('leaderboard', room.leaderboard);
  });

  socket.on('restart-game', () => {
    const room = GAME_ROOMS[socket.room_id];
    room.board = create_game_board(room.board_size[0], room.board_size[1]);

    io.to(socket.room_id).emit('start-game', {
      board_size: room.board_size,
      current_player: room.current_player,
      players: room.names
    });

    if (room.mode === 'one-player') {
      socket.emit('set-colour', {
        colour: room.current_player,
        player: room.names[room.colours.indexOf(room.current_player)]
      });

    } else {
      for (var i in room.players) {
        room.players[i].emit('set-colour', {
          colour: room.colours[i],
          player: room.players[i].player_name
        });
      }
    }

    console.log(room.current_player);
    let index = room.colours.indexOf(room.current_player);
    if (index === room.colours.length - 1) {
      index = 0;
    } else if (index === 0) {
      index = room.colours.length - 1;
    } else {
      index = index - 1;
    }
    console.log(index);
    alternateTimer(room, room.names[index]);
  });

  socket.on('leave-game', () => {
    let room = GAME_ROOMS[socket.room_id];
    socket.leave(socket.room_id);

    if (room.mode !== 'one-player') {
      let index = room.players.indexOf(socket);

      room.players.splice(index, 1);
      room.names.splice(index, 1);
      room.colours.splice(index, 1);

      if (room.players.length !== 0) {
        let remaining = room.capacity - room.names.length;
        io.to(socket.room_id).emit('waiting', remaining);
      } else {
        delete GAME_ROOMS[socket.room_id];
      }
    } else {
      delete GAME_ROOMS[socket.room_id];
    }
    socket.emit('start-screen');
  });

  socket.on('disconnect', () => {
    let room = GAME_ROOMS[socket.room_id];
    if (room !== undefined) {
      socket.leave(socket.room_id);
      let index = room.players.indexOf(socket);

      room.players.splice(index, 1);
      room.names.splice(index, 1);
      room.colours.splice(index, 1);

      if (room.players.length === 0) {
        delete GAME_ROOMS[socket.room_id];
      } else {
        let remaining = room.capacity - room.names.length;
        io.to(socket.room_id).emit('waiting', remaining);
      }
    }
  });
});

function reset_timer(room) {
  for (var i in room.times) {
    room.times[i] = 0;
    stopTimer(room.timer[i]);
  }
}

function tick(ROOM, index) {
  ROOM.times[index]++;
  var remain = ROOM.times[index];
  var mins = Math.floor(remain / 6000);
  remain -= mins * 6000;
  var secs = Math.floor(remain / 100);
  remain -= secs * 100;
  var millis = remain;

  mins = (mins < 10) ? `0${mins}` : mins;
  secs = (secs < 10) ? `0${secs}` : secs;
  millis = (millis < 10) ? `0${millis}` : millis;
  ROOM.current_time = `${mins} : ${secs} : ${millis}`;
  if (ROOM.players[0] !== undefined) {
    io.to(ROOM.players[0].room_id).emit('update-time', {
      time: ROOM.current_time,
      play: ROOM.names[index]
    });
  }
}

function alternateTimer(ROOM, player) {
  let i = ROOM.names.indexOf(player);
  if (ROOM.timer.length !== 0) {
    stopTimer(ROOM.timer[i]);
    i++;
    if (ROOM.timer.length < ROOM.times.length) {
      ROOM.timer.push(startTimer(ROOM, i));
    } else {
      if (i === ROOM.timer.length) {
        ROOM.timer[0] = startTimer(ROOM, 0);
      } else {
        ROOM.timer[i] = startTimer(ROOM, i);
      }
    }
  } else {
    ROOM.timer.push(startTimer(ROOM, i));
  }
}

function startTimer(ROOM, index) {
  timer = setInterval(tick, 1, ROOM, index);
  return timer;
}

function stopTimer(timer) {
  clearInterval(timer);
}

server.listen(PORT, () => {
  console.log(`-- Server is running on http://localhost:${PORT}`);
});