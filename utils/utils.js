const filter_rooms_info = (ROOMS) => {
  var filtered_rooms = [];
  for (var i in ROOMS) {
    const free_players = ROOMS[i].capacity - ROOMS[i].players.length;
    if (ROOMS[i].active && free_players !== 0) {
      filtered_rooms.push({
        id: ROOMS[i].id,
        name: ROOMS[i].name,
        capacity: ROOMS[i].capacity - ROOMS[i].players.length
      });
    }
  }
  return filtered_rooms;
}

const free_colours = (ROOMS, all_colours) => {
  let free_colours = [];
  for (var i in ROOMS) {
    let remaining = ROOMS[i].capacity - ROOMS[i].names.length;
    if (ROOMS[i].active && ROOMS[i].capacity !== 1 && remaining !== 0) {
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