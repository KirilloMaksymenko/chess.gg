

let clientId = ""

const IP = "localhost"
const PORT = 12345

const socket = io.connect('ws://'+IP+':'+PORT)

socket.on('client-id',function(clientid){
    document.getElementById("id-client-text").textContent = clientid
    clientId = clientid
})

socket.on("redirect",(page)=>{
    console.log("redirect")
    localStorage.setItem('userId', clientId);
    window.location.href = page
})

document.getElementById("create-room-bt").addEventListener("click", ()=>{
    console.log("clic")
    socket.emit('create-room', clientId); 
})
