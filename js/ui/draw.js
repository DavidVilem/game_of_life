import { cellCounts, fixedMilCells, fixedRelCells, fixedTechCells } from '../civ/civs.js';
import { board, BOARD_SIZE, civilizations } from '../core/game.js';
import { terrain } from '../core/terrain.js';
import { boardDiv } from './controls.js';


export const COLORS = [
    '#17aaff', '#ff4d4d', '#44e665', '#f5e663',
    '#e663f5', '#ff922b', '#63f5ea', '#8884ff',
    '#ffb347', '#c70039'
];
export const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ*@$#%&Ωαβπ'.split('');

export const BIOMES = [
    { name: "Pradera",   key: "pradera",   symbol: "🌱", color: "#b6e388" },
    { name: "Montaña",   key: "montaña",   symbol: "⛰️", color: "#888" },
    { name: "Desierto",  key: "desierto",  symbol: "🏜️", color: "#f9d65d" },
    { name: "Lago",      key: "lago",      symbol: "💧", color: "#1d6de0" },
    { name: "Río",       key: "río",       symbol: "🌊", color: "#3af" },
    { name: "Bosque",    key: "bosque",    symbol: "🌲", color: "#2e8b57" },
    { name: "Pantano",   key: "pantano",   symbol: "🦆", color: "#769868" },
    { name: "Tundra",    key: "tundra",    symbol: "❄️", color: "#d0e9f7" },
    { name: "Jungla",    key: "jungla",    symbol: "🌴", color: "#228B22" },
    { name: "Volcán",    key: "volcan",    symbol: "🌋", color: "#7c2f00" }
];

export const BIOME_RULES = {
    pradera:   { ocupable: true,  construible: true,  costoExpandir: 1, costoConstruirTec: 1, costoConstruirMil: 1, costoConstruirRel: 1 },
    montaña:   { ocupable: true,  construible: true,  costoExpandir: 2, costoConstruirTec: 2, costoConstruirMil: 2, costoConstruirRel: 2 },
    desierto:  { ocupable: false, construible: false, costoExpandir: Infinity, costoConstruirTec: Infinity, costoConstruirMil: Infinity, costoConstruirRel: Infinity },
    lago:      { ocupable: false, construible: false, costoExpandir: Infinity, costoConstruirTec: Infinity, costoConstruirMil: Infinity, costoConstruirRel: Infinity },
    río:       { ocupable: false, construible: false, costoExpandir: Infinity, costoConstruirTec: Infinity, costoConstruirMil: Infinity, costoConstruirRel: Infinity },
    bosque:    { ocupable: true,  construible: true,  costoExpandir: 2, costoConstruirTec: 2, costoConstruirMil: 2, costoConstruirRel: 1 },
    pantano:   { ocupable: true,  construible: true,  costoExpandir: 3, costoConstruirTec: 3, costoConstruirMil: 3, costoConstruirRel: 2 },
    tundra:    { ocupable: true,  construible: true,  costoExpandir: 3, costoConstruirTec: 2, costoConstruirMil: 3, costoConstruirRel: 2 },
    jungla:    { ocupable: true,  construible: true,  costoExpandir: 2, costoConstruirTec: 3, costoConstruirMil: 3, costoConstruirRel: 1 },
    volcan:    { ocupable: false, construible: false, costoExpandir: Infinity, costoConstruirTec: Infinity, costoConstruirMil: Infinity, costoConstruirRel: Infinity }
};


export function drawLegend() {
    const legendDiv = document.getElementById('legend');
    legendDiv.innerHTML = "<b>Leyenda de Biomas:</b><br>";
    BIOMES.forEach(biome => {
        legendDiv.innerHTML += `
          <span style="display:inline-block; width:22px; height:22px; background:${biome.color}; text-align:center; border-radius:4px; margin:2px;">${biome.symbol}</span>
          <span style="font-size:15px; margin-left:5px;">${biome.name}</span><br>
        `;
    });
}


export function drawBoard() {
    boardDiv.innerHTML = '';
    boardDiv.style.display = 'grid';
    boardDiv.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 14px)`;
    boardDiv.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 14px)`;
    console.log("Graficando board:", board);
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const civIdx = board[y][x];
            if (civIdx !== null && civIdx !== undefined) {
                cell.style.background = civilizations[civIdx].color;
                cell.textContent = civilizations[civIdx].symbol;
            }
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
            const biomeDef = BIOMES.find(b => b.key === terrainType);

            if (biomeDef) {
                cell.style.background = biomeDef.color;
                cell.textContent = biomeDef.symbol;
            } else {
                cell.style.background = "#ccc"; // fallback si bioma no existe
                cell.textContent = "?";
            }

            // Si hay civilización encima Y no es bioma especial que bloquea
            if (civIdx !== null && civIdx !== undefined && ["río", "lago", "desierto"].indexOf(terrainType) === -1) {
                cell.style.background = civilizations[civIdx].color;
                cell.textContent = civilizations[civIdx].symbol;
                // Ejemplo: para montaña, podrías combinar símbolo
                if (terrainType === "montaña") {
                    cell.textContent = civilizations[civIdx].symbol + "⛰️";
                }
            }

            boardDiv.appendChild(cell);
        }
    }
}


export function drawStats() {
    // Asocia íconos con personalidad
    const iconoPersonalidad = {
        paloma: "🕊️ Paloma (defensiva, religión)",
        halcon: "🦅 Halcón (expansiva, militar)",
        tecnologico: "💡 Tecnológica (defensiva, tecnología)",
        militarista: "⚔️ Militarista (expansiva, militar/tec)",
        elegido: "✨ Elegido de dios (expansiva, religión/militar)",
        equilibrado: "⚖️ Equilibrado (todo igual, defensivo)"
    };

    let html = "<b>Estadísticas de Civilizaciones:</b><br>";
    civilizations.forEach((civ, i) => {
        html += `<span style="color:${civ.color};font-weight:bold;">${civ.name}:</span> 
        ⚙️ <b>Tec:</b> ${civ.tecnologia} (${civ.plantasTec.length}) 
        ⛪ <b>Rel:</b> ${civ.religion} (${civ.iglesias.length}) 
        🛡️ <b>Mil:</b> ${civ.militar} (${civ.cuarteles.length})<br>
        <b>Fuerza:</b> ${civ.fuerza} &nbsp;&nbsp; <b>Complejidad:</b> ${civ.complejidad}<br>
        <small>${civ.complejidadDetalle}</small><br>
        <b>Personalidad:</b> 
            ${iconoPersonalidad[civ.personalidad] || civ.personalidad}<br>
        <b>Estrategia:</b> 
            ${civ.strategy === "hawk" ? "🦅 <b>Halcón</b>" : "🕊️ <b>Paloma</b>"}<br>
        <b>Payoff último ciclo:</b> ${civ.payoff || 0}<br>`;

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
