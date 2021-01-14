function create_game_screen(gane_board) {
  gane_board.innerHTML = `
  
	<div class='info-div sp-bn'>
    <p>Room Name</p>
    <input type='text' id='room-name' class='text-box'/>
  </div>
  <div class='info-div sp-bn'>
    <p>Game Mode</p>
    <div class='inner-div sp-bn'>
      <button id='one-player' class='mode-btns'>1P</button>
      <button id='two-player' class='mode-btns'>2P</button>
      <button id='four-player' class='mode-btns'>4P</button>
    </div>
  </div>
  <div class='colour-div'>
    <p>Player Color</p>
    <div id='player-colours'></div>
  </div>
  <div class='info-div sp-bn'>
    <button id='start-game' class='big-btn'>Start Game</button>
    <button id='back_btn' class='big-btn'>Back</button>
  </div>
  
  `;
}

function create_discs_2(colours, mode) {
	var colours_div = document.getElementById('player-colours');
	colours_div.innerHTML = '';
	for(var colour of colours) {
		if(mode !== 'four-player' && colours.indexOf(colour) == 2) {
			break;
		}
		colours_div.innerHTML += `
		<div id='p-${colour}' class='colour'>
			<img src='img/${colour}-disc.svg' alt='no-disc'/>
		</div>
		`;
	}
}