//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///          GAME FUNCTIONS   /////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ctx = document.getElementById("canvas").getContext("2d")
const ctxTurn = document.getElementById("canvas-turn").getContext("2d")

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
        self:["evasion"],
        opponent:["pawn-shoot"]
    },
    "s":{
        self:["contre-attack","evasion"],
        opponent:["bishop-shoot"] // ignore all shields/evasions
    },
    "r":{
        self:["healing"],
        opponent:["heavy-shoot","rook-shoot"]
    },
    "n":{
        self:["stacking"],
        opponent:["kamicadze"]
    },
    "q":{
        self:["def-piece"],
        opponent:["heavy-shoot","kamicadze","bishop-shoot"]
    },
    "k":{
        self:["vampiring","spikes","prayers"],
        opponent:[]
    }
}

const abilitiesDescription = {
    "p":{
        "evasion":"You have chance to evasion 35%",
        "pawn-shoot":"You take 20 dmg"
    },
    "s":{
        "contre-attack":"For next opponent turn you have chance to contre attack opponent on 45%",
        "evasion":"You have chance to evasion 35%",
        "bishop-shoot":"You take 20 dmg and ignore all shields/evasions", // ignore all shields/evasions
    },
    "r":{
        "healing":"You heal 15 hp",
        "heavy-shoot":"You take 50 dmg and with chance 30% 70 dmg, but you skip next turn",
        "rook-shoot":"You take 15 dmg"
    },
    "n":{
        "stacking":"You restore one stack, max 5 stacks",
        "kamicadze":"You take 15 dmg * stacks, but you tacke 10 dmg"
    },
    "q":{
        "def-piece":"You take on 60% less dmg",
        "heavy-shoot":"You take 50 dmg and with chance 30% 70 dmg, but you skip next turn",
        "kamicadze":"You take 35 dmg , but you tacke 10 dmg",
        "bishop-shoot":"You take 25 dmg and ignore all shields/evasions"
    },
    "k":{
        "vampiring":"You heal 20 hp and take 20 dmg to opponent",
        "spikes":"If opponent attack you, to him return 45% dmg",
        "prayers":"If opponent have less than 25% hp he DEAD, but if more, you take 40 dmg"
    }
}


const ImgObj = {};
const bgImage = new Image();
const pointImage = new Image();
const pointAttImage = new Image();
const cellImage = new Image();

const barHp = new Image();
const bar = new Image();
const battleGround = new Image();
const bgTurnBased = new Image();
const cellSpell = new Image();
const cloudColone = new Image();
const colone = new Image();
const handUpB = new Image()
const handPushB = new Image ()
const handUpW = new Image()
const handPushW = new Image ()
const smashW = new Image ()
const smashB = new Image ()
const bookRead = [new Image (),new Image (),new Image ()]


let imagesLoaded = false;

let selectedPiece = null; 
let validMoves = [];
let lastTurn = null
let posSelect = null


let gamemode = null
let yourColor = null
let countTurn = 0;
let currentTurn = 'white'; // 'white'  'black'
let gameStatus = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate' ,'selectNewPawn' , 'turnBased'
let winner = null; // 'white', 'black', null
let loseShow = false;
let kingDead = false

let pieceUse = null
let pieceOpponent = null
let hpUse = null
let hpOpponent = null
let currentBasedTurn = null
let selectedPieceTurn = null
let winnerBasedTurn = null

// let timerWhite = 600;
// let timerBlack = 600;
// let intervalBlack = null;
// let intervalWhite = null;

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
    

    barHp.src = "/Source/TurnBased/bar_hp.png";
    imagePromises.push(new Promise((resolve) => {
        barHp.onload = resolve;
        barHp.onerror = resolve;
    }));
    
    bar.src = "/Source/TurnBased/bar.png";
    imagePromises.push(new Promise((resolve) => {
        bar.onload = resolve;
        bar.onerror = resolve;
    }));
    
    battleGround.src = "/Source/TurnBased/batt_ground.png";
    imagePromises.push(new Promise((resolve) => {
        battleGround.onload = resolve;
        battleGround.onerror = resolve;
    }));
     
    bgTurnBased.src = "/Source/TurnBased/bg_turn_based.png";
    imagePromises.push(new Promise((resolve) => {
        bgTurnBased.onload = resolve;
        bgTurnBased.onerror = resolve;
    }));
    
    cellSpell.src = "/Source/TurnBased/cell_spell.png";
    imagePromises.push(new Promise((resolve) => {
        cellSpell.onload = resolve;
        cellSpell.onerror = resolve;
    }));
    
    cloudColone.src = "/Source/TurnBased/cloud_colone.png";
    imagePromises.push(new Promise((resolve) => {
        cloudColone.onload = resolve;
        cloudColone.onerror = resolve;
    }));
    
    colone.src = "/Source/TurnBased/colone.png";
    imagePromises.push(new Promise((resolve) => {
        colone.onload = resolve;
        colone.onerror = resolve;
    }));

    handUpB.src = "/Source/TurnBased/hand_up_b.png";
    imagePromises.push(new Promise((resolve) => {
        handUpB.onload = resolve;
        handUpB.onerror = resolve;
    }));

    handPushB.src = "/Source/TurnBased/hand_push_b.png";
    imagePromises.push(new Promise((resolve) => {
        handPushB.onload = resolve;
        handPushB.onerror = resolve;
    }));

    handUpW.src = "/Source/TurnBased/hand_up_w.png";
    imagePromises.push(new Promise((resolve) => {
        handUpW.onload = resolve;
        handUpW.onerror = resolve;
    }));

    handPushW.src = "/Source/TurnBased/hand_push_w.png";
    imagePromises.push(new Promise((resolve) => {
        handPushW.onload = resolve;
        handPushW.onerror = resolve;
    }));
    smashB.src = "/Source/TurnBased/smash_b.png";
    imagePromises.push(new Promise((resolve) => {
        smashB.onload = resolve;
        smashB.onerror = resolve;
    }));

    smashW.src = "/Source/TurnBased/smash_w.png";
    imagePromises.push(new Promise((resolve) => {
        smashW.onload = resolve;
        smashW.onerror = resolve;
    }));

    bookRead[0].src = "/Source/TurnBased/book_read_1.png";
    imagePromises.push(new Promise((resolve) => {
        bookRead[0].onload = resolve;
        bookRead[0].onerror = resolve;
    }));
    bookRead[1].src = "/Source/TurnBased/book_read_2.png";
    imagePromises.push(new Promise((resolve) => {
        bookRead[1].onload = resolve;
        bookRead[1].onerror = resolve;
    }));
    bookRead[2].src = "/Source/TurnBased/book_read_3.png";
    imagePromises.push(new Promise((resolve) => {
        bookRead[2].onload = resolve;
        bookRead[2].onerror = resolve;
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
            if(gamemode==="mode-Black"){
                piece = piece.toUpperCase()
            }
            
            if(piece && ImgObj[piece]){
                ctx.drawImage(ImgObj[piece], 60+117*colom, 103*row+20, 50, 100);
            }
        }
    }

    if(gameStatus == "selectNewPawn" && yourColor === currentTurn){
        const piecSelect = ["r","n","s","q"]
        const piece = map[posSelect[0]][posSelect[1]]
        if(gamemode==="mode-Black"){
            piece = piece.toUpperCase()
        }
        let dec = 0
        if(posSelect[0]>4) dec = 3
        else dec = posSelect[0]-1

        for (let i = 0; i < 4; i++) {
            ctx.drawImage(cellImage, dec*117+200+i*117, posSelect[1]*103, 117, 103);
            ctx.drawImage(ImgObj[piece === piece.toLowerCase() ?  piecSelect[i] : piecSelect[i].toUpperCase()], dec*117+235+117*i, posSelect[1]*103+10, 40, 80);
            
        }
    }

    if(gameStatus == "turnBased"){

        const canvasTurn = document.getElementById("canvas-turn");
        canvasTurn.style = "display: block;"
        document.getElementById("panel-sq").style = "display: block;"
        ctxTurn.clearRect(0, 0, canvasTurn.width, canvasTurn.height);
        
        ctxTurn.drawImage(bgTurnBased, 0, 0);
        ctxTurn.drawImage(battleGround, 15, 325);

        let c = 1
        for(let key in abilitiesDescription[pieceUse.toLowerCase()]){
            ctxTurn.save()
            ctxTurn.font = '16px "Rock Salt", serif ';
            ctxTurn.fillText(c+"."+key+"->", 50, 150+30*c*2-30)
            ctxTurn.fillText("  "+abilitiesDescription[pieceUse.toLowerCase()][key], 50, 150+30*c*2)
            ctxTurn.restore()
            c++
        }
      

        ctxTurn.save()
        ctxTurn.font = '24px "Rock Salt", serif ';
        if(winnerBasedTurn){
            ctxTurn.fillText("WINNER: "+winnerBasedTurn, canvasTurn.width/2-100, 100)
        }else{
            ctxTurn.fillText("Turn: "+(yourColor === currentBasedTurn ? "your" : currentBasedTurn), canvasTurn.width/2-100, 100)
        }
        
        ctxTurn.restore()

        ctxTurn.drawImage(colone, 100, 550);
        ctxTurn.drawImage(cloudColone, 100, 750);

        ctxTurn.drawImage(colone, 650, 300);
        ctxTurn.drawImage(cloudColone, 620, 500);

        ctxTurn.save();
        ctxTurn.scale(-1, 1)
        ctxTurn.drawImage(ImgObj[pieceUse], -168-60, 460, 60, 125);
        ctxTurn.restore();
        
        ctxTurn.save();
        ctxTurn.drawImage(ImgObj[pieceOpponent], 718, 210, 60, 125);
        ctxTurn.restore();  

        ctxTurn.drawImage(bar, 150, 595, 100, 25);
        ctxTurn.drawImage(barHp,0,0,100*(hpUse/hpCount[pieceUse.toLowerCase()]),25, 150, 595, 105*(hpUse/hpCount[pieceUse.toLowerCase()]), 25);
        ctxTurn.drawImage(bar, 700, 340, 100, 25);
        ctxTurn.drawImage(barHp,0,0,100*(hpOpponent/hpCount[pieceOpponent.toLowerCase()]),50, 700, 335, 105*(hpOpponent/hpCount[pieceOpponent.toLowerCase()]), 50);

        if(selectedPieceTurn==="use"){
            

            const posUse = [[190,405,0],[270,435,0.9],[300,518,1.8]]
            for (let i = 0; i < abilitiesPieces[pieceUse.toLowerCase()].self.length; i++) {
                ctxTurn.save();
                ctxTurn.translate(posUse[i][0], posUse[i][1])
                ctxTurn.rotate(posUse[i][2])
                ctxTurn.drawImage(cellSpell, -(cellSpell.width/2), -(cellSpell.height/2), 110, 75);
                ctxTurn.restore();  
                ctxTurn.save()
                ctxTurn.font = '24px "Rock Salt", serif ';
                ctxTurn.fillText(abilitiesPieces[pieceUse.toLowerCase()].self[i], posUse[i][0]-(cellSpell.width/2), posUse[i][1])
                ctxTurn.restore(); 

            }
        }
        if(selectedPieceTurn==="opponent"){
            

            const posOpponent = [[740,145,0],[665,190,-0.9],[655,280,-1.8]]
            for (let i = 0; i < abilitiesPieces[pieceUse.toLowerCase()].opponent.length; i++) {
                ctxTurn.save();
                ctxTurn.translate(posOpponent[i][0], posOpponent[i][1])
                ctxTurn.rotate(posOpponent[i][2])
                ctxTurn.drawImage(cellSpell, -(cellSpell.width/2), -(cellSpell.height/2), 110, 75);
                ctxTurn.restore();  
                ctxTurn.save()
                ctxTurn.font = '24px "Rock Salt", serif ';
                ctxTurn.fillText(abilitiesPieces[pieceUse.toLowerCase()].opponent[i], posOpponent[i][0]-(cellSpell.width/2), posOpponent[i][1])
                ctxTurn.restore(); 
            }
        }

    }else{
        document.getElementById("canvas-turn").style = "display: none;"
        document.getElementById("panel-sq").style = "display: none;"
    }

}


async function animSpell(isOpponent,turn){


    if(gameStatus == "turnBased"){
        if(!isOpponent){
            
                console.log("ANIM")
                for (let i = 0; i < 4; i++) {
                    draw()
                    ctxTurn.drawImage(bookRead[0], 170, 520, 85, 50);
                    await new Promise(r => setTimeout(r, 50));

                    draw()
                    ctxTurn.drawImage(bookRead[1], 170, 520, 85, 50);
                    await new Promise(r => setTimeout(r, 50));
                    
                    draw()
                    ctxTurn.drawImage(bookRead[2], 170, 520, 85, 50);
                    await new Promise(r => setTimeout(r, 50));
                    draw()   
                }
                
        }else if(isOpponent && turn === yourColor){

            for (let i = 0; i < 4; i++) {
                draw()
                ctxTurn.save();
                ctxTurn.scale(-1, 1)
                ctxTurn.drawImage(bookRead[0], -670-100, 270, 85, 50);
                ctxTurn.restore();
                await new Promise(r => setTimeout(r, 50));

                draw()
                ctxTurn.save();
                ctxTurn.scale(-1, 1)
                ctxTurn.drawImage(bookRead[1], -670-100, 270, 85, 50);
                ctxTurn.restore();
                await new Promise(r => setTimeout(r, 50));
                
                draw()
                ctxTurn.save();
                ctxTurn.scale(-1, 1)
                ctxTurn.drawImage(bookRead[2], -670-100, 270, 85, 50);
                ctxTurn.restore();
                await new Promise(r => setTimeout(r, 50));

                draw()
            }

        }
    }

}



async function animAttack(isOpponent,turn){


    if(gameStatus == "turnBased"){
        if(!isOpponent){
            const smash = yourColor === "white" ? smashW : smashB
            const frame1 = yourColor === "white" ? handUpW : handUpB
            const frame2 = yourColor === "white" ? handPushW : handPushB
            
                console.log("ANIM")
                
                draw()
                ctxTurn.drawImage(frame1, 100, 500, 100, 80);
                await new Promise(r => setTimeout(r, 250));

                draw()
                ctxTurn.drawImage(smash, 120, 490, 150, 90); 
                await new Promise(r => setTimeout(r, 100));
                
                draw()
                ctxTurn.drawImage(frame2, 190, 490, 100, 60);
                await new Promise(r => setTimeout(r, 100));
                draw()
        }else if(isOpponent && turn === yourColor){
            const smash = yourColor === "black" ? smashW : smashB
            const frame1 = yourColor === "black" ? handUpW : handUpB
            const frame2 = yourColor === "black" ? handPushW : handPushB

            draw()
            ctxTurn.save();
            ctxTurn.scale(-1, 1)
            ctxTurn.drawImage(frame1, -740-100, 250, 100, 80);
            ctxTurn.restore();
            await new Promise(r => setTimeout(r, 250));

            draw()
            ctxTurn.save();
            ctxTurn.scale(-1, 1)
            ctxTurn.drawImage(smash, -720-100, 240, 150, 90); 
            ctxTurn.restore();
            await new Promise(r => setTimeout(r, 100));
            
            draw()
            ctxTurn.save();
            ctxTurn.scale(-1, 1)
            ctxTurn.drawImage(frame2, -650-100, 240, 100, 60);
            ctxTurn.restore();
            await new Promise(r => setTimeout(r, 100));

            draw()

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

const canvasTurn = document.getElementById("canvas-turn");
canvasTurn.addEventListener("click", handleTurnBasedClick, true);
canvasTurn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleTurnBasedClick(e);
}, true);




function getPlayerSpellCell(x, y) {
    
    if (x >= 135 && x <= 135 + 110 && y >= 370 && y <= 370 + 75) {
        return 1;
    }
    
    if (Math.abs((x - 270) * Math.cos(-0.9) - (y - 435) * Math.sin(-0.9)) <= 110 / 2 && Math.abs((x - 270) * Math.sin(-0.9) + (y - 435) * Math.cos(-0.9)) <= 75 / 2) {
        return 2;
    }

    if (Math.abs((x - 300) * Math.cos(-1.8) - (y - 518) * Math.sin(-1.8)) <= 110 / 2 && Math.abs((x - 300) * Math.sin(-1.8) + (y - 518) * Math.cos(-1.8)) <= 75 / 2) {
        return 3;
    }
    return null;
}


function getOpponentSpellCell(x, y) {
        
    if (x >= 685 && x <= 685 + 110 && y >= 110 && y <= 110 + 75) {
        return 1;
    }
    
    if (Math.abs((x - 665) * Math.cos(0.9) - (y - 190) * Math.sin(0.9)) <= 110 / 2 && Math.abs((x - 665) * Math.sin(0.9) + (y - 190) * Math.cos(0.9)) <= 75 / 2) {
        return 2;
    }
    
    if (Math.abs((x - 655) * Math.cos(1.8) - (y - 280) * Math.sin(1.8)) <= 110 / 2 && Math.abs((x - 655) * Math.sin(1.8) + (y - 280) * Math.cos(1.8)) <= 75 / 2) {
        return 3;
    }
    
    return null;
}

function handleTurnBasedClick(e) {
    if (gameStatus !== 'turnBased') {
        return;
    }
    if (currentBasedTurn !== yourColor) {
        console.log("Not your turn");
        return;
    }
    
    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    
    if (!x || !y) {
        return;
    }
    
    const rect = canvasTurn.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    const scaleX = canvasTurn.width / rect.width;
    const scaleY = canvasTurn.height / rect.height;
    
    const scaledX = canvasX * scaleX;
    const scaledY = canvasY * scaleY;


    if (getPlayerSpellCell(scaledX, scaledY) !== null) {
        console.log(abilitiesPieces[pieceUse.toLowerCase()].self[getPlayerSpellCell(scaledX, scaledY)-1])
        animSpell(false)
        socket.emit(abilitiesPieces[pieceUse.toLowerCase()].self[getPlayerSpellCell(scaledX, scaledY)-1]+"-send",{})
        selectedPieceTurn = null  
    }else if (getOpponentSpellCell(scaledX, scaledY) !== null) {
        console.log(abilitiesPieces[pieceUse.toLowerCase()].opponent[getOpponentSpellCell(scaledX, scaledY)-1])
        animAttack(false)
        socket.emit(abilitiesPieces[pieceUse.toLowerCase()].opponent[getOpponentSpellCell(scaledX, scaledY)-1]+"-send",{})
        selectedPieceTurn = null  
        
    }else if (scaledX >= 168 && scaledX <= 168 + 60 && scaledY >= 460 && scaledY <= 460 + 125) {
        console.log("Player piece");
        selectedPieceTurn = "use"
    }else if (scaledX >= 718 && scaledX <= 718 + 60 && scaledY >= 210 && scaledY <= 210 + 125) {
        console.log("Opponent piece");
        selectedPieceTurn = "opponent"
    }else{
        selectedPieceTurn = null   
    }

    draw()
    
}

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
    
    const inCheck = false;
    
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


    if(gameStatus == 'selectNewPawn' || gameStatus == 'turnBased'){
        return
    }
    if (kingDead) {
        gameStatus = 'checkmate';
        winner = currentTurn === 'white' ? 'black' : 'white';
        socket.emit("checkmate-gameover",winner)
            
    } else if (inCheck) {
        gameStatus = 'check';
    } else {
        gameStatus = 'playing';
    }

    
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

function startTurnBased(pieceUse,pieceOpponent,posB,posW){
    console.log("STARTTURN")
    

    const data = {
        pieceW: pieceUse === pieceUse.toLowerCase() ? pieceUse : pieceOpponent,
        pieceB: pieceUse === pieceUse.toUpperCase() ? pieceUse : pieceOpponent,
        currentTurn: yourColor,
        lastPos: {
            posB: posB,
            posW: posW
        }

    }

    socket.emit("start-turn-based",data)

}   


function movePiece(fromCol, fromRow, toCol, toRow, isAttacked=false) {
    console.log("PIECE")

    countTurn += 1

    const piece = map[fromCol][fromRow];
    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    
    if (pieceColor !== currentTurn && !isAttacked) {
        return;
    }


    msg = countTurn+". "+ pieceColor + ": " + String.fromCharCode(fromCol+65) + ""+ (8-fromRow) + " -> "+ String.fromCharCode(toCol+65) + ""+ (8-toRow)
    if(enemyColor(map[fromCol][fromRow],map[toCol][toRow])) msg+= " #"+map[toCol][toRow]


    console.log("enem", enemyColor(map[fromCol][fromRow],map[toCol][toRow]),map[fromCol][fromRow],map[toCol][toRow])
    if(enemyColor(map[fromCol][fromRow],map[toCol][toRow]) && !isAttacked){
        console.log("NONO")
        return startTurnBased(map[fromCol][fromRow] ,map[toCol][toRow],pieceColor === 'white' ? [toCol,toRow]:[fromCol,fromRow],pieceColor === 'black' ? [toCol,toRow]:[fromCol,fromRow])
    }


    console.log("MOVE",map[fromCol][fromRow],"TO" ,map[toCol][toRow],"PIECE",piece)


    if(map[toCol][toRow].toLowerCase() =="k"){
        kingDead = true
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

    if(gameStatus != 'selectNewPawn'){
        currentTurn = currentTurn === 'white' ? 'black' : 'white';
    }
    

    draw();
    updateData()
    
}

function updateData(){
    let newMap = []

    let clonMap = map.map(row => [...row])
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

    if(gameStatus == 'turnBase'){
        return
    }

    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    
    if (!x || !y) {
        return;
    }

    if(gameStatus == 'selectNewPawn'){

        let t = getCellSelect(x,y)
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


function flipMap(data){
    let cloneMap = data.map(row => [...row])
    if(yourColor==='white'){
        map = cloneMap
    }else{
        let newMap = []
        for (let i = 0; i < cloneMap.length; i++) {
            newMap[i] = [...cloneMap[i]].reverse()   
        }
        map = newMap
    }
}

// function timerResume(color){
//     document.getElementById('timer-'+color).style

// }


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
        
        document.getElementById('room-id').textContent = roomId
        document.getElementById('player-color').textContent = playerColor ? (playerColor === 'white' ? 'White' : 'Black') : '-'
        document.getElementById('spectators-count').textContent = data.spectatorsCount || 0
        console.log(`Room ${roomId} has ${data.playersCount} players and ${data.spectatorsCount} spectators`)
        console.log(`Your role: ${playerRole}, color: ${playerColor}`)
        if (data.playerColors) {
            console.log('Player colors:', data.playerColors)
        }
        console.log("PROBLEM")
        gameStatus = data.gameInfo.gameStatus

        if(gameStatus == "turnBased"){
            pieceUse = yourColor === 'white' ? data.gameInfo.turnBasedInfo.pieceW : data.gameInfo.turnBasedInfo.pieceB
            pieceOpponent = yourColor === 'black' ? data.gameInfo.turnBasedInfo.pieceW : data.gameInfo.turnBasedInfo.pieceB
            
            console.log(data.gameInfo.turnBasedInfo.hpW,data.gameInfo.turnBasedInfo.hpB)
            
            hpUse =  yourColor === 'white' ? data.gameInfo.turnBasedInfo.hpW : data.gameInfo.turnBasedInfo.hpB
            hpOpponent =  yourColor === 'black' ? data.gameInfo.turnBasedInfo.hpW : data.gameInfo.turnBasedInfo.hpB
    
            currentBasedTurn = data.gameInfo.turnBasedInfo.currentTurn
        }
        

        countTurn = data.gameInfo.countTurn
        currentTurn = data.gameInfo.currentTurn
        winner = data.gameInfo.winner

        flipMap(data.gameInfo.map)
        
        
        preloadImages();

        setTimeout(() => {
            updateGameStatus();
            displayGameStatus();
        }, 100);
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
    console.log("PROBLEM")
    gameStatus = data.gameStatus
    winner = data.winner
    gamemode = data.gamemode

    //timerResume(data.currentTurn)
    flipMap(data.map)

    logGame(data.log[data.countTurn])
    updateGameStatus();
    displayGameStatus();
    draw()

})

socket.on("turn-based-update",function(data){
    const abilities = yourColor === 'white' ? data.info.turnBasedInfo.abilities.pieceW : data.info.turnBasedInfo.abilities.pieceB
    if(abilities.skipTurn && data.info.turnBasedInfo.currentTurn === yourColor){
        socket.emit("skip-turn-send",{})
        return
    }

    if(data.isAttack){
        animAttack(true, data.info.turnBasedInfo.currentTurn)
    }else{
        animSpell(true,data.info.turnBasedInfo.currentTurn)
    } 

    console.log(data)

    gameStatus = data.info.gameStatus
    winnerBasedTurn = data.info.turnBasedInfo.winner

    pieceUse = yourColor === 'white' ? data.info.turnBasedInfo.pieceW : data.info.turnBasedInfo.pieceB
    pieceOpponent = yourColor === 'black' ? data.info.turnBasedInfo.pieceW : data.info.turnBasedInfo.pieceB
    
    hpUse =  yourColor === 'white' ? data.info.turnBasedInfo.hpW : data.info.turnBasedInfo.hpB
    hpOpponent =  yourColor === 'black' ? data.info.turnBasedInfo.hpW : data.info.turnBasedInfo.hpB

    currentBasedTurn = data.info.turnBasedInfo.currentTurn

    draw()

})


socket.on("turn-based-winner",async function(data){

    if(data.isAttack){
        animAttack(true, data.info.turnBasedInfo.currentTurn)
    }else{
        animSpell(true,data.info.turnBasedInfo.currentTurn)
    } 
    console.log(data)
    
    pieceUse = yourColor === 'white' ? data.info.turnBasedInfo.pieceW : data.info.turnBasedInfo.pieceB
    pieceOpponent = yourColor === 'black' ? data.info.turnBasedInfo.pieceW : data.info.turnBasedInfo.pieceB
    
    hpUse =  yourColor === 'white' ? data.info.turnBasedInfo.hpW : data.info.turnBasedInfo.hpB
    hpOpponent =  yourColor === 'black' ? data.info.turnBasedInfo.hpW : data.info.turnBasedInfo.hpB
    currentBasedTurn = data.info.turnBasedInfo.currentTurn
    winnerBasedTurn = data.info.turnBasedInfo.winner
    draw()

    await new Promise(r => setTimeout(r, 3000));
    gameStatus = data.info.gameStatus
    if(yourColor===winnerBasedTurn){
        console.log(winnerBasedTurn === 'white' ? data.info.lastPosW[0] : data.info.lastPosB[0], winnerBasedTurn === 'white' ? data.info.lastPosW[1] : data.info.lastPosB[1], winnerBasedTurn === 'black' ? data.info.lastPosW[0] : data.info.lastPosB[0], winnerBasedTurn === 'black' ? data.info.lastPosW[1] : data.info.lastPosB[1])
        movePiece(winnerBasedTurn === 'white' ? data.info.lastPosW[0] : data.info.lastPosB[0], winnerBasedTurn === 'white' ? data.info.lastPosW[1] : data.info.lastPosB[1], winnerBasedTurn === 'black' ? data.info.lastPosW[0] : data.info.lastPosB[0], winnerBasedTurn === 'black' ? data.info.lastPosW[1] : data.info.lastPosB[1],true)
    
    }

    draw()
})



socket.on("gameover-gg",function(data){
    if(!loseShow){
        gameStatus = data.gameStatus
        winner = data.winner
        updateGameStatus();
        displayGameStatus();
        const timeBtext = Math.round(data.timerB/60) + ":" + data.timerB%60
        const timeWtext = Math.round(data.timerW/60) + ":" + data.timerW%60
    
        alert(`Checkmate! Won: ${data.winner}\n time black: ${timeBtext}\n time white: ${timeWtext}\n count turns: ${data.gameInfo.countTurn}`);

        loseShow = true
    }
})          



