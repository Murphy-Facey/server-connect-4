function start_screen(game_board) {
  game_board.innerHTML = `
    <div class="logo">
      <p>Simple Multiplayer Connect 4 Game</p>
    </div>
    <input type="text" id="player_name" placeholder="Enter Player Name"/>
    <div class="play-btns">
      <button id="create-game" class="btn">Create Game</button>
      <button id="show-rooms" class="btn">Join Game</button>
    </div>
  `;
}