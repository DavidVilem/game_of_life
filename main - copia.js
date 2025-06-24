document.addEventListener('DOMContentLoaded', () => {
    const boardDiv = document.getElementById('board');
    const paramsForm = document.getElementById('params-form');
    const sizeInput = document.getElementById('size-input');
    const civsInput = document.getElementById('civs-input');
    const cellsInput = document.getElementById('cells-input');
    const stepBtn = document.getElementById('step-btn');
    const autoBtn = document.getElementById('auto-btn');

    const COLORS = [
        '#17aaff', '#ff4d4d', '#44e665', '#f5e663',
        '#e663f5', '#ff922b', '#63f5ea', '#8884ff',
        '#ffb347', '#c70039'
    ];
    const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ*@$#%&Ωαβπ'.split('');

    let BOARD_SIZE = 50;
    let NUM_CIVS = 3;
    let INITIAL_CELLS_PER_CIV = 30;
    const WEIGHT_SIZE = 1.5;
    const WEIGHT_TECH = 2.0;
    const WEIGHT_MIL = 2.0;
    const WEIGHT_REL = 1.2;
    let civilizations = [];
    let board = [];
    let terrain = []; 
    let running = false;
    let globalTurn = 0;
    let interval = null;
    let fixedTechCells = []; 
    let fixedRelCells = [];
    let fixedMilCells = [];
    let cellCounts = [];


    function createCivilizations() {
        civilizations = [];
        for (let i = 0; i < NUM_CIVS; i++) {
            civilizations.push({
                name: `Civ${i + 1}`,
                color: COLORS[i % COLORS.length],
                symbol: SYMBOLS[i % SYMBOLS.length],
                // Atributos:
                tecnologia: 0,
                religion: 0,
                militar: 0,
                techTurns: 0,
                relTurns: 0,
                milTurns: 0,
                plantasTec: [],
                iglesias: [],
                cuarteles: []
            });
        }
    }


    // Generador aleatorio de terrenos (personaliza como desees)
    function createTerrain() {
        // 1. Inicializa todo como "pradera"
        terrain = Array.from({ length: BOARD_SIZE }, () =>
            Array(BOARD_SIZE).fill("pradera")
        );

        // 2. Montañas en bloques aleatorios
        let numMountains = Math.floor(BOARD_SIZE * 0.8);
        for (let i = 0; i < numMountains; i++) {
            const size = Math.floor(Math.random() * 4) + 1; // 1-4
            const x0 = Math.floor(Math.random() * (BOARD_SIZE - size));
            const y0 = Math.floor(Math.random() * (BOARD_SIZE - size));
            for (let dx = 0; dx < size; dx++) {
                for (let dy = 0; dy < size; dy++) {
                    terrain[y0 + dy][x0 + dx] = "montaña";
                }
            }
        }

        // 3. Desierto en bloques
        let numDeserts = Math.floor(BOARD_SIZE * 0.5);
        for (let i = 0; i < numDeserts; i++) {
            const size = Math.floor(Math.random() * 3) + 2; // 2-4
            const x0 = Math.floor(Math.random() * (BOARD_SIZE - size));
            const y0 = Math.floor(Math.random() * (BOARD_SIZE - size));
            for (let dx = 0; dx < size; dx++) {
                for (let dy = 0; dy < size; dy++) {
                    terrain[y0 + dy][x0 + dx] = "desierto";
                }
            }
        }

        // 4. Ríos aleatorios (no cruzan todo el mapa necesariamente)
        let numRivers = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numRivers; i++) {
            let riverLen = Math.floor(BOARD_SIZE * (0.3 + 0.4 * Math.random()));
            let y = Math.floor(Math.random() * BOARD_SIZE);
            let x = Math.floor(Math.random() * BOARD_SIZE);
            for (let l = 0; l < riverLen; l++) {
                terrain[y][x] = "río";
                // Aleatorio: vertical, horizontal o diagonal
                const dir = Math.floor(Math.random() * 3);
                if (dir === 0 && x + 1 < BOARD_SIZE) x++; // derecha
                else if (dir === 1 && y + 1 < BOARD_SIZE) y++; // abajo
                else if (dir === 2 && x + 1 < BOARD_SIZE && y + 1 < BOARD_SIZE) { x++; y++; }
            }
        }

        // 5. Lagos (2x2, máximo 2 lagos)
        let lakes = 0;
        while (lakes < 2) {
            const x0 = Math.floor(Math.random() * (BOARD_SIZE - 2));
            const y0 = Math.floor(Math.random() * (BOARD_SIZE - 2));
            // Solo si el espacio es pradera
            let canPlace = true;
            for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) {
                if (terrain[y0 + dy][x0 + dx] !== "pradera") canPlace = false;
            }
            if (canPlace) {
                for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) {
                    terrain[y0 + dy][x0 + dx] = "lago";
                }
                lakes++;
            }
        }
    }

    function expandDesert() {
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
        // Evita duplicados
        toDesert = toDesert.filter(
            ([x, y], idx, arr) => arr.findIndex(([x2, y2]) => x2 === x && y2 === y) === idx
        );
        if (toDesert.length > 0) {
            const [x, y] = toDesert[Math.floor(Math.random() * toDesert.length)];
            terrain[y][x] = "desierto";
        }
    }

    function createBoard() {
        board = Array.from({ length: BOARD_SIZE }, () =>
            Array(BOARD_SIZE).fill(null)
        );
    }

    function seedCivilizations() {
        civilizations.forEach((civ, idx) => {
            // Elige un punto de origen aleatorio para el cluster
            const centerX = Math.floor(Math.random() * (BOARD_SIZE - 10)) + 5;
            const centerY = Math.floor(Math.random() * (BOARD_SIZE - 10)) + 5;
            let cellsPlaced = 0;
            while (cellsPlaced < INITIAL_CELLS_PER_CIV) {
                // Coloca en un área de 7x7 alrededor del centro
                const x = centerX + Math.floor(Math.random() * 7) - 3;
                const y = centerY + Math.floor(Math.random() * 7) - 3;
                if (
                    x >= 0 && x < BOARD_SIZE &&
                    y >= 0 && y < BOARD_SIZE &&
                    board[y][x] === null
                ) {
                    board[y][x] = idx;
                    cellsPlaced++;
                }
            }
        });
    }

    function terrainAround(x, y, type) {
        return getNeighbors(x, y).some(([nx, ny]) => terrain[ny][nx] === type) || terrain[y][x] === type;
    }


    function updateCivilizationStats() {
        civilizations.forEach(civ => {
            // Timers SÓLO se incrementan aquí
            civ.techTurns++;
            civ.relTurns++;
            civ.milTurns++;
            // Limpia edificios temporales
            civ.plantasTec = [];
            civ.iglesias = [];
            civ.cuarteles = [];
        });

        // Cuenta celdas ocupadas por cada civilización
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
            // Recolecta edificios ya construidos
            let techCells = fixedTechCells.filter(([x, y, ci]) => ci === idx);
            let relCells = fixedRelCells.filter(([x, y, ci]) => ci === idx);
            let milCells = fixedMilCells.filter(([x, y, ci]) => ci === idx);

            civ.plantasTec = techCells.map(([x, y]) => [x, y]);
            civ.iglesias   = relCells.map(([x, y]) => [x, y]);
            civ.cuarteles  = milCells.map(([x, y]) => [x, y]);

            // ----- Construcción de EDIFICIOS -----
            // --- TECNOLOGÍA ---
            let cycleTec = 2;
            let maxTec = Math.floor(cellCounts[idx] / 4);
            let techCellsCount = techCells.length;
            while (civ.techTurns >= cycleTec && techCellsCount < maxTec) {
                let celdasValidas = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (
                            board[y][x] === idx &&
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
                civ.techTurns -= cycleTec;
                techCellsCount++;
            }

            // --- RELIGIÓN ---
            let cycleRel = 4;
            let maxRel = Math.floor(cellCounts[idx] / 6);
            let relCellsCount = relCells.length;
            while (civ.relTurns >= cycleRel && relCellsCount < maxRel) {
                let celdasValidas = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (
                            board[y][x] === idx &&
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
                civ.relTurns -= cycleRel;
                relCellsCount++;
            }

            // --- MILITAR ---
            let cycleMil = 10;
            let maxMil = Math.floor(cellCounts[idx] / 10);
            let milCellsCount = milCells.length;
            while (civ.milTurns >= cycleMil && milCellsCount < maxMil) {
                let celdasValidas = [];
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (
                            board[y][x] === idx &&
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
                civ.milTurns -= cycleMil;
                milCellsCount++;
            }

            // ----- Suma de STATS -----
            let sumTec = 0;
            for (let [x, y] of techCells) {
                let ciclo = 2;
                if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 1;
                if (terrainAround(x, y, "desierto")) ciclo = 4;
                if (terrainAround(x, y, "montaña")) ciclo = 1;
                if (civ.techTurns % ciclo === 0 && cellCounts[idx] >= 4) sumTec++;
            }
            if (sumTec > 0) civ.tecnologia += sumTec;

            let sumRel = 0;
            for (let [x, y] of relCells) {
                let ciclo = 4;
                if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 2;
                if (terrainAround(x, y, "desierto")) ciclo = 8;
                if (civ.relTurns % ciclo === 0 && cellCounts[idx] >= 6) sumRel++;
            }
            if (sumRel > 0) civ.religion += sumRel;

            let sumMil = 0;
            for (let [x, y] of milCells) {
                let ciclo = 10;
                if (terrainAround(x, y, "lago") || terrainAround(x, y, "río")) ciclo = 5;
                if (terrainAround(x, y, "desierto")) ciclo = 20;
                if (civ.milTurns % ciclo === 0 && cellCounts[idx] >= 10) sumMil++;
            }
            if (sumMil > 0) civ.militar += sumMil;

            // Cálculo de fuerza y complejidad
            let tiposEdificio = 0;
            if (civ.plantasTec.length > 0) tiposEdificio++;
            if (civ.iglesias.length > 0) tiposEdificio++;
            if (civ.cuarteles.length > 0) tiposEdificio++;

            let numEdificios = civ.plantasTec.length + civ.iglesias.length + civ.cuarteles.length;
            let fuerza = WEIGHT_SIZE * cellCounts[idx]
                + WEIGHT_TECH * civ.tecnologia
                + WEIGHT_MIL * civ.militar
                + WEIGHT_REL * civ.religion;
            civ.fuerza = Math.round(fuerza);

            // 1. Biomas bajo control (en cualquier celda)
            let biomas = new Set();
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (board[y][x] === idx) {
                        biomas.add(terrain[y][x]);
                    }
                }
            }
            let numBiomas = biomas.size;

            // 2. Biomas donde hay edificios especiales (por tipo)
            let biomasTec = new Set();
            let biomasRel = new Set();
            let biomasMil = new Set();
            civ.plantasTec.forEach(([x, y]) => biomasTec.add(terrain[y][x]));
            civ.iglesias.forEach(([x, y]) => biomasRel.add(terrain[y][x]));
            civ.cuarteles.forEach(([x, y]) => biomasMil.add(terrain[y][x]));
            let biomasConEdificios = new Set([...biomasTec, ...biomasRel, ...biomasMil]);
            let numBiomasConEdificios = biomasConEdificios.size;

            // --- Fórmula avanzada de complejidad ---
            civ.complejidad = 
                1.5 * tiposEdificio +              
                1.2 * numBiomas +                  
                1.8 * numBiomasConEdificios +      
                0.5 * numEdificios +               
                0.8 * (biomasTec.size + biomasRel.size + biomasMil.size);

            civ.complejidad = Math.round(civ.complejidad * 10) / 10;

            civ.complejidadDetalle = 
                `Tipos:${tiposEdificio} | Total:${numEdificios} | Biomas:${numBiomas} | Edif/bioma:${numBiomasConEdificios}<br>
                ⚙️:${civ.plantasTec.length}(${[...biomasTec].join(",")}) ⛪:${civ.iglesias.length}(${[...biomasRel].join(",")}) 🛡️:${civ.cuarteles.length}(${[...biomasMil].join(",")}) | Terr:${cellCounts[idx]}`;
        });
    }


    function drawBoard() {
        boardDiv.innerHTML = '';
        boardDiv.style.display = 'grid';
        boardDiv.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 14px)`;
        boardDiv.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 14px)`;
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                const civIdx = board[y][x];
                const terrainType = terrain[y][x];

                // --- PRIORIDAD: mostrar íconos fijos ---
                let fixedCiv = null, fixedIcon = null;
                let found = fixedTechCells.find(([fx, fy, ci]) => fx === x && fy === y && (fixedCiv = ci) !== undefined);
                if (found) fixedIcon = "⚙️";
                found = fixedRelCells.find(([fx, fy, ci]) => fx === x && fy === y && (fixedCiv = ci) !== undefined);
                if (found) fixedIcon = "⛪";
                found = fixedMilCells.find(([fx, fy, ci]) => fx === x && fy === y && (fixedCiv = ci) !== undefined);
                if (found) fixedIcon = "🛡️";

                if (fixedIcon !== null) {
                    cell.style.background = civilizations[fixedCiv].color;
                    cell.textContent = fixedIcon;
                    boardDiv.appendChild(cell);
                    continue;
                }

                // --- Terrenos y civilizaciones ---
                if (terrainType === "montaña") {
                    cell.style.background = "#888";
                    cell.textContent = "⛰️";
                }
                if (terrainType === "río") {
                    cell.style.background = "#3af";
                    cell.textContent = "🌊";
                }
                if (terrainType === "lago") {
                    cell.style.background = "#1d6de0";
                    cell.textContent = "💧";
                }
                if (terrainType === "desierto") {
                    cell.style.background = "#f9d65d";
                    cell.textContent = "🏜️";
                }
                if (terrainType === "pradera" && civIdx === null) {
                    cell.style.background = "#b6e388";
                    cell.textContent = ""; // O "🌱"
                }
                if (civIdx !== null && ["río", "desierto", "lago"].indexOf(terrainType) === -1) {
                    cell.style.background = civilizations[civIdx].color;
                    cell.textContent = civilizations[civIdx].symbol;
                    if (terrainType === "montaña") {
                        cell.textContent = civilizations[civIdx].symbol + "⛰️";
                        cell.style.background = "#6a8";
                    }
                }
                boardDiv.appendChild(cell);
            }
        }
    }




    // --- Reglas de evolución básicas ---
    function getNeighbors(x, y) {
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


    function countCellsByCiv(board, civIdx) {
        let count = 0;
        for (let row of board) for (let cell of row) if (cell === civIdx) count++;
        return count;
    }

    // Marca como estables los bloques 2x2 o más
    function isStableBlock(y, x, civIdx, stableMap) {
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

    function drawStats() {
        let html = "<b>Estadísticas de Civilizaciones:</b><br>";
        civilizations.forEach((civ, i) => {
            html += `<span style="color:${civ.color};font-weight:bold;">${civ.name}:</span> 
            ⚙️ <b>Tec:</b> ${civ.tecnologia} (${civ.plantasTec.length}) 
            ⛪ <b>Rel:</b> ${civ.religion} (${civ.iglesias.length}) 
            🛡️ <b>Mil:</b> ${civ.militar} (${civ.cuarteles.length})<br>
            <b>Fuerza:</b> ${civ.fuerza} &nbsp;&nbsp; <b>Complejidad:</b> ${civ.complejidad}<br>
            <small>${civ.complejidadDetalle}</small>`;

            if (civ.plantasTec.length >= Math.floor(cellCounts[i]/4)) {
                html += `<br><span style="color:orange">⚙️ Edificios máximo construidos</span>`;
            }
            if (civ.iglesias.length >= Math.floor(cellCounts[i]/6)) {
                html += `<br><span style="color:orange">⛪ Iglesias máximo construidas</span>`;
            }
            if (civ.cuarteles.length >= Math.floor(cellCounts[i]/10)) {
                html += `<br><span style="color:orange">🛡️ Cuarteles máximo construidos</span>`;
            }

            html += "<hr>";
        });
        document.getElementById('civ-stats').innerHTML = html;
    }



    function nextGeneration() {
        globalTurn++;
        updateCivilizationStats();
        // Cada 3 ciclos, expande el desierto
        if (globalTurn % 3 === 0) expandDesert();

        // 1. Detectar células "estables"
        let stableMap = Array.from({ length: BOARD_SIZE }, () =>
            Array(BOARD_SIZE).fill(false)
        );
        for (let y = 0; y < BOARD_SIZE - 1; y++) {
            for (let x = 0; x < BOARD_SIZE - 1; x++) {
                let civIdx = board[y][x];
                if (civIdx !== null) isStableBlock(y, x, civIdx, stableMap);
            }
        }

        // 2. Siguiente generación basada en estabilidad, bordes y terreno
        const newBoard = Array.from({ length: BOARD_SIZE }, () =>
            Array(BOARD_SIZE).fill(null)
        );

        // Mapa para expansión lenta en montaña
        if (!window.mountainPending) window.mountainPending = Array.from({ length: BOARD_SIZE }, () =>
            Array(BOARD_SIZE).fill(null)
        );

        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const civIdx = board[y][x];
                const neighborsCoords = getNeighbors(x, y);
                const neighbors = neighborsCoords.map(([nx, ny]) => board[ny][nx]);
                const neighborCounts = {};
                neighbors.forEach(idx => {
                    if (idx !== null) neighborCounts[idx] = (neighborCounts[idx] || 0) + 1;
                });

                const terrainType = terrain[y][x];

                // --- REGLA: RÍO O DESIERTO: nunca ocupable ni modificable
                if (terrainType === "río" || terrainType === "lago" || terrainType === "desierto") {
                    continue;
                }

                // 2a. Célula estable: sobrevive siempre
                if (civIdx !== null && stableMap[y][x]) {
                    newBoard[y][x] = civIdx;
                    continue;
                }

                // 2b. Célula no estable: sobrevive si tiene 2+ vecinos iguales, o asimilada
                if (civIdx !== null && !stableMap[y][x]) {
                    const sameCiv = neighbors.filter(idx => idx === civIdx).length;
                    if (sameCiv >= 2) {
                        newBoard[y][x] = civIdx;
                    } else {
                        // Asimilación por mayoría local
                        let max = 0, rival = null;
                        for (let rivalIdx in neighborCounts) {
                            if (parseInt(rivalIdx) !== civIdx && neighborCounts[rivalIdx] > max) {
                                max = neighborCounts[rivalIdx];
                                rival = parseInt(rivalIdx);
                            }
                        }
                        if (rival !== null && max >= 3) {
                            newBoard[y][x] = rival;
                        }
                    }
                    continue;
                }

                // 2c. Celda vacía: expansión según terreno
                if (civIdx === null) {
                    // MONTAÑA: expansión lenta
                    if (terrainType === "montaña") {
                        let candidate = null, maxCount = 0;
                        for (let c = 0; c < civilizations.length; c++) {
                            const count = neighbors.filter(idx => idx === c).length;
                            const hasStable = neighborsCoords.some(
                                ([nx, ny]) => board[ny][nx] === c && stableMap[ny][nx]
                            );
                            if (count >= 3 && hasStable && count > maxCount) {
                                candidate = c;
                                maxCount = count;
                            }
                        }
                        if (candidate !== null) {
                            if (mountainPending[y][x] === candidate) {
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

                    // NORMAL: expansión estándar
                    let candidate = null, maxCount = 0;
                    for (let c = 0; c < civilizations.length; c++) {
                        const count = neighbors.filter(idx => idx === c).length;
                        const hasStable = neighborsCoords.some(
                            ([nx, ny]) => board[ny][nx] === c && stableMap[ny][nx]
                        );
                        if (count >= 3 && hasStable && count > maxCount) {
                            candidate = c;
                            maxCount = count;
                        }
                    }
                    if (candidate !== null) {
                        newBoard[y][x] = candidate;
                    }
                }
            }
        }
        board = newBoard;
        drawBoard();
        drawStats();
    }


    // ---- UI, Controles ----
    function startSimulation(event) {
        fixedTechCells = [];
        fixedRelCells = [];
        fixedMilCells = [];
        if (event) event.preventDefault();
        BOARD_SIZE = Math.max(10, Math.min(200, parseInt(sizeInput.value) || 50));
        NUM_CIVS = Math.max(2, Math.min(10, parseInt(civsInput.value) || 3));
        INITIAL_CELLS_PER_CIV = Math.max(1, Math.min(500, parseInt(cellsInput.value) || 30));
        createCivilizations();
        createBoard();
        createTerrain();
        seedCivilizations();
        console.log("Tablero después de sembrar:", JSON.parse(JSON.stringify(board)));
        drawBoard();
        stopAuto();
    }

    function step() {
        nextGeneration();
    }

    function auto() {
        if (running) {
            stopAuto();
            autoBtn.textContent = "▶️";
        } else {
            running = true;
            autoBtn.textContent = "⏸️";
            interval = setInterval(() => {
                nextGeneration();
            }, 180); // velocidad de la simulación
        }
    }
    function stopAuto() {
        running = false;
        autoBtn.textContent = "▶️";
        if (interval) clearInterval(interval);
    }

    // Inicializa
    startSimulation();

    paramsForm.addEventListener('submit', startSimulation);
    stepBtn.addEventListener('click', step);
    autoBtn.addEventListener('click', auto);
});