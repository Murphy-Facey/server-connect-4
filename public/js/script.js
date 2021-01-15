var socket = io();

var GAME;
var PLAYER_COLOUR;
var PLAYER_NAME;
var GAME_MODE;
var GAME_OVER;
const PLAYER_TITLE = document.createElement('div');

function start_button_events() {
  const START_BTNS = document.querySelectorAll('.btn');
  START_BTNS.forEach(button => {
    button.addEventListener('click', () => {
      const player_name = document.getElementById('player_name').value;
      if (player_name !== null && player_name !== '') {
        socket.emit(button.id, player_name);
        PLAYER_NAME = player_name;

        let start_screen = document.querySelector('.start-screen');
        GAME = start_screen;
        // change the screen
        start_screen.classList.add('game-board');
        start_screen.classList.remove('start-screen');
      }
    });
  });
}

start_button_events();

// ------------ sockets on --------------
socket.on('view-rooms', ({ rooms, colours }) => {
  // HTML 
  GAME.classList.add('join-board');
  GAME.classList.remove('game-board');
  create_join_screen(GAME, rooms, colours);

  let refresh_btn = document.getElementById('refresh');
  refresh_btn.addEventListener('click', () => {
    socket.emit('show-rooms');
    GAME.innerHTML = '<p>Waitiing ...</p>';
  });

  let p_cs = document.querySelectorAll('.colours');
  p_cs.forEach(p_c => {
    p_c.addEventListener('click', () => {
      PLAYER_COLOUR = p_c.id.split('-')[1];
    });
  });

  let back_btn = document.getElementById('back_btn');
  back_btn.addEventListener('click', () => {
    GAME.classList.remove('join-board');
    create_start_screen();
  });

  var join_btns = document.querySelectorAll('.join-btn');
  join_btns.forEach(button => {
    button.addEventListener('click', () => {
      if (PLAYER_COLOUR !== undefined) {
        GAME.classList.remove('join-board');
        socket.emit('join-game', { room_id: button.id, colour: PLAYER_COLOUR });
      }
    });
  });
});

socket.on('config-game', colours => {
  create_game_screen(GAME);

  document.getElementById('back_btn').addEventListener('click', () => socket.emit('back-to-start'));

  document.querySelectorAll('.mode-btns').forEach(button => {
    button.addEventListener('click', () => {
      let selected_game_mode = document.querySelector('.--selected');

      if (selected_game_mode !== null)
        selected_game_mode.classList.remove('--selected');

      button.classList.add('--selected');

      GAME_MODE = button.id;
      PLAYER_COLOUR = undefined;

      // let hidden = document.querySelector('.colour-div');
      // if (hidden.style.display === "") {
      //   hidden.style.display = 'flex';
      // }

      create_discs_2(colours, button.id);

      document.querySelectorAll('.colour').forEach(colour => {
        colour.addEventListener('click', () => {
          let selected_colour_disc = document.querySelector('#player-colours').querySelector('.--selected');
          if (selected_colour_disc !== null) {
            selected_colour_disc.classList.remove('--selected');
          }

          colour.classList.add('--selected');
          PLAYER_COLOUR = colour.id.split('-')[1];
        });
      });
    });
  });

  document.querySelector('#start-game').addEventListener('click', () => {
    let room_name = document.getElementById('room-name').value;

    if (GAME_MODE !== undefined && PLAYER_COLOUR !== undefined && room_name !== '') {
      socket.emit('game-mode', { game_mode: GAME_MODE, colour: PLAYER_COLOUR, room_name: room_name });
    }
  });
});

socket.on('next-player', () => {
  next_player_info();
});

socket.on('waiting', available => {
  let body = document.querySelector('body');
  body.innerHTML = '';
  body.append(GAME);
  GAME.classList.remove('blurred');

  GAME.innerHTML = `<p>Waiting: ${available}</p>`;
});

socket.on('start-game', ({ board_size, current_player, player }) => {
  GAME_OVER = false;

  let body = document.querySelector('body');

  body.innerHTML = '';
  body.append(GAME);

  if (GAME.classList.contains('game-board')) {
    GAME.classList.remove('game-board');
  }
  if (!GAME.classList.contains('active-game')) {
    GAME.classList.add('active-game');
  }

  if (GAME.classList.contains('blurred')) {
    GAME.classList.remove('blurred');
  }

  GAME.innerHTML = '';

  GAME.innerHTML = `
  <div class='active-game-top'>
    <p>Player: <span id='player'><span></p>
    <p>Color: <span id='player_colour' class='highlight'></span></p>
    <p>Turn: <span id='current_player' class='highlight ${current_player}'>${current_player}</span></p>
  </div>
  `;

  const board_container = document.createElement('div');
  board_container.id = 'board-container';
  const BOARD = document.createElement('div');
  BOARD.id = 'board';
  if (board_size[0] !== 6) {
    BOARD.classList.add('four-board');
  }

  for (var c = 0; c < board_size[1]; c++) {
    var col_div = document.createElement('div');
    col_div.classList.add('col');
    for (var r = 0; r < board_size[0]; r++) {
      const row_div = document.createElement('div');
      row_div.classList.add('row');
      row_div.setAttribute('data-col', c);
      row_div.setAttribute('data-row', r);
      col_div.append(row_div);
    }
    BOARD.append(col_div);
  }
  board_container.append(BOARD);
  let board_image = (board_size[0] === 6) ? "<img src='img/board-2p.svg' alt='no-board'/>" : "<img src='img/board-4p.svg' alt='no-board'/>";

  board_container.innerHTML += board_image;

  GAME.append(board_container);
  GAME.innerHTML += "<div id='timer'></div>";
  for (var i in player.names) {
    document.getElementById('timer').innerHTML += `
      <p>${player.names[i]}: <span id='${player.ids[i]}' class='times'>00 : 00 : 00</span></p>
    `;
  }
  handle_input();
});

socket.on('update-board', ({ coords, play }) => {
  const { i, j } = coords;
  const cell = document.querySelector(`.row[data-col='${j}'][data-row='${i}']`);
  cell.innerHTML = `
  <img src='img/${play}-disc.svg' alt='no-disc' class='fall'/>
  `;
});

socket.on('change-current', current_play => {
  let current = document.querySelector('#current_player')
  current.textContent = current_play;
  remove_other_colours(current);
  current.classList.add(current_play);
});

socket.on('game-over', ({ winner, rows, cols }) => {
  GAME_OVER = true;
  GAME.classList.add('blurred');

  for (let i in rows) {
    document.querySelector(`.row[data-row='${rows[i]}'][data-col='${cols[i]}']`).classList.add('win');
  }
  game_over_screen(document.querySelector('body'), winner);

  let button = document.createElement('button');
  button.textContent = 'Blur buttton';
  button.addEventListener('click', () => {
    toggle_view(false);
  });
  document.querySelector('.active-game').append(button);

  socket.emit('reset-timer');
  if (PLAYER_COLOUR === winner)
    socket.emit('update-streak', winner);
});

socket.on('leaderboard', ({ leaderboard, ids }) => {
  create_leaderboard(
    document.getElementById('leaderboard'),
    Object.keys(leaderboard),
    leaderboard
  );

  const restart_game = document.getElementById('restart');
  restart_game.addEventListener('click', () => {
    socket.emit('restart-game');
  });

  const show_board = document.getElementById('hide-btn');
  show_board.addEventListener('click', () => {
    toggle_view(true);
  });

  const leave_game = document.getElementById('leave');
  leave_game.addEventListener('click', () => {
    socket.emit('leave-game');
  });
});

socket.on('set-colour', ({ colour, player }) => {
  document.getElementById('player').innerText = player;
  let player_colour = document.getElementById('player_colour')
  player_colour.innerText = colour;
  remove_other_colours(player_colour);
  player_colour.classList.add(colour);
  PLAYER_COLOUR = colour;
});

socket.on('update-time', ({ time, id }) => {
  const current_timer = document.getElementById(`${id}`)
  current_timer.textContent = time;

  if (document.querySelector('.active') !== null) {
    document.querySelector('.active').classList.remove('active');
  }

  current_timer.classList.add('active');
});

socket.on('start-screen', () => {
  GAME.classList.remove('active-game');
  create_start_screen();
});

function create_start_screen() {
  //let body = document.querySelector('body');
  document.body.innerHTML = '';
  document.body.append(GAME);
  GAME.classList.remove('game-board');
  GAME.classList.remove('blurred');
  GAME.classList.add('start-screen');
  start_screen(GAME);
  start_button_events();
}

function next_player_info() {
  create_next_player(GAME);

  let submit_btn = document.getElementById('add-player');
  submit_btn.addEventListener('click', () => {
    const next_player_name = document.getElementById('next-player-name').value;
    if (next_player_name !== null && next_player_name !== '') {
      socket.emit('add-next-player', next_player_name);
    }
  });

  let back_btn = document.getElementById('back_btn');
  back_btn.addEventListener('click', () => {
    socket.emit('back-to-config');
  });

}

function handle_input() {
  const cols = document.querySelectorAll('.col');
  cols.forEach(col => {
    col.addEventListener('click', () => {
      if (GAME_OVER)
        return;
      socket.emit('add-player', {
        col: col.querySelector('.row').getAttribute('data-col'),
        colour: PLAYER_COLOUR
      });
    });
  });
}

function remove_other_colours(colour_div) {
  let list = colour_div.classList;
  if (list.contains('red') !== null) {
    colour_div.classList.remove('red');
  }
  if (list.contains('black') !== null) {
    colour_div.classList.remove('black');
  }
  if (list.contains('yellow') !== null) {
    colour_div.classList.remove('yellow');
  }
  if (list.contains('green') !== null) {
    colour_div.classList.remove('green');
  }
}

function toggle_view(blur) {
  if (blur === false) {
    document.querySelector('.active-game').classList.add('blurred');
    document.querySelector('#game_over').classList.remove('hide');
  } else {
    document.querySelector('.active-game').classList.remove('blurred');
    document.querySelector('#game_over').classList.add('hide');
  }
}


