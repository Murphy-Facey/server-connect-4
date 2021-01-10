function game_over_screen(game_board, winner) {
	game_board.innerHTML += `
	<div id='game_over'>
		<p class='winner-title'>Game over! Player ${winner} wins!</p>
		<div id='leaderboard'>
			<h6>LEADERBOARD</h6>
		</div>
		<div class='over-btns'>
			<button id='restart'>Restart Game</button>
			<button id='hide-btn'>Show Board</button>
			<button id='leave'>Leave Game</button>
		</div>
	</div>
  	`;
}

function create_leaderboard(leaderboard_div, names, leaderboard) {
	for(var name of names) {
		leaderboard_div.innerHTML += `
			<p> ${name}: <span>${leaderboard[name]}</span></p>
		`;
	}
}