function game_over_screen(game_board, winner) {
	game_board.innerHTML += `
	<div id='game_over'>
		<p class='winner-title'>Game over! Player ${winner} wins!</p>
		<div id='leaderboard'>
			<h6>LEADERBOARD</h6>
		</div>
		<div class='over-btns'>
			<button id='restart' class='big-btn'>Restart Game</button>
			<button id='hide-btn' class='big-btn'>Show Board</button>
			<button id='leave' class='big-btn'>Leave Game</button>
		</div>
	</div>
  	`;
}

function create_leaderboard(leaderboard_div,ids, leaderboard) {
	for(var id of ids) {
		leaderboard_div.innerHTML += `
			<p>${leaderboard[id].name} <span>${leaderboard[id].streak}</span></p>
		`;
	}
}