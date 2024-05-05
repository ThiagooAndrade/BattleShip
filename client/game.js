const gamesBoardContainer = document.querySelector("#gamesboard-container");
const optionContainer = document.querySelector("#option-container");
const flipButton = document.querySelector("#flip-button");
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector("#restart-button");
const infoDisplay = document.querySelector('#info');
const turnDisplay = document.querySelector('#turn-display');

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = (e) => {
    console.log("conectado!")
}

const shipQtd = 5;

const optionContainerDefault = [];

for (let i = 0; i < $(optionContainer).children().length; i++) {
    optionContainerDefault.push($(optionContainer).children().get(i).outerHTML);
}

let angle = 0;

function flip() {
    const optionShips = Array.from($(optionContainer).children());
    angle = angle === 0 ? 90 : 0;
    optionShips.forEach(optionShip => $(optionShip).css('transform', `rotate(${angle}deg)`));
}
$(flipButton).click(flip)

const width = 10;

function createBoard(color, user) {
    const gameBoardContainer = document.createElement('div');
    $(gameBoardContainer).addClass('width-300')
    $(gameBoardContainer).addClass('height-300')
    $(gameBoardContainer).addClass('d-flex')
    $(gameBoardContainer).addClass('flex-wrap')
    $(gameBoardContainer).css("background-color", color);
    gameBoardContainer.id = user;

    for (let i = 0; i < width * width; i++) {
        const block = document.createElement('div');
        $(block).addClass("width-30");
        $(block).addClass("height-30");
        block.id = i;
        $(gameBoardContainer).append(block);
    }

    $(gamesBoardContainer).append(gameBoardContainer);
}

createBoard('yellow', 'player');
createBoard('pink', 'computer');

class Ship {
    constructor(name, color, length) {
        this.name = name;
        this.length = length;
        this.color = color;
    }
}

const destroyer = new Ship('destroyer', 'blue', 2);
const submarine = new Ship('submarine', 'green', 3);
const cruiser = new Ship('cruiser', 'orange', 3);
const battleship = new Ship('battleship', 'brown', 4);
const carrier = new Ship('carrier', 'purple', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
    let validStart = isHorizontal ? startIndex <= Math.pow(width, 2) - ship.length ? startIndex : Math.pow(width, 2) - ship.length : startIndex <= Math.pow(width, 2) - width * ship.length ? startIndex : startIndex - ship.length * width + width;

    let shipBlocks = [];

    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i]);
        } else {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i * width]);
        }
    }

    let valid;

    if (isHorizontal) {
        shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)));
    } else {
        shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id < 90 + (width * index + 1));
    }
    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'));

    return { shipBlocks, valid, notTaken };
}


function addShipPiece(user, ship, startId) {
    const allBoardBlocks = document.querySelectorAll(`#${user} div`);
    let randomBoolean = Math.random() < 0.5;
    let isHorizontal = user === 'player' ? angle === 0 : randomBoolean;
    let randomStartIndex = Math.floor(Math.random() * Math.pow(width, 2));

    let startIndex = startId ? startId : randomStartIndex;

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            $(shipBlock).addClass(ship.name);
            const color = ship.color; //para testar o jogo, é possivel ver os navios do outro jogador
            // const color = user === "computer" ? 'pink' : ship.color; //para jogar o jogo normalmente, não é possivel saber os navios do outro jogador 
            $(shipBlock).css('background-color', color);
            $(shipBlock).addClass('taken');
        })
    } else {
        if (user === 'computer') addShipPiece(user, ship, startId);
        if (user === 'player') notDropped = true;
    }
}

ships.forEach(ship => addShipPiece('computer', ship, null));

let draggedShip;
const optionShips = Array.from(optionContainer.children);
optionShips.forEach(optionShip => $(optionShip).on('dragstart', dragStart));

const allPlayerBlocks = document.querySelectorAll("#player div");
allPlayerBlocks.forEach(playerBlock => {
    $(playerBlock).on('dragover', dragOver);
    $(playerBlock).on('drop', dropShip);
})

function dragStart(e) {
    notDropped = false;
    draggedShip = e.target;
}

function dragOver(e) {
    e.preventDefault();
    const ship = ships[draggedShip.id];
    highlightArea(e.target.id, ship);
}

function dropShip(e) {
    e.preventDefault();
    const startId = e.target.id;
    const ship = ships[draggedShip.id];

    const allPlayerBlocks = document.querySelectorAll("#player div");
    for (let i = 0; i < allPlayerBlocks.length; i++) {
        if (allPlayerBlocks[i].classList.contains(ship.name)) {
            notDropped = true;
            break;
        }
    }

    if (!notDropped) {
        addShipPiece('player', ship, startId);
    }

    for (let i = 0; i < allPlayerBlocks.length; i++) {
        if (allPlayerBlocks[i].classList.contains(ship.name)) {
            $(draggedShip).remove();
            break;
        }
    }
}

function highlightArea(startIndex, ship) {
    const allBoardBlocks = document.querySelectorAll('#player div');
    let isHorizontal = angle === 0;

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship);

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            $(shipBlock).addClass('hover');
            setTimeout(() => $(shipBlock).removeClass('hover'), 250);
        })
    }
}

let gameOver = false;
let playerTurn = true;

function startGame() {
    if (playerTurn === true) {
        if ($(optionContainer).children().length != 0) {
            $(infoDisplay).html('Please place all your pieces first!');
        } else {
            const allBoardComputerBlocks = document.querySelectorAll('#computer div');
            allBoardComputerBlocks.forEach(block => block.addEventListener('click', handleCLick));
            playerTurn = true;
            $(turnDisplay).html("Your Go!");
            $(infoDisplay).html("The game has started");
        }
    }
}
$(startButton).click(startGame);

let playerHits = [];
let computerHits = [];
let playerSunkShips = [];
let computerSunkShips = [];

function handleCLick(e) {
    playerTurn = false;
    if (!gameOver) {
        if (e.target.classList.contains('boom') || e.target.classList.contains('empty')) {
            $(infoDisplay).html('You already claim that area');
            return;
        }
        if (e.target.classList.contains('taken')) {
            $(e.target).addClass('boom');
            $(infoDisplay).html('You hit the computers ship!');
            let classes = Array.from(e.target.classList);
            classes = classes.filter(className => className !== 'block');
            classes = classes.filter(className => className !== 'boom');
            classes = classes.filter(className => className !== 'taken');
            playerHits.push(...classes);
            checkScore('player', playerHits, playerSunkShips);
        }
        else {
            $(e.target).addClass('empty');
            $(infoDisplay).html("You misses");
        }

        const allBoardBlocks = document.querySelectorAll('#computer div');
        allBoardBlocks.forEach(block => $(block).replaceWith(block.cloneNode(true)));
        if (!playerTurn) {
            setTimeout(computerGo, 100);
        }
    }
}

function computerGo() {
    if (!gameOver && !playerTurn) {
        $(turnDisplay).html("Computer Go!");
        $(infoDisplay).html("The computer is thinking...");

        setTimeout(() => {
            let randomGo = Math.floor(Math.random() * Math.pow(width, 2));
            const allBoardBlocks = document.querySelectorAll('#player div');

            if (allBoardBlocks[randomGo].classList.contains('taken') && allBoardBlocks[randomGo].classList.contains('boom')) {
                computerGo();
                return;
            } else if (allBoardBlocks[randomGo].classList.contains('taken') && !allBoardBlocks[randomGo].classList.contains('boom')) {
                $(allBoardBlocks[randomGo]).addClass('boom');
                $(infoDisplay).html("The computer hit your ship");
                let classes = Array.from(allBoardBlocks[randomGo].classList);
                classes = classes.filter(className => className !== 'block');
                classes = classes.filter(className => className !== 'boom');
                classes = classes.filter(className => className !== 'taken');
                computerHits.push(...classes);
                checkScore('computer', computerHits, computerSunkShips);
            } else {
                $(infoDisplay).html("Nothing hit this time");
                $(allBoardBlocks[randomGo]).addClass('empty');
            }
        }, 100)
        setTimeout(() => {
            playerTurn = true;
            $(turnDisplay).html("Your go!");
            $(infoDisplay).html("Please take your go.");
            const allPlayerBlocks = document.querySelectorAll('#computer div');
            allPlayerBlocks.forEach(block => $(block).click(handleCLick));
        }, 100);
    }
}

function checkScore(user, userHits, userSunkShips) {
    function checkShip(shipName, shipLength) {
        if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {

            if (user === 'player') {
                $(infoDisplay).html(`You sunk the computer's ${shipName}`);
                playerHits = userHits.filter(storedShipName => storedShipName !== shipName);
            }
            if (user === 'computer') {
                $(infoDisplay).html(`The computer sunk your ${shipName}`);
                computerHits = userHits.filter(storedShipName => storedShipName !== shipName);
            }
            userSunkShips.push(shipName);
        }
    }

    checkShip('destroyer', 2);
    checkShip('submarine', 3);
    checkShip('cruiser', 3);
    checkShip('battleship', 4);
    checkShip('carrier', 5);


    if (playerSunkShips.length === shipQtd) {
        $(infoDisplay).html('You sunk all the computers ships. YOU WON!');
        window.alert("YOU WON!")
        restartGame();
    }
    if (computerSunkShips.length === shipQtd) {
        $(infoDisplay).html('The computer has sunk all your ships. YOU LOST!');
        restartGame();
        gameOver = true;
    }
}

function restartShipBlocks(allBoardBlocks, colorDefault) {
    for (let index = 0; index < allBoardBlocks.length; index++) {
        $(allBoardBlocks[index]).css('background-color', colorDefault);
        if (allBoardBlocks[index].classList.contains('taken')) {
            $(allBoardBlocks[index]).removeClass('taken');
        }
        if (allBoardBlocks[index].classList.contains('boom')) {
            $(allBoardBlocks[index]).removeClass('boom');
        }
        if (allBoardBlocks[index].classList.contains('empty')) {
            $(allBoardBlocks[index]).removeClass('empty');
        }
        ships.forEach(ship => {
            if (allBoardBlocks[index].classList.contains(ship.name)) {
                $(allBoardBlocks[index]).removeClass(ship.name);
            }
        })
    }
}

let restartingGame = false;

function restartGame() {
    const allBoardBlocksPlayer = document.querySelectorAll('#player div');
    restartShipBlocks(allBoardBlocksPlayer, 'yellow');
    const allBoardBlocksComputer = document.querySelectorAll('#computer div');
    restartShipBlocks(allBoardBlocksComputer, 'pink');
    ships.forEach(ship => addShipPiece('computer', ship, null));



    optionContainer.innerHTML = optionContainerDefault.join('');

    const optionShips = Array.from($(optionContainer).children());
    optionShips.forEach(optionShip => $(optionShip).on('dragstart', dragStart));

    angle = 90;
    flip();

    playerSunkShips = [];
    computerSunkShips = [];
    playerHits = [];
    computerHits = [];
    gameOver = false;
    // restartingGame = true;
    playerTurn = true;
}
$(restartButton).click(restartGame);

const gamesBoardContainer = document.querySelector("#gamesboard-container")
const optionContainer = document.querySelector(".option-container")
const flipButton = document.querySelector("#flip-button")
const startButton = document.querySelector('#start-button')
const infoDisplay = document.querySelector('#info')
const turnDisplay = document.querySelector('#turn-display')



let angle = 0;

function flip() {
    const optionShips = Array.from(optionContainer.children)
    angle = angle === 0 ? 90 : 0
    console.log(angle)
    optionShips.forEach(optionShip => optionShip.style.transform = `rotate(${angle}deg)`)
}
flipButton.addEventListener("click", flip)

const width = 10;

function createBoard(color, user) {
    const gameBoardContainer = document.createElement('div')
    gameBoardContainer.classList.add('game-board')
    gameBoardContainer.style.backgroundColor = color
    gameBoardContainer.id = user

    for (let i = 0; i < width * width; i++) {
        const block = document.createElement('div')
        block.classList.add("block")
        block.id = i
        gameBoardContainer.append(block)
    }

    gamesBoardContainer.append(gameBoardContainer)
}

createBoard('yellow', 'player')
createBoard('pink', 'computer')

class Ship {
    constructor(name, length) {
        this.name = name
        this.length = length
    }
}

const destroyer = new Ship('destroyer', 2)
const submarine = new Ship('submarine', 3)
const cruiser = new Ship('cruiser', 3)
const battleship = new Ship('battleship', 4)
const carrier = new Ship('carrier', 5)

const ships = [destroyer, submarine, cruiser, battleship, carrier]
let notDropped

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
    let validStart = isHorizontal ? startIndex <= Math.pow(width, 2) - ship.length ? startIndex : Math.pow(width, 2) - ship.length : startIndex <= Math.pow(width, 2) - width * ship.length ? startIndex : startIndex - ship.length * width + width

    let shipBlocks = []

    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i])
        } else {
            shipBlocks.push(allBoardBlocks[Number(validStart) + i * width])
        }
    }

    let valid

    if (isHorizontal) {
        shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id % width !== width - (shipBlocks.length - (index + 1)))
    } else {
        shipBlocks.every((_shipBlock, index) => valid = shipBlocks[0].id < 90 + (width * index + 1))
    }
    const notTaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))

    return { shipBlocks, valid, notTaken }
}

function addShipPiece(user, ship, startId) {
    const allBoardBlocks = document.querySelectorAll(`#${user} div`)
    let randomBoolean = Math.random() < 0.5
    let isHorizontal = user === 'player' ? angle === 0 : randomBoolean
    let randomStartIndex = Math.floor(Math.random() * Math.pow(width, 2))

    let startIndex = startId ? startId : randomStartIndex

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)


    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
        })
    } else {
        if (user === 'computer') addShipPiece(user, ship, startId)
        if (user === 'player') notDropped = true
    }
}

ships.forEach(ship => addShipPiece('computer', ship, null))

let draggedShip
const optionShips = Array.from(optionContainer.children)
optionShips.forEach(optionShip => optionShip.addEventListener('dragstart', dragStart))

const allPlayerBlocks = document.querySelectorAll("#player div")
allPlayerBlocks.forEach(playerBlock => {
    playerBlock.addEventListener('dragover', dragOver)
    playerBlock.addEventListener('drop', dropShip)
})

function dragStart(e) {
    notDropped = false
    draggedShip = e.target
}

function dragOver(e) {
    e.preventDefault()
    const ship = ships[draggedShip.id]
    highlightArea(e.target.id, ship)
}

function dropShip(e) {
    const startId = e.target.id
    const ship = ships[draggedShip.id]
    addShipPiece('player', ship, startId)
    if (!notDropped) {
        draggedShip.remove()
    }
}

function highlightArea(startIndex, ship) {
    const allBoardBlocks = document.querySelectorAll('#player div')
    let isHorizontal = angle === 0

    const { shipBlocks, valid, notTaken } = getValidity(allBoardBlocks, isHorizontal, startIndex, ship)

    if (valid && notTaken) {
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add('hover')
            setTimeout(() => shipBlock.classList.remove('hover'), 250)
        })
    }
}

let gameOver = false
let playerTurn


function startGame() {
    if (playerTurn === undefined) {
        if (optionContainer.children.length != 0) {
            infoDisplay.textContent = 'Please place all your pieces first!'
        } else {
            const allBoardBlocks = document.querySelectorAll('#computer div')
            allBoardBlocks.forEach(block => block.addEventListener('click', handleCLick))
            playerTurn = true
            turnDisplay.textContent = "Your Go!"
            infoDisplay.textContent = "The game has started"
        }

    }
}
startButton.addEventListener('click', startGame)

let playerHits = []
let computerHits = []
const playerSunkShips = []
const computerSunkShips = []

function handleCLick(e) {
    if (!gameOver) {
        if (e.target.classList.contains('taken')) {
            e.target.classList.add('boom')
            infoDisplay.textContent = 'You hit the computers ship!'
            let classes = Array.from(e.target.classList)
            classes = classes.filter(className => className !== 'block')
            classes = classes.filter(className => className !== 'boom')
            classes = classes.filter(className => className !== 'taken')
            playerHits.push(...classes)
            checkScore('player', playerHits, playerSunkShips)
        }
        if (!e.target.classList.contains('taken')) {
            e.target.classList.add('empty')
            infoDisplay.textContent = "You misses"
        }
        playerTurn = false
        const allBoardBlocks = document.querySelectorAll('#computer div')
        allBoardBlocks.forEach(block => block.replaceWith(block.cloneNode(true)))
        setTimeout(computerGo, 100)
    }
}

function computerGo() {
    if (!gameOver) {
        turnDisplay.textContent = "Computer Go!"
        infoDisplay.textContent = "The computer is thinking..."

        setTimeout(() => {
            let randomGo = Math.floor(Math.random() * Math.pow(width, 2))
            const allBoardBlocks = document.querySelectorAll('#player div')

            if (allBoardBlocks[randomGo].classList.contains('taken') && allBoardBlocks[randomGo].classList.contains('boom')) {
                computerGo()
                return
            } else if (allBoardBlocks[randomGo].classList.contains('taken') && !allBoardBlocks[randomGo].classList.contains('boom')) {
                allBoardBlocks[randomGo].classList.add('boom')
                infoDisplay.textContent = "The computer hit your ship"
                let classes = Array.from(allBoardBlocks[randomGo].classList)
                classes = classes.filter(className => className !== 'block')
                classes = classes.filter(className => className !== 'boom')
                classes = classes.filter(className => className !== 'taken')
                computerHits.push(...classes)
                checkScore('computer', computerHits, computerSunkShips)
            } else {
                infoDisplay.textContent = "Nothing hit this time"
                allBoardBlocks[randomGo].classList.add('empty')
            }
        }, 100)
        setTimeout(() => {
            playerTurn = true
            turnDisplay.textContent = "Your go!"
            infoDisplay.textContent = "Please take your go."
            const allPlayerBlocks = document.querySelectorAll('#computer div')
            allPlayerBlocks.forEach(block => block.addEventListener('click', handleCLick))
        }, 100)
    }
}

function checkScore(user, userHits, userSunkShips) {
    function checkShip(shipName, shipLength) {
        if (userHits.filter(storedShipName => storedShipName === shipName).length === shipLength) {

            if (user === 'player') {
                infoDisplay.textContent = `You sunk the computer's ${shipName}`
                playerHits = userHits.filter(storedShipName => storedShipName !== shipName)
            }
            if (user === 'computer') {
                infoDisplay.textContent = `The computer sunk your ${shipName}`
                computerHits = userHits.filter(storedShipName => storedShipName !== shipName)
            }
            userSunkShips.push(shipName)
        }
    }

    checkShip('destroyer', 2)
    checkShip('submarine', 3)
    checkShip('cruiser', 3)
    checkShip('battleship', 4)
    checkShip('carrier', 5)

    console.log('playerHits', playerHits)
    console.log('playerSunkShips', playerSunkShips)

    if (playerSunkShips.length === 5) {
        infoDisplay.textContent = 'You sunk all the computers ships. YOU WON!'
    }
    if (computerSunkShips.length === 5) {
        infoDisplay.textContent = 'The computer has sunk all your ships. YOU LOST!'
        gameOver = true
    }
}