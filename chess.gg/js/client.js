


let clientId = ""
let currentRoomId = null

let gamemode = "mode-Classic"

const socket = io()

socket.on('connect', function() {
    console.log('Connected to server')
})

socket.on('disconnect', function() {
    console.log('Disconnected from server')
})

socket.on('connect_error', function(error) {
    console.error('Connection error:', error)
    alert('Server connection error')
})

socket.on('client-id', function(clientid) {
    console.log('Received client ID:', clientid)
    const idElement = document.getElementById("id-client-text")
    if (idElement) {
        idElement.textContent = clientid
    }
    clientId = clientid
})

socket.on('rooms-list', function(rooms) {
    console.log('Received rooms list:', rooms)
    updateRoomsList(rooms)
})

socket.on('room-created', function(data) {
    console.log("Room created event:", data)
    if (data && data.roomId) {
        currentRoomId = data.roomId
        const currentRoomElement = document.getElementById("current-room")
        if (currentRoomElement) {
            const roleText = data.role === 'player' ? 'Player' : 'Spectator'
            currentRoomElement.textContent = `Your room: ${data.roomId} (You: ${roleText}, player expectations...)`
            currentRoomElement.style.display = "block"
        }
        console.log("Room created, currentRoomId set to:", currentRoomId, "role:", data.role, "color:", data.color)
        if (data.role) {
            localStorage.setItem('playerRole', data.role)
        }
        if (data.color) {
            localStorage.setItem('playerColor', data.color)
        }
    }
})

socket.on('room-joined', function(data) {
    console.log("Room joined event:", data)
    if (data && data.roomId) {
        currentRoomId = data.roomId
        const currentRoomElement = document.getElementById("current-room")
        if (currentRoomElement) {
            const roleText = data.role === 'player' ? 'Player' : 'Spectator'
            currentRoomElement.textContent = `You are in the room: ${data.roomId} (You: ${roleText})`
            currentRoomElement.style.display = "block"
        }
        console.log("Room joined, currentRoomId set to:", currentRoomId, "role:", data.role, "color:", data.color)
        if (data.role) {
            localStorage.setItem('playerRole', data.role)
        }
        if (data.color) {
            localStorage.setItem('playerColor', data.color)
        }
    }
})

socket.on('redirect', function(url) {
    console.log("Redirect event received, redirecting to:", url)
    console.log("Current clientId:", clientId)
    console.log("Current roomId:", currentRoomId)
    
    const urlParams = new URLSearchParams(url.split('?')[1] || '')
    const roomIdFromUrl = urlParams.get('roomId')
    if (roomIdFromUrl) {
        currentRoomId = roomIdFromUrl
        console.log("Extracted roomId from URL:", currentRoomId)
    }
    
    if (!clientId && socket.id) {
        clientId = socket.id
        console.log("Using socket.id as clientId:", clientId)
    }
    
    if (clientId) {
        console.log("Saving userId to localStorage:", clientId)
        localStorage.setItem('userId', clientId)
    } else {
        console.warn("Warning: clientId is not set before redirect!")
    }
    
    if (currentRoomId) {
        localStorage.setItem('roomId', currentRoomId)
    }
    
    setTimeout(() => {
        console.log("Performing redirect to:", url)
        console.log("Final clientId before redirect:", clientId)
        window.location.replace(url)
    }, 300)
})

socket.on('error', function(error) {
    alert(error.message || 'Error')
    console.error('Error:', error)
})

function updateRoomsList(rooms) {
    const roomsList = document.getElementById("rooms-list")
    if (!roomsList) {
        console.error('rooms-list element not found')
        return
    }
    
    roomsList.innerHTML = ""

    if (!rooms || rooms.length === 0) {
        roomsList.innerHTML = '<p class="no-rooms">No rooms available</p>'
        return
    }

    rooms.forEach(room => {
        if(room.gamemode === gamemode){
            const roomElement = document.createElement('div')
            roomElement.className = 'room-item'
            roomElement.innerHTML = `
                <div class="room-list-item">
                    <div class="text-block">
                        <img class="panel-room-img" src="/Source/panel.png" alt="">
                        <div class="text-item">
                            <span class="room-id">#${room.roomId}</span>
                            <span class="room-players">${room.playersCount}/${room.maxPlayers}</span>
                        </div>
                    </div>
                    
                    <button class="join-btn" data-room-id="${room.roomId}"><img class="bt-join-img" src="/Source/bt_join.png" alt=""></button>
                </div>
            `
            roomsList.appendChild(roomElement)
        }
    })

    document.querySelectorAll('.join-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true)
        btn.parentNode.replaceChild(newBtn, btn)
        newBtn.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id')
            console.log('Joining room:', roomId)
            joinRoom(roomId)
        })
    })
}

function joinRoom(roomId) {
    if (currentRoomId) {
        alert('You are already in the room')
        return
    }
    socket.emit('join-room', { roomId: roomId })
}

function createRoom() {
    if (currentRoomId) {
        alert('You are already in the room.')
        return
    }
    const data = {
        gamemode: gamemode
    }
    socket.emit('create-room', data)
}

function init() {
    const createBtn = document.getElementById("create-room-bt")
    if (createBtn) {
        createBtn.addEventListener("click", createRoom)
    }

    setInterval(() => {
        socket.emit('get-rooms')
    }, 100)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}

document.getElementById('select-mode-id').addEventListener("change", function(e){
    gamemode = e.target.value
})
