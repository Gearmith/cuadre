# DESIGN.md — Control de gastos

Fuente de verdad del diseño. Leer antes de tocar cualquier pantalla y mantener al día.

## Nombre: Cuadre

De "hacer el cuadre" o "cuadrar caja": revisar al final del día si la plata cuadra. Corto, de uso cotidiano en Latinoamérica, y no estorba en inglés. Se escribe siempre "Cuadre" (con mayúscula inicial), sin traducir (`translate="no"`).

## Dirección: "Libreta de banco"

Una libreta de ahorros bien cuidada: seria pero amable, tranquila, clara. Registrar un gasto debe tomar 5 segundos. El protagonista es **el número**: el saldo grande y la lista de movimientos agrupada por día, como las filas de una libreta, con el subtotal de cada día a la derecha. Todo lo demás es silencioso.

Principios:
1. **El número manda.** Cifras grandes, con números tabulares (alineados en columna). Nada compite con ellas.
2. **El color significa algo.** Verde = dinero que entra, ladrillo = dinero que sale, azul marino = acciones. No se usa color como decoración. El signo (+ / −) siempre acompaña al color, para no depender sólo de él.
3. **Filas, no tarjetas.** Los movimientos son filas en una hoja, separadas por líneas finas. Las superficies (paneles) se usan sólo para agrupar, no para cada elemento.
4. **Un toque, una acción.** El botón de "Agregar" siempre a mano: botón flotante en celular (sólo en Resumen y Movimientos, para no confundirlo con "Agregar deuda"), botones en la cabecera en escritorio.
5. **Celular primero.** Navegación inferior en celular (≤ 5 destinos), lateral en escritorio.

## Paleta

Tokens CSS en `src/app/globals.css`. Nunca usar hex sueltos en componentes.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F2F4F3` | `#121A22` | Fondo de la app |
| `--surface` | `#FFFFFF` | `#1A242F` | Paneles, hoja de movimientos, diálogos |
| `--surface-2` | `#E7ECEA` | `#222E3A` | Campos, filas en hover, chips |
| `--line` | `#D3DAD7` | `#2E3B48` | Líneas divisorias, bordes |
| `--ink` | `#17212B` | `#E4EAEF` | Texto principal |
| `--ink-soft` | `#55616D` | `#9AA7B3` | Texto secundario (≥ 4.5:1 sobre fondo) |
| `--navy` | `#1D3557` | `#8DB2DD` | Botones primarios, enlaces, foco |
| `--on-navy` | `#FFFFFF` | `#0F1822` | Texto sobre botón primario |
| `--income` | `#2F7D5B` | `#62BE92` | Ingresos, "me deben" |
| `--income-tint` | `#EEF6F1` | `#1D3A2F` | Fondo suave de ingresos y avisos de éxito |
| `--expense-tint` | `#F6E4DF` | `#3D2620` | Fondo suave de errores |
| `--expense` | `#B4472E` | `#E8896F` | Gastos, "debo" |
| `--warn` | `#8A6510` | `#E0B455` | Deudas vencidas |
| `--danger` | `#A8321F` | `#F0927C` | Acciones destructivas |

## Tipografía

- **Lexend** (títulos y cifras): diseñada para leerse con facilidad. Pesos 400 / 500 / 600. Cifras siempre con `font-variant-numeric: tabular-nums`.
- **Source Sans 3** (texto, etiquetas, formularios): pesos 400 / 600.
- Escala (rem): 0.8125 · 0.875 · 1 (base 16px) · 1.125 · 1.375 · 1.75 · 2.5 (saldo principal) · 3.25 (saldo en escritorio).
- Interlineado: 1.5 texto, 1.1 cifras grandes.
- Mayúsculas sostenidas: no. Todo en "sentence case".

## Espaciado, radios y sombras

- Base 4px. Escala usada: 4, 8, 12, 16, 20, 24, 32, 48.
- Margen lateral: 16px en celular, 32px en escritorio. Ancho máximo de contenido: 960px.
- Radios con jerarquía: 6px campos y botones · 10px paneles y diálogos · 999px botón flotante y chips.
- Sombras: casi ninguna. Sólo los elementos flotantes (diálogo, botón flotante) llevan `--shadow-float`. Los paneles usan borde de 1px.
- Áreas táctiles ≥ 44×44px.

## Movimiento

- 150ms para hover/focus, 200ms para abrir diálogos (entrada) y 150ms para cerrar.
- Sin animaciones de entrada por sección. Respetar `prefers-reduced-motion`.

## Componentes clave

- **Saldo (BalanceHero):** cifra grande Lexend 600, debajo "Entró" / "Salió" del periodo en dos columnas.
- **Hoja de movimientos (Ledger):** grupos por día. Cabecera del día: fecha a la izquierda, neto del día a la derecha. Filas: ícono de categoría (Lucide, trazo 1.75), categoría + nota, monto con signo y color.
- **Barras diarias:** una barra por día del mes (neto), verde arriba / ladrillo abajo; se puede tocar un día para ver su detalle.
- **Diálogo de movimiento:** selector Gasto/Ingreso arriba, monto grande, categoría en chips, fecha, nota. Botón "Guardar gasto" / "Guardar ingreso".
- **Deuda:** fila con persona, descripción, barra de progreso de lo pagado, saldo pendiente. Dentro: historial de abonos y botón "Registrar abono".
- **Estados:** cada lista tiene estado vacío (qué hacer a continuación), carga (esqueletos con la forma de las filas) y error (qué pasó + reintentar).

## Íconos

Lucide (`lucide-react`), trazo 1.75, 20px. Nunca emojis.

## Tono de los textos

- Tutea, directo y tranquilo. Verbos claros: "Agregar gasto", "Guardar ingreso", "Registrar abono".
- La acción conserva su nombre en todo el flujo: botón "Eliminar gasto" → aviso "Gasto eliminado".
- Errores: qué pasó y cómo arreglarlo, sin disculpas. Ej: "La contraseña debe tener al menos 8 caracteres."
- Vacíos como invitación: "Aún no hay movimientos este mes. Agrega el primero con el botón +."

## Idiomas y moneda

- Español (predeterminado) e inglés, con `next-intl`. La ruta lleva el idioma: `/es/...`, `/en/...`.
- Moneda elegible en Ajustes (COP, USD, EUR, MXN, ARS, CLP, PEN...). Formato con `Intl.NumberFormat` según idioma.
