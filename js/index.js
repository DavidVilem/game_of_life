// js/index.js

// Importa funciones principales del núcleo y la UI del juego.
import { startSimulation, step, auto, civilizacionesLog } from './core/game.js';
import { paramsForm, stepBtn, autoBtn } from './ui/controls.js';
import { drawLegend } from './ui/draw.js';

/**
 * Configura la aplicación cuando el DOM ha cargado.
 * - Dibuja la leyenda.
 * - Inicializa el log.
 * - Inicia la simulación.
 * - Asigna eventos a botones de la interfaz.
 */
document.addEventListener('DOMContentLoaded', () => {
    drawLegend(); 
    civilizacionesLog.length = 0;    // Limpia el log anterior
    startSimulation();               // Arranca una simulación nueva

    paramsForm.addEventListener('submit', startSimulation); // Nuevo arranque con parámetros personalizados
    stepBtn.addEventListener('click', step);               // Botón para avanzar un ciclo
    autoBtn.addEventListener('click', auto);               // Botón para simular automáticamente

    // Botón para exportar el log de civilizaciones como CSV
    document.getElementById("export-csv-btn").addEventListener("click", exportLogToCSV);

    // Botón para abrir dashboard básico
    document.getElementById("dashboard-btn").addEventListener("click", function() {
        window.open("python/kpi_imgs/analitica_civilizaciones.html", "_blank");
    });

    // Botón para abrir dashboard avanzado
    document.getElementById("dashboard-avanzado-btn").addEventListener("click", function() {
        window.open("python/kpi_imgs/analitica_avanzada.html", "_blank");
    });
});

/**
 * Exporta el historial de la simulación (civilizacionesLog) a un archivo CSV.
 * - Convierte los datos a texto CSV.
 * - Descarga automáticamente el archivo con un nombre único por fecha y hora.
 */
function exportLogToCSV() {
    if (!civilizacionesLog.length) {
        alert("No hay datos que exportar.");
        return;
    }
    // Arma el encabezado usando las claves del primer elemento
    const encabezado = Object.keys(civilizacionesLog[0]).join(",");
    // Prepara cada fila del CSV
    const filas = civilizacionesLog.map(row =>
        Object.values(row).map(val => {
            // Números flotantes con 2 decimales entre comillas
            if (typeof val === "number" && !Number.isInteger(val)) {
                return `"${val.toFixed(2)}"`;  
            }
            // Escapa comillas para texto y lo coloca entre comillas
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
    );
    // Une encabezado y filas para formar el texto CSV
    const csvContent = [encabezado].concat(filas).join("\n");

    // Crea el archivo y dispara la descarga
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Genera nombre único por fecha/hora
    const fecha = new Date();
    const nombre = `civilizaciones_log_${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}_${String(fecha.getHours()).padStart(2,'0')}${String(fecha.getMinutes()).padStart(2,'0')}${String(fecha.getSeconds()).padStart(2,'0')}.csv`;
    link.setAttribute("download", nombre);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}