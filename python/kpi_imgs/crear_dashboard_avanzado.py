# Lista de archivos y descripciones para el dashboard avanzado
imagenes = [
    ('reg_fuerza_vs_celdas.png', "1️⃣ <b>Regresión lineal fuerza vs celdas:</b> Relación directa entre tamaño y fuerza por civilización."),
    ('reg_complejidad_vs_edificios.png', "2️⃣ <b>Regresión lineal complejidad vs total de edificios:</b> ¿A más edificios, más complejidad?"),
    ('reg_multiple_fuerza_final.png', "3️⃣ <b>Regresión múltiple de fuerza final:</b> ¿Qué métricas predicen mejor la fuerza final de una civilización?"),
    ('matriz_correlacion.png', "4️⃣ <b>Matriz de correlación:</b> ¿Qué variables están más relacionadas entre sí?"),
    ('clusters_civilizaciones.png', "5️⃣ <b>Clusterización:</b> Agrupación de civilizaciones por patrón final de fuerza y tamaño."),
    ('outliers_saltos_fuerza_complejidad.png', "6️⃣ <b>Saltos anómalos:</b> Identificación de ciclos con grandes cambios de fuerza o complejidad."),
    ('tendencia_aceleracion_fuerza.png', "7️⃣ <b>Aceleración/deceleración:</b> Periodos donde crece o desacelera el poder de cada civilización.")
]

html_content = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Analítica Avanzada Civilizaciones</title>
    <link rel="stylesheet" href="../../css/style.css">
    <style>
        body { max-width: 900px; margin: 0 auto; background: #181818; color: #fafafa; }
        h1 { color: #17aaff; margin-top:32px;}
        .kpi-card { background: #252525; border-radius: 14px; padding: 22px 32px; margin-bottom: 36px; box-shadow: 0 2px 10px #0002;}
        .kpi-card img { border-radius: 8px; box-shadow: 0 2px 12px #0003; max-width:100%; }
        .kpi-desc { font-size: 1.2em; margin-bottom: 12px; display: block;}
    </style>
</head>
<body>
    <h1>Analítica Avanzada Civilizaciones</h1>
"""

for filename, desc in imagenes:
    html_content += f"""
    <div class="kpi-card">
        <span class="kpi-desc">{desc}</span>
        <img src="{filename}">
    </div>
    """

html_content += """
</body>
</html>
"""

with open('kpi_imgs/analitica_avanzada.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("¡Dashboard avanzado generado en kpi_imgs/analitica_avanzada.html!")
