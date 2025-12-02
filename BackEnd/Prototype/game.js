const IP = "localhost"
const PORT = 12345

const socket = io.connect('ws://'+IP+':'+PORT)

socket.on('client-id',function(clientid){
    document.getElementById("player1").textContent = clientid
    clientId = clientid

    const oldclientId = localStorage.getItem('userId');
    socket.emit('change-id',oldclientId)

})