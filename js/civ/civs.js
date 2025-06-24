// js/civ/civs.js

// Importa constantes y datos globales desde otros módulos del juego.
import { NUM_CIVS } from '../core/game.js';
import { COLORS, SYMBOLS } from '../ui/draw.js';
import { civilizations } from '../core/game.js';

// Variables de estado exportadas para que otros archivos puedan acceder y modificarlas.
// Estas arrays almacenan celdas fijas por civilización para diferentes dimensiones.
export let fixedTechCells = [];   // Celdas fijas de tecnología por civilización
export let fixedRelCells = [];    // Celdas fijas de religión por civilización
export let fixedMilCells = [];    // Celdas fijas de militar por civilización
export let cellCounts = [];       // Conteo de celdas por civilización

// Lista de personalidades posibles que puede tener una civilización.
// Se utiliza para definir el comportamiento o estrategia de cada civilización.
export const PERSONALIDADES = [
    "paloma",         // Enfoque pacifista
    "halcon",         // Enfoque agresivo
    "tecnologico",    // Prioriza tecnología
    "militarista",    // Prioriza fuerza militar
    "elegido",        // Personalidad especial/única
    "equilibrado"     // Busca el balance en varias áreas
];

// Función para crear y reinicializar la lista global de civilizaciones.
// Recibe como parámetros el número de civilizaciones, colores y símbolos disponibles.
// Llena el array exportado 'civilizations' con objetos que representan cada civilización.
export function createCivilizations(NUM_CIVS, COLORS, SYMBOLS) {
    civilizations.length = 0; // Limpia el array exportado para reinicializar

    for (let i = 0; i < NUM_CIVS; i++) {
        civilizations.push({
            name: `Civ${i + 1}`,                                     // Nombre único
            color: COLORS[i % COLORS.length],                         // Color asignado (cíclico)
            personalidad: PERSONALIDADES[Math.floor(Math.random() * PERSONALIDADES.length)], // Personalidad aleatoria
            symbol: SYMBOLS[i % SYMBOLS.length],                      // Símbolo asignado (cíclico)
            tecnologia: 0,                                            // Puntos de tecnología
            religion: 0,                                              // Puntos de religión
            militar: 0,                                               // Puntos de militar
            techTurns: 0,                                             // Turnos dedicados a tecnología
            relTurns: 0,                                              // Turnos dedicados a religión
            milTurns: 0,                                              // Turnos dedicados a militar
            plantasTec: [],                                           // Celdas con plantas tecnológicas
            iglesias: [],                                             // Celdas con iglesias
            cuarteles: [],                                            // Celdas con cuarteles
            strategy: Math.random() < 0.5 ? "hawk" : "dove",          // Estrategia (halcón/paloma) asignada aleatoriamente
            payoff: 0                                                 // Recompensa acumulada o puntaje
        });
    }
}

// NOTA: Todas las variables y funciones necesarias para compartir entre módulos están exportadas.
// Este archivo sirve como módulo de gestión y creación de civilizaciones para el juego.