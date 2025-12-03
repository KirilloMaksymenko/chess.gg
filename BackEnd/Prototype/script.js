const socket = io()
        let clientId = null
        let roomId = null
        let playerRole = null
        let playerColor = null

        const urlParams = new URLSearchParams(window.location.search)
        roomId = urlParams.get('roomId') || localStorage.getItem('roomId')

        if (roomId) {
            document.getElementById('room-id').textContent = roomId
            localStorage.setItem('roomId', roomId)
        }

        socket.on('connect', function() {
            console.log('Connected to server on game page')
            if (roomId) {
                console.log('Rejoining room:', roomId)
                socket.emit('rejoin-room', { roomId: roomId })
            }
        })

        socket.on('client-id', function(clientid) {
            console.log('Received client ID on game page:', clientid)
            clientId = clientid
            document.getElementById('player-id').textContent = clientId
            localStorage.setItem('userId', clientId)
            
            if (roomId && socket.connected) {
                console.log('Rejoining room after receiving client ID:', roomId)
                socket.emit('rejoin-room', { roomId: roomId })
            }
        })

        socket.on('room-rejoined', function(data) {
            console.log('Successfully rejoined room:', data)
            if (data && data.roomId) {
                roomId = data.roomId
                playerRole = data.role
                playerColor = data.color
                document.getElementById('room-id').textContent = roomId
                document.getElementById('player-role').textContent = playerRole === 'player' ? 'Гравець' : 'Глядач'
                document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'Білі' : 'Чорні') : '-'
                document.getElementById('players-count').textContent = data.playersCount || 0
                document.getElementById('spectators-count').textContent = data.spectatorsCount || 0
                console.log(`Room ${roomId} has ${data.playersCount} players and ${data.spectatorsCount} spectators`)
                console.log(`Your role: ${playerRole}, color: ${playerColor}`)
                if (data.playerColors) {
                    console.log('Player colors:', data.playerColors)
                }
            }
        })

        socket.on('role-info', function(data) {
            console.log('Role info received:', data)
            if (data) {
                playerRole = data.role
                playerColor = data.color
                document.getElementById('player-role').textContent = playerRole === 'player' ? 'Гравець' : 'Глядач'
                document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'Білі' : 'Чорні') : '-'
                if (data.roomId) {
                    roomId = data.roomId
                    document.getElementById('room-id').textContent = roomId
                }
            }
        })

        socket.on('color-info', function(data) {
            console.log('Color info received:', data)
            if (data) {
                playerColor = data.color
                playerRole = data.role
                document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'Білі' : 'Чорні') : '-'
                document.getElementById('player-role').textContent = playerRole === 'player' ? 'Гравець' : 'Глядач'
                if (data.roomId) {
                    roomId = data.roomId
                    document.getElementById('room-id').textContent = roomId
                }
            }
        })

        socket.on('player-color-assigned', function(data) {
            console.log('Player color assigned:', data)
            if (data) {
                playerColor = data.color
                document.getElementById('player-color').textContent = playerColor === 'white' ? 'Білі' : 'Чорні'
                console.log(`You are player ${data.playerNumber} with color ${playerColor}`)
            }
        })

        socket.on('player-rejoined', function(data) {
            console.log('Another player rejoined:', data)
        })

        socket.on('error', function(error) {
            console.error('Socket error:', error)
            if (error.message) {
                alert(error.message)
            }
        })

        function checkRole() {
            if (socket.connected) {
                socket.emit('get-role')
                console.log('Requesting role information...')
            } else {
                alert('Не підключено до сервера')
            }
        }

        function checkColor() {
            if (socket.connected) {
                socket.emit('get-color')
                console.log('Requesting color information...')
            } else {
                alert('Не підключено до сервера')
            }
        }

        function isPlayer() {
            return playerRole === 'player'
        }

        function isSpectator() {
            return playerRole === 'spectator'
        }

        function isWhite() {
            return playerColor === 'white'
        }

        function isBlack() {
            return playerColor === 'black'
        }

        window.checkRole = checkRole
        window.checkColor = checkColor
        window.isPlayer = isPlayer
        window.isSpectator = isSpectator
        window.isWhite = isWhite
        window.isBlack = isBlack
        window.getRole = function() { return playerRole }
        window.getColor = function() { return playerColor }

        const storedUserId = localStorage.getItem('userId')
        if (storedUserId) {
            document.getElementById('player-id').textContent = storedUserId + ' (оновлюється...)'
        }