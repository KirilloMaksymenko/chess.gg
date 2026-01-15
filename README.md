https://gist.github.com/win3zz/0a1c70589fcbea64dba4588b93095855



# chess.gg

# Документація BackEnd сервера та клієнта Chess.gg

## Зміст
1. [Огляд архітектури](#огляд-архітектури)
2. [Серверна частина](#серверна-частина)
3. [Клієнтська частина](#клієнтська-частина)
4. [Socket.IO події](#socketio-події)
5. [Структури даних](#структури-даних)
6. [API ендпоінти](#api-ендпоінти)
7. [Приклади використання](#приклади-використання)

---

## Огляд архітектури

Система складається з:
- **HTTP сервер** (Node.js) - обробляє HTTP запити та статичні файли
- **Socket.IO сервер** - обробляє real-time комунікацію між клієнтами
- **Клієнтський JavaScript** - обробляє взаємодію користувача та комунікацію з сервером

### Потік роботи:
1. Користувач відкриває `/lobby.html`
2. Клієнт підключається до Socket.IO сервера
3. Користувач створює кімнату або приєднується до існуючої
4. Коли в кімнаті збираються 2 гравці, обидва перенаправляються на `/game?roomId=...`
5. На сторінці гри гравці автоматично приєднуються до кімнати знову

---

## Серверна частина

### Файл: `server.js`

#### Залежності
- `http` - HTTP сервер
- `fs` - робота з файловою системою
- `path` - робота з шляхами
- `crypto` - генерація випадкових чисел
- `socket.io` - WebSocket комунікація
####  Конфігурація
```javascript
const PORT = 12345  // Порт сервера
```

#### Структури даних сервера

##### `rooms` (Map)
Зберігає інформацію про всі кімнати:
```javascript
{
  roomId: {
    players: [socketId1, socketId2],           // Поточні гравці в кімнаті
    spectators: [socketId3, ...],              // Глядачі в кімнаті
    playerColors: {                             // Кольори гравців
      socketId1: 'white',
      socketId2: 'black'
    },
    originalPlayerOrder: [socketId1, socketId2], // Оригінальний порядок гравців (для збереження кольорів)
    createdAt: timestamp                        // Час створення кімнати
  }
}
```

##### `clientToRoom` (Map)
Відстежує в якій кімнаті знаходиться кожен клієнт:
```javascript
{
  socketId: roomId
}
```

##### `clientRole` (Map)
Відстежує роль кожного клієнта:
```javascript
{
  socketId: 'player' | 'spectator'
}
```

##### `clientColor` (Map)
Відстежує колір кожного гравця:
```javascript
{
  socketId: 'white' | 'black'
}
```

##### `socketToOriginalSocket` (Map)
Відстежує оригінальний socket.id для відновлення позиції:
```javascript
{
  newSocketId: originalSocketId
}
```

#### HTTP маршрути

HTTP сервер обробляє запити наступним чином:
- Socket.IO автоматично обробляє запити `/socket.io/`, тому вони не обробляються HTTP обробником
- CORS headers встановлюються для всіх запитів (для розробки)

##### `GET /` або `GET /lobby.html`
Повертає HTML сторінку лобі (`lobby.html`).

##### `GET /game` або `GET /game?roomId=...`
Обробляє запити на `/game` та `/game?roomId=12345`.
Повертає HTML сторінку гри (`game.html`).

##### `GET /*`
Обробляє статичні файли (JS, CSS, зображення).
Визначає Content-Type на основі розширення файлу:
- `.js` → `application/javascript`
- `.css` → `text/css`
- `.png` → `image/png`
- `.jpg` / `.jpeg` → `image/jpeg`
- Інші → `text/html`

---

## Клієнтська частина

### Файл: `client.js` (Лобі)

#### Глобальні змінні
```javascript
let clientId = ""           // ID клієнта від сервера
let currentRoomId = null    // ID поточної кімнати
```

#### Підключення до Socket.IO
```javascript
const socket = io()  // Автоматично підключається до того ж хосту
```

#### Основні функції

##### `updateRoomsList(rooms)`
Оновлює список доступних кімнат на сторінці.

##### `joinRoom(roomId)`
Відправляє запит на приєднання до кімнати.

##### `createRoom()`
Відправляє запит на створення нової кімнати.

---

### Файл: `script_chess.js` (Гра)

#### Глобальні змінні та константи

##### Структура дошки
```javascript
let map = [  // 8x8 масив, що представляє дошку
    ["R","P","","","","","p","r"],  // Колонка 0
    ["N","P","","","","","p","n"],  // Колонка 1
    // ... (8 колонок)
]
// Великі літери = чорні фігури, малі = білі
// R/r = тура, N/n = кінь, S/s = слон, Q/q = ферзь, K/k = король, P/p = пішак
```

##### Зображення фігур
```javascript
const ImgLinks = {
    "p": "/Source/Paws/v1/pawn_w.png",    // Білий пішак
    "r": "/Source/Paws/v1/rok_w.png",      // Біла тура
    "s": "/Source/Paws/v1/slon_w.png",     // Білий слон
    "n": "/Source/Paws/v1/horse_w.png",    // Білий кінь
    "k": "/Source/Paws/v1/king_w.png",     // Білий король
    "q": "/Source/Paws/v1/quin_w.png",     // Білий ферзь
    // Великі літери для чорних фігур
}
```

##### Стан гри
```javascript
let selectedPiece = null      // [col, row] вибраної фігури
let validMoves = []          // Масив валідних ходів [[col, row], ...]
let yourColor = null         // 'white' | 'black' - колір гравця
let countTurn = 0            // Лічильник ходів
let currentTurn = 'white'    // 'white' | 'black' - чия черга
let gameStatus = 'playing'   // 'playing' | 'check' | 'checkmate' | 'stalemate' | 'selectNewPawn'
let winner = null            // 'white' | 'black' | null
```

#### Основні функції гри

##### `preloadImages()`
Завантажує всі зображення (фон, фігури, індикатори ходів) та викликає `draw()` після завантаження.

##### `draw()`
Малює поточний стан дошки на canvas:
- Фон дошки (різний для білих/чорних)
- Всі фігури на дошці
- Якщо `gameStatus === 'selectNewPawn'`: показує меню вибору нової фігури

##### `getCell(x, y)`
Перетворює координати миші/дотику в координати клітинки дошки.
- Повертає: `[col, row]` (1-8) або `-1` якщо поза дошкою

##### `getCellSelect(x, y)`
Перетворює координати для вибору нової фігури при трансформації пішака.
- Повертає: `[col, row]` або `-1`

##### `movePoint(e)`
Обробник кліків/дотиків на canvas:
- Якщо `gameStatus === 'selectNewPawn'`: обробляє вибір нової фігури
- Інакше: обробляє вибір фігури та хід

##### `movePiece(fromCol, fromRow, toCol, toRow)`
Виконує хід фігури:
- Перевіряє чи це хід поточного гравця
- Оновлює `map`
- Обробляє трансформацію пішака (коли досягає останнього ряду)
- Змінює `currentTurn`
- Викликає `updateData()` та `draw()`

##### `selectNewPawn(pos, L)`
Обробляє вибір нової фігури при трансформації пішака:
- `pos` - позиція пішака `[col, row]`
- `L` - нова фігура ('r', 'n', 's', 'q' або великі літери для чорних)

##### `updateData()`
Готує дані для відправки на сервер:
- Створює копію `map` (перевертає для чорних гравців)
- Оновлює статус гри
- Відправляє `game-turn` подію на сервер

##### `flipMap(data)`
Перевертає карту для чорних гравців (щоб їхні фігури були знизу):
- Для білих: залишає як є
- Для чорних: перевертає кожен рядок

#### Функції перевірки ходів

##### `getValidMoves(piece, pos)`
Повертає масив валідних ходів для фігури без урахування шаху.
- `piece` - символ фігури ('p', 'r', 'n', 's', 'k', 'q')
- `pos` - позиція `[col, row]` (1-8)
- Повертає: `[[col, row], ...]`

##### `getValidMovesWithCheck(piece, pos)`
Повертає валідні ходи з урахуванням шаху (фільтрує ходи, що ставлять короля під шах).

##### `isValidMove(targetCol, targetRow)`
Перевіряє чи хід є валідним (чи є в `validMoves`).

##### `isKingInCheck(color)`
Перевіряє чи король кольору `color` під шахом.

##### `wouldMovePutKingInCheck(fromCol, fromRow, toCol, toRow, color)`
Перевіряє чи хід поставить короля під шах (тимчасово виконує хід та перевіряє).

##### `hasValidMoves(color)`
Перевіряє чи є у гравця хоча б один валідний хід.

##### `updateGameStatus()`
Оновлює `gameStatus` та `winner` на основі поточного стану:
- Якщо немає валідних ходів + шах → `checkmate`
- Якщо немає валідних ходів + немає шаху → `stalemate`
- Якщо шах → `check`
- Інакше → `playing`

##### `displayGameStatus()`
Оновлює UI з поточним статусом гри (черга, статус).

#### Функції рухів фігур

##### `pawnMoves(piece, pos, collectMoves = false)`
Обчислює/відображає ходи пішака:
- Рух на 1 клітинку вперед
- Рух на 2 клітинки з початкової позиції
- Атака по діагоналі
- `collectMoves = true` → повертає масив ходів
- `collectMoves = false` → малює індикатори на canvas

##### `smoothPath(directions, pos, collectMoves = false)`
Обчислює ходи для фігур, що рухаються по прямій (тура, слон, ферзь):
- `directions` - масив напрямків `[[dx, dy], ...]`
- Рухається по кожному напрямку до зустрічі з перешкодою

##### `pointPos(directions, pos, collectMoves = false)`
Обчислює ходи для фігур, що рухаються на фіксовану відстань (кінь, король):
- `directions` - масив напрямків `[[dx, dy], ...]`

##### `showMoves(piece, pos)`
Відображає валідні ходи для вибраної фігури (викликає відповідну функцію рухів).

#### Допоміжні функції

##### `sameColor(ch1, ch2)`
Перевіряє чи дві фігури одного кольору.

##### `enemyColor(ch1, ch2)`
Перевіряє чи дві фігури різних кольорів.

##### `findKing(color)`
Знаходить позицію короля кольору `color` на дошці.

##### `logGame(msg)`
Додає запис ходу в історію (відображається в UI).

#### Socket.IO події (клієнт → сервер)

##### `rejoin-room`
Повторно приєднується до кімнати при завантаженні сторінки гри.

##### `game-turn`
Відправляє дані про хід на сервер:
```javascript
{
    map: Array,           // Стан дошки
    countTurn: number,    // Номер ходу
    currentTurn: string,  // 'white' | 'black'
    gameStatus: string,   // Статус гри
    winner: string,       // 'white' | 'black' | null
    log: string          // Текстовий запис ходу
}
```

#### Socket.IO події (сервер → клієнт)

##### `client-id`
Отримує ID клієнта від сервера.

##### `room-rejoined`
Отримує інформацію про кімнату при повторному підключенні:
```javascript
{
    roomId: string,
    role: 'player' | 'spectator',
    color: 'white' | 'black',
    gameInfo: {
        map: Array,
        countTurn: number,
        currentTurn: string,
        gameStatus: string,
        winner: string,
        log: Array
    },
    playersCount: number,
    spectatorsCount: number
}
```

##### `update-game-state`
Отримує оновлення стану гри від іншого гравця:
```javascript
{
    map: Array,
    countTurn: number,
    currentTurn: string,
    gameStatus: string,
    winner: string,
    log: Array
}
```

##### `role-info`, `color-info`, `player-color-assigned`
Отримує інформацію про роль та колір гравця.

##### `error`
Отримує повідомлення про помилку.

---

## Socket.IO події

### Події від сервера до клієнта

#### `client-id`
Відправляється при підключенні клієнта.
```javascript
socket.on('client-id', function(clientid) {
  // clientid - унікальний ID клієнта
})
```

#### `rooms-list`
Відправляється при підключенні та оновленні списку кімнат.
```javascript
socket.on('rooms-list', function(rooms) {
  // rooms - масив об'єктів:
  // [
  //   {
  //     roomId: "12345",
  //     playersCount: 1,
  //     maxPlayers: 2,
  //     spectatorsCount: 0
  //   }
  // ]
})
```

#### `room-created`
Відправляється після успішного створення кімнати.
```javascript
socket.on('room-created', function(data) {
  // data = {
  //   roomId: "12345",
  //   role: "player",
  //   color: "white"
  // }
})
```

#### `room-joined`
Відправляється після успішного приєднання до кімнати.
```javascript
socket.on('room-joined', function(data) {
  // data = {
  //   roomId: "12345",
  //   role: "player" | "spectator",
  //   color: "white" | "black" (тільки для гравців)
  // }
})
```

#### `room-rejoined`
Відправляється після повторного приєднання до кімнати (на сторінці гри).
```javascript
socket.on('room-rejoined', function(data) {
  // data = {
  //   roomId: "12345",
  //   role: "player" | "spectator",
  //   color: "white" | "black",
  //   playersCount: 2,
  //   spectatorsCount: 0,
  //   allPlayers: [socketId1, socketId2],
  //   allSpectators: [socketId3],
  //   playerColors: { socketId1: 'white', socketId2: 'black' },
  //   gameInfo: {              // Стан гри (якщо гра вже почалася)
  //     map: Array,            // Стан дошки (8x8 масив)
  //     countTurn: number,     // Номер ходу
  //     currentTurn: string,    // 'white' | 'black'
  //     gameStatus: string,    // Статус гри
  //     winner: string,        // 'white' | 'black' | null
  //     log: Array            // Масив записів ходів
  //   }
  // }
})
```

#### `redirect`
Відправляється коли в кімнаті збираються 2 гравці.
```javascript
socket.on('redirect', function(url) {
  // url = "/game?roomId=12345"
  // Перенаправляє користувача на сторінку гри
})
```

#### `player-color-assigned`
Відправляється при призначенні кольору гравцю.
```javascript
socket.on('player-color-assigned', function(data) {
  // data = {
  //   color: "white" | "black",
  //   playerNumber: 1 | 2
  // }
})
```

#### `player-rejoined`
Відправляється іншим гравцям коли хтось приєднався до кімнати.
```javascript
socket.on('player-rejoined', function(data) {
  // data = {
  //   clientId: "socketId",
  //   role: "player" | "spectator",
  //   color: "white" | "black",
  //   playersCount: 2,
  //   spectatorsCount: 0
  // }
})
```

#### `role-info`
Відправляється у відповідь на запит `get-role`.
```javascript
socket.on('role-info', function(data) {
  // data = {
  //   role: "player" | "spectator",
  //   color: "white" | "black",
  //   roomId: "12345"
  // }
})
```

#### `color-info`
Відправляється у відповідь на запит `get-color`.
```javascript
socket.on('color-info', function(data) {
  // data = {
  //   color: "white" | "black",
  //   role: "player" | "spectator",
  //   roomId: "12345"
  // }
})
```

#### `error`
Відправляється при виникненні помилки.
```javascript
socket.on('error', function(error) {
  // error = {
  //   message: "Текст помилки"
  // }
})
```

### Події від клієнта до сервера

#### `create-room`
Створює нову кімнату.
```javascript
socket.emit('create-room', {})
```

#### `join-room`
Приєднується до існуючої кімнати.
```javascript
socket.emit('join-room', {
  roomId: "12345"
})
```

#### `rejoin-room`
Повторно приєднується до кімнати (використовується на сторінці гри).
```javascript
socket.emit('rejoin-room', {
  roomId: "12345"
})
```

#### `get-rooms`
Запитує список доступних кімнат.
```javascript
socket.emit('get-rooms')
```

#### `get-role`
Запитує роль поточного клієнта.
```javascript
socket.emit('get-role')
```

#### `get-color`
Запитує колір поточного гравця.
```javascript
socket.emit('get-color')
```

#### `game-turn`
Відправляє дані про хід на сервер (використовується в `script_chess.js`).
```javascript
socket.emit('game-turn', {
    map: Array,           // Стан дошки (8x8 масив)
    countTurn: number,    // Номер ходу
    currentTurn: string,  // 'white' | 'black'
    gameStatus: string,   // 'playing' | 'check' | 'checkmate' | 'stalemate' | 'selectNewPawn'
    winner: string,       // 'white' | 'black' | null
    log: string          // Текстовий запис ходу (наприклад: "1. white: A7 -> A5")
})
```

---

## Структури даних

### Кімната (Room)
```javascript
{
  players: Array<string>,              // Масив socket.id гравців (максимум 2)
  spectators: Array<string>,          // Масив socket.id глядачів
  playerColors: {                      // Об'єкт з кольорами гравців
    [socketId]: 'white' | 'black'
  },
  originalPlayerOrder: Array<string>,  // Оригінальний порядок гравців
  createdAt: number                    // Timestamp створення
}
```

### Інформація про кімнату (для списку)
```javascript
{
  roomId: string,           // ID кімнати
  playersCount: number,      // Кількість гравців (0-2)
  maxPlayers: number,        // Максимальна кількість гравців (2)
  spectatorsCount: number   // Кількість глядачів
}
```

---

## API ендпоінти

### HTTP ендпоінти

#### `GET /`
Повертає сторінку лобі (`lobby.html`).

#### `GET /lobby.html`
Повертає сторінку лобі.

#### `GET /game`
Повертає сторінку гри (`game.html`).

#### `GET /game?roomId=12345`
Повертає сторінку гри з параметром кімнати.

#### `GET /socket.io/socket.io.js`
Повертає Socket.IO клієнтську бібліотеку (обробляється автоматично Socket.IO).

---

## Приклади використання

### Створення кімнати

**Клієнт:**
```javascript
socket.emit('create-room', {})
```

**Сервер:**
- Генерує унікальний roomId (5-значне число)
- Додає клієнта як першого гравця (білі)
- Відправляє `room-created` з roomId та role

**Результат:**
- Клієнт отримує `room-created` з `{ roomId: "12345", role: "player", color: "white" }`
- Кімната з'являється в списку доступних кімнат для інших клієнтів

### Приєднання до кімнати

**Клієнт:**
```javascript
socket.emit('join-room', { roomId: "12345" })
```

**Сервер:**
- Перевіряє чи кімната існує
- Перевіряє чи є місце для гравця (< 2 гравців)
- Якщо є місце: додає як гравця (чорні)
- Якщо немає місця: додає як глядача
- Якщо кімната заповнена (2 гравці): перенаправляє обох на `/game`

**Результат:**
- Клієнт отримує `room-joined` або `redirect`
- Якщо 2 гравці: обидва перенаправляються на `/game?roomId=12345`

### Повторне приєднання на сторінці гри

**Клієнт (на сторінці `/game`):**
```javascript
socket.emit('rejoin-room', { roomId: "12345" })
```

**Сервер (детальна логіка):**

1. **Перевірка кімнати:**
   - Перевіряє чи кімната існує
   - Ініціалізує `spectators`, `playerColors`, `originalPlayerOrder` якщо не існують

2. **Очищення originalPlayerOrder:**
   - Шукає в `originalPlayerOrder` socket.id, які не в `room.players`
   - Якщо знайдено відключені socket.id і є новий гравець:
     - Замінює старий socket.id на новий на тій самій позиції
     - Переносить колір зі старого socket.id на новий
   - Якщо немає місця: видаляє старі socket.id

3. **Перевірка чи клієнт вже в кімнаті:**
   - Якщо так: відправляє `room-rejoined` з поточною інформацією
   - Якщо колір не знайдено: визначає за позицією в `originalPlayerOrder`

4. **Визначення ролі та кольору:**
   - Шукає роль в `clientRole` Map
   - Шукає колір в `clientColor` Map
   - Якщо не знайдено:
     - Шукає позицію в `originalPlayerOrder`
     - Якщо знайдено: визначає колір за позицією
     - Якщо не знайдено: шукає вільну позицію або замінює старий socket.id

5. **Визначення ролі:**
   - Якщо роль не визначена:
     - Якщо `room.players.length < 2`: роль = `'player'`
     - Інакше: роль = `'spectator'`
   - Якщо роль визначена: відновлює її

6. **Фінальна перевірка кольору:**
   - Якщо гравець і колір не визначений:
     - Шукає в `originalPlayerOrder`
     - Якщо не знайдено: використовує позицію в `room.players`
     - Додає до `originalPlayerOrder` якщо потрібно
   - Якщо колір визначений:
     - Перевіряє чи відповідає позиції в `originalPlayerOrder`
     - Якщо не відповідає: виправляє

7. **Оновлення даних:**
   - Додає до `room.players` або `room.spectators`
   - Встановлює роль та колір в Maps
   - Приєднує до Socket.IO кімнати

**Результат:**
- Клієнт отримує `room-rejoined` з role, color, та інформацією про кімнату
- Гравець знову підключений до кімнати і може грати
- Колір відновлюється правильно навіть після зміни socket.id

### Перевірка ролі та кольору

**Клієнт:**
```javascript
// Перевірка ролі
socket.emit('get-role')

// Перевірка кольору
socket.emit('get-color')
```

**Сервер:**
- Шукає роль/колір в Maps
- Якщо не знайдено, визначає за позицією в `originalPlayerOrder`
- Відправляє `role-info` або `color-info`

---

## Логіка роботи з кольорами

### Призначення кольорів

1. **Перший гравець** (створює кімнату):
   - Позиція в `originalPlayerOrder`: 0
   - Колір: `white` (білі)
   - Додається до `room.players[0]` та `room.originalPlayerOrder[0]`
   - `room.playerColors[socketId] = 'white'`

2. **Другий гравець** (приєднується):
   - Позиція в `originalPlayerOrder`: 1
   - Колір: `black` (чорні)
   - Додається до `room.players[1]` та `room.originalPlayerOrder[1]`
   - `room.playerColors[socketId] = 'black'`

3. **Третій та наступні**:
   - Роль: `spectator` (глядач)
   - Колір: не призначається
   - Додаються до `room.spectators`

### Збереження кольорів

Кольори зберігаються в:
- `room.playerColors[socketId]` - для швидкого доступу по socket.id
- `room.originalPlayerOrder` - для відновлення при повторному підключенні (зберігає оригінальні socket.id)
- `clientColor` Map - для глобального доступу на сервері

### Відновлення кольорів при повторному підключенні

Коли гравець перенаправляється на `/game`, він отримує новий `socket.id`. Для відновлення кольору використовується складніша логіка:

#### Очищення originalPlayerOrder

При обробці `rejoin-room`:
1. Сервер шукає в `originalPlayerOrder` socket.id, які не в `room.players` (відключені)
2. Якщо знайдено відключені socket.id і є новий гравець:
   - Замінює старий socket.id на новий в `originalPlayerOrder` на тій самій позиції
   - Переносить колір зі старого socket.id на новий в `room.playerColors`
3. Якщо немає місця для заміни: видаляє старі socket.id з `originalPlayerOrder`

#### Визначення кольору

1. Спочатку перевіряє чи новий socket.id вже є в `originalPlayerOrder`
2. Якщо так: використовує позицію для визначення кольору (0 = white, 1 = black)
3. Якщо ні:
   - Шукає вільну позицію (якщо `originalPlayerOrder.length < 2`)
   - Або замінює старий socket.id на новий
   - Визначає колір за позицією

#### Фінальна перевірка

Після всіх операцій виконується фінальна перевірка:
- Якщо колір не визначений: шукає в `originalPlayerOrder` або використовує позицію в `room.players`
- Якщо колір визначений: перевіряє чи він відповідає позиції в `originalPlayerOrder`
- Якщо не відповідає: виправляє колір на правильний

### Логіка в get-color

При запиті кольору (`get-color`):
1. Очищає `originalPlayerOrder` від старих socket.id (як в `rejoin-room`)
2. Шукає позицію поточного socket.id в `originalPlayerOrder`
3. Якщо знайдено: визначає колір за позицією
4. Якщо не знайдено: використовує позицію в `room.players`
5. Оновлює `room.playerColors` та `clientColor`

---

## Функції сервера

### `generateRoomId()`
Генерує унікальний 5-значний ID кімнати (10000-99999).

### `getAvailableRooms()`
Повертає масив доступних кімнат (з менше ніж 2 гравцями).

### `getClientRole(clientId)`
Повертає роль клієнта: `'player'` або `'spectator'`.

### `setClientRole(clientId, role)`
Встановлює роль клієнта.

### `getClientColor(clientId)`
Повертає колір гравця: `'white'` або `'black'`.

### `setClientColor(clientId, color)`
Встановлює колір гравця.

### `cleanupRoom(roomId)`
Керує життєвим циклом кімнати та її автоматичним видаленням.

#### Поточна поведінка:
1. Функція отримує кімнату з `rooms` за `roomId`
2. Обчислюється:
   - `playersCount` — кількість гравців у кімнаті
   - `spectatorsCount` — кількість глядачів
   - `roomAgeMs` — скільки мілісекунд пройшло з моменту створення кімнати (`Date.now() - room.createdAt`)
3. Кімната **видаляється** тільки якщо одночасно виконується:
   - `playersCount === 0`
   - `spectatorsCount === 0`
   - `roomAgeMs > EMPTY_ROOM_TIMEOUT_MS` (за замовчуванням `10 хвилин`)

#### Навіщо це потрібно:
- При переході гравців із лобі на сторінку гри (`/game?roomId=...`) вони отримують нові `socket.id` і старі підключення відключаються.
- Щоб **не втрачати кімнату при такому тимчасовому відключенні**, кімната більше **не видаляється одразу**, коли обидва гравці відʼєдналися.
- Кімната залишається в `rooms` деякий час (10 хвилин), що дозволяє гравцям **перепідʼєднатися через `rejoin-room`** і зберегти:
  - ту саму `roomId`
  - порядок гравців (`originalPlayerOrder`)
  - кольори гравців (`playerColors`)

---

## Обробка помилок

### Типові помилки

1. **"Ви вже знаходитесь в кімнаті"**
   - Клієнт намагається створити/приєднатися до кімнати, але вже в кімнаті

2. **"Кімната не знайдена"**
   - Клієнт намагається приєднатися до неіснуючої кімнати

3. **"Кімната заповнена"**
   - Клієнт намагається приєднатися як гравець, але вже є 2 гравці

### Логування

Сервер логує всі важливі події в консоль:
- Підключення/відключення клієнтів
- Створення/приєднання до кімнат
- Призначення ролей та кольорів
- Перенаправлення на гру

---

## Розгортання

### Вимоги
- Node.js (версія 14+)
- npm або yarn

### Встановлення залежностей
```bash
cd BackEnd/Prototype
npm install
```

### Запуск сервера
```bash
node server.js
```

Сервер запуститься на порту 12345.

### Доступ
- Лобі: `http://localhost:12345/`
- Гра: `http://localhost:12345/game?roomId=12345`

---

## Розширення функціональності

### Додавання нових подій

1. Додайте обробник на сервері:
```javascript
client.on('new-event', function(data) {
  // Обробка події
})
```

2. Додайте відправку з клієнта:
```javascript
socket.emit('new-event', { /* дані */ })
```

3. Додайте обробник на клієнті:
```javascript
socket.on('new-event-response', function(data) {
  // Обробка відповіді
})
```

### Додавання нових ролей

1. Оновіть `clientRole` Map для підтримки нових ролей
2. Оновіть логіку в `join-room` та `rejoin-room`
3. Оновіть клієнтську частину для відображення нових ролей

---

## Детальна логіка обробки подій

### create-room

1. Перевіряє чи клієнт вже не в кімнаті
2. Генерує унікальний roomId
3. Створює кімнату з:
   - `players: [client.id]`
   - `spectators: []`
   - `playerColors: { [client.id]: 'white' }`
   - `originalPlayerOrder: [client.id]`
4. Встановлює роль `'player'` та колір `'white'`
5. Приєднує клієнта до Socket.IO кімнати
6. Оновлює список кімнат для всіх
7. Якщо кімната заповнена (2 гравці): перенаправляє на `/game`
8. Інакше: відправляє `room-created`

### join-room

1. Перевіряє чи клієнт вже не в кімнаті
2. Перевіряє чи кімната існує
3. Ініціалізує `spectators`, `playerColors`, `originalPlayerOrder` якщо не існують
4. Визначає роль:
   - Якщо `room.players.length < 2`: роль = `'player'`
   - Інакше: роль = `'spectator'`
5. Для гравця:
   - Призначає колір на основі `originalPlayerOrder.length`:
     - 0 → `'white'`
     - 1 → `'black'`
   - Додає до `room.players` та `room.originalPlayerOrder`
6. Для глядача:
   - Додає до `room.spectators`
7. Приєднує до Socket.IO кімнати
8. Оновлює список кімнат
9. Якщо кімната заповнена (2 гравці):
   - Перенаправляє обох гравців на `/game`
   - Відправляє `player-color-assigned` кожному гравцю
10. Інакше: відправляє `room-joined`

### disconnect

1. Знаходить кімнату клієнта
2. Видаляє з `room.players` або `room.spectators`
3. **НЕ видаляє з `originalPlayerOrder`** — це дозволяє відновити позицію при повторному підключенні
4. Видаляє з `clientToRoom`, `clientRole`, `clientColor` (для поточного `socket.id`)
5. **НЕ видаляє** кольори з `room.playerColors` для збереження привʼязки до оригінальних позицій;
   - кольори можуть бути перенесені на новий `socket.id` при `rejoin-room`
6. Оновлює список кімнат через `io.emit('rooms-list', getAvailableRooms())`
7. Викликає `cleanupRoom(roomId)`, яка **не одразу видаляє кімнату**, а тільки якщо вона порожня та старіша за таймаут

## Примітки

- Socket.id змінюється при кожному новому підключенні (навіть при перенаправленні на `/game`)
- Для збереження позиції гравця використовується `originalPlayerOrder`, який зберігає оригінальні socket.id
- При повторному підключенні старі socket.id в `originalPlayerOrder` замінюються на нові
- Кольори визначаються на основі позиції в `originalPlayerOrder`, а не в `room.players`
- `room.players` може змінюватися при відключеннях, але `originalPlayerOrder` зберігається
- Глядачі можуть приєднуватися до кімнати навіть коли вже є 2 гравці
- Кімната автоматично видаляється тільки тоді, коли **немає жодного гравця і глядача** і вона існує довше, ніж таймаут (за замовчуванням 10 хвилин) — це дозволяє гравцям безпечно реконектитись
- CORS налаштований для розробки (всі джерела дозволені)

---


* так позначаеться способність яку можна використати на себе
-> так позначаеться способність яку можно використати на супротивника (атака)

Pawn: 
* Для наступного ходу противника має шанс уклону від його атаки на 25%(крім тих атак які ігнорують уклон)
-> Наносить урон 20 ед

Bishop:
* Наступна атака супротивника може бети контратакована з шансом 65% 
* Для наступного ходу противника має шанс уклону від його атаки на 25%(крім тих атак які ігнорують уклон)
-> Наносить урон 30 ед

Rook:
* Хілить свое здоровьє на 30 ед
-> Наносить 50 ед урона з шансом 30% 70 ед, але пропускае наступний свій хід
-> Наносить урон 15 ед

Knight:
* Він отримуе стак до додаткового урону, тобто він накопичуе коофіціент до наступної атаки, максимум 5 ед стаку
-> Наносить 15 ед урона помножене на кількість стаків, але наносить собі після атаки 15 ед урону

Queen:
* На наступну атаку супротивника вона отримуе на 60% урона менше, але можна використовувати через ход після використання
-> Наносить 35 ед урона, але наносить собі після атаки 15 ед урону (копіює knight)
-> Наносить 50 ед урона з шансом 30% 70 ед, але пропускае наступний свій хід (копіює rook)
-> Наносить урон 20 ед (копіює pawn)

King:
* Хілить собі 20 ед здоровья а також забирає сталькиж хп у супротивника (20 ед)
* Накладає щит, наступна атака супротивника наносить йому 50% від того скільки урону отримав король
* Якщо у супротивника хп менше ніж 15% то він помирае, інакше королю наноситься 40 ед урону


## Автор

Документація створена для проекту Chess.gg Prototype BackEnd.

