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

### Файл: `client.js`

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
  //   playerColors: { socketId1: 'white', socketId2: 'black' }
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

## Автор

Документація створена для проекту Chess.gg Prototype BackEnd.

