//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///          GAME FUNCTIONS   /////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ctx = document.getElementById("canvas").getContext("2d")

let map = [
    ["R","P","","","","","p","r"],
    ["N","P","","","","","p","n"],
    ["S","P","","","","","p","s"],
    ["Q","P","","","","","p","q"],
    ["K","P","","","","","p","k"],
    ["S","P","","","","","p","s"],
    ["N","P","","","","","p","n"],
    ["R","P","","","","","p","r"],
]

const ImgLinks = {
    "p":"/Source/Paws/v1/pawn_w.png",
    "r":"/Source/Paws/v1/rok_w.png",
    "s":"/Source/Paws/v1/slon_w.png",
    "n":"/Source/Paws/v1/horse_w.png",
    "k":"/Source/Paws/v1/king_w.png",
    "q":"/Source/Paws/v1/quin_w.png",

    "P":"/Source/Paws/v1/pawn_b_2.png",
    "R":"/Source/Paws/v1/rok_b_2.png",
    "S":"/Source/Paws/v1/slon_b_2.png",
    "N":"/Source/Paws/v1/horse_b_2.png",
    "K":"/Source/Paws/v1/king_b_2.png",
    "Q":"/Source/Paws/v1/quin_b_2.png",
}

const ImgObj = {};
const bgImage = new Image();
const pointImage = new Image();
const pointAttImage = new Image();
const cellImage = new Image();

let imagesLoaded = false;

let selectedPiece = null; 
let validMoves = [];
let lastTurn = null
let posSelect = null

let yourColor = null
let countTurn = 0;
let currentTurn = 'white'; // 'white'  'black'
let gameStatus = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate' ,'selectNewPawn'
let winner = null; // 'white', 'black', null
let timerWhite = 600;
let timerBlack = 600;
let intervalBlack = null;
let intervalWhite = null;

function preloadImages() {
    const imagePromises = [];
    
    if(yourColor==="white"){
        bgImage.src = "/Source/bg_chess.png"
    }else{
        bgImage.src = "/Source/bg_chess_2.png"
    }
    
    imagePromises.push(new Promise((resolve) => {
        bgImage.onload = resolve;
        bgImage.onerror = resolve; 
    }));
    
    for (const [key, src] of Object.entries(ImgLinks)) {
        ImgObj[key] = new Image();
        ImgObj[key].src = src;
        imagePromises.push(new Promise((resolve) => {
            ImgObj[key].onload = resolve;
            ImgObj[key].onerror = resolve;
        }));
    }
    pointImage.src = "/Source/point.png";
    imagePromises.push(new Promise((resolve) => {
        pointImage.onload = resolve;
        pointImage.onerror = resolve;
    }));
    
    pointAttImage.src = "/Source/point_att.png";
    imagePromises.push(new Promise((resolve) => {
        pointAttImage.onload = resolve;
        pointAttImage.onerror = resolve;
    }));

    cellImage.src = "/Source/cell.png";
    imagePromises.push(new Promise((resolve) => {
        cellImage.onload = resolve;
        cellImage.onerror = resolve;
    }));
    
    Promise.all(imagePromises).then(() => {
        imagesLoaded = true;
        console.log("Pre")
        draw(); 
    });
}

function draw(){
    console.log("SYKA",map)
    if (!imagesLoaded) {
        return;
    }
    
    const canvas = document.getElementById("canvas");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(bgImage, 0, 0);
    
    const boardStartX = 32;
    const boardStartY = 45; 
    const cellWidth = 117;
    const cellHeight = 103;
    
    for (let row = 0; row < 8; row++) {
        for (let colom = 0; colom < 8; colom++) {
            let piece = map[colom][row];
            
            if(piece && ImgObj[piece]){
                ctx.drawImage(ImgObj[piece], 60+117*colom, 103*row+20, 50, 100);
            }
        }
    }

    if(gameStatus == "selectNewPawn" && yourColor === currentTurn){
        console.log(posSelect)
        const piecSelect = ["r","n","s","q"]
        const piece = map[posSelect[0]][posSelect[1]]
        let dec = 0
        if(posSelect[0]>4) dec = 3
        else dec = posSelect[0]-1

        for (let i = 0; i < 4; i++) {
            console.log(posSelect[0]+50+i*117, posSelect[1])
            //ctx.rect(dec*117+200+i*117, posSelect[1]*103, 117, 103);
            //ctx.fillStyle = "lightblue";
            //ctx.fill();
            //ctx.rect(dec*117+200+i*117, posSelect[1]*103, 117, 103);
            //ctx.stroke();
            ctx.drawImage(cellImage, dec*117+200+i*117, posSelect[1]*103, 117, 103);
            ctx.drawImage(ImgObj[piece === piece.toLowerCase() ?  piecSelect[i] : piecSelect[i].toUpperCase()], dec*117+235+117*i, posSelect[1]*103+10, 40, 80);
            
        }
    }
}

function getCell(x, y){
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const scaledX = canvasX * scaleX;
    const scaledY = canvasY * scaleY;
    
    const boardStartX = 32;
    const boardStartY = 50; 
    const cellWidth = 117;
    const cellHeight = 103;
    const boardEndX = boardStartX + cellWidth * 8;
    const boardEndY = boardStartY + cellHeight * 8;
    
    if (scaledX < boardStartX || scaledX > boardEndX || scaledY < boardStartY || scaledY > boardEndY) {
        return -1;
    }

    const col = Math.ceil((scaledX - boardStartX) / cellWidth);
    const row = Math.ceil((scaledY - boardStartY) / cellHeight);
    
    return [col, row];
}

function getCellSelect(x, y){
    const canvas = document.getElementById("canvas");
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const scaledX = canvasX * scaleX;
    const scaledY = canvasY * scaleY;
    
    let dec = 0
    if(posSelect[0]>4) dec = 3
    else dec = posSelect[0]-1

    const boardStartX = dec*117+200;
    const boardStartY = posSelect[1]*103; 
    const cellWidth = 117;
    const cellHeight = 103;
    const boardEndX = boardStartX + cellWidth * 4;
    const boardEndY = posSelect[1]*103+103

    console.log(scaleX,scaleY," - ",boardStartX,boardStartY," / ",boardEndX,boardEndY)
    if (scaledX < boardStartX || scaledX > boardEndX || scaledY < boardStartY || scaledY > boardEndY) {
        return -1;
    }

    const col = Math.ceil((scaledX - boardStartX) / cellWidth);
    const row = Math.ceil((scaledY - boardStartY) / cellHeight);
    
    return [col, row];
}

const canvas = document.getElementById("canvas");
canvas.addEventListener("click", movePoint, true);
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    movePoint(e);
}, true);

function pawnMoves(piece, pos, collectMoves = false) {
    const moves = [];
    const col = pos[0] - 1;
    const row = pos[1] - 1;
    
    const direction = -1  
    const startRow = 6 

    const oneStepCol = col;
    const oneStepRow = row + direction;
    
    if (oneStepRow >= 0 && oneStepRow < 8) {
        if (!map[oneStepCol][oneStepRow]) {
            if (collectMoves) {
                moves.push([oneStepCol, oneStepRow]);
            } else if (imagesLoaded && pointImage.complete) {
                ctx.drawImage(pointImage, oneStepCol*117+75, oneStepRow*103+85, 25, 25);
            }
            
            if (row === startRow) {
                const twoStepRow = row + 2 * direction;
                if (twoStepRow >= 0 && twoStepRow < 8 && !map[oneStepCol][twoStepRow]) {
                    if (collectMoves) {
                        moves.push([oneStepCol, twoStepRow]);
                    } else if (imagesLoaded && pointImage.complete) {
                        ctx.drawImage(pointImage, oneStepCol*117+75, twoStepRow*103+85, 25, 25);
                    }
                }
            }
        }
    }
    
    const attackDirections = [[-1, direction], [1, direction]];
    
    for (const [dCol, dRow] of attackDirections) {
        const attackCol = col + dCol;
        const attackRow = row + dRow;
        
        if (attackCol >= 0 && attackCol < 8 && attackRow >= 0 && attackRow < 8) {
            const targetPiece = map[attackCol][attackRow];

            if (targetPiece && enemyColor(piece, targetPiece)) {
                if (collectMoves) {
                    moves.push([attackCol, attackRow]);
                } else if (imagesLoaded && pointAttImage.complete) {
                    ctx.drawImage(pointAttImage, attackCol*117+75, attackRow*103+85, 25, 25);
                }
            }
        }
    }
    
    return moves;
}

function getValidMoves(piece, pos) {
    const moves = [];
    
    switch (piece.toLowerCase()) {
        case "p":
            moves.push(...pawnMoves(piece, pos, true));
            break;
        case "r":
            moves.push(...smoothPath([[1,0],[-1,0],[0,1],[0,-1]], pos, true));
            break;
        case "s":
            moves.push(...smoothPath([[1,1],[-1,1],[-1,-1],[1,-1]], pos, true));
            break;
        case "n":
            moves.push(...pointPos([[-2,1],[-2,-1],[1,2],[-1,2],[2,1],[2,-1],[1,-2],[-1,-2]], pos, true));
            break;
        case "k":
            moves.push(...pointPos([[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]], pos, true));
            break;
        case "q":
            moves.push(...smoothPath([[1,1],[-1,1],[-1,-1],[1,-1],[1,0],[-1,0],[0,1],[0,-1]], pos, true));
            break;
    }
    
    return moves;
}

function isValidMove(targetCol, targetRow) {
    return validMoves.some(move => move[0] === targetCol && move[1] === targetRow);
}

function findKing(color) {
    const king = color === 'white' ? 'k' : 'K';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (map[col][row] === king) {
                return [col, row];
            }
        }
    }
    return null;
}

function isKingInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;
    
    const [kingCol, kingRow] = kingPos;
    const enemyColor = color === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = map[col][row];
            if (!piece) continue;
            
            const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
            if (pieceColor !== enemyColor) continue;
            
            const moves = getValidMoves(piece, [col + 1, row + 1]);

            if (moves.some(move => move[0] === kingCol && move[1] === kingRow)) {
                return true;
            }
        }
    }
    
    return false;
}

function wouldMovePutKingInCheck(fromCol, fromRow, toCol, toRow, color) {
    const originalPiece = map[fromCol][fromRow];
    const targetPiece = map[toCol][toRow];
    
    map[toCol][toRow] = originalPiece;
    map[fromCol][fromRow] = "";
    
    const inCheck = isKingInCheck(color);
    
    map[fromCol][fromRow] = originalPiece;
    map[toCol][toRow] = targetPiece;
    
    return inCheck;
}

function getValidMovesWithCheck(piece, pos) {
    const moves = getValidMoves(piece, pos);
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    
    const [fromCol, fromRow] = [pos[0] - 1, pos[1] - 1];
    return moves.filter(([toCol, toRow]) => {
        return !wouldMovePutKingInCheck(fromCol, fromRow, toCol, toRow, pieceColor);
    });
}

function hasValidMoves(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = map[col][row];
            if (!piece) continue;
            
            const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
            if (pieceColor !== color) continue;
            
            const validMoves = getValidMovesWithCheck(piece, [col + 1, row + 1]);
            if (validMoves.length > 0) {
                return true;
            }
        }
    }
    return false;
}

function updateGameStatus() {
    const inCheck = isKingInCheck(currentTurn);
    const hasMoves = hasValidMoves(currentTurn);


    if(gameStatus == 'selectNewPawn'){
        return
    }
    if (!hasMoves) {
        if (inCheck) {
            gameStatus = 'checkmate';
            winner = currentTurn === 'white' ? 'black' : 'white';
            console.log("Winner")
            
        } else {
            gameStatus = 'stalemate';
        }
    } else if (inCheck) {
        gameStatus = 'check';
    } else {
        gameStatus = 'playing';
    }
    console.log(winner)

    
}

function logGame(msg){
    const moveCount = document.getElementById("move-count")

    var msgSpan = document.createElement('span')
    msgSpan.textContent = msg;

    var newLine = document.createElement("br")
    
    if(lastTurn != null){
        moveCount.appendChild(msgSpan);
        moveCount.insertBefore(msgSpan,lastTurn)
        moveCount.appendChild(newLine);
        moveCount.insertBefore(newLine,lastTurn)
        lastTurn = msgSpan
    }else{
        moveCount.appendChild(msgSpan);
        lastTurn = msgSpan
    }
    return msg
}

function selectNewPawn(pos,L){

    map[pos[0]][pos[1]] = L;
    gameStatus = 'playing'
    updateData()

}

function movePiece(fromCol, fromRow, toCol, toRow) {
    countTurn += 1

    const piece = map[fromCol][fromRow];
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    
    if (pieceColor !== currentTurn) {
        return;
    }


    msg = countTurn+". "+ pieceColor + ": " + String.fromCharCode(fromCol+65) + ""+ (8-fromRow) + " -> "+ String.fromCharCode(toCol+65) + ""+ (8-toRow)
    if(enemyColor(map[fromCol][fromRow],map[toCol][toRow])) msg+= " #"+map[toCol][toRow]

    if(piece =="p" && toRow == 0){
        map[toCol][toRow] = piece;
        gameStatus = 'selectNewPawn'
        posSelect = [toCol,toRow]
        


    }else if(piece =="P" && toRow == 7){


        map[toCol][toRow] = piece;
        gameStatus = 'selectNewPawn'
        posSelect = [toCol,toRow]
        
    }else{
        map[toCol][toRow] = piece;
    }

    
    map[fromCol][fromRow] = "";

    selectedPiece = null;
    validMoves = [];

    if(gameStatus != 'selectNewPawn'){
        currentTurn = currentTurn === 'white' ? 'black' : 'white';
    }
    

    
    updateData()
    
console.log("movepice")
    draw();
}

function updateData(){
    let newMap = []

    let clonMap = map.map(row => [...row])
    console.log("UPDTE send", map)
    if(yourColor==='white'){
        newMap = clonMap
    }else{

        for (let i = 0; i < clonMap.length; i++) {
            newMap[i] = [...clonMap[i]].reverse()   
        }
    }
    
    updateGameStatus();
    let data = {
        map: newMap,
        countTurn: countTurn,
        currentTurn: currentTurn,
        gameStatus: gameStatus,
        winner: winner,
        log: msg
    }
    socket.emit('game-turn',data)
    displayGameStatus();
}

function displayGameStatus() {
    const turnElement = document.getElementById('currentTurn');
    const statusElement = document.getElementById('status');
    
    if (turnElement) {
        turnElement.textContent = currentTurn === 'white' ? 'White' : 'Black';
    }
    
    if (statusElement) {
        if (gameStatus === 'checkmate') {
            statusElement.textContent = `Checkmate! Won: ${winner === 'white' ? 'White' : 'Black'}`;
            alert(`Checkmate! Won: ${winner === 'white' ? 'White' : 'Black'}`);
            updateData()
        } else if (gameStatus === 'stalemate') {
            statusElement.textContent = 'No way! Draw';
            alert('No way! Draw');
        } else if (gameStatus === 'check') {
            statusElement.textContent = 'Check!';
        } else {
            statusElement.textContent = 'The game continue';
        }
    }
}

function movePoint(e){

    if(yourColor !== currentTurn){
        return
    }

    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    
    if (!x || !y) {
        return;
    }

    if(gameStatus == 'selectNewPawn'){

        let t = getCellSelect(x,y)
        console.log(x,y,t)
        if (t === -1) {
            return;
        }
        const piecSelect = ["r","n","s","q"]
        const piece = map[posSelect[0]][posSelect[1]]

        selectNewPawn([posSelect[0],posSelect[1]],piece === piece.toLowerCase() ?  piecSelect[t[0]-1] : piecSelect[t[0]-1].toUpperCase())
        console.log("selecnewpaw")
        draw()
        return
    }
    
    let u = getCell(x, y);
    
    if (u === -1) {
        return;
    }
    
    const col = u[0]-1;
    const row = u[1]-1;

    if (selectedPiece !== null) {
        const [selectedCol, selectedRow] = selectedPiece;
        
        if (isValidMove(col, row)) {
            movePiece(selectedCol, selectedRow, col, row);
            return;
        }
        
        if (col === selectedCol && row === selectedRow) {
            selectedPiece = null;
            validMoves = [];
            console.log("1")
            draw();
            return;
        }

        const clickedPiece = map[col][row];
        if (clickedPiece && sameColor(map[selectedCol][selectedRow], clickedPiece)) {
            const pieceColor = clickedPiece === clickedPiece.toLowerCase() ? 'white' : 'black';
            if (pieceColor !== currentTurn) {
                selectedPiece = null;
                validMoves = [];
                console.log("2")
                draw();
                return;
            }
            selectedPiece = [col, row];
            validMoves = getValidMovesWithCheck(clickedPiece, u);
            console.log("3")
            draw();
            showMoves(clickedPiece, u);
            return;
        }

        selectedPiece = null;
        validMoves = [];
        console.log("4")
        draw();
        return;
    }

    const piece = map[col][row];
    if (!piece) {
        console.log("5")
        draw();
        return;
    }
    
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    if (pieceColor !== currentTurn) {
        console.log("6")
        draw();
        return;
    }

    selectedPiece = [col, row];
    validMoves = getValidMovesWithCheck(piece, u);
    console.log("6")
    draw();
    showMoves(piece, u);
}

function showMoves(piece, pos) {
    switch (piece.toLowerCase()) {
        case "p":
            pawnMoves(piece, pos);
            break;
        case "r":
            smoothPath([[1,0],[-1,0],[0,1],[0,-1]], pos);
            break;
        case "s":
            smoothPath([[1,1],[-1,1],[-1,-1],[1,-1]], pos);
            break;
        case "n":
           pointPos([[-2,1],[-2,-1],[1,2],[-1,2],[2,1],[2,-1],[1,-2],[-1,-2]], pos);
            break;
        case "k":
            pointPos([[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]], pos);
            break;
        case "q":
            smoothPath([[1,1],[-1,1],[-1,-1],[1,-1],[1,0],[-1,0],[0,1],[0,-1]], pos);
            break;
    }
}

function smoothPath(directions,pos, collectMoves = false){
    const moves = [];
    
    for (let i = 0; i < directions.length; i++) {
        for (let d = 1; d < 8; d++) {
            const e = directions[i];
            
            const targetCol = pos[0]-1+e[0]*d;
            const targetRow = pos[1]-1+e[1]*d;

            if(targetCol < 0 || targetCol >= 8 || targetRow < 0 || targetRow >= 8) {
                break
            }
            
            if(sameColor(map[pos[0]-1][pos[1]-1],map[targetCol][targetRow])){
                break
            }

            if(enemyColor(map[pos[0]-1][pos[1]-1],map[targetCol][targetRow])){
                if (imagesLoaded && pointAttImage.complete && !collectMoves) {
                    ctx.drawImage(pointAttImage, ((pos[0]-1)+e[0]*d)*117+75, ((pos[1]-1)+e[1]*d)*103+85, 25, 25);
                }
                if (collectMoves) {
                    moves.push([targetCol, targetRow]);
                }
                break
            }else{
                if (imagesLoaded && pointImage.complete && !collectMoves) {
                    ctx.drawImage(pointImage, ((pos[0]-1)+e[0]*d)*117+75, ((pos[1]-1)+e[1]*d)*103+85, 25, 25);
                }
                if (collectMoves) {
                    moves.push([targetCol, targetRow]);
                }
            }
        }
    }
    
    return moves;
}

function pointPos(directions,pos, collectMoves = false){
    const moves = [];

    for (let i = 0; i < directions.length; i++) {
        const e = directions[i];
        
        const targetCol = pos[0]-1+e[0];
        const targetRow = pos[1]-1+e[1];
        
        if(targetCol < 0 || targetCol >= 8 || targetRow < 0 || targetRow >= 8) {
            continue
        }

        if(sameColor(map[pos[0]-1][pos[1]-1],map[targetCol][targetRow])){
            continue
        }
        
        if(enemyColor(map[pos[0]-1][pos[1]-1],map[targetCol][targetRow])){
        
            if (imagesLoaded && pointAttImage.complete && !collectMoves) {
                ctx.drawImage(pointAttImage, ((pos[0]-1)+e[0])*117+75, ((pos[1]-1)+e[1])*103+85, 25, 25);
            }
            if (collectMoves) {
                moves.push([targetCol, targetRow]);
            }
        }else{
            if (imagesLoaded && pointImage.complete && !collectMoves) {
                ctx.drawImage(pointImage, ((pos[0]-1)+e[0])*117+75, ((pos[1]-1)+e[1])*103+85, 25, 25);
            }
            if (collectMoves) {
                moves.push([targetCol, targetRow]);
            }
        }
    }
    
    return moves;
}
function sameColor(ch1, ch2) {
    if (!ch1 || !ch2) {
    return false;
    }

    const isUpper1 = ch1 === ch1.toUpperCase();
    const isUpper2 = ch2 === ch2.toUpperCase();

    return isUpper1 === isUpper2;
}

function enemyColor(ch1, ch2) {
    if (!ch1 || !ch2) {
    return false;
    }

    const isUpper1 = ch1 === ch1.toUpperCase();
    const isUpper2 = ch2 === ch2.toUpperCase();

    return isUpper1 !== isUpper2;
}


function flipMap(data){
    console.log("FLIP START",map," - ",data)
    let cloneMap = data.map(row => [...row])
    if(yourColor==='white'){
        console.log("MAP ====",map)
        map = cloneMap
    }else{
        console.log("Black flip")
        let newMap = []
        for (let i = 0; i < cloneMap.length; i++) {
            newMap[i] = [...cloneMap[i]].reverse()   
        }
        console.log("MAP ====",map)
        map = newMap
    }
    console.log("FLIP END",map)
}

function timerResume(color){
    document.getElementById('timer-'+color).style

}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////        SERVER FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        yourColor = data.color

        if(data.gameInfo.log){
            for (let i = 1; i < data.gameInfo.log.length; i++) {
                logGame(msgs=data.gameInfo.log[i])    
            }
        }
        
        timer
        document.getElementById('room-id').textContent = roomId
        document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'White' : 'Black') : '-'
        document.getElementById('spectators-count').textContent = data.spectatorsCount || 0
        console.log(`Room ${roomId} has ${data.playersCount} players and ${data.spectatorsCount} spectators`)
        console.log(`Your role: ${playerRole}, color: ${playerColor}`)
        if (data.playerColors) {
            console.log('Player colors:', data.playerColors)
        }


        countTurn = data.gameInfo.countTurn
        currentTurn = data.gameInfo.currentTurn
        gameStatus = data.gameInfo.gameStatus
        winner = data.gameInfo.winner

        console.log("MAP: ",data.gameInfo.map)
        flipMap(data.gameInfo.map)
        
        
        preloadImages();

        setTimeout(() => {
            updateGameStatus();
            displayGameStatus();
        }, 100);
        console.log("roomrej")
        draw()
    }
})

socket.on('role-info', function(data) {
    console.log('Role info received:', data)
    if (data) {
        playerRole = data.role
        playerColor = data.color
        document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'White' : 'Black') : '-'
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
        document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'White' : 'Black') : '-'
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
        document.getElementById('player-color').textContent = playerColor === 'white' ? 'White' : 'Black'
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

socket.on('update-game-state', function(data){
    countTurn = data.countTurn
    currentTurn = data.currentTurn
    gameStatus = data.gameStatus
    winner = data.winner

    console.log("MAP: ",data.map)

    timerResume(data.currentTurn)
    flipMap(data.map)

    logGame(data.log[data.countTurn])
    updateGameStatus();
    displayGameStatus();
    console.log("updatestate",map)
    draw()

})




