# Cuadre: control de gastos

App web para registrar gastos, ingresos y deudas desde cualquier dispositivo con la misma cuenta.
Next.js 16 + Supabase (base de datos y login) + next-intl (español / inglés) + modo claro y oscuro.
Cuentas (banco, efectivo, tarjeta de crédito) con bolsillos o cajitas, y movimientos entre cuentas.

El diseño está documentado en [`DESIGN.md`](./DESIGN.md).

---

## 1. Crear la base de datos (gratis, 5 minutos)

1. Entra en <https://supabase.com>, crea una cuenta y un **New project** (plan Free). Elige la región más cercana a ti y guarda la contraseña de la base de datos.
2. En el menú izquierdo abre **SQL Editor → New query**, pega todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y pulsa **Run**. Después, en otra consulta nueva, haz lo mismo con [`supabase/migrations/002_accounts.sql`](./supabase/migrations/002_accounts.sql) (cuentas, bolsillos y movimientos entre cuentas).
   - Consejo: copia el archivo desde el editor de código o con `pbcopy < archivo.sql`, no desde un chat: algunos chats recortan texto al copiar.
3. En **Project Settings → API Keys** copia la **Publishable key** (`sb_publishable_…`). En **Project Settings → Data API** copia la **Project URL**.
4. En **Authentication → Sign In / Providers → Email**:
   - Deja activado *Email*.
   - **Recomendado para uso personal:** desactiva *Confirm email*. Así entras directamente al crear la cuenta, sin depender del correo. El plan gratis solo envía unos pocos correos por hora.
5. En **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` por ahora. Cuando despliegues, cámbiala por la dirección de Vercel.
   - *Redirect URLs*: añade `http://localhost:3000/**` y, más adelante, `https://TU-APP.vercel.app/**`.

## 2. Correrla en tu computador

```bash
cp .env.example .env.local   # y pega ahí la URL y la clave
npm install
npm run dev                  # abre http://localhost:3000
```

Crea tu cuenta en `/es/signup`. Cuando ya tengas tu cuenta, puedes desactivar los registros nuevos en
**Authentication → Sign In / Providers → Allow new users to sign up** para que nadie más la use.

## 3. Publicarla gratis en Vercel

1. Sube el proyecto a un repositorio de GitHub (puede ser privado).
2. Entra en <https://vercel.com> con tu cuenta de GitHub → **Add New → Project** → elige el repositorio.
3. En **Environment Variables** añade las mismas dos variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Pulsa **Deploy**. En un par de minutos tendrás una dirección como `https://cuadre-tuusuario.vercel.app`.
5. Vuelve a Supabase → **Authentication → URL Configuration** y pon esa dirección como *Site URL* y en *Redirect URLs* (`https://…vercel.app/**`).

Cada vez que subas cambios a GitHub, Vercel publica la nueva versión sola.

### Costos y límites (planes gratuitos)

| Servicio | Plan | Lo que importa |
|---|---|---|
| Vercel | Hobby | Gratis para uso personal y no comercial. |
| Supabase | Free | 500 MB de base de datos (cientos de miles de movimientos). **El proyecto se pausa tras 7 días sin uso.** Se reactiva con un clic en el panel de Supabase, sin perder datos. |

## Estructura

```
supabase/schema.sql          Tablas, seguridad por usuario (RLS) y función de totales
src/proxy.ts                 Idioma en la URL + refresco de sesión + protección de rutas
src/app/[locale]/(app)/      Resumen, Movimientos, Deudas, Ajustes
src/app/[locale]/(auth)/     Entrar, Crear cuenta, Recuperar contraseña
src/app/auth/callback/       Destino de los enlaces de correo de Supabase
src/lib/actions/             Acciones del servidor (guardar, editar, eliminar)
src/messages/{es,en}.json    Textos de la interfaz
```
