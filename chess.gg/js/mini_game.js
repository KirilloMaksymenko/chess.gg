const ctx = document.getElementById("canvas").getContext("2d");



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

    "P":"/Source/Paws/v1/pawn_b.png",
    "R":"/Source/Paws/v1/rok_b.png",
    "S":"/Source/Paws/v1/slon_b.png",
    "N":"/Source/Paws/v1/horse_b.png",
    "K":"/Source/Paws/v1/king_b.png",
    "Q":"/Source/Paws/v1/quin_b.png",
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

let countTurn = 0;
let currentTurn = 'white'; // 'white'  'black'
let gameStatus = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate' ,'selectNewPawn'
let winner = null; // 'white', 'black', null

function preloadImages() {
    const imagePromises = [];
    
    bgImage.src = "/Source/bg_chess.png";
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
        draw(); 
    });
}

function draw(){
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

    if(gameStatus == "selectNewPawn"){
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
            ctx.drawImage(ImgObj[piece === piece.toLowerCase() ?  piecSelect[i] : piecSelect[i].toUpperCase()], dec*117+235+117*i, posSelect[1]*103, 50, 100);
            
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
    const isWhite = piece === piece.toLowerCase(); 
    
  
    const direction = isWhite ? -1 : 1; 
    const startRow = isWhite ? 6 : 1; 
    
   


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
        } else {
            gameStatus = 'stalemate';
        }
    } else if (inCheck) {
        gameStatus = 'check';
    } else {
        gameStatus = 'playing';
    }
}


function selectNewPawn(pos,L){

    map[pos[0]][pos[1]] = L;
    gameStatus = 'playing'

}

function movePiece(fromCol, fromRow, toCol, toRow) {
    countTurn += 1

    const piece = map[fromCol][fromRow];
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    
    if (pieceColor !== currentTurn) {
        return;
    }
    
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

    currentTurn = currentTurn === 'white' ? 'black' : 'white';

    
    updateGameStatus();
    displayGameStatus();

    draw();
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
            draw();
            return;
        }

        const clickedPiece = map[col][row];
        if (clickedPiece && sameColor(map[selectedCol][selectedRow], clickedPiece)) {
            const pieceColor = clickedPiece === clickedPiece.toLowerCase() ? 'white' : 'black';
            if (pieceColor !== currentTurn) {
                selectedPiece = null;
                validMoves = [];
                draw();
                return;
            }
            selectedPiece = [col, row];
            validMoves = getValidMovesWithCheck(clickedPiece, u);
            draw();
            showMoves(clickedPiece, u);
            return;
        }

        selectedPiece = null;
        validMoves = [];
        draw();
        return;
    }

    const piece = map[col][row];
    if (!piece) {
        draw();
        return;
    }
    
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    if (pieceColor !== currentTurn) {
        draw();
        return;
    }

    selectedPiece = [col, row];
    validMoves = getValidMovesWithCheck(piece, u);
    
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

preloadImages();


setTimeout(() => {
    updateGameStatus();
    displayGameStatus();
}, 100);