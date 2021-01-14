const express = require('express');
const shortid = require('shortid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {});
// ----------------------------------------------
const { filter_rooms_info, free_colours } = require('./utils/utils');
const { create_game_board, find_last_empty_cell, alternate_player, vertical_check, horizontal_check, diagonal_check_1, diagonal_check_2, filter_player_name } = require('./utils/game');
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

// I needed a variable to tell all the colours and this is that.
const PLAYER_COLOURS = ['red', 'yellow', 'black', 'green'];

// this stores all the games, basically the temporary database 
var GAME_ROOMS = {};

io.on('connection', socket => {
  
  // this creates the game for the players after is enters
  // their names and clicks create game button on the start
  // page [client side]
  socket.on('create-game', player_name => {
    
    socket.room_id = shortid.generate();
    socket.player_name = player_name;
    
    GAME_ROOMS[socket.room_id] = {
      id: socket.room_id,           // uniquely identifies every game
      players: [socket],            // list of players (sockets)
      names: [socket.player_name],  // list of player's names
      ids: [shortid.generate()],    // list of player's id
      is_first_played: true,        // indicates if the game is played already
      active: false                 // indicates if game can be viewed in the game room list's
    };

    // this addes the player creating the game to the actual room 
    socket.join(socket.room_id);

    // this changes the client side to the page where
    // they can enter the rest of  information about
    // the game [such as name, colour, and mode]
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
    
    room.mode = game_mode;    // this cam be either 'one-player', 'two-player', 'four-player'
    room.name = room_name;   
    room.colours = [colour];  
    room.timer = [];          // stores all the timer function so I can stop them whenever I need to
    room.active = true;       // show the game in the game room listing
    room.board = [];

    if (game_mode === 'one-player') {
      room.capacity = 1;
      room.board_size = [6, 7];
      room.times = [0, 0];
      // this gets name of the next player 
      socket.emit('next-player');           
    } else if (game_mode === 'two-player') {
      room.capacity = 2;
      room.board_size = [6, 7];
      room.times = [0, 0];
      // this changes the client side to the waiting
      // screen which tell how many player are left
      // for the game to start
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

    // this sends all the information about the active games to the client side
    socket.emit('view-rooms', {
      rooms: filter_rooms_info(GAME_ROOMS),
      colours: free_colours(GAME_ROOMS, PLAYER_COLOURS)
    });
  });

  socket.on('join-game', ({ room_id, colour }) => {
    socket.room_id = room_id;           // gives the other players the room's id
    const room = GAME_ROOMS[room_id];

    room.colours.push(colour);
    room.players.push(socket);
    room.names.push(socket.player_name);
    room.ids.push(shortid.generate());
    room.leaderboard = {};

    socket.join(room_id);
    
    const available = room.capacity - room.players.length;
    
    // there are no nore players 
    if (available === 0) {
      room.board = create_game_board(room.board_size[0], room.board_size[1]);

      room.current_player = room.colours[0];

      io.to(room_id).emit('start-game', {
        board_size: room.board_size,
        current_player: room.current_player,
        player: {
          names: room.names,
          ids: room.ids
        }
      });

      // this adds player's names and their corresponding colours
      for (var i in room.players) {
        room.players[i].emit('set-colour', {
          colour: room.colours[i],
          player: room.players[i].player_name
        });
      }

      // I needed to adjust for players that left the game and re-enter it
      // so if this is the first game ...
      if (room.is_first_played)
        // ...
        alternate_timer(room, room.ids[0]);
      else
        alternate_timer(room, room.ids[room.ids.length - 1]);

    } else {
      io.to(room_id).emit('waiting', available);
    }
  });

  // this takes name of the next player in the 1P mode and
  // adds to game and then starts it
  socket.on('add-next-player', next_player_name => {
    const room = GAME_ROOMS[socket.room_id];
    const other_colour = (room.colours[0] === PLAYER_COLOURS[0]) ? PLAYER_COLOURS[1] : PLAYER_COLOURS[0];

    // the following lines adds the player's information to the selected game
    room.names.push(next_player_name);
    room.ids.push(shortid.generate());
    room.current_player = room.colours[0];
    room.colours.push(other_colour);

    room.board = create_game_board(room.board_size[0], room.board_size[1]);
    room.leaderboard = {};

    // this set ups the board on the client side for all players
    io.to(socket.room_id).emit('start-game', {
      board_size: room.board_size,
      current_player: room.current_player,
      player: {
        names: room.names,
        ids: room.ids
      },
    });

    // this adds current player's names and their corresponding colour
    socket.emit('set-colour', {
      colour: room.colours[0],
      player: room.names[0]
    });

    // this starts the first player's timer immediately when the game begins.
    alternate_timer(room, room.ids[0]);
  });

  // this basically serves as the game loop and handles all the logical
  // stuff in regards to the next player and moves ... etc. 
  socket.on('add-player', ({ col, colour }) => {
    const room = GAME_ROOMS[socket.room_id];
    var play = colour;
    if (play === room.current_player) {
      const coords = find_last_empty_cell(col, play, room.board_size[0], room.board);

      if (coords !== null) {
        io.to(socket.room_id).emit('update-board', { coords: coords, play: play });

        let game_over_states = [
          horizontal_check(room.board_size[0], room.board_size[1], room.board),
          vertical_check(room.board_size[0], room.board_size[1], room.board),
          diagonal_check_1(room.board_size[0], room.board_size[1], room.board),
          diagonal_check_2(room.board_size[0], room.board_size[1], room.board)
        ];

        let is_game_over = game_over_states.find((check) => { return check.success });

        if (is_game_over != undefined) {
          reset_timer(room);
          io.to(socket.room_id).emit('game-over', { winner: play, rows: is_game_over.rows, cols: is_game_over.cols });
        } else {
          let index = room.colours.indexOf(colour);
          alternate_timer(room, room.ids[index]);
          room.current_player = alternate_player(room.colours, play);
          console.log(room.current_player);
          io.to(socket.room_id).emit('change-current', room.current_player);

          // this is to update the name and colour to the next player [1P onlu]
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
    
    // if this is not the first game won, increase the player's streak
    // else initialize the leaderboard an set the first winning streak
    if (JSON.stringify(room.leaderboard) != JSON.stringify({})) {
      room.leaderboard[room.ids[room.colours.indexOf(winner)]].streak += 1;
    } else {
      for (var i in room.ids) {
        room.leaderboard[room.ids[i]] = {
          name: room.names[i],
          streak: 0
        };
      }
      room.leaderboard[room.ids[room.colours.indexOf(winner)]].streak = 1;
    }
    
    console.log(room.leaderboard);
    // this sends the leaderboard to the client side
    io.to(socket.room_id).emit('leaderboard', room.leaderboard);
  });

  socket.on('restart-game', () => {
    const room = GAME_ROOMS[socket.room_id];
    room.board = create_game_board(room.board_size[0], room.board_size[1]);

    io.to(socket.room_id).emit('start-game', {
      board_size: room.board_size,
      current_player: room.current_player,
      player: {
        names:room.names,
        ids: room.ids
    }
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

    let index_of_last_player = room.colours.length - room.colours.indexOf(room.current_player) - 1;
    alternate_timer(room, room.ids[index_of_last_player]);
  });

  socket.on('leave-game', () => {
    let room = GAME_ROOMS[socket.room_id];
    room.is_first_played = false;
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
      room.is_first_played = false;
      socket.leave(socket.room_id);
      let index = room.players.indexOf(socket);
      
      room.players.splice(index, 1);
      room.names.splice(index, 1);

      if(room.colours !== undefined)
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
    stop_timer(room.timer[i]);
  }
}

function tick(ROOM, index) {
  // this is the elapsed time basically
  ROOM.times[index]++;

  // ... by using modulus (remainder) and division
  // the time can be separated into hrs, mins, and
  // secs
  var remain = ROOM.times[index];
  var mins = Math.floor(remain / 6000);
  remain -= mins * 6000;
  var secs = Math.floor(remain / 100);
  remain -= secs * 100;
  var millis = remain;

  // these turnaru functions fix the problems having 
  // single digits in the timer 
  mins = (mins < 10) ? `0${mins}` : mins;
  secs = (secs < 10) ? `0${secs}` : secs;
  millis = (millis < 10) ? `0${millis}` : millis;
  
  // set up current time 
  ROOM.current_time = `${mins} : ${secs} : ${millis}`;

  // checks if players are still playing the game 
  if (ROOM.players[0] !== undefined) {
    
    // if they are, update their timer
    io.to(ROOM.players[0].room_id).emit('update-time', {
      time: ROOM.current_time,
      id: ROOM.ids[index]
    });
  }
}

function alternate_timer(ROOM, player_id) {
  let i = ROOM.ids.indexOf(player_id);

  // if the timer is not empty, 
  if (ROOM.timer.length !== 0) {
    // stop the preview timer 
    stop_timer(ROOM.timer[i]);
    i++;
    
    // then check if the other timers exists,
    if (ROOM.timer.length < ROOM.times.length) {
      
      // if not add a new timer to the timer array
      ROOM.timer.push(start_timer(ROOM, i));
    } else {
      
      // otherwise, start the next timer
      if (i === ROOM.timer.length) {
        ROOM.timer[0] = start_timer(ROOM, 0);
      } else {
        ROOM.timer[i] = start_timer(ROOM, i);
      }
    }
  } else {
    // ... else add the first timer [Please note: this timer is always player 1] 
    ROOM.timer.push(start_timer(ROOM, i));
  }
}

function start_timer(ROOM, index) {
  timer = setInterval(tick, 1, ROOM, index);
  return timer;
}

function stop_timer(timer) {
  clearInterval(timer);
}

server.listen(PORT, () => {
  console.log(`-- Server is running on http://localhost:${PORT}`);
});