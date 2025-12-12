const http = require('http')
const fs = require('fs')
const path = require('path')
const { randomInt } = require('crypto')

const PORT = 12345
const kcof = 50

const newMap =[
    ["R","P","","","","","p","r"],
    ["N","P","","","","","p","n"],
    ["S","P","","","","","p","s"],
    ["Q","P","","","","","p","q"],
    ["K","P","","","","","p","k"],
    ["S","P","","","","","p","s"],
    ["N","P","","","","","p","n"],
    ["R","P","","","","","p","r"],
]

const hpCount = {
    "p":75,
    "r":130,
    "s":60,
    "n":100,
    "k":200,
    "q":125,
}

const abilitiesPieces = {
    "p":{
        self:{
            "evasion":null
        },
        opponent:{
            "pawn-shoot":null
        }
    },
    "s":{
        self:{
            "contre-attack":null,
            "evasion":null
        },
        opponent:{
            "bishop-shoot":null
        } // ignore all shields/evasions, 45% dmg after shield and etc.
    },
    "r":{
        self:{
            "healing":null
        },
        opponent:{
            "heavy-shoot":null,
            "rook-shoot":null
        }
    },
    "k":{
        self:{
            "stacking":null
        },
        opponent:{
            "kamicadze":null
        }
    },
    "q":{
        self:{
            "def-piece":null
        },
        opponent:{
            "heavy-shoot":null,
            "kamicadze":null,
            "bishop-shoot":null
        }
    },
    "k":{
        self:{
            "vampiring": null,
            "spikes": null,
            "prayers":null,
        },
        opponent:{}
    }
}


const rooms = new Map() 
const clientToRoom = new Map()
const clientRole = new Map()
const clientColor = new Map()
const socketToOriginalSocket = new Map()

const server = http.createServer((req, res) => {

    if (req.url === '/' || req.url === '/lobby.html' || req.url === '/lobby') {
        const filePath = path.join(__dirname, 'html', 'lobby.html')
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end('Not found')
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(data)
            }
        })
    } else if (req.url.startsWith('/game/mode-Classic') || req.url.startsWith('/game/mode-Black')) {
        const filePath = path.join(__dirname, 'html', 'index_chess.html')
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end('Not found')
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(data)
            }
        })
    } else if (req.url.startsWith('/game/mode-turne-based')) {
        const filePath = path.join(__dirname, 'html', 'index_turn_based.html')
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end('Not found')
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(data)
            }
        })
    } else if (req.url.startsWith('/socket.io/')) {
        return
    } else {
        const filePath = path.join(__dirname, req.url)
        const ext = path.extname(filePath)
        let contentType = 'text/html'

        if (ext === '.js') contentType = 'application/javascript'
        if (ext === '.css') contentType = 'text/css'
        if (ext === '.png') contentType = 'image/png'
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
        if (ext === '.otf') contentType = 'font/otf'

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404)
                res.end('Not found')
            } else {
                res.writeHead(200, { 'Content-Type': contentType })
                res.end(data)
            }
        })
    }
})

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

function generateRoomId() {
    let roomId
    do {
        roomId = randomInt(10000, 99999).toString()
    } while (rooms.has(roomId))
    return roomId
}

function getAvailableRooms() {
    const availableRooms = []
    rooms.forEach((room, roomId) => {
        const playersCount = room.players ? room.players.length : 0
        // if (playersCount < 2) {
            availableRooms.push({
                roomId: roomId,
                gamemode:room.gameInfo.gamemode,
                playersCount: playersCount,
                maxPlayers: 2,
                spectatorsCount: room.spectators ? room.spectators.length : 0
            })
        // }
    })
    //console.log(`getAvailableRooms: found ${availableRooms.length} rooms out of ${rooms.size} total`)
    return availableRooms
}

function getClientRole(clientId) {
    return clientRole.get(clientId) || null
}

function setClientRole(clientId, role) {
    clientRole.set(clientId, role)
    console.log(`Client ${clientId} role set to: ${role}`)
}

function StartTimer(roomId){

}

function setClientColor(clientId, color) {
    clientColor.set(clientId, color)
    console.log(`Client ${clientId} color set to: ${color}`)
}

function getClientColor(clientId) {
    return clientColor.get(clientId) || null
}

function cleanupRoom(roomId) {
    const room = rooms.get(roomId)
    if (!room) return

    const playersCount = room.players ? room.players.length : 0
    const spectatorsCount = room.spectators ? room.spectators.length : 0
    const createdAt = room.createdAt || 0
    const roomAgeMs = Date.now() - createdAt

    const EMPTY_ROOM_TIMEOUT_MS =   5 * 1000 

    if (playersCount === 0 && spectatorsCount === 0 && roomAgeMs > EMPTY_ROOM_TIMEOUT_MS) {
        rooms.delete(roomId)
        console.log(`Room ${roomId} deleted (empty for more than ${EMPTY_ROOM_TIMEOUT_MS / 1000} sec)`)
    }
}

// function eloCalc(elo1,elo2,winner){

//     const P1 = elo1 / (elo1+elo2)
//     const P2 = elo2 / (elo1+elo2)

//     elo1 = elo1 + kcof*(winner === 'white' ? 1 : 0 - P1) 
//     elo2 = elo2 + kcof*(winner === 'white' ? 0 : 1 - P2)

//     return {player1: elo1, player2: elo2}
// }



function timerStart(){
    
}



function timerTimeout(game){
    // if(gameInfo.currentTurn

    // intervalWhite = setInterval(() => {
        
    // }, 1000);
}









io.sockets.on('connection', function (client) {
    console.log("New client connected: " + client.id)

    client.emit('client-id', client.id)

    const availableRooms = getAvailableRooms()
    console.log(`Sending ${availableRooms.length} available rooms to ${client.id}`)
    client.emit('rooms-list', availableRooms)

    client.on('create-room', function (data) {
        try {
            if (clientToRoom.has(client.id)) {
                client.emit('error', { message: 'You are already in the room.' })
                return
            }

            const roomId = generateRoomId()
            rooms.set(roomId, {
                players: [client.id],
                spectators: [],
                playerColors: { [client.id]: 'white' },
                originalPlayerOrder: [client.id],
                createdAt: Date.now(),
                gameInfo: {
                    map: newMap,
                    countTurn: 0,
                    currentTurn: 'white',
                    gameStatus: 'playing',
                    gamemode: data.gamemode,
                    winner: null,  
                    log: [],
                    timerBlack: 600,
                    timerWhite: 600,
                    disableTimer: false,
                    turnBasedInfo: {
                        pieceW: null,
                        pieceB: null,
                        hpW: null,
                        hpB: null,
                        currentTurn: null,
                        abilities:{
                            pieceW:{
                                evasion:0,
                                contrAttack:0,
                                skipTurn:false,
                                stacks:1,
                                spikes:0,
                                usePrayers:false,
                            },
                            pieceB:{
                                evasion:0,
                                contrAttack:0,
                                skipTurn:false,
                                stacks:1,
                                spikes:0,
                                usePrayers:false,
                            }
                        }
                    }
                }
            })
            clientToRoom.set(client.id, roomId)
            setClientRole(client.id, 'player')
            setClientColor(client.id, 'white')
            socketToOriginalSocket.set(client.id, client.id)
            client.join(roomId)

            console.log(`Room ${roomId} created by ${client.id}`)
            console.log(`Total rooms: ${rooms.size}`)

            const updatedRooms = getAvailableRooms()
            console.log(`Broadcasting updated rooms list: ${updatedRooms.length} rooms`)
            io.emit('rooms-list', updatedRooms)

            const room = rooms.get(roomId)
            console.log(`Room ${roomId} has ${room.players.length} players`)
            if (room.players.length === 2) {
                const redirectUrl = `/game/${room.gameInfo.gamemode}?roomId=${roomId}`
                console.log(`Redirecting room ${roomId} to ${redirectUrl}`)
                io.to(roomId).emit('redirect', redirectUrl)
            } else {
                client.emit('room-created', { 
                    roomId: roomId,
                    role: 'player',
                    color: 'white'
                })
            }
        } catch (error) {
            console.error('Error creating room:', error)
            client.emit('error', { message: 'Room creation error' })
        }
    })

    client.on('join-room', function (data) {
        try {
            const { roomId } = data

            if (clientToRoom.has(client.id)) {
                client.emit('error', { message: 'You are already in the room.' })
                return
            }

            if (!rooms.has(roomId)) {
                client.emit('error', { message: 'Room not found' })
                return
            }

            const room = rooms.get(roomId)

            if (!room.spectators) {
                room.spectators = []
            }

            if (!room.playerColors) {
                room.playerColors = {}
            }
            if (!room.originalPlayerOrder) {
                room.originalPlayerOrder = []
            }

            let role
            let color = null
            const currentPlayersCount = room.players.length
            const originalPlayersCount = room.originalPlayerOrder.length
            if (currentPlayersCount < 2) {
                role = 'player'
                
                if (originalPlayersCount === 0) {
                    color = 'white'
                    room.originalPlayerOrder.push(client.id)
                } else if (originalPlayersCount === 1) {
                    color = 'black'
                    room.originalPlayerOrder.push(client.id)
                } else {
                    const originalIndex = room.originalPlayerOrder.indexOf(client.id)
                    if (originalIndex !== -1) {
                        color = originalIndex === 0 ? 'white' : 'black'
                    } else {
                        color = currentPlayersCount === 0 ? 'white' : 'black'
                        room.originalPlayerOrder.push(client.id)
                    }
                }
                
                room.players.push(client.id)
                setClientRole(client.id, 'player')
                socketToOriginalSocket.set(client.id, client.id)
                
                if (color) {
                    room.playerColors[client.id] = color
                    setClientColor(client.id, color)
                    console.log(`Client ${client.id} joined room ${roomId} as PLAYER ${currentPlayersCount + 1} with color ${color} (original order pos: ${originalPlayersCount})`)
                } else {
                    console.log(`Client ${client.id} joined room ${roomId} as PLAYER`)
                }
            } else {
                role = 'spectator'
                room.spectators.push(client.id)
                setClientRole(client.id, 'spectator')
                console.log(`Client ${client.id} joined room ${roomId} as SPECTATOR`)
            }

            clientToRoom.set(client.id, roomId)
            client.join(roomId)

            console.log(`Room ${roomId} now has ${room.players.length} players and ${room.spectators.length} spectators`)

            const updatedRooms = getAvailableRooms()
            console.log(`Broadcasting updated rooms list after join: ${updatedRooms.length} rooms`)
            io.emit('rooms-list', updatedRooms)

            if (room.players.length === 2) {
                const redirectUrl = `/game/${room.gameInfo.gamemode}?roomId=${roomId}`
                console.log(`Redirecting room ${roomId} to ${redirectUrl}`)
                console.log(`Room players array:`, room.players)
                console.log(`Room playerColors:`, room.playerColors)
                room.players.forEach((playerId, index) => {
                    const playerColor = index === 0 ? 'white' : 'black'
                    if (!room.playerColors) {
                        room.playerColors = {}
                    }
                    room.playerColors[playerId] = playerColor
                    setClientColor(playerId, playerColor)
                    console.log(`Player ${playerId} at position ${index} is assigned color ${playerColor}`)
                    io.to(playerId).emit('redirect', redirectUrl)
                    io.to(playerId).emit('player-color-assigned', {
                        color: playerColor,
                        playerNumber: index + 1
                    })
                })
                
            } else {
                client.emit('room-joined', { 
                    roomId: roomId,
                    role: role,
                    color: color
                })
            }
        } catch (error) {
            console.error('Error joining room:', error)
            client.emit('error', { message: 'Error joining room' })
        }
    })

    client.on('rejoin-room', function (data) {
        try {
            const { roomId } = data

            if (!rooms.has(roomId)) {
                client.emit('error', { message: 'Room not found' })
                return
            }

            const room = rooms.get(roomId)
            if (!room.spectators) {
                room.spectators = []
            }

            if (!room.playerColors) {
                room.playerColors = {}
            }
            if (!room.originalPlayerOrder) {
                room.originalPlayerOrder = []
            }

            if (room.originalPlayerOrder.length > 0) {
                const disconnectedSockets = room.originalPlayerOrder.filter(oldSocketId => {
                    return !room.players.includes(oldSocketId)
                })
                
                if (disconnectedSockets.length > 0 && room.players.length < 2) {
                    for (let i = 0; i < room.originalPlayerOrder.length; i++) {
                        const oldSocketId = room.originalPlayerOrder[i]
                        if (!room.players.includes(oldSocketId)) {
                            room.originalPlayerOrder[i] = client.id
                            console.log(`Replaced old socket.id ${oldSocketId} with new ${client.id} at position ${i} in originalPlayerOrder`)
                            if (room.playerColors[oldSocketId]) {
                                room.playerColors[client.id] = room.playerColors[oldSocketId]
                                delete room.playerColors[oldSocketId]
                            }
                            break
                        }
                    }
                } else {
                    room.originalPlayerOrder = room.originalPlayerOrder.filter(id => room.players.includes(id))
                    console.log(`Cleaned originalPlayerOrder, removed disconnected sockets`)
                }
            }

            if (clientToRoom.has(client.id)) {
                const currentRoom = clientToRoom.get(client.id)
                if (currentRoom === roomId) {
                    const role = getClientRole(client.id)
                    let color = getClientColor(client.id)
                    if (!color && role === 'player' && room.originalPlayerOrder.length > 0) {
                        const originalIndex = room.originalPlayerOrder.indexOf(client.id)
                        if (originalIndex !== -1) {
                            color = originalIndex === 0 ? 'white' : 'black'
                            setClientColor(client.id, color)
                            room.playerColors[client.id] = color
                        }
                    }
                    console.log(`Client ${client.id} already in room ${roomId} as ${role} with color ${color}`)
                    client.emit('room-rejoined', { 
                        roomId: roomId,
                        role: role,
                        color: color,
                        playersCount: room.players.length,
                        spectatorsCount: room.spectators.length,
                        gameInfo: room.gameInfo
                    })
                    return
                }
            }

            let role = getClientRole(client.id)
            let color = getClientColor(client.id)
            
            if (!color && room.originalPlayerOrder.length > 0) {
                const existingIndex = room.originalPlayerOrder.indexOf(client.id)
                if (existingIndex !== -1) {
                    color = existingIndex === 0 ? 'white' : 'black'
                    console.log(`Found existing position ${existingIndex} for ${client.id} in originalPlayerOrder, color: ${color}`)
                } else {
                    if (room.originalPlayerOrder.length < 2) {
                        const newIndex = room.originalPlayerOrder.length
                        room.originalPlayerOrder.push(client.id)
                        color = newIndex === 0 ? 'white' : 'black'
                        console.log(`Added ${client.id} to originalPlayerOrder at position ${newIndex}, color: ${color}`)
                    } else {
                        for (let i = 0; i < room.originalPlayerOrder.length; i++) {
                            const oldSocketId = room.originalPlayerOrder[i]
                            if (!room.players.includes(oldSocketId)) {
                                room.originalPlayerOrder[i] = client.id
                                color = i === 0 ? 'white' : 'black'
                                console.log(`Replaced old socket.id at position ${i} with ${client.id}, color: ${color}`)
                                if (room.playerColors[oldSocketId]) {
                                    room.playerColors[client.id] = room.playerColors[oldSocketId]
                                    delete room.playerColors[oldSocketId]
                                }
                                break
                            }
                        }
                    }
                }
            }
            
            if (room.playerColors && room.playerColors[client.id]) {
                color = room.playerColors[client.id]
                console.log(`Found saved color for ${client.id}: ${color}`)
            }
            
            if (!role) {
                const currentPlayersCount = room.players.length
                if (currentPlayersCount < 2) {
                    role = 'player'
                    if (!room.players.includes(client.id)) {
                        if (!color) {
                            if (room.originalPlayerOrder.length === 0) {
                                if (currentPlayersCount === 0) {
                                    color = 'white'
                                    room.originalPlayerOrder.push(client.id)
                                } else if (currentPlayersCount === 1) {
                                    color = 'black'
                                    room.originalPlayerOrder.push(client.id)
                                }
                            } else {
                                const originalIndex = room.originalPlayerOrder.length
                                color = originalIndex === 0 ? 'white' : 'black'
                                room.originalPlayerOrder.push(client.id)
                            }
                        }
                        room.players.push(client.id)
                        socketToOriginalSocket.set(client.id, client.id)
                    } else {
                        if (!color) {
                            const originalIndex = room.originalPlayerOrder.indexOf(client.id)
                            if (originalIndex !== -1) {
                                color = originalIndex === 0 ? 'white' : 'black'
                            } else {
                                const playerIndex = room.players.indexOf(client.id)
                                color = playerIndex === 0 ? 'white' : 'black'
                            }
                        }
                    }
                } else {
                    role = 'spectator'
                    if (!room.spectators.includes(client.id)) {
                        room.spectators.push(client.id)
                    }
                }
            } else {
                if (role === 'player' && !room.players.includes(client.id)) {
                    const currentPlayersCount = room.players.length
                    if (!color) {
                        if (currentPlayersCount === 0) {
                            color = 'white'
                        } else if (currentPlayersCount === 1) {
                            color = 'black'
                        } else {
                            if (room.playerColors) {
                                const existingColors = Object.values(room.playerColors)
                                if (!existingColors.includes('white')) {
                                    color = 'white'
                                } else if (!existingColors.includes('black')) {
                                    color = 'black'
                                }
                            }
                        }
                    }
                    room.players.push(client.id)
                } else if (role === 'player' && room.players.includes(client.id)) {
                    if (!color) {
                        const playerIndex = room.players.indexOf(client.id)
                        color = playerIndex === 0 ? 'white' : (playerIndex === 1 ? 'black' : null)
                        if (!color && room.playerColors) {
                            const existingColors = Object.values(room.playerColors)
                            if (!existingColors.includes('white')) {
                                color = 'white'
                            } else if (!existingColors.includes('black')) {
                                color = 'black'
                            }
                        }
                    }
                } else if (role === 'spectator' && !room.spectators.includes(client.id)) {
                    room.spectators.push(client.id)
                }
            }

            setClientRole(client.id, role)
            if (color) {
                setClientColor(client.id, color)
                room.playerColors[client.id] = color
            }

            clientToRoom.set(client.id, roomId)
            client.join(roomId)

            console.log(`Client ${client.id} rejoined room ${roomId} as ${role}${color ? ` with color ${color}` : ''}`)
            console.log(`Room ${roomId} now has ${room.players.length} players and ${room.spectators.length} spectators`)

            if (role === 'player') {
                if (!color || color === null) {
                    let originalIndex = room.originalPlayerOrder.indexOf(client.id)
                    
                    if (originalIndex !== -1) {
                        color = originalIndex === 0 ? 'white' : 'black'
                        console.log(`FINAL: Found original position ${originalIndex} for ${client.id}, color: ${color}`)
                    } else {
                        const playerIndex = room.players.indexOf(client.id)
                        if (playerIndex !== -1) {
                            color = playerIndex === 0 ? 'white' : 'black'
                            if (!room.originalPlayerOrder.includes(client.id)) {
                                if (room.originalPlayerOrder.length < 2) {
                                    room.originalPlayerOrder.push(client.id)
                                } else {
                                    room.originalPlayerOrder[playerIndex] = client.id
                                }
                            }
                            console.log(`FINAL: Assigned color ${color} to player ${client.id} based on current position ${playerIndex}`)
                        } else {
                            console.warn(`Player ${client.id} not found in room.players array! Array:`, room.players)
                        }
                    }
                    
                    if (color) {
                        setClientColor(client.id, color)
                        if (!room.playerColors) {
                            room.playerColors = {}
                        }
                        room.playerColors[client.id] = color
                        socketToOriginalSocket.set(client.id, client.id)
                    }
                } else {
                    const originalIndex = room.originalPlayerOrder.indexOf(client.id)
                    
                    if (originalIndex !== -1) {
                        const expectedColor = originalIndex === 0 ? 'white' : 'black'
                        if (color !== expectedColor) {
                            console.warn(`Color mismatch for ${client.id}: has ${color}, should be ${expectedColor} (original position ${originalIndex})`)
                            color = expectedColor
                            setClientColor(client.id, color)
                            if (!room.playerColors) {
                                room.playerColors = {}
                            }
                            room.playerColors[client.id] = color
                        }
                    } else {
                        const playerIndex = room.players.indexOf(client.id)
                        if (playerIndex !== -1 && room.originalPlayerOrder.length < 2) {
                            room.originalPlayerOrder[playerIndex] = client.id
                            console.log(`Added ${client.id} to originalPlayerOrder at position ${playerIndex}`)
                        }
                    }
                }
            }

            client.emit('room-rejoined', { 
                roomId: roomId,
                role: role,
                color: color,
                playersCount: room.players.length,
                spectatorsCount: room.spectators.length,
                allPlayers: room.players,
                allSpectators: room.spectators,
                playerColors: room.playerColors,
                gameInfo: room.gameInfo
            })
            
            console.log(`Sending room-rejoined to ${client.id}: role=${role}, color=${color}, position=${room.players.indexOf(client.id)}`)

            client.to(roomId).emit('player-rejoined', { 
                clientId: client.id,
                role: role,
                color: color,
                playersCount: room.players.length,
                spectatorsCount: room.spectators.length
            })
        } catch (error) {
            console.error('Error rejoining room:', error)
            client.emit('error', { message: 'Помилка повторного приєднання до кімнати' })
        }
    })

    client.on('get-rooms', function () {
        const availableRooms = getAvailableRooms()
        //console.log(`Client ${client.id} requested rooms, sending ${availableRooms.length} rooms`)
        client.emit('rooms-list', availableRooms)
    })

    client.on('game-turn', function (data) {
        const roomId = clientToRoom.get(client.id)

        const room = rooms.get(roomId)

        console.log(room)
        room.gameInfo.map = data["map"]
        console.log(data["map"])
        room.gameInfo.countTurn = data["countTurn"]
        room.gameInfo.currentTurn = data["currentTurn"]
        room.gameInfo.gameStatus = data["gameStatus"]
        room.gameInfo.winner = data["winner"]
        room.gameInfo.log[room.gameInfo.countTurn] = data.log
        timerTimeout(room.gameInfo);
        console.log(room)
        
        io.to(roomId).emit('update-game-state',room.gameInfo)
    })

    client.on("checkmate-gameover", function(winner){

        console.log("CHECKMATE: ",winner)
        const roomId = clientToRoom.get(client.id)
        const room = rooms.get(roomId)
        
        const data = {
            winner:winner,
            timerW:321,
            timerB:75,
            countTurns: room.gameInfo.countTurn,
            gameInfo:room.gameInfo

        }

        io.to(roomId).emit('gameover-gg',data)
    })



    client.on("start-turn-based", function(data){

        const roomId = clientToRoom.get(client.id)
        const room = rooms.get(roomId)

        room.gameInfo.gameStatus = "turnBased"
        room.gameInfo.turnBasedInfo.pieceW = data.pieceW
        room.gameInfo.turnBasedInfo.pieceB = data.pieceB
        room.gameInfo.turnBasedInfo.hpW = hpCount[data.pieceW.toLowerCase()]
        room.gameInfo.turnBasedInfo.hpB = hpCount[data.pieceB.toLowerCase()]
        room.gameInfo.turnBasedInfo.currentTurn = data.currentTurn

        io.to(roomId).emit('turn-based-update',room.gameInfo)
    })


    // "p":{
    //     self:["evasion"],
    //     opponent:["pawn-shoot"]
    // },
    // "s":{
    //     self:["contre-attack","evasion"],
    //     opponent:["bishop-shoot"] // ignore all shields/evasions
    // },
    // "r":{
    //     self:["healing"],
    //     opponent:["heavy-shoot","rook-shoot"]
    // },
    // "k":{
    //     self:["stacking"],
    //     opponent:["kamicadze"]
    // },
    // "q":{
    //     self:["def-piece"],
    //     opponent:["heavy-shoot","kamicadze","bishop-shoot"]
    // },
    // "k":{
    //     self:["vampiring","spikes","prayers"],
    //     opponent:[]
    // }

    client.on("evasion-send", function(data){

    })
    client.on("pawn-shoot-send", function(data){
        
    })



    client.on("contre-attack-send", function(data){
        
    })
    client.on("bishop-shoot-send", function(data){
        
    })



    client.on("healing-send", function(data){
        
    })
    client.on("heavy-shoot-send", function(data){
        
    })
    client.on("rook-shoot-send", function(data){
        
    })



    client.on("stacking-send", function(data){
        
    })
    client.on("kamicadze-send", function(data){
        
    })



    client.on("def-piece-send", function(data){

    })


    client.on("vampiring-send", function(data){
        
    })
    client.on("spikes-send", function(data){

    })
    client.on("prayers-send", function(data){
        
    })
    



    client.on('disconnect', function () {
        console.log(`Client ${client.id} disconnected`)

        const roomId = clientToRoom.get(client.id)
        const role = getClientRole(client.id)
        if (roomId) {
            const room = rooms.get(roomId)
            if (room) {
                if (role === 'player') {
                    room.players = room.players.filter(id => id !== client.id)
                    console.log(`Player ${client.id} left room ${roomId} (kept in original order & colors for rejoin)`)
                } else if (role === 'spectator') {
                    if (room.spectators) {
                        room.spectators = room.spectators.filter(id => id !== client.id)
                    }
                    console.log(`Spectator ${client.id} left room ${roomId}`)
                }
                clientToRoom.delete(client.id)
                clientRole.delete(client.id)
                clientColor.delete(client.id)

                console.log(`Room ${roomId} now has ${room.players.length} players and ${room.spectators ? room.spectators.length : 0} spectators`)
                console.log(`Original player order preserved:`, room.originalPlayerOrder)

                io.emit('rooms-list', getAvailableRooms())
                cleanupRoom(roomId)
            }
        }
    })
})

server.listen(PORT)
console.log(`Server ${PORT}`)
