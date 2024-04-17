const state = {
    grid: Array(10)
        .fill()
        .map(() => Array(10).fill(""))
};

function updateGrid() {
    for (let line = 0; line < state.grid.length; line++) {
        for (let column = 0; column < state.grid[line].length; column++) {
            const cell = document.getElementById(`cell${line}${column}`);
            // box.textContent = state.grid[line][column];
        }
    }
}

function drawBox(container, row, col) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = `cell${row}${col}`;
    // box.textContent = letter;

    container.appendChild(cell);
    return cell;
}

function drawGrid(container) {
    const grid = document.createElement("div");
    grid.className = "grid";

    for (let line = 0; line < 10; line++) {
        for (let column = 0; column < 10; column++) {
            drawBox(grid, line, column);
        }
    }

    container.appendChild(grid);
}

function startup() {
    const game = document.getElementById("game");
    drawGrid(game);
}

startup();