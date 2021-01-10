# Multiplayer Connect 4

This is a simple multiplayer connect 4 game built using javascript, HTML & CSS. Before you ask if this could be done using React, Vue or any other front-end framework and would it have been easily ... the answer is yes, 100%. The same thing applies to the efforts taken to add custom styles when they are many tools that exists to make styling so much easier.

## How to use it

After cloning this repo on your machine, run the following commands in your terminal to install all the necessary dependencies and run the server.

```
npm install
npm start
```

The server should open up at http://localhost:8080. Enter that url into your browser and enjoy the game with friends and family. Please note that this is only for one player (1P) mode and to play with other modes, you will need to tunnel your localhost using ngrok. One player mode justs means that you and someone else beside you can play with each other on your current machine.

You can get ngrok and setup it [here](https://ngrok.com/download). Afterwards, you should have a link that looks like this: https://033a3ebe3735.ngrok.io. Share that link with your friend(s)/family and then you can play it with them.


## Frameworks used

For those who would like to know, this is a list of frameworks/packages that I used in this project.
- Express
- Socket.io 
- Shortid

## Things to work

- [ ] Styling
- [ ] Refactor codebase
- [ ] Minor bug fixes
- [ ] Minor features to possibly add
    - [ ] Proper animations
    - [ ] Allow the player to join via direct link
    - [ ] Lock a game to allow only specific players
