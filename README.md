# 🏛️ Simulación de Civilizaciones Celulares

Simulación visual e interactiva de civilizaciones celulares en un entorno dinámico, con analítica avanzada y exportación de resultados.

## ✨ Descripción General

Este proyecto implementa una simulación interactiva de civilizaciones que compiten y evolucionan en un mundo de autómatas celulares con diferentes biomas, reglas de expansión, personalidades, estrategias y construcciones. Incluye un sistema de analítica automática que permite analizar los datos generados por la simulación, tanto a nivel descriptivo como avanzado (regresiones, clusterización, outliers, etc.).

## 🎮 Características principales

- **Mapa dinámico** con hasta 10 biomas (pradera, montaña, jungla, pantano, etc.)
- **Civilizaciones con personalidad propia** (halcón, paloma, tecnológico, militarista, elegido de dios, equilibrado), que influye en expansión, conquistas y prioridades.
- **Edificios especiales**: plantas tecnológicas, iglesias, cuarteles.
- **Reglas de asimilación y batalla**: conquista de territorios, destrucción de edificios, aplicación de teoría de juegos en fronteras.
- **Visualización en tiempo real**: tablero interactivo, estadísticas, leyenda de biomas.
- **Exportación de logs**: guarda cada ciclo de la simulación para análisis posterior en CSV.
- **Analítica básica y avanzada**: dashboards HTML automáticos con KPIs, gráficos y explicaciones.
- **Fácilmente ampliable**: modular, código claro, orientado a experimentación y didáctica.

## 🗂️ Estructura del Proyecto

```
JUEGO_VIDA/
│
├── assets/
├── css/
│   └── style.css
├── js/
│   ├── civ/
│   │   ├── civs.js
│   │   ├── civStats.js
│   │   └── seed.js
│   ├── core/
│   │   ├── board.js
│   │   ├── game.js
│   │   └── terrain.js
│   ├── ui/
│   │   └── controls.js
│   │   └── draw.js
│   └── index.js
├── logs/
│   └── civilizaciones_log_*.csv
├── python/
│   ├── kpi_imgs/
│   │   ├── ...png (imágenes generadas por análisis)
│   │   ├── analitica_civilizaciones.html   # Dashboard KPIs principales
│   │   └── analitica_avanzada.html         # Dashboard analítica avanzada
│   ├── analitica_avanzada.ipynb
│   └── kpi.ipynb
├── index.html
└── main - copia.js (backup opcional)
```

## 🚀 Cómo Usar la Simulación

1. **Abre** `index.html` en tu navegador  
   *(Si tienes problemas de permisos, usa un servidor local: `python -m http.server`)*

2. **Configura los parámetros:**
   - Tamaño del tablero
   - Número de civilizaciones
   - Células iniciales por civilización

3. **Controla la simulación:**
   - Avanza por ciclos o usa la simulación automática
   - Observa en tiempo real el crecimiento y stats de cada civilización
   - Explora leyenda de biomas y estadísticas detalladas

4. **Exporta los logs:**
   - Haz clic en **Descargar log CSV** para guardar todos los datos por ciclo
   - Los archivos se guardan en la carpeta `/logs/`

## 📊 Dashboards Analíticos

### KPIs principales
Haz clic en **Ver Dashboard Analítico** desde la página principal para ver:
- Crecimiento territorial
- Especialización en edificios
- Eficiencia (fuerza/celda)
- Comparación de personalidades
- Eventos clave y más

### Analítica avanzada
Haz clic en **Ver Dashboard Avanzado** para análisis profundos como:
- Regresiones lineales (fuerza vs celdas, complejidad vs edificios)
- Regresión múltiple para fuerza final
- Mapa de correlaciones
- Clusterización (k-means)
- Detección de outliers (saltos anómalos)
- Aceleración y tendencia temporal

## 🧑‍💻 Analítica con Python

1. **Exporta el log** desde la simulación (guardado en `/logs/`)
2. **Abre y ejecuta** los notebooks o scripts en la carpeta `/python/`:
   - Usa `analitica_avanzada.ipynb` para la analítica avanzada
   - Usa `kpi.ipynb` para KPIs básicos
3. **Abre los HTML generados** (`/python/kpi_imgs/analitica_civilizaciones.html` y `/python/kpi_imgs/analitica_avanzada.html`) en tu navegador y explora los resultados

## 💡 Ejemplo de Análisis Avanzado

- ¿Cuál personalidad suele tener mayor fuerza final?
- ¿Hay una relación fuerte entre número de celdas y fuerza total?
- ¿Qué variable predice mejor el éxito de una civilización?
- ¿Qué civilizaciones crecieron más rápido y cuáles tuvieron eventos anómalos?
- ¿Existen grupos de civilizaciones con patrones de crecimiento similares?

## 🛠️ Requisitos

- **Navegador moderno** (Chrome, Firefox, Edge, etc)
- **Python 3.x** con matplotlib, pandas, seaborn y scikit-learn para los análisis avanzados

Instala las dependencias con:
```bash
pip install pandas matplotlib seaborn scikit-learn
```

## 👨‍🔬 Notas para desarrollo y personalización

El proyecto está pensado para fácil extensión:
- Puedes añadir nuevas personalidades, biomas, o reglas en `js/civ/`, `js/core/`, etc.
- Puedes crear nuevas métricas o KPIs en los scripts/notebooks de Python
- Todos los dashboards se actualizan automáticamente al generar nuevos logs y correr los scripts

## 📝 Licencia

**MIT License** – Libre para uso educativo, académico y personal.  
Contribuciones y forks bienvenidos.
