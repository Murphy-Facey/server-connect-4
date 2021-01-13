const create_game_board = (ROWS, COLS) => {
  rows = []
  for (var r = 0; r < ROWS; r++) {
    cols = []
    for (var c = 0; c < COLS; c++) {
      cols.push('-');
    }
    rows.push(cols);
  }
  return rows;
}

function find_last_empty_cell(col, play, ROWS, BOARD) {
  for (var i = ROWS - 1; i >= 0; i--)     // starts for the last row of the current column
    if (BOARD[i][Number(col)] == '-') {   // go up upon you see an empty cell
      var j = Number(col);
      BOARD[i][j] = play;                 // updates board
      return { i, j };                    // returns coordinations of the updated cell
    }
  return null;                            // if there is no empty cell in the column, send nothing
}

function alternate_player(plays, current_play) {
  var index = (plays.indexOf(current_play) + 1) % plays.length;
  return plays[index];
}

function color_match_check(one, two, three, four) {
  return (one === two && one === three && one == four && one !== '-');
}

// the following functions are used to check if player has won in
// either of the four directions: horizontally, vertically, and 
// both of the diagonals.
// Please Note: the rows and cols attributes are used to show the 
//              winner titles


function horizontal_check(ROWS, COLS, BOARD) {
  for (var row = 0; row < ROWS; row++) {
    for (var col = 0; col < COLS - 3; col++) {
      if (color_match_check(
        BOARD[row][col],
        BOARD[row][col + 1],
        BOARD[row][col + 2],
        BOARD[row][col + 3]
      )) {
        return {
          success: true,
          rows: [row, row, row, row],
          cols: [col, col + 1, col + 2, col + 3],
        };
      }
    }
  }
  return {
    success: false
  };
}

function vertical_check(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS; col++) {
    for (var row = 0; row < ROWS - 3; row++) {
      if (color_match_check(
        BOARD[row][col],
        BOARD[row + 1][col],
        BOARD[row + 2][col],
        BOARD[row + 3][col]
      )) {
        return {
          success: true,
          rows: [row, row + 1, row + 2, row + 3],
          cols: [col, col, col, col],
        };
      }
    }
  }
  return {
    success: false
  };
}

function diagonal_check_1(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS - 3; col++) {
    for (var row = 0; row < ROWS - 3; row++) {
      if (color_match_check(
        BOARD[row][col],
        BOARD[row + 1][col + 1],
        BOARD[row + 2][col + 2],
        BOARD[row + 3][col + 3]
      )) {
        return {
          success: true,
          rows: [row, row + 1, row + 2, row + 3],
          cols: [col, col + 1, col + 2, col + 3]
        };
      }
    }
  }
  return {
    success: false
  };
}

function diagonal_check_2(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS - 3; col++) {
    for (var row = ROWS - 1; row > 3; row--) {
      if (color_match_check(
        BOARD[row][col],
        BOARD[row - 1][col + 1],
        BOARD[row - 2][col + 2],
        BOARD[row - 3][col + 3]
      )) {
        return {
          success: true,
          rows: [row, row - 1, row - 2, row - 3],
          cols: [col, col + 1, col + 2, col + 3]
        };
      }
    }
  }
  return {
    success: false
  };
}

module.exports = {
  create_game_board,
  find_last_empty_cell,
  alternate_player,
  vertical_check,
  horizontal_check,
  diagonal_check_1,
  diagonal_check_2,
};