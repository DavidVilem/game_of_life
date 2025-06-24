// Importa utilidades para crear tablero, vecinos, bloques estables, terreno y visualización.
import { createBoard, getNeighbors, isStableBlock } from './board.js';
import { createTerrain, expandDesert, terrain } from './terrain.js';
import { fixedTechCells, fixedRelCells, fixedMilCells, createCivilizations, cellCounts} from '../civ/civs.js';
import { updateCivilizationStats } from '../civ/civStats.js';
import { drawBoard, drawStats, COLORS, SYMBOLS } from '../ui/draw.js';
import { sizeInput, civsInput, cellsInput, autoBtn } from '../ui/controls.js';
import { seedCivilizations } from '../civ/seed.js';
import { BIOME_RULES } from '../ui/draw.js'; 

// Variables globales del estado de la simulación y configuración inicial.
export let running = false;            // Controla si la simulación está activa.
export let globalTurn = 0;             // Contador global de ciclos.
export let interval = null;            // Referencia al intervalo de simulación automática.
export let board = [];                 // Tablero principal.
export let civilizations = [];         // Lista de civilizaciones.
export let BOARD_SIZE = 50;            // Tamaño del tablero.
export let NUM_CIVS = 3;               // Número de civilizaciones.
export let INITIAL_CELLS_PER_CIV = 30; // Celdas iniciales por civilización.
export let civilizacionesLog = [];     // Historial/log de estados por turno.

// Función principal para inicializar la simulación.
// Lee valores de los inputs, limpia estructuras y arranca el ciclo inicial.
export function startSimulation(event) {
    fixedTechCells.length = 0;
    fixedRelCells.length = 0;
    fixedMilCells.length = 0;
    if (event) event.preventDefault();
    BOARD_SIZE = Math.max(10, Math.min(200, parseInt(sizeInput.value) || 50));
    NUM_CIVS = Math.max(2, Math.min(10, parseInt(civsInput.value) || 3));
    INITIAL_CELLS_PER_CIV = Math.max(1, Math.min(500, parseInt(cellsInput.value) || 30));
    createCivilizations(NUM_CIVS, COLORS, SYMBOLS);
    createBoard();
    createTerrain();
    seedCivilizations();
    drawBoard();
    stopAuto();
}

// Realiza un paso/ciclo de la simulación (alias para nextGeneration)
export function step() {
    nextGeneration();
}

// Simula una batalla entre dos civilizaciones según su fuerza.
// Devuelve el ganador ("A" o "B") y la etiqueta usada para el desempate.
function fuerzaBattle(civA, civB) {
    const total = civA.fuerza + civB.fuerza;
    if (total === 0) return { winner: Math.random() < 0.5 ? "A" : "B", label: "Fuerza" };
    const probA = civA.fuerza / total;
    return { winner: Math.random() < probA ? "A" : "B", label: "Fuerza" };
}

// Determina si la civilización puede atacar (por personalidad)
function puedeAtacar(civ) {
    return ["halcon", "militarista", "elegido"].includes(civ.personalidad);
}

// Determina si la civilización solo puede defender (por personalidad)
function soloDefiende(civ) {
    return ["paloma", "tecnologico", "equilibrado"].includes(civ.personalidad);
}

// Borra cualquier edificio presente en una celda específica (x, y) para todas las civilizaciones.
function borrarEdificiosEn(x, y) {
    civilizations.forEach(civ => {
        civ.plantasTec = civ.plantasTec.filter(([px, py]) => px !== x || py !== y);
        civ.iglesias   = civ.iglesias.filter(([px, py]) => px !== x || py !== y);
        civ.cuarteles  = civ.cuarteles.filter(([px, py]) => px !== x || py !== y);
    });
}

// Limpia referencias a edificios que ya no existen en el tablero (evita "fantasmas").
function limpiarFantasmas() {
    civilizations.forEach(civ => {
        civ.plantasTec = civ.plantasTec.filter(([px, py]) => board[py][px] !== null && board[py][px] === civilizations.indexOf(civ));
        civ.iglesias   = civ.iglesias.filter(([px, py])   => board[py][px] !== null && board[py][px] === civilizations.indexOf(civ));
        civ.cuarteles  = civ.cuarteles.filter(([px, py])  => board[py][px] !== null && board[py][px] === civilizations.indexOf(civ));
    });
}

// Devuelve true si la celda [x, y] está completamente rodeada de celdas de la misma civilización (índice civIdx)
function isEncircled(x, y, civIdx, board) {
    const neighbors = getNeighbors(x, y);
    return neighbors.every(([nx, ny]) => board[ny][nx] === civIdx);
}

// Inicia o detiene la simulación automática.
export function auto() {
    if (running) {
        stopAuto();
        autoBtn.textContent = "▶️";
    } else {
        running = true;
        autoBtn.textContent = "⏸️";
        interval = setInterval(() => {
            nextGeneration();
        }, 180); // Velocidad de simulación (ms)
    }
}

// Detiene la simulación automática.
export function stopAuto() {
    running = false;
    autoBtn.textContent = "▶️";
    if (interval) clearInterval(interval);
}

// Calcula el "payoff" de la interacción entre dos estrategias (teoría de juegos, halcón-paloma).
function getPayoff(stratA, stratB) {
    const payoff = Math.floor(Math.random() * 10) + 1;
    if (stratA === "hawk" && stratB === "hawk") {
        return Math.random() < 0.5 ? [payoff, 0] : [0, payoff];
    }
    if (stratA === "hawk" && stratB === "dove") return [payoff, 0];
    if (stratA === "dove" && stratB === "hawk") return [0, payoff];
    if (stratA === "dove" && stratB === "dove") return [payoff / 2, payoff / 2];
}

// Redondea valores numéricos a dos decimales, si aplica.
function round2(val) {
    return (typeof val === "number" && !Number.isInteger(val)) ? Number(val.toFixed(2)) : val;
}

/**
 * Ejecuta la lógica de un ciclo ("generación") de la simulación.
 * - Actualiza las métricas de cada civilización.
 * - Loguea el estado por ciclo.
 * - Aplica reglas de expansión, conflicto y asimilación en el tablero.
 * - Aplica reglas de replicación de estrategias (si se usa payoff).
 * - Actualiza visualización.
 */
export function nextGeneration() {
    globalTurn++;
    updateCivilizationStats();
    // Log de snapshot de cada civilización
    civilizations.forEach((civ, idx) => {
        civilizacionesLog.push({
            ciclo: globalTurn,
            civilizacion: civ.name,
            personalidad: civ.personalidad,
            estrategia: civ.strategy,
            fuerza: round2(civ.fuerza),
            tecnologia: round2(civ.tecnologia),
            religion: round2(civ.religion),
            militar: round2(civ.militar),
            complejidad: round2(civ.complejidad),
            celdas: board.flat().filter(c => c === idx).length,
            plantasTec: civ.plantasTec.length,
            iglesias: civ.iglesias.length,
            cuarteles: civ.cuarteles.length
        });
    });

    // Expande desierto cada 3 turnos (cambia biomas en el terreno)
    if (globalTurn % 3 === 0) expandDesert();

    // Calcula bloques estables para futuras reglas (por ejemplo, montañas)
    let stableMap = Array.from({ length: BOARD_SIZE }, () =>
        Array(BOARD_SIZE).fill(false)
    );
    for (let y = 0; y < BOARD_SIZE - 1; y++) {
        for (let x = 0; x < BOARD_SIZE - 1; x++) {
            let civIdx = board[y][x];
            if (civIdx !== null) isStableBlock(y, x, civIdx, stableMap);
        }
    }

    // Prepara el nuevo tablero para la siguiente generación
    const newBoard = Array.from({ length: BOARD_SIZE }, () =>
        Array(BOARD_SIZE).fill(null)
    );

    // Manejo especial para expansión de montaña (retraso en ocupación)
    if (!window.mountainPending) window.mountainPending = Array.from({ length: BOARD_SIZE }, () =>
        Array(BOARD_SIZE).fill(null)
    );
    let mountainPending = window.mountainPending;

    // Lógica principal de expansión, conflicto y ocupación de celdas.
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const civIdx = board[y][x];
            const terrainType = terrain[y][x];
            const neighborsCoords = getNeighbors(x, y);
            const neighbors = neighborsCoords.map(([nx, ny]) => board[ny][nx]);
            const neighborCounts = {};
            neighbors.forEach(idx => {
                if (idx !== null) neighborCounts[idx] = (neighborCounts[idx] || 0) + 1;
            });

            // Solo se puede ocupar celdas de biomas "ocupables"
            if (!BIOME_RULES[terrainType]?.ocupable) continue;

            // --- CELDA OCUPADA ---
            if (civIdx !== null) {
                // Si está totalmente rodeada por la misma civ, permanece estable
                const surrounded = neighbors.length > 0 && neighbors.every(idx => idx === civIdx);
                if (surrounded) {
                    newBoard[y][x] = civIdx;
                    continue;
                }

                // Si tiene vecinos enemigos, batalla por fuerza (asimilación total)
                const enemyNeighbors = neighbors.filter(idx => idx !== civIdx && idx !== null);
                if (enemyNeighbors.length > 0) {
                    // Encuentra el vecino enemigo más fuerte
                    let rivalIdx = null, rivalForce = -Infinity;
                    for (let idx of enemyNeighbors) {
                        const force = civilizations[idx].fuerza;
                        if (force > rivalForce) {
                            rivalIdx = idx;
                            rivalForce = force;
                        }
                    }
                    if (rivalIdx !== null) {
                        const civA = civilizations[civIdx];
                        const civB = civilizations[rivalIdx];
                        if (puedeAtacar(civB) && civB.fuerza > civA.fuerza) {
                            // Asimilación: el rival toma la celda y destruye edificio si existe
                            borrarEdificiosEn(x, y);
                            newBoard[y][x] = rivalIdx;
                            continue;
                        }
                    }
                }
                // Regla de persistencia: si no hay asimilación, la celda permanece igual
                newBoard[y][x] = civIdx;
                continue;
            }

            // --- CELDA VACÍA ---
            if (civIdx === null) {
                // Reglas especiales para montaña (expansión lenta)
                if (terrainType === "montaña") {
                    const nonNullNeighbors = neighbors.filter(idx => idx !== null);
                    if (
                        nonNullNeighbors.length > 0 &&
                        nonNullNeighbors.every(idx => idx === nonNullNeighbors[0])
                    ) {
                        borrarEdificiosEn(x, y); // Limpia antes de ocupar
                        newBoard[y][x] = nonNullNeighbors[0];
                        mountainPending[y][x] = null;
                        continue;
                    }
                    let candidate = null, maxCount = 0;
                    for (let c = 0; c < civilizations.length; c++) {
                        const count = neighbors.filter(idx => idx === c).length;
                        const hasStable = neighborsCoords.some(
                            ([nx, ny]) => board[ny][nx] === c && stableMap[ny][nx]
                        );
                        if ((count >= 2) || (count >= 1 && hasStable)) {
                            if (count > maxCount) {
                                candidate = c;
                                maxCount = count;
                            }
                        }
                    }
                    if (candidate !== null) {
                        if (mountainPending[y][x] === candidate) {
                            borrarEdificiosEn(x, y);
                            newBoard[y][x] = candidate;
                            mountainPending[y][x] = null;
                        } else {
                            mountainPending[y][x] = candidate;
                        }
                    } else {
                        mountainPending[y][x] = null;
                    }
                    continue;
                }

                // Reglas para expansión en celdas normales (no montaña)
                const nonNullNeighbors = neighbors.filter(idx => idx !== null);
                if (
                    nonNullNeighbors.length > 0 &&
                    nonNullNeighbors.every(idx => idx === nonNullNeighbors[0])
                ) {
                    newBoard[y][x] = nonNullNeighbors[0];
                } else {
                    let contenders = [];
                    for (let c = 0; c < civilizations.length; c++) {
                        const count = neighbors.filter(idx => idx === c).length;
                        const hasStable = neighborsCoords.some(
                            ([nx, ny]) => board[ny][nx] === c && stableMap[ny][nx]
                        );
                        if ((count >= 2) || (count >= 1 && hasStable)) {
                            contenders.push({ civIdx: c, count });
                        }
                    }
                    if (contenders.length === 1) {
                        newBoard[y][x] = contenders[0].civIdx;
                    } else if (contenders.length > 1) {
                        contenders.sort((a, b) => b.count - a.count);
                        const top = contenders.filter(c => c.count === contenders[0].count);
                        let winnerIdx;
                        if (top.length === 1) {
                            winnerIdx = top[0].civIdx;
                        } else {
                            // Si hay empate, resuelve por teoría de juegos (halcón-paloma)
                            const civA = civilizations[top[0].civIdx];
                            const civB = civilizations[top[1].civIdx];
                            const [payoffA, payoffB] = getPayoff(civA.strategy, civB.strategy);
                            civA.payoff += payoffA;
                            civB.payoff += payoffB;

                            if (payoffA > payoffB) {
                                winnerIdx = top[0].civIdx;
                            } else if (payoffB > payoffA) {
                                winnerIdx = top[1].civIdx;
                            } else {
                                // Si empate de payoff, decide por fuerza
                                winnerIdx = civA.fuerza > civB.fuerza ? top[0].civIdx : top[1].civIdx;
                            }
                        }
                        newBoard[y][x] = winnerIdx;
                    }
                }

            }
        }
    }

    // Dinámica replicadora: civilizaciones pueden imitar estrategia del que mejor payoff tuvo ese turno.
    const oldStrategies = civilizations.map(civ => civ.strategy);
    civilizations.forEach((civ, idx) => {
        let bestPayoff = civ.payoff;
        let bestStrategy = civ.strategy;
        for (let j = 0; j < civilizations.length; j++) {
            if (j !== idx && civilizations[j].payoff > bestPayoff) {
                bestPayoff = civilizations[j].payoff;
                bestStrategy = oldStrategies[j];
            }
        }
        civ.strategy = bestStrategy;
        civ.payoff = 0;
    });

    board = newBoard;
    window.asimilacionesPorTurno = [];
    limpiarFantasmas();
    drawBoard();
    drawStats();
}