# Sudoku Clásico

Clon de sudoku.com como webapp 100 % front (sin backend). Prioridad móvil: pensada para usarse en el teléfono y para servir de base a la futura app nativa.

## Qué incluye

- Pantallas: Principal, Juego, Desafíos diarios (calendario con trofeos) y Estadísticas.
- Seis dificultades (Fácil → Extremo). Generador propio con solución única; Fácil y Medio se resuelven solo con "singles", Difícil o más exigen técnicas avanzadas.
- Mecánicas de sudoku.com: resaltado de fila/columna/caja, mismos números, errores en rojo, límite de 3 errores, segunda oportunidad, notas con auto‑borrado, deshacer, 3 pistas por partida, puntuación con bonus por tiempo, pausa automática al salir de la app.
- Ajustes: idioma (ES/EN), vibración, temporizador, límite de errores, comprobación automática, resaltados, notas automáticas, modo "número primero", números restantes.
- Persistencia en IndexedDB (con fallback a localStorage): partida en curso (clásica y diarias), estadísticas por dificultad, ajustes y progreso diario.
- PWA: manifest + service worker (funciona sin conexión e instalable en la pantalla de inicio).

## Estructura

```
index.html            Marcado de todas las pantallas
css/style.css         Estilos (colores y layout calcados de sudoku.com)
js/sudoku.js          Motor: solver, generador, RNG con semilla (diarios)
js/db.js              Wrapper de IndexedDB
js/app.js             Lógica de juego, UI, i18n, estadísticas, diarios
manifest.webmanifest  PWA
sw.js                 Service worker (network‑first)
icons/                Iconos SVG/PNG
build.js              Genera dist/sudoku.html (un solo archivo) y dist/sudoku-artifact.html
```

## Ejecutar en local

Cualquier servidor estático vale. Por ejemplo:

```bash
python -m http.server 8765
```

y abrir `http://localhost:8765`. Para probar en el móvil dentro de la misma red, usa la IP del PC.

## Un solo archivo / despliegue

```bash
node build.js
```

`dist/sudoku.html` es la app completa en un solo HTML (CSS y JS inline). Puede subirse tal cual a GitHub Pages, Netlify Drop, Cloudflare Pages o Vercel, o publicarse como Artifact de Claude.

## Pendiente para siguientes iteraciones

- Tema oscuro.
- Killer sudoku y logros ("Awards").
- Clasificación de dificultad por técnicas de resolución (ahora es por número de pistas + comprobación de "singles").
- Sonidos.
