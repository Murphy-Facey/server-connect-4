function create_next_player(game_board) {
  game_board.innerHTML = `
    <button id='back_btn'>Back</button>
    <div>
      <p>Player 2 Name</p>
      <input type='text' id='next-player-name'>
      <button id='add-player'>Add Player</button>
    </div>
  `;
}