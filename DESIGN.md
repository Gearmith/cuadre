# DESIGN.md — Cuadre

Fuente de verdad del diseño. Leer antes de tocar cualquier pantalla y mantener al día.

## Nombre: Cuadre

De "hacer el cuadre" o "cuadrar caja": revisar al final del día si la plata cuadra. Corto, de uso cotidiano en Latinoamérica, y no estorba en inglés. Se escribe siempre "Cuadre" (con mayúscula inicial), sin traducir (`translate="no"`).

## Dirección: "Billete"

Inspirada en los billetes colombianos: papel de seguridad, tramas de líneas finas (guilloché), tinta verde profunda, oro y cifras grandes y condensadas. Atrevida pero legible.

El elemento memorable es **el billete**: el saldo total y cada cuenta se imprimen como billetes, con su color, su trama y su roseta. Siempre se ven igual en modo claro y oscuro: son "objetos impresos". Todo lo demás (listas, formularios) es papel de seguridad sobrio para que los billetes resalten.

Principios:
1. **El billete manda.** Saldo total y cuentas = billetes con trama. Ningún otro elemento lleva trama.
2. **Cifras como en un billete.** Bricolage Grotesque condensada (ancho 78), peso 700–800, números tabulares, tamaños grandes.
3. **El color significa algo.** Verde = entra, coral/ladrillo = sale, oro = acción principal y destacado. Movimientos entre cuentas en tinta neutra. El signo (+ / −) siempre acompaña al color.
4. **Filas, no tarjetas,** para la lista de movimientos: renglones en una hoja de papel de seguridad.
5. **Celular primero.** Navegación inferior en celular (5 destinos), lateral en escritorio. Botón flotante "+" sólo en Resumen, Movimientos y Cuentas.

## Paleta (interfaz)

Tokens CSS en `src/app/globals.css`. Nunca hex sueltos en componentes.

| Token | Claro (papel de seguridad) | Oscuro (bóveda) | Uso |
|---|---|---|---|
| `--bg` | `#E9EFE6` | `#0A2622` | Fondo |
| `--surface` | `#F7FAF4` | `#0F332D` | Hojas, paneles, diálogos |
| `--surface-2` | `#DCE6D9` | `#164139` | Campos, hover, chips |
| `--line` | `#BFCFBF` | `#265248` | Divisiones |
| `--ink` | `#0E2B26` | `#F1EAD6` | Texto principal |
| `--ink-soft` | `#4A5F58` | `#AFC0B4` | Texto secundario (≥ 4.5:1) |
| `--primary` | `#0F3D36` | `#E7A93B` | Botón principal (verde billete / oro) |
| `--on-primary` | `#F1EAD6` | `#1B1404` | Texto sobre botón principal |
| `--gold` | `#8A5A0B` | `#E7A93B` | Destacados, enlaces, foco |
| `--income` | `#1B6E45` | `#7FD6A4` | Entra, "me deben" |
| `--expense` | `#B0412A` | `#FF8F72` | Sale, "debo" |
| `--warn` | `#8A5A0B` | `#FFC861` | Vencidas |
| `--danger` | `#A3301C` | `#FF9A80` | Destructivo |

## Billetes (colores de cuenta)

Cada cuenta elige un color. El billete del total siempre es **verde**.

| Clave | Fondo | Tinta | Trama |
|---|---|---|---|
| `green` | `#0F3D36` | `#F1EAD6` | `#E7A93B` |
| `blue` | `#16395C` | `#EAF0F7` | `#8FC1E3` |
| `purple` | `#3D2A62` | `#EFE7FB` | `#C4A8F5` |
| `red` | `#6A2422` | `#F8E7E0` | `#F0A27E` |
| `gold` | `#5C430F` | `#FBF0D6` | `#F2C95C` |
| `slate` | `#2B3441` | `#E8ECF1` | `#9FB3C8` |

Trama: ondas sinusoidales finas (1px, 12–18% de opacidad) + una roseta guilloché en la esquina. Componente `src/components/banknote.tsx`.

## Tipografía

- **Bricolage Grotesque** (`--font-display`): títulos y cifras. `font-variation-settings: "wdth" 78`, pesos 600–800, `tabular-nums`.
- **Figtree** (`--font-sans`): texto, etiquetas, formularios. 400 / 600.
- Escala (rem): 0.8125 · 0.875 · 1 · 1.125 · 1.5 · 2 · 3 (total en celular) · 4 (total en escritorio).
- Sentence case. Sin mayúsculas sostenidas salvo el nombre de la cuenta impreso en el billete (rótulo de billete, tracking 0.08em).

## Espaciado, radios y sombras

- Base 4px. Escala: 4, 8, 12, 16, 20, 24, 32, 48.
- Margen lateral 16px celular / 32px escritorio. Ancho máximo 1040px.
- Radios: 8px campos y botones · 14px hojas y diálogos · 18px billetes · 999px chips y botón flotante.
- Sombras: los billetes llevan `--shadow-note` (sombra larga y suave, como papel sobre mesa). Diálogos y botón flotante `--shadow-float`. Hojas sin sombra, con borde.

## Movimiento

- 150ms hover/focus, 200ms entrada de diálogos, 150ms salida.
- Billetes enlazados: al pasar el mouse se levantan 2px (`translateY`). Sin animaciones automáticas.
- Respetar `prefers-reduced-motion`.

## Modelo: cuentas

- **Cuenta** (`bank`), **Efectivo** (`cash`), **Tarjeta de crédito** (`credit`, saldo normalmente negativo) y **Bolsillo o cajita** (`pocket`, siempre dentro de otra cuenta).
- Saldo de cuenta = saldo inicial + ingresos − gastos + lo que entra por movimientos − lo que sale.
- **Tienes en total** = suma de todas las cuentas (las tarjetas restan).
- **Mover plata** entre cuentas no es gasto ni ingreso: no cambia el total ni el balance del día/mes.

## Componentes clave

- **Banknote:** billete con trama, roseta, rótulo (nombre en mayúsculas), cifra grande, detalle abajo (tipo, bolsillos).
- **Ledger:** grupos por día; cabecera con fecha y neto del día; filas con ícono de categoría, categoría + cuenta/nota, monto con signo. Movimientos entre cuentas: ícono de flechas, "Bancolombia → Nu", monto en tinta neutra.
- **Diálogo de movimiento:** selector Gasto / Ingreso / Mover; monto grande; cuenta (chips con el color de cada billete); categoría; fecha; nota.
- **Estados:** vacío (qué hacer), carga (esqueletos con forma), error (qué pasó + reintentar). Sin cuentas: invitación a crear las primeras con atajos (Bancolombia, Nu, Efectivo, Tarjeta).

## Íconos

Lucide, trazo 1.75, 20px. Nunca emojis.

## Tono de los textos

Tutea, directo, cercano y colombiano sin exagerar ("plata", "bolsillo", "cajita"). Verbos claros: "Agregar gasto", "Mover plata", "Guardar cuenta". La acción conserva su nombre en todo el flujo. Errores: qué pasó y cómo arreglarlo. Vacíos como invitación.

## Idiomas y moneda

Español (predeterminado) e inglés con `next-intl` (`/es/...`, `/en/...`). Moneda elegible en Ajustes. Formato con `Intl.NumberFormat`.
