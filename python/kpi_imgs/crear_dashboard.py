kpi_descriptions = [
    "1️⃣ <b>Crecimiento territorial:</b> ¿Cuántas celdas ocupó cada civilización en el tiempo?",
    "2️⃣ <b>Especialización:</b> ¿En qué tipo de edificios se especializó cada civilización?",
    "3️⃣ <b>Eficiencia:</b> ¿Qué civilización tiene más fuerza por celda ocupada al final?",
    "4️⃣ <b>Estrategia dominante:</b> ¿Qué personalidad logra la mayor fuerza máxima?",
    "5️⃣ <b>Eventos clave:</b> ¿En qué ciclos hubo grandes saltos de fuerza? (Guerras, conquistas)",
    "6️⃣ <b>Comparación entre personalidades:</b> ¿Qué personalidad domina en fuerza, tamaño y complejidad?",
    "7️⃣ <b>Análisis temporal:</b> ¿Cómo evolucionó la fuerza de cada civilización durante la simulación?"
]

# Lista de nombres de imágenes generadas por tu análisis
img_paths = [
    "kpi1_crecimiento_celdas.png",
    "kpi2_edificios.png",
    "kpi3_fuerza_x_celda.png",
    "kpi4_fuerza_personalidad.png",
    "kpi5_eventos_clave.png",
    "kpi6_promedio_personalidad.png",
    "kpi7_evolucion_fuerza.png"
]

# Crea el HTML resultante con tu CSS y formato visual
html_content = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Analítico Civilizaciones</title>
    <link rel="stylesheet" href="../../css/style.css">
    <style>
        body {
            max-width: 900px;
            margin: 0 auto;
            background: #181818;
            color: #fafafa;
            padding-bottom: 60px;
        }
        h1 {
            margin-top: 32px;
            font-size: 2.3em;
            color: #17aaff;
        }
        .kpi-card {
            background: #252525;
            border-radius: 14px;
            padding: 22px 32px;
            margin-bottom: 36px;
            box-shadow: 0 2px 10px #0002;
        }
        .kpi-card button {
            margin-bottom: 12px;
            background: #17aaff;
            color: #222;
            padding: 7px 18px;
            border-radius: 7px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            font-size: 1.12em;
            transition: background 0.2s;
        }
        .kpi-card button:hover {
            background: #14b0ef;
        }
        .kpi-card img {
            border-radius: 8px;
            box-shadow: 0 2px 12px #0003;
        }
        .kpi-desc {
            font-size: 1.2em;
            margin-bottom: 12px;
            display: block;
        }
    </style>
</head>
<body>
    <h1>Análisis Civilizaciones: KPIs</h1>
"""

# Agrega cada KPI visual y descripción al HTML
for idx, img in enumerate(img_paths):
    html_content += f"""
    <div class="kpi-card">
        <button onclick="window.open('{img}', '_blank')">Ver Gráfico KPI {idx+1}</button><br>
        <span class="kpi-desc">{kpi_descriptions[idx]}</span>
        <img src="{img}" style="max-width:100%;margin:12px 0;">
    </div>
    """

html_content += """
</body>
</html>
"""

# Guarda el HTML en la carpeta de los gráficos
with open('kpi_imgs/analitica_civilizaciones.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("¡Dashboard generado! Abre kpi_imgs/analitica_civilizaciones.html en tu navegador.")