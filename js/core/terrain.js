import { BOARD_SIZE } from '../core/game.js';
import { board } from '../core/game.js';
import { getNeighbors } from './board.js';
import { BIOMES } from '../ui/draw.js'; 

export let terrain = []; // Matriz bidimensional que representa el tipo de bioma de cada celda

/**
 * Genera el mapa de biomas (terreno) para el tablero.
 * - Usa una proporción fija de "pradera" (70%) y reparte el resto aleatoriamente
 *   entre los otros biomas definidos en BIOMES.
 * - Distribuye los biomas de forma aleatoria sobre el tablero.
 */
export function createTerrain() {
    // 1. Define proporciones de cada bioma
    const BOARD_AREA = BOARD_SIZE * BOARD_SIZE;
    const praderaCount = Math.floor(BOARD_AREA * 0.7); // 70% pradera
    const otherBiomes = BIOMES.filter(b => b.key !== 'pradera');
    const slotsLeft = BOARD_AREA - praderaCount;

    // 2. Asigna proporciones aleatorias a los otros biomas
    let randomParts = [];
    let totalRandom = 0;
    for (let i = 0; i < otherBiomes.length; i++) {
        let part = Math.random();
        randomParts.push(part);
        totalRandom += part;
    }

    // 3. Calcula la cantidad de celdas para cada bioma extra (redondea)
    let biomeCounts = [praderaCount];
    let sumOther = 0;
    for (let i = 0; i < otherBiomes.length; i++) {
        let count = Math.round((randomParts[i] / totalRandom) * slotsLeft);
        biomeCounts.push(count);
        sumOther += count;
    }
    // Ajusta el último para cuadrar el 100% del área
    biomeCounts[biomeCounts.length - 1] += slotsLeft - sumOther;

    // 4. Prepara el "pool" de biomas (array con la cantidad exacta de cada bioma)
    let biomePool = [];
    biomeCounts.forEach((count, i) => {
        const key = i === 0 ? 'pradera' : otherBiomes[i - 1].key;
        for (let j = 0; j < count; j++) biomePool.push(key);
    });

    // 5. Mezcla el pool aleatoriamente (algoritmo Fisher-Yates)
    for (let i = biomePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [biomePool[i], biomePool[j]] = [biomePool[j], biomePool[i]];
    }
    
    // Inicializa la matriz de terreno
    for (let y = 0; y < BOARD_SIZE; y++) {
        terrain[y] = [];
    }

    // 6. Asigna el tipo de bioma a cada celda del tablero
    let idx = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            terrain[y][x] = biomePool[idx++];
        }
    }
}

/**
 * Simula la expansión natural del desierto:
 * - Encuentra celdas de pradera vecinas a celdas de desierto
 *   (solo si están vacías) y convierte aleatoriamente una de ellas en desierto.
 */
export function expandDesert() {
    let toDesert = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (terrain[y][x] === "desierto") {
                getNeighbors(x, y).forEach(([nx, ny]) => {
                    if (terrain[ny][nx] === "pradera" && board[ny][nx] === null) {
                        toDesert.push([nx, ny]);
                    }
                });
            }
        }
    }
    // Evita duplicados en la lista de posibles celdas a convertir
    toDesert = toDesert.filter(
        ([x, y], idx, arr) => arr.findIndex(([x2, y2]) => x2 === x && y2 === y) === idx
    );
    // Si hay candidatos, elige uno al azar y lo convierte en desierto
    if (toDesert.length > 0) {
        const [x, y] = toDesert[Math.floor(Math.random() * toDesert.length)];
        terrain[y][x] = "desierto";
    }
}

/**
 * Determina si la celda (x, y) o alguna de sus vecinas es del tipo de bioma indicado.
 * @param {number} x - coordenada x de la celda central.
 * @param {number} y - coordenada y de la celda central.
 * @param {string} type - tipo de bioma a buscar.
 * @returns {boolean} true si la celda o alguna vecina coincide.
 */
export function terrainAround(x, y, type) {
    return getNeighbors(x, y).some(([nx, ny]) => terrain[ny][nx] === type) || terrain[y][x] === type;
}