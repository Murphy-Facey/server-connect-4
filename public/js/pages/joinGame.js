function create_join_screen(game_board, rooms, colour_lists) {
  game_board.innerHTML = `
  <div id='top-nav' class='sp-bn'>
    <h1>Games</h1>
    <div class='nav-btns'>
      <button id='back_btn'>Back</button>
      <button id='refresh'>Refresh</button>
    </div>
  </div>
  <div id='games'></div>
  `;
  console.log(rooms);
  create_game_div(rooms);
  create_discs(colour_lists);
}

function create_game_div(rooms) {
  const room_container = document.getElementById('games');
  for(var room of rooms) {
    room_container.innerHTML += `
    <div class='game sp-bn'>
      <div class='text-info'>
        <p>Room Name: ${room.name}</p>
        <p>Needed Player: ${room.capacity}</p>
      </div>
      <div class='available-colours'></div>
      <button id='${room.id}' class='join-btn'>Join Game</button>
    </div>
    `;
  }
}

function create_discs(colour_lists) {
  const colours_divs = document.querySelectorAll('.available-colours');
  console.log(colour_lists);
  for(var idx in colour_lists) {
    var colours = colour_lists[idx];
    for(var colour of colours) {
      colours_divs[idx].innerHTML += `
      <div id='p${idx}-${colour}' class='colours'>
        <img src='img/${colour}-disc.svg' alt='no-disc'/>
      </div>
      `;
    }
  }
}