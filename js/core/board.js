import { board } from './game.js';
import { INITIAL_CELLS_PER_CIV, BOARD_SIZE, civilizations } from '../core/game.js';

/**
 * Crea o reinicializa el tablero de juego.
 * Llena el array 'board' con filas y columnas de tamaño BOARD_SIZE,
 * dejando todas las celdas en null (vacías).
 */
export function createBoard() {
    board.length = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        board.push(Array(BOARD_SIZE).fill(null));
    }
}

/**
 * Devuelve las coordenadas de las 8 celdas vecinas (incluye diagonales)
 * alrededor de la posición (x, y), siempre y cuando estén dentro de los límites del tablero.
 * @param {number} x - Coordenada horizontal de la celda central.
 * @param {number} y - Coordenada vertical de la celda central.
 * @returns {Array} neighbors - Array de pares [nx, ny] de vecinos válidos.
 */
export function getNeighbors(x, y) {
    const deltas = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
    ];
    let neighbors = [];
    for (let [dx, dy] of deltas) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            neighbors.push([nx, ny]);
        }
    }
    return neighbors;
}

/**
 * Cuenta cuántas celdas pertenecen a una civilización específica en el tablero dado.
 * @param {Array} board - Tablero bidimensional.
 * @param {number} civIdx - Índice de la civilización.
 * @returns {number} count - Número total de celdas ocupadas por la civilización.
 */
export function countCellsByCiv(board, civIdx) {
    let count = 0;
    for (let row of board) for (let cell of row) if (cell === civIdx) count++;
    return count;
}

/**
 * Determina si una celda (y, x) y sus tres vecinas derechas/abajo forman un bloque 2x2
 * homogéneo de la misma civilización (civIdx). Si lo son, marca las 4 celdas como estables
 * en el mapa 'stableMap'.
 * @param {number} y - Fila inicial.
 * @param {number} x - Columna inicial.
 * @param {number} civIdx - Índice de civilización a verificar.
 * @param {Array} stableMap - Matriz booleana para marcar bloques estables.
 * @returns {boolean} true si se encontró bloque 2x2 homogéneo, false en caso contrario.
 */
export function isStableBlock(y, x, civIdx, stableMap) {
    // Checa si la celda y tres adyacentes derechas y abajo forman un bloque 2x2 homogéneo
    if (
        y + 1 < BOARD_SIZE && x + 1 < BOARD_SIZE &&
        board[y][x] === civIdx &&
        board[y][x + 1] === civIdx &&
        board[y + 1][x] === civIdx &&
        board[y + 1][x + 1] === civIdx
    ) {
        stableMap[y][x] = stableMap[y][x + 1] = stableMap[y + 1][x] = stableMap[y + 1][x + 1] = true;
        return true;
    }
    return false;
}