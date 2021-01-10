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

function findLastEmptyCell(col, play, ROWS, BOARD) {
  for (var i = ROWS - 1; i >= 0; i--)
    if (BOARD[i][Number(col)] == '-') {
      var j = Number(col);
      BOARD[i][j] = play;
      return { i, j };
    }
  return null;
}

function alternatePlayer(plays, current_play) {
  var i = plays.indexOf(current_play);
  if (i < plays.length - 1) {
    current_play = plays[i + 1];
  } else {
    current_play = plays[0];
  }
  return current_play;
}

function colorMatchCheck(one, two, three, four) {
  return (one === two && one === three && one == four && one !== '-');
}

function horizontalCheck(ROWS, COLS, BOARD) {
  for (var row = 0; row < ROWS; row++) {
    for (var col = 0; col < COLS - 3; col++) {
      if (colorMatchCheck(
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

function verticalCheck(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS; col++) {
    for (var row = 0; row < ROWS - 3; row++) {
      if (colorMatchCheck(
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

function diagonalCheck1(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS - 3; col++) {
    for (var row = 0; row < ROWS - 3; row++) {
      if (colorMatchCheck(
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

function diagonalCheck2(ROWS, COLS, BOARD) {
  for (var col = 0; col < COLS - 3; col++) {
    for (var row = ROWS - 1; row > 3; row--) {
      if (colorMatchCheck(
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
  findLastEmptyCell,
  alternatePlayer,
  verticalCheck,
  horizontalCheck,
  diagonalCheck1,
  diagonalCheck2,
};