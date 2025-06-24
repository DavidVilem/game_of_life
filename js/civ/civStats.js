// Importa datos y funciones principales del núcleo del juego y los módulos relacionados.
import { civilizations, board, BOARD_SIZE } from '../core/game.js';
import { fixedTechCells, fixedRelCells, fixedMilCells, cellCounts } from '../civ/civs.js';
import { terrain, terrainAround } from '../core/terrain.js';
import { BIOME_RULES } from '../ui/draw.js'; 

// Pesos para calcular la fuerza final de una civilización.
export const WEIGHT_SIZE = 1.5;
export const WEIGHT_TECH = 2.0;
export const WEIGHT_MIL = 2.0;
export const WEIGHT_REL = 1.2;


/**
 * Calcula la entropía de Shannon para un arreglo de conteos.
 * Útil para medir la diversidad de elementos, como biomas o edificios.
 * @param {number[]} counts - Array de conteos por categoría.
 * @returns {number} - Entropía normalizada.
 */
function shannonEntropy(counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    let entropy = 0;
    for (const n of counts) {
        if (n === 0) continue;
        const p = n / total;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}


/**
 * Actualiza las estadísticas principales de cada civilización.
 * Incluye el manejo de turnos, construcción de edificios (tecnología, religión, militar),
 * suma de stats, y el cálculo de métricas avanzadas como entropía y complejidad.
 * Esta función debe llamarse cada ciclo/tick del juego para refrescar el estado.
 */
export function updateCivilizationStats() {
    civilizations.forEach(civ => {
        // Los contadores de turnos solo se incrementan aquí.
        civ.techTurns++;
        civ.relTurns++;
        civ.milTurns++;
        // Limpia los edificios temporales antes de recalcularlos.
        civ.plantasTec = [];
        civ.iglesias = [];
        civ.cuarteles = [];
    });

    // Recalcula cuántas celdas controla cada civilización en el tablero.
    let cellCounts = Array(civilizations.length).fill(0);
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            let civIdx = board[y][x];
            if (civIdx !== null) {
                cellCounts[civIdx]++;
            }
        }
    }

    civilizations.forEach((civ, idx) => {
        // Extrae las celdas donde hay edificios ya construidos por tipo.
        let techCells = fixedTechCells.filter(([x, y, ci]) => ci === idx);
        let relCells = fixedRelCells.filter(([x, y, ci]) => ci === idx);
        let milCells = fixedMilCells.filter(([x, y, ci]) => ci === idx);

        // Guarda las posiciones de los edificios actuales en el estado de la civilización.
        civ.plantasTec = techCells.map(([x, y]) => [x, y]);
        civ.iglesias   = relCells.map(([x, y]) => [x, y]);
        civ.cuarteles  = milCells.map(([x, y]) => [x, y]);

        // --- Construcción automática de EDIFICIOS segun personalidad ---
        // Parámetros para tipo de civilización: modifican la frecuencia y el bonus.
        // TECNOLOGÍA
        let techMaxMult = 1, techCycle = 2, techMult = 1;
        if (civ.personalidad === "tecnologico") { techMaxMult = 1.7; techCycle = 1; techMult = 2.5; }
        if (civ.personalidad === "militarista") { techMaxMult = 1.2; techCycle = 2; techMult = 1.2; }
        if (civ.personalidad === "equilibrado") { techMaxMult = 1; techCycle = 2; techMult = 1; }
        if (civ.personalidad === "paloma")      { techMaxMult = 0.9; techCycle = 3; techMult = 0.9; }
        if (civ.personalidad === "halcon")      { techMaxMult = 0.9; techCycle = 3; techMult = 0.9; }
        if (civ.personalidad === "elegido")     { techMaxMult = 1; techCycle = 2; techMult = 1; }

        // Calcula el máximo de edificios posibles según el tamaño de la civ.
        let maxTec = Math.floor(cellCounts[idx] / 4 * techMaxMult);
        let techCellsCount = techCells.length;

        // Bucle para construir edificios tecnológicos mientras alcance los turnos y espacio.
        while (civ.techTurns >= techCycle && techCellsCount < maxTec) {
            let celdasValidas = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const bioma = terrain[y][x];
                    if (
                        board[y][x] === idx &&
                        BIOME_RULES[bioma]?.construible &&
                        !fixedTechCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedRelCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedMilCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx)
                    ) {
                        celdasValidas.push([x, y]);
                    }
                }
            }
            if (celdasValidas.length === 0) break;
            let idxCelda = Math.floor(Math.random() * celdasValidas.length);
            let [px, py] = celdasValidas[idxCelda];
            fixedTechCells.push([px, py, idx]);
            civ.plantasTec.push([px, py]);
            civ.techTurns -= techCycle;
            civ.tecnologia += techMult;
            techCellsCount++;
        }

        // RELIGIÓN
        let relMaxMult = 1, relCycle = 4, relMult = 1;
        if (civ.personalidad === "elegido")     { relMaxMult = 1.5; relCycle = 3; relMult = 2.5; }
        if (civ.personalidad === "paloma")      { relMaxMult = 1.3; relCycle = 3; relMult = 2; }
        if (civ.personalidad === "tecnologico") { relMaxMult = 0.8; relCycle = 5; relMult = 0.7; }
        if (civ.personalidad === "militarista") { relMaxMult = 0.8; relCycle = 5; relMult = 0.7; }
        if (civ.personalidad === "halcon")      { relMaxMult = 0.8; relCycle = 5; relMult = 0.7; }
        if (civ.personalidad === "equilibrado") { relMaxMult = 1; relCycle = 4; relMult = 1; }

        let maxRel = Math.floor(cellCounts[idx] / 6 * relMaxMult);
        let relCellsCount = relCells.length;

        // Construcción de edificios religiosos bajo reglas similares.
        while (civ.relTurns >= relCycle && relCellsCount < maxRel) {
            let celdasValidas = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const bioma = terrain[y][x];
                    if (
                        board[y][x] === idx &&
                        BIOME_RULES[bioma]?.construible &&
                        !fixedRelCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedTechCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedMilCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx)
                    ) {
                        celdasValidas.push([x, y]);
                    }
                }
            }
            if (celdasValidas.length === 0) break;
            let idxCelda = Math.floor(Math.random() * celdasValidas.length);
            let [px, py] = celdasValidas[idxCelda];
            fixedRelCells.push([px, py, idx]);
            civ.iglesias.push([px, py]);
            civ.relTurns -= relCycle;
            civ.religion += relMult;
            relCellsCount++;
        }

        // MILITAR
        let milMaxMult = 1, milCycle = 10, milMult = 1;
        if (civ.personalidad === "militarista") { milMaxMult = 1.5; milCycle = 7; milMult = 2.2; }
        if (civ.personalidad === "halcon")      { milMaxMult = 1.3; milCycle = 8; milMult = 1.7; }
        if (civ.personalidad === "tecnologico") { milMaxMult = 0.7; milCycle = 13; milMult = 0.7; }
        if (civ.personalidad === "paloma")      { milMaxMult = 0.6; milCycle = 16; milMult = 0.5; }
        if (civ.personalidad === "elegido")     { milMaxMult = 1.1; milCycle = 9; milMult = 1.3; }
        if (civ.personalidad === "equilibrado") { milMaxMult = 1; milCycle = 10; milMult = 1; }

        let maxMil = Math.floor(cellCounts[idx] / 10 * milMaxMult);
        let milCellsCount = milCells.length;

        // Construcción de cuarteles bajo reglas similares.
        while (civ.milTurns >= milCycle && milCellsCount < maxMil) {
            let celdasValidas = [];
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    const bioma = terrain[y][x];
                    if (
                        board[y][x] === idx &&
                        BIOME_RULES[bioma]?.construible &&
                        !fixedMilCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedTechCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx) &&
                        !fixedRelCells.some(([xx, yy, ci2]) => xx === x && yy === y && ci2 === idx)
                    ) {
                        celdasValidas.push([x, y]);
                    }
                }
            }
            if (celdasValidas.length === 0) break;
            let idxCelda = Math.floor(Math.random() * celdasValidas.length);
            let [px, py] = celdasValidas[idxCelda];
            fixedMilCells.push([px, py, idx]);
            civ.cuarteles.push([px, py]);
            civ.milTurns -= milCycle;
            civ.militar += milMult;
            milCellsCount++;
        }


        // --- Suma de puntos adicionales por edificios según entorno y ciclos ---
        // Tecnología: edificios cercanos a ciertos biomas pueden producir más.
        let sumTec = 0;
        for (let [x, y] of techCells) {
            let ciclo = 2;
            if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 1;
            if (terrainAround(x, y, "desierto")) ciclo = 4;
            if (terrainAround(x, y, "montaña")) ciclo = 1;
            if (civ.techTurns % ciclo === 0 && cellCounts[idx] >= 4) sumTec++;
        }
        if (sumTec > 0) civ.tecnologia += sumTec;

        // Religión: comportamiento similar, diferentes ciclos por bioma.
        let sumRel = 0;
        for (let [x, y] of relCells) {
            let ciclo = 4;
            if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 2;
            if (terrainAround(x, y, "desierto")) ciclo = 8;
            if (civ.relTurns % ciclo === 0 && cellCounts[idx] >= 6) sumRel++;
        }
        if (sumRel > 0) civ.religion += sumRel;

        // Militar: comportamiento similar, ciclos más largos.
        let sumMil = 0;
        for (let [x, y] of milCells) {
            let ciclo = 10;
            if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 5;
            if (terrainAround(x, y, "desierto")) ciclo = 20;
            if (civ.milTurns % ciclo === 0 && cellCounts[idx] >= 10) sumMil++;
        }
        if (sumMil > 0) civ.militar += sumMil;

        // --- Métricas avanzadas de diversidad y complejidad ---
        // Se cuentan los tipos y la cantidad de edificios, diversidad de biomas y su distribución.

        // Número de tipos de edificios construidos.
        let tiposEdificio = 0;
        if (civ.plantasTec.length > 0) tiposEdificio++;
        if (civ.iglesias.length > 0) tiposEdificio++;
        if (civ.cuarteles.length > 0) tiposEdificio++;

        let numEdificios = civ.plantasTec.length + civ.iglesias.length + civ.cuarteles.length;

        // Cálculo de la "fuerza" combinada usando pesos para tamaño, tecnología, militar y religión.
        let fuerza = WEIGHT_SIZE * cellCounts[idx]
            + WEIGHT_TECH * civ.tecnologia
            + WEIGHT_MIL * civ.militar
            + WEIGHT_REL * civ.religion;
        civ.fuerza = Math.round(fuerza);

        // Número y variedad de biomas bajo control, y biomas donde hay edificios especiales.
        let biomas = new Set();
        let biomeCellCounts = {};
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === idx) {
                    const tipo = terrain[y][x];
                    biomas.add(tipo);
                    biomeCellCounts[tipo] = (biomeCellCounts[tipo] || 0) + 1;
                }
            }
        }
        let numBiomas = biomas.size;

        // Biomas con edificios de cada tipo.
        let biomasTec = new Set();
        let biomasRel = new Set();
        let biomasMil = new Set();
        civ.plantasTec.forEach(([x, y]) => biomasTec.add(terrain[y][x]));
        civ.iglesias.forEach(([x, y]) => biomasRel.add(terrain[y][x]));
        civ.cuarteles.forEach(([x, y]) => biomasMil.add(terrain[y][x]));
        let biomasConEdificios = new Set([...biomasTec, ...biomasRel, ...biomasMil]);
        let numBiomasConEdificios = biomasConEdificios.size;

        // Cálculo de entropía (diversidad) de biomas y edificios.
        const biomaCountsArr = Object.values(biomeCellCounts);
        civ.entropiaBiomas = Math.round(shannonEntropy(biomaCountsArr) * 100) / 100;

        let edificioCounts = [
            civ.plantasTec.length,
            civ.iglesias.length,
            civ.cuarteles.length
        ];
        civ.entropiaEdificios = Math.round(shannonEntropy(edificioCounts) * 100) / 100;

        // Fórmula ponderada para calcular la "complejidad" de la civilización.
        civ.complejidad =
            1.5 * tiposEdificio +
            1.2 * numBiomas +
            1.8 * numBiomasConEdificios +
            0.5 * numEdificios +
            0.8 * (biomasTec.size + biomasRel.size + biomasMil.size) +
            1.0 * civ.entropiaBiomas +
            0.8 * civ.entropiaEdificios;

        civ.complejidad = Math.round(civ.complejidad * 10) / 10;

        // Texto de detalle para mostrar en dashboards o análisis.
        civ.complejidadDetalle =
            `Tipos:${tiposEdificio} | Total:${numEdificios} | Biomas:${numBiomas} | Edif/bioma:${numBiomasConEdificios}<br>
            ⚙️:${civ.plantasTec.length}(${[...biomasTec].join(",")}) ⛪:${civ.iglesias.length}(${[...biomasRel].join(",")}) 🛡️:${civ.cuarteles.length}(${[...biomasMil].join(",")}) | Terr:${cellCounts[idx]}` +
            `<br>🌱 Entropía Biomas: ${civ.entropiaBiomas} | 🏛️ Entropía Edificios: ${civ.entropiaEdificios}`;
    });
}