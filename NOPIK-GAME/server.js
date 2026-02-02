const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const CARD_VALUES = {
  A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  J: 10, Q: 10, K: 10
};

const DECK = Object.keys(CARD_VALUES);

let players = {};
let dealer = null;
let pot = 0;

function drawCard() {
  return DECK[Math.floor(Math.random() * DECK.length)];
}

function handValue(cards) {
  let sum = cards.reduce((a, c) => a + CARD_VALUES[c], 0);
  return sum % 10;
}

io.on("connection", (socket) => {
  players[socket.id] = {
    cards: [],
    bet: 0,
    active: true
  };

  if (!dealer) dealer = socket.id;

  io.emit("state", { players, dealer, pot });

  socket.on("startRound", () => {
    pot = 0;
    for (let id in players) {
      players[id].cards = [];
      players[id].bet = 10;
      pot += 10;
    }

    for (let id in players) {
      players[id].cards.push(drawCard(), drawCard());
    }

    players[dealer].cards.push(drawCard());

    io.emit("state", { players, dealer, pot });
  });

  socket.on("bet", () => {
    players[socket.id].cards.push(drawCard());
    io.emit("state", { players, dealer, pot });
  });

  socket.on("revealDealer", () => {
    players[dealer].cards.push(drawCard(), drawCard());
    io.emit("state", { players, dealer, pot });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    if (dealer === socket.id) dealer = Object.keys(players)[0] || null;
    io.emit("state", { players, dealer, pot });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  console.log("NOPIK server running on 3000");

});

