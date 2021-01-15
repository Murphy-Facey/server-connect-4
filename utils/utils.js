const filter_rooms_info = (ROOMS) => {
  var filtered_rooms = [];
  for (var i in ROOMS) {
    let free_players = ROOMS[i].capacity - ROOMS[i].names.length;
    
    // if game is active, and there is space for more players
    if (ROOMS[i].active && free_players !== 0  && ROOMS[i].capacity !== 1) { 
      
      // then add it to the filtered list of rooms to be displayed
      filtered_rooms.push({
        id: ROOMS[i].id,
        name: ROOMS[i].name,
        capacity: ROOMS[i].capacity - ROOMS[i].names.length
      });
    }
  }
  return filtered_rooms;
}

const free_colours = (ROOMS, all_colours) => {
  let free_colours = [];
  for (var i in ROOMS) {
    let free_players = ROOMS[i].capacity - ROOMS[i].names.length;
    if (ROOMS[i].active && ROOMS[i].capacity !== 1 && free_players !== 0) {
      var colours = (ROOMS[i].mode === 'two-player') ? [...all_colours].slice(0, 2) : [...all_colours];
      for (var colour of ROOMS[i].colours) {
        colours.splice(colours.indexOf(colour), 1);
      }
      free_colours.push(colours);
    }
  }
  return free_colours;
}

module.exports = {
  filter_rooms_info,
  free_colours
};