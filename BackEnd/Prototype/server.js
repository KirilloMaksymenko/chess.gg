const http = require('http');

const fs = require('fs');
const { randomInt } = require('crypto');

const PORT = 11111;

const server = http.createServer(function(req, res) {
    fs.readFile('BackEnd/Prototype/lobby.html', 'utf-8', function(error, content) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(content);
    });
 });

const io = require('socket.io')(server);
io.sockets.on('connection', function (client) {
    
    console.log("New client conn " + client.id);
    client.emit('client-id',client.id);
    
//   client.on('appel', function (valeur) {
//     // On recupère la valeur du BP cliqué
//     console.log(valeur);
//     if (valeur == 1) {
//       compteur++;
//       client.emit('data', compteur);
//     }
//   });
    client.on('disconnect', function () {
        console.log(client.id + " déconnecté.");
    });
});
server.listen(PORT); // port d'écoute
console.log("Le serveur écoute sur le port ", PORT);
