const http = require('http')

const fs = require('fs')
const path = require('path')
const { randomInt } = require('crypto')

const PORT = 12345

let listClients = []
let numClients = 0

let listRooms = []
let numRooms = 0

const server = http.createServer((req, res) => {

    if (req.url === '/' || req.url === '/lobby.html') {
        fs.readFile('lobby.html', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }else if (req.url === '/game' || req.url === '/game.html') {
        fs.readFile('game.html', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }else {

        const filePath = path.join(__dirname, req.url);
        const ext = path.extname(filePath);
        let contentType = 'text/html';

        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.css') contentType = 'text/css';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }
})

const io = require('socket.io')(server)
io.sockets.on('connection', function (client) {

    numClients += 1
    listClients[numClients] = client.id
    console.log("New client conn " + client.id)

    client.emit('client-id',client.id)
        
    client.on('create-room', function (clientId) {
        console.log("create: ",listClients,clientId)
        if(listClients.includes(clientId)){
            const roomId = randomInt(99999)
            console.log(roomId)
            client.join(roomId)
            io.to(roomId).emit("redirect","/game")
            const rooms = io.sockets.adapter.rooms;
            console.log('Current rooms:', Array.from(rooms.keys()));
        }
    })

    client.on("change-id", (oldclientId)=>{
        if(listClients.includes(oldclientId)){
            listClients[listClients.indexOf(oldclientId)]=client.id
            
        }
    })

    client.on('disconnect', function () {
        console.log(client.id + " déconnecté.")
    })
})
server.listen(PORT) // port d'écoute
console.log("Le serveur écoute sur le port ", PORT)
