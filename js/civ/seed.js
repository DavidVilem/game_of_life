import { board, BOARD_SIZE, civilizations, INITIAL_CELLS_PER_CIV } from '../core/game.js';

/**
 * Inicializa el tablero asignando celdas de inicio para cada civilización.
 * 
 * Para cada civilización:
 *   - Selecciona una celda inicial aleatoria como "centro".
 *   - Usa un enfoque tipo "BFS" (cola) para expandirse a las celdas vecinas.
 *   - Marca cada celda asignada con el índice de la civilización.
 *   - Continua hasta colocar el número inicial de celdas definido.
 */
export function seedCivilizations() {
    civilizations.forEach((civ, idx) => {
        let cellsPlaced = 0;
        // 1. Elige un punto central aleatorio para la civilización
        const x0 = Math.floor(Math.random() * BOARD_SIZE);
        const y0 = Math.floor(Math.random() * BOARD_SIZE);
        // Inicializa una cola con el punto central
        const queue = [[x0, y0]];
        // Continua hasta que se hayan asignado todas las celdas iniciales o no queden opciones
        while (cellsPlaced < INITIAL_CELLS_PER_CIV && queue.length > 0) {
            const [x, y] = queue.shift();
            // Verifica que la celda esté dentro del tablero y esté libre
            if (
                x >= 0 && x < BOARD_SIZE &&
                y >= 0 && y < BOARD_SIZE &&
                board[y][x] === null
            ) {
                // Asigna la celda a la civilización correspondiente
                board[y][x] = idx;
                cellsPlaced++;
                // Determina los vecinos alrededor de la celda actual (incluye diagonales)
                let neighbors = [
                    [x+1, y], [x-1, y], [x, y+1], [x, y-1],
                    [x+1, y+1], [x-1, y-1], [x+1, y-1], [x-1, y+1]
                ];
                // Mezcla aleatoriamente el orden de los vecinos para una expansión menos predecible
                neighbors = neighbors.sort(() => Math.random() - 0.5);
                // Añade los vecinos válidos (dentro del tablero y sin ocupar) a la cola
                for (const [nx, ny] of neighbors) {
                    if (
                        nx >= 0 && nx < BOARD_SIZE &&
                        ny >= 0 && ny < BOARD_SIZE &&
                        board[ny][nx] === null
                    ) {
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    });
}