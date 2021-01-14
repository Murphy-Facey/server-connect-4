function start_screen(game_board) {
  game_board.innerHTML = `
  <div class="logo">
    <p>Simple Multiplayer Connect 4 Game</p>
  </div>
  <div class="instructions">
    <span>How to Play:</span>
    All you have to do is connect four of your colored checker pieces in a row, much the same as tic tac toe. This can be done horizontally, vertically or diagonally. Each player will drop in one checker piece at a time. This will give you a chance to either build your row, or stop your opponent from getting four in a row.
  </div>
  <input type="text" id="player_name" placeholder="Enter Player Name"/>
  <div class="play-btns sp-bn">
    <button id="create-game" class="big-btn btn">Create Game</button>
    <button id="show-rooms" class="big-btn btn">Join Game</button>
  </div>
  `;
}