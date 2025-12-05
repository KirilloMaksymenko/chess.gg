const ctx = document.getElementById("canvas").getContext("2d");

// Стартова позиція дошки
const START_POSITION = [
    ["R","P","","","","","p","r"],
    ["N","P","","","","","p","n"],
    ["S","P","","","","","p","s"],
    ["Q","P","","","","","p","q"],
    ["K","P","","","","","p","k"],
    ["S","P","","","","","p","s"],
    ["N","P","","","","","p","n"],
    ["R","P","","","","","p","r"],
];

// Поточний стан дошки (клон стартової позиції)
let map = START_POSITION.map(col => [...col]);

// let map = [
//     ["R","S","N","K","Q","N","S","R"],
//     ["P","P","P","P","P","P","P","P"],
//     ["","","","","","","",""],
//     ["","","","","","","",""],
//     ["","","","","","","",""],
//     ["","","","","","","",""],
//     ["p","p","p","p","p","p","p","p"],
//     ["r","s","n","q","k","n","s","r"],
// ]

const black_p = ["P","R","S","N","K","Q"]
const white_p = ["p","r","s","n","k","q"]

// const ImgObj = {
//     "p":new Image(),
//     "r":new Image(),
//     "s":new Image(),
//     "n":new Image(),
//     "k":new Image(),
//     "q":new Image(),

//     "P":new Image(),
//     "R":new Image(),
//     "S":new Image(),
//     "N":new Image(),
//     "K":new Image(),
//     "Q":new Image(),
// }



const ImgLinks = {
    "p":"../Source/Paws/v1/pawn_w.png",
    "r":"../Source/Paws/v1/rok_w.png",
    "s":"../Source/Paws/v1/slon_w.png",
    "n":"../Source/Paws/v1/horse_w.png",
    "k":"../Source/Paws/v1/king_w.png",
    "q":"../Source/Paws/v1/quin_w.png",

    "P":"../Source/Paws/v1/pawn_b.png",
    "R":"../Source/Paws/v1/rok_b.png",
    "S":"../Source/Paws/v1/slon_b.png",
    "N":"../Source/Paws/v1/horse_b.png",
    "K":"../Source/Paws/v1/king_b.png",
    "Q":"../Source/Paws/v1/quin_b.png",
}

const ImgObj = {};
const bgImage = new Image();
const pointImage = new Image();
const pointAttImage = new Image();

let imagesLoaded = false;

let selectedPiece = null; 
let validMoves = [];
let lastTurn = null
let posSelect = null

// Змінні для drag and drop
let isDragging = false;
let dragPiece = null;
let dragStartPos = null;
let dragOffset = { x: 0, y: 0 };
let draggedPieceImage = null;

// Змінні для анімації завершення перетягування
let moveAnimation = null;
let animationStartTime = 0;
const ANIMATION_DURATION = 800; // тривалість анімації в мілісекундах

// Режим гри проти бота
let playAgainstBot = false;
let botColor = 'black';
let botDifficulty = 'easy';
let hintMove = null;
let botThinking = false;

// Значення фігур для оцінки
const pieceValues = {
    'p': 1,
    'n': 3,
    's': 3,
    'r': 5,
    'q': 9,
    'k': 100
};

let playerName = 'White';
let activeEmotes = [];

let countTurn = 0;
let currentTurn = 'white'; // 'white'  'black'
let gameStatus = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate' ,'selectNewPawn'
let winner = null; // 'white', 'black', null

function preloadImages() {
    const imagePromises = [];
    
    bgImage.src = "../Source/Group 102.png";
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
    pointImage.src = "../Source/point.png";
    imagePromises.push(new Promise((resolve) => {
        pointImage.onload = resolve;
        pointImage.onerror = resolve;
    }));
    
    pointAttImage.src = "../Source/point_att.png";
    imagePromises.push(new Promise((resolve) => {
        pointAttImage.onload = resolve;
        pointAttImage.onerror = resolve;
    }));
    
    Promise.all(imagePromises).then(() => {
        imagesLoaded = true;
        draw(); 
    });
}

// Скидання стану гри
function resetGameState() {
    map = START_POSITION.map(col => [...col]);
    selectedPiece = null;
    validMoves = [];
    lastTurn = null;
    posSelect = null;
    isDragging = false;
    dragPiece = null;
    dragStartPos = null;
    dragOffset = { x: 0, y: 0 };
    draggedPieceImage = null;
    moveAnimation = null;
    hintMove = null;
    countTurn = 0;
    currentTurn = 'white';
    gameStatus = 'playing';
    winner = null;
    playerName = 'White';

    const moveCount = document.getElementById("move-count");
    if (moveCount) {
        moveCount.innerHTML = "";
    }
    updateGameStatus();
    displayGameStatus();
    draw();
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
    
    // Малюємо всі фігури, крім тієї що перетягується
    for (let row = 0; row < 8; row++) {
        for (let colom = 0; colom < 8; colom++) {
            let piece = map[colom][row];
            
            // Пропускаємо фігуру яку зараз перетягуємо
            if (isDragging && dragStartPos && colom === dragStartPos[0] && row === dragStartPos[1]) {
                continue;
            }
            
            if(piece && ImgObj[piece]){
                ctx.drawImage(ImgObj[piece], 60+117*colom, 103*row+20, 50, 100);
            }
        }
    }

    // Малюємо валідні ходи під час перетягування або коли фігура вибрана через click
    if (validMoves.length > 0 && (isDragging || selectedPiece !== null)) {
        let pieceToShow = null;
        
        if (isDragging && dragPiece) {
            // Під час перетягування використовуємо dragPiece
            pieceToShow = dragPiece;
        } else if (selectedPiece !== null) {
            // Коли фігура вибрана через click, використовуємо selectedPiece
            const [selectedCol, selectedRow] = selectedPiece;
            pieceToShow = map[selectedCol][selectedRow];
        }
        
        if (pieceToShow) {
            validMoves.forEach(([moveCol, moveRow]) => {
                const targetPiece = map[moveCol][moveRow];
                
                if (targetPiece && enemyColor(pieceToShow, targetPiece)) {
                    // Якщо на клітинці ворожа фігура - показуємо точку атаки
                    if (imagesLoaded && pointAttImage.complete) {
                        ctx.drawImage(pointAttImage, moveCol*117+75, moveRow*103+85, 25, 25);
                    }
                } else {
                    // Якщо клітинка порожня - показуємо звичайну точку
                    if (imagesLoaded && pointImage.complete) {
                        ctx.drawImage(pointImage, moveCol*117+75, moveRow*103+85, 25, 25);
                    }
                }
            });
        }
    }

    // Підсвітка підказки (hint)
    if (hintMove) {
        const fromX = boardStartX + hintMove.fromCol * 117;
        const fromY = boardStartY + hintMove.fromRow * 103;
        const toX = boardStartX + hintMove.toCol * 117;
        const toY = boardStartY + hintMove.toRow * 103;

        ctx.fillStyle = 'rgba(0, 150, 255, 0.18)';
        ctx.fillRect(fromX, fromY, 117, 103);
        ctx.fillRect(toX, toY, 117, 103);

        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(fromX + 2, fromY + 2, 117 - 4, 103 - 4);
        ctx.strokeRect(toX + 2, toY + 2, 117 - 4, 103 - 4);
    }

    // Малюємо фігуру що перетягується поверх всього
    if (isDragging && dragPiece && draggedPieceImage) {
        const canvas = document.getElementById("canvas");
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Отримуємо позицію курсора на canvas
        const mouseX = (dragOffset.x - rect.left) * scaleX;
        const mouseY = (dragOffset.y - rect.top) * scaleY;
        
        // Малюємо фігуру з тінню для ефекту перетягування
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(draggedPieceImage, mouseX - 25, mouseY - 50, 50, 100);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Малюємо анімацію завершення ходу
    if (moveAnimation) {
        drawMoveAnimation();
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
            ctx.rect(dec*117+200+i*117, posSelect[1]*103, 117, 103);
            ctx.fillStyle = "lightblue";
            //ctx.fill();
            ctx.rect(dec*117+200+i*117, posSelect[1]*103, 117, 103);
            ctx.stroke();
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

// ========== DRAG AND DROP СИСТЕМА ==========

// Обробка початку перетягування (mouse)
canvas.addEventListener("mousedown", handleDragStart, true);

// Обробка перетягування (mouse)
canvas.addEventListener("mousemove", handleDragMove, true);

// Обробка завершення перетягування (mouse)
canvas.addEventListener("mouseup", handleDragEnd, true);
canvas.addEventListener("mouseleave", handleDragEnd, true);

// Обробка початку перетягування (touch)
canvas.addEventListener("touchstart", handleDragStart, true);

// Обробка перетягування (touch)
canvas.addEventListener("touchmove", handleDragMove, true);

// Обробка завершення перетягування (touch)
canvas.addEventListener("touchend", handleDragEnd, true);
canvas.addEventListener("touchcancel", handleDragEnd, true);

// Функція початку перетягування
function handleDragStart(e) {
    if (playAgainstBot && (currentTurn === botColor || botThinking || gameStatus !== 'playing')) {
        return;
    }

    if (gameStatus === 'selectNewPawn') {
        // Якщо вибираємо нову фігуру для пішака, використовуємо стару систему
        e.preventDefault();
        movePoint(e);
        return;
    }

    const x = e.clientX || (e.touches && e.touches[0]?.clientX);
    const y = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!x || !y) {
        return;
    }

    const cell = getCell(x, y);
    if (cell === -1) {
        return;
    }

    const col = cell[0] - 1;
    const row = cell[1] - 1;
    const piece = map[col][row];

    // Перевіряємо чи є фігура і чи це хід поточного гравця
    if (!piece) {
        return;
    }

    const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
    if (pieceColor !== currentTurn) {
        return;
    }

    // Починаємо перетягування
    isDragging = true;
    dragPiece = piece;
    dragStartPos = [col, row];
    dragOffset = { x: x, y: y };

    // Створюємо зображення фігури для перетягування
    if (ImgObj[piece]) {
        draggedPieceImage = ImgObj[piece];
    }

    // Визначаємо валідні ходи
    selectedPiece = [col, row];
    validMoves = getValidMovesWithCheck(piece, cell);
    
    // Малюємо дошку з валідними ходами (точки будуть показані в draw())
    draw();
}

// Функція перетягування
function handleDragMove(e) {
    if (!isDragging) {
        return;
    }

    e.preventDefault();
    
    const x = e.clientX || (e.touches && e.touches[0]?.clientX);
    const y = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!x || !y) {
        return;
    }

    dragOffset = { x: x, y: y };
    draw();
}

// Функція завершення перетягування
function handleDragEnd(e) {
    if (!isDragging) {
        return;
    }

    e.preventDefault();

    const x = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX);
    const y = e.clientY || (e.changedTouches && e.changedTouches[0]?.clientY);
    
    if (!x || !y) {
        // Якщо координати недоступні, просто скасовуємо перетягування
        cancelDrag();
        return;
    }

    const cell = getCell(x, y);
    
    if (cell === -1) {
        // Якщо випустили поза дошкою, скасовуємо
        cancelDrag();
        return;
    }

    const col = cell[0] - 1;
    const row = cell[1] - 1;

    // Перевіряємо чи це валідний хід
    if (isValidMove(col, row)) {
        // Скидаємо стан перетягування перед анімацією
        const fromCol = dragStartPos[0];
        const fromRow = dragStartPos[1];
        
        isDragging = false;
        dragPiece = null;
        dragStartPos = null;
        draggedPieceImage = null;
        selectedPiece = null;
        validMoves = [];
        
        // Запускаємо анімацію та виконуємо хід
        startMoveAnimation(col, row);
        
        // Виконуємо хід одразу (анімація буде відображатись поверх)
        movePiece(fromCol, fromRow, col, row);
    } else {
        // Якщо хід невалідний, скасовуємо
        cancelDrag();
    }
}

// Функція скасування перетягування
function cancelDrag() {
    isDragging = false;
    dragPiece = null;
    dragStartPos = null;
    draggedPieceImage = null;
    selectedPiece = null;
    validMoves = [];
    draw();
}

// Функція запуску анімації завершення ходу
function startMoveAnimation(col, row) {
    moveAnimation = {
        col: col,
        row: row,
        particles: []
    };
    
    // Створюємо частинки для анімації
    const centerX = col * 117 + 60 + 25; // центр клітинки по X
    const centerY = row * 103 + 20 + 50; // центр клітинки по Y
    
    // Створюємо 20 частинок що розлітаються
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        moveAnimation.particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 4,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02
        });
    }
    
    animationStartTime = Date.now();
    
    // Запускаємо анімацію
    if (!animationFrameId) {
        animateMove();
    }
}

// Функція малювання анімації
function drawMoveAnimation() {
    if (!moveAnimation) return;
    
    const elapsed = Date.now() - animationStartTime;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    
    const centerX = moveAnimation.col * 117 + 60 + 25;
    const centerY = moveAnimation.row * 103 + 20 + 50;
    const cellWidth = 117;
    const cellHeight = 103;
    
    // Малюємо хвилі що розширюються
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
        const waveProgress = (progress - i * 0.2) * 1.5;
        if (waveProgress > 0 && waveProgress < 1) {
            const radius = waveProgress * Math.max(cellWidth, cellHeight) * 0.8;
            const alpha = 1 - waveProgress;
            
            ctx.strokeStyle = `rgba(64, 150, 255, ${alpha * 0.6})`;
            ctx.lineWidth = 3 - waveProgress * 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Малюємо світіння в центрі
    const glowSize = 30 + Math.sin(progress * Math.PI * 4) * 10;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
    gradient.addColorStop(0, `rgba(100, 180, 255, ${0.8 * (1 - progress)})`);
    gradient.addColorStop(0.5, `rgba(64, 150, 255, ${0.4 * (1 - progress)})`);
    gradient.addColorStop(1, `rgba(64, 150, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Малюємо частинки
    moveAnimation.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        
        if (particle.life > 0) {
            const alpha = particle.life;
            ctx.fillStyle = `rgba(64, 150, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            
            // Додаємо світіння навколо частинки
            ctx.shadowColor = `rgba(64, 150, 255, ${alpha * 0.5})`;
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
    
    // Видаляємо мертві частинки
    moveAnimation.particles = moveAnimation.particles.filter(p => p.life > 0);
    
    // Якщо анімація завершилась, очищаємо
    if (progress >= 1) {
        moveAnimation = null;
    }
}

// Функція анімації (requestAnimationFrame)
let animationFrameId = null;

function animateMove() {
    if (moveAnimation) {
        draw();
        animationFrameId = requestAnimationFrame(animateMove);
    } else {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

// ========== СТАРА СИСТЕМА CLICK (залишаємо для сумісності) ==========
// Використовується тільки для вибору нової фігури пішака
canvas.addEventListener("click", movePoint, true);

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

function logGame(pos1,pos2, attck){
    const moveCount = document.getElementById("move-count")
    const piece = map[pos1[0]][pos1[1]]; 
    const pieceColor = piece === piece.toLowerCase() ? 'w' : 'b'; // Name of Players

    var msg = countTurn+". "+ pieceColor + ": " + String.fromCharCode(pos1[0]+65) + ""+ (8-pos1[1]) + " -> "+ String.fromCharCode(pos2[0]+65) + ""+ (8-pos2[1])
    if(attck) msg+= " #"+map[pos2[0]][pos2[1]]


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



    logGame([fromCol,fromRow],[toCol,toRow],enemyColor(map[fromCol][fromRow],map[toCol][toRow]))
    
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
    
    // Mettre à jour le nom du joueur pour les émotes
    playerName = currentTurn === 'white' ? 'White' : 'Black';

    
    updateGameStatus();
    displayGameStatus();

    // Скидаємо підказку після ходу
    hintMove = null;

    draw();

    // Якщо граємо проти бота і настав його хід — запускаємо хід бота
    maybePlayBotTurn();
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

// --------- Генерація ходів та бот ---------

function getPieceValue(piece) {
    if (!piece) return 0;
    const key = piece.toLowerCase();
    return pieceValues[key] || 0;
}

function evaluateBoard() {
    let score = 0;
    for (let c = 0; c < 8; c++) {
        for (let r = 0; r < 8; r++) {
            const piece = map[c][r];
            if (!piece) continue;
            const value = getPieceValue(piece);
            if (piece === piece.toLowerCase()) {
                score += value; // білий
            } else {
                score -= value; // чорний
            }
        }
    }
    return score;
}

function generateAllMoves(color) {
    const moves = [];
    for (let c = 0; c < 8; c++) {
        for (let r = 0; r < 8; r++) {
            const piece = map[c][r];
            if (!piece) continue;
            const pieceColor = piece === piece.toLowerCase() ? 'white' : 'black';
            if (pieceColor !== color) continue;

            const legal = getValidMovesWithCheck(piece, [c + 1, r + 1]);
            legal.forEach(([toCol, toRow]) => {
                moves.push({
                    from: [c, r],
                    to: [toCol, toRow],
                    piece
                });
            });
        }
    }
    return moves;
}

function simulateMove(move, callback) {
    const [fromCol, fromRow] = move.from;
    const [toCol, toRow] = move.to;
    const piece = map[fromCol][fromRow];
    const captured = map[toCol][toRow];

    map[toCol][toRow] = piece;
    map[fromCol][fromRow] = "";

    const result = callback();

    // revert
    map[fromCol][fromRow] = piece;
    map[toCol][toRow] = captured;
    return result;
}

function minimax(depth, colorToMove, alpha, beta) {
    const moves = generateAllMoves(colorToMove);

    // Якщо немає ходів — мат або пат
    if (moves.length === 0) {
        const inCheck = isKingInCheck(colorToMove);
        if (inCheck) {
            // Мат для поточного гравця
            return colorToMove === 'white' ? -9999 : 9999;
        }
        return 0; // пат
    }

    if (depth === 0) {
        return evaluateBoard();
    }

    const maximizing = colorToMove === 'white';
    let bestScore = maximizing ? -Infinity : Infinity;
    const nextColor = colorToMove === 'white' ? 'black' : 'white';

    for (const move of moves) {
        const score = simulateMove(move, () => minimax(depth - 1, nextColor, alpha, beta));
        if (maximizing) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, bestScore);
        } else {
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, bestScore);
        }
        if (beta <= alpha) break;
    }

    return bestScore;
}

function chooseBotMove(difficulty) {
    const moves = generateAllMoves(botColor);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Medium: оцінка за захопленням / матеріалом після ходу
    if (difficulty === 'medium') {
        let best = null;
        let bestScore = Infinity; // бот грає чорними і мінімізує
        moves.forEach(move => {
            const score = simulateMove(move, () => evaluateBoard());
            if (score < bestScore || (score === bestScore && Math.random() > 0.5)) {
                bestScore = score;
                best = move;
            }
        });
        return best || moves[0];
    }

    // Hard: глибина 2 мінімакс
    let bestMove = null;
    let bestScore = Infinity;
    for (const move of moves) {
        const score = simulateMove(move, () => minimax(2, 'white', -Infinity, Infinity));
        if (score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove || moves[0];
}

function suggestHintForPlayer(color) {
    const moves = generateAllMoves(color);
    if (moves.length === 0) return null;
    // Використовуємо "hard" логіку незалежно від складності
    const maximizing = color === 'white';
    let bestMove = null;
    let bestScore = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
        const score = simulateMove(move, () => minimax(2, color === 'white' ? 'black' : 'white', -Infinity, Infinity));
        if ((maximizing && score > bestScore) || (!maximizing && score < bestScore)) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove || moves[0];
}

function maybePlayBotTurn() {
    if (!playAgainstBot) return;
    if (currentTurn !== botColor) return;
    if (gameStatus !== 'playing') return;
    if (botThinking) return;

    botThinking = true;
    setTimeout(() => {
        const move = chooseBotMove(botDifficulty);
        if (move) {
            movePiece(move.from[0], move.from[1], move.to[0], move.to[1]);
        }
        botThinking = false;
    }, 250);
}

function movePoint(e){
    // Якщо зараз відбувається перетягування, ігноруємо click
    if (isDragging) {
        return;
    }
    if (playAgainstBot && (currentTurn === botColor || botThinking || gameStatus !== 'playing')) {
        return;
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

// ========== SYSTÈME D'ÉMOTES (Style Clash Royale) ==========

// Mapping des émotes avec messages thématiques échecs
const emoteMap = {
    'checkmate': { emoji: '♔', message: 'Get checkmated!', color: '#ff4757' },
    'check': { emoji: '⚡', message: 'Check!', color: '#ffa502' },
    'good-move': { emoji: '✨', message: 'Good move!', color: '#2ed573' },
    'well-played': { emoji: '👑', message: 'Well played!', color: '#ffd700' },
    'oops': { emoji: '😅', message: 'Oops!', color: '#ff6348' },
    'nice-try': { emoji: '💪', message: 'Nice try!', color: '#5f27cd' },
    'brilliant': { emoji: '🌟', message: 'Brilliant!', color: '#00d2d3' },
    'respect': { emoji: '🤝', message: 'Respect!', color: '#3742fa' }
};

// Initialisation de la barre d'émotes
function initEmoteBar() {
    const emoteButtons = document.querySelectorAll('.emote-btn');
    
    emoteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const emoteType = this.getAttribute('data-emote');
            sendEmote(emoteType);
        });
        
        // Animation au survol
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.15) rotate(5deg)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// Fonction pour envoyer une émoji (sera étendue avec Socket.IO)
function sendEmote(emoteType) {
    const emote = emoteMap[emoteType];
    if (!emote) return;
    
    // Pour l'instant, affichage local
    // Plus tard: socket.emit('emote', { emoteType, playerName });
    
    displayEmote(emote, playerName);
}

// Fonction pour recevoir une émoji (sera étendue avec Socket.IO)
function receiveEmote(emoteType, fromPlayer) {
    const emote = emoteMap[emoteType];
    if (!emote) return;
    
    displayEmote(emote, fromPlayer);
}

// Fonction pour afficher une émoji à gauche du plateau
function displayEmote(emoteData, playerName) {
    const displayArea = document.getElementById('emote-display-area');
    if (!displayArea) return;
    
    // Position aléatoire à gauche du plateau
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const displayAreaRect = displayArea.getBoundingClientRect();
    
    // Position aléatoire verticale dans la zone d'affichage
    const maxY = displayAreaRect.height - 120; // Réserve pour la taille de l'émoji + message
    const randomY = Math.random() * Math.max(maxY, 100);
    
    // Créer le conteneur principal
    const emoteContainer = document.createElement('div');
    emoteContainer.className = 'emote-display-container';
    emoteContainer.style.cssText = `
        position: absolute;
        left: 10px;
        top: ${randomY}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        pointer-events: none;
    `;
    
    // Créer l'élément émoji
    const emoteElement = document.createElement('div');
    emoteElement.className = 'emote-display';
    emoteElement.textContent = emoteData.emoji;
    emoteElement.style.cssText = `
        font-size: 60px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        animation: emoteAppear 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;
    
    // Créer le message
    const messageElement = document.createElement('div');
    messageElement.className = 'emote-message';
    messageElement.textContent = emoteData.message;
    messageElement.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        color: ${emoteData.color};
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8),
                     0 0 10px ${emoteData.color}40;
        padding: 4px 12px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 12px;
        border: 2px solid ${emoteData.color};
        white-space: nowrap;
        animation: messageAppear 1.2s ease-out forwards;
    `;
    
    // Ajouter le nom du joueur
    const playerLabel = document.createElement('div');
    playerLabel.textContent = playerName;
    playerLabel.style.cssText = `
        font-size: 11px;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
        font-weight: bold;
        animation: fadeInOut 1.2s ease-out forwards;
    `;
    
    emoteContainer.appendChild(emoteElement);
    emoteContainer.appendChild(messageElement);
    emoteContainer.appendChild(playerLabel);
    
    displayArea.appendChild(emoteContainer);
    
    // Créer des particules autour de l'émoji avec la couleur de l'émoji
    createEmoteParticles(displayAreaRect.left + 10, displayAreaRect.top + randomY + 30, emoteData.color);
    
    // Supprimer après l'animation
    setTimeout(() => {
        emoteContainer.remove();
    }, 1200);
}

// Fonction pour créer des particules autour de l'émoji
function createEmoteParticles(x, y, emoteColor) {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'emote-particle';
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 40 + Math.random() * 30;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        // Utiliser la couleur de l'émoji avec variations
        const baseColor = emoteColor || '#ff6b6b';
        const alpha = 0.6 + Math.random() * 0.4;
        particle.style.background = `radial-gradient(circle, ${baseColor}${Math.floor(alpha * 255).toString(16)} 0%, transparent 70%)`;
        particle.style.boxShadow = `0 0 10px ${baseColor}80`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

// Animation CSS pour fadeInOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Initialiser la barre d'émotes au chargement
function initGameControls() {
    const modeSelect = document.getElementById('mode-select');
    const diffSelect = document.getElementById('bot-difficulty');
    const hintBtn = document.getElementById('hint-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (modeSelect) {
        modeSelect.addEventListener('change', () => {
            playAgainstBot = modeSelect.value === 'bot';
            botColor = 'black'; // бот грає чорними
            resetGameState();
        });
    }

    if (diffSelect) {
        diffSelect.addEventListener('change', () => {
            botDifficulty = diffSelect.value;
        });
    }

    if (hintBtn) {
        hintBtn.addEventListener('click', () => {
            const move = suggestHintForPlayer(currentTurn);
            if (move) {
                hintMove = {
                    fromCol: move.from[0],
                    fromRow: move.from[1],
                    toCol: move.to[0],
                    toRow: move.to[1]
                };
                draw();
            } else {
                alert("Aucun coup disponible.");
            }
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetGameState();
            // Si mode bot sélectionné, on reste en mode bot
            playAgainstBot = modeSelect && modeSelect.value === 'bot';
        });
    }
}

function initUI() {
    initEmoteBar();
    initGameControls();
    resetGameState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}

// Pour tester: simuler une émoji d'un autre joueur (décommentez pour tester)
// setTimeout(() => receiveEmote('crown', 'Opponent'), 2000);