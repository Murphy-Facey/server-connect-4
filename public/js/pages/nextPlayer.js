function create_next_player(game_board) {
  game_board.innerHTML = `
    <div class='info-div sp-bn'>
      <p>Player 2 Name</p>
      <input type='text' id='next-player-name' class='text-box'>
    </div>
    <div class='info-div sp-bn'>
      <button id='back_btn' class='big-btn'>Back</button>
      <button id='add-player' class='big-btn'>Add Player</button>
    </div>
  `;
}