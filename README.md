# Agenda Telefónica API

Backend REST en JavaScript (Node.js + Express) para una aplicación móvil de agenda telefónica, documentado con OpenAPI 3.0.

## Requisitos

- Node.js 18+

## Instalación

```bash
npm install
npm run seed   # Carga datos de demo
npm start      # Inicia el servidor en http://localhost:3000
```

Modo desarrollo con recarga automática:

```bash
npm run dev
```

## Documentación OpenAPI

- **Swagger UI:** http://localhost:3000/api/docs
- **Spec YAML:** http://localhost:3000/api/docs/openapi.yaml

## Usuario demo

| Campo      | Valor              |
|------------|--------------------|
| Email      | demo@agenda.com    |
| Contraseña | demo1234           |

## Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| POST   | `/register`         | Registrar usuario        |
| POST   | `/login`            | Iniciar sesión           |
| GET    | `/me`               | Obtener perfil           |
| PUT    | `/me`               | Actualizar perfil        |
| PUT    | `/me/password`      | Cambiar contraseña       |
| GET    | `/me/stats`         | Estadísticas             |

### Contactos (`/api/contacts`)

| Método | Ruta                | Descripción                        |
|--------|---------------------|------------------------------------|
| GET    | `/`                 | Listar (búsqueda, filtros, paginación) |
| POST   | `/`                 | Crear contacto                     |
| GET    | `/:id`              | Obtener contacto                   |
| PUT    | `/:id`              | Actualizar contacto                |
| DELETE | `/:id`              | Eliminar contacto                  |
| PATCH  | `/:id/favorite`     | Alternar favorito                  |
| GET    | `/favorites`        | Listar favoritos                   |
| GET    | `/recent`           | Contactos recientes                |
| GET    | `/index`            | Índice alfabético                  |
| GET    | `/sync?since=`      | Sincronización incremental         |

### Grupos (`/api/groups`)

| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| GET    | `/`                 | Listar grupos            |
| POST   | `/`                 | Crear grupo              |
| GET    | `/:id`              | Obtener grupo            |
| PUT    | `/:id`              | Actualizar grupo         |
| DELETE | `/:id`              | Eliminar grupo           |
| GET    | `/:id/contacts`     | Contactos del grupo      |

### Health

| Método | Ruta           | Descripción    |
|--------|----------------|----------------|
| GET    | `/api/health`  | Health check   |

## Autenticación

Tras el login, incluir el token JWT en cada petición:

```
Authorization: Bearer <token>
```

## Ejemplo rápido

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@agenda.com","password":"demo1234"}'

# Listar contactos
curl http://localhost:3000/api/contacts \
  -H "Authorization: Bearer <TOKEN>"

# Crear contacto
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "phones": [{"type": "mobile", "number": "+54 11 1234-5678", "isPrimary": true}]
  }'
```

## Estructura del proyecto

```
src/
├── app.js              # Configuración Express + Swagger
├── server.js           # Punto de entrada
├── controllers/        # Controladores HTTP
├── services/           # Lógica de negocio
├── routes/             # Rutas REST
├── middleware/         # Auth, errores
├── validators/         # Validación de entrada
└── db/                 # SQLite + seed
openapi.yaml            # Especificación OpenAPI 3.0
data/                   # Base de datos JSON (generada)
```

## Modulo CLM (PostgreSQL) — dashboard con login y CRUD completo

Ademas de la agenda telefonica, este proyecto incluye un modulo aparte que
se conecta a una base de datos PostgreSQL con el schema de un CLM (Contract
Lifecycle Management: `empresa_cliente`, `contrato`, `clausula`) y expone un
dashboard web para gestionarla. Es independiente del resto de la API: usa su
propia conexion (`src/db/postgres.js`), su propio login (no comparte
usuarios con `/api/auth`), y no toca `data/agenda.json`.

El dashboard (`http://localhost:3000/clm/`) esta protegido por sesion: si
intentas entrar sin haber iniciado sesion, el servidor te redirige solo a
`/clm/login.html` (no se puede saltar escribiendo la URL directo). Una vez
adentro, cada una de las 3 tablas tiene su propio formulario para **crear**,
y cada fila tiene botones para **editar** y **eliminar** — no es solo un
visualizador de solo lectura.

### 1. Tener una base PostgreSQL con las 3 tablas creadas

Hay dos formas de conseguir esto — eliges UNA con las variables de entorno
del paso 2, sin cambiar nada de código (ver `src/db/postgres.js`):

**Opcion A: Supabase (recomendada, sin instalar nada en tu PC)**

1. Crea un proyecto en https://supabase.com (plan gratis). Guarda la
   contrasena que le pongas a la base — la vas a necesitar en el paso 2.
2. Ve a **Project Settings → Database → Connection string**, pestaña
   **URI**, y copia esa cadena (empieza con `postgresql://postgres...`).
3. Corre el script `../3_tablas_principales.sql` contra ese proyecto. La
   forma mas simple: en el panel de Supabase, **SQL Editor → New query**,
   pega el contenido completo del archivo y ejecuta con "Run". (Tambien se
   puede con `psql` usando esa misma connection string, si lo prefieres.)
4. (Opcional, para no ver las tablas vacias) haz lo mismo con
   `../seed_datos_ejemplo.sql`.

**Opcion B: PostgreSQL instalado en tu propia PC**

1. Instala PostgreSQL en tu maquina (incluye pgAdmin) si aun no lo tienes:
   https://www.postgresql.org/download/windows/
2. Crea una base de datos, por ejemplo `clm_db`.
3. Ejecuta contra esa base el script `../3_tablas_principales.sql` (esta un
   nivel arriba de esta carpeta, en `practico/`). Puedes abrirlo con el
   Query Tool de pgAdmin y ejecutarlo con F5, o con psql:
   ```
   psql -U postgres -d clm_db -f "D:/diplomado/modulo 2/practico/3_tablas_principales.sql"
   ```
4. (Opcional, para no ver las tablas vacias) haz lo mismo con
   `../seed_datos_ejemplo.sql`.

### 2. Configurar la conexion

```
copy .env.example .env
```

Abre `.env` y mira las dos opciones que ya vienen comentadas:

- Si elegiste **Supabase**: pega tu connection string en `DATABASE_URL`
  (reemplazando `[YOUR-PASSWORD]` por tu contraseña real) y deja las
  variables `PGHOST/PGPORT/...` como estan (se ignoran cuando hay
  `DATABASE_URL`).
- Si elegiste **Postgres local**: deja `DATABASE_URL` comentada/vacia y
  completa `PGPASSWORD` (y `PGDATABASE`/`PGUSER` si usaste otros nombres).

`src/db/postgres.js` detecta automaticamente cual de las dos configuraste
y, si es Supabase, activa SSL (obligatorio para conectarse a una base en
internet; no hace falta para una base en tu propia PC).

En el mismo `.env` tambien estan las 3 variables del login del dashboard
(ver mas abajo, seccion "Login del dashboard CLM") — ya vienen con un valor
de ejemplo que funciona sin que tengas que generar nada la primera vez.

### 3. Levantar el proyecto (igual que siempre)

```
npm install
npm start
```

### 4. Login del dashboard CLM

El dashboard NO es publico: usa un solo usuario "admin" fijo, definido por
variables de entorno (no una tabla de usuarios en Postgres — el schema de
este practico se queda en las 3 tablas del CLM). Valores por defecto que ya
vienen en `.env.example`:

| Campo      | Valor      |
|------------|------------|
| Usuario    | `admin`    |
| Contraseña | `clm12345` |

Para cambiar la contraseña: corre `npm run clm:hash-password -- "tu-clave-nueva"`
y pega el resultado en `CLM_ADMIN_PASSWORD_HASH` dentro de tu `.env` (se
guarda como hash de bcrypt, nunca en texto plano). Hay que reiniciar el
servidor despues de editar el `.env` para que tome el cambio.

La sesion se guarda en una cookie (dura 8 horas). Si entras directo a
`http://localhost:3000/clm/` sin haber iniciado sesion, el servidor te
redirige solo a la pantalla de login — es la forma en que este modulo
cumple con "no dejar entrar directo al dashboard sin loguearse".

### 5. Gestionar los datos (crear, editar, eliminar)

La forma mas simple es el dashboard mismo (`http://localhost:3000/clm/`):
cada seccion (Empresas, Contratos, Clausulas) tiene un formulario para crear,
y cada fila de la tabla tiene botones "Editar" y "Eliminar".

Tambien se puede hacer todo por API directa (requiere estar autenticado —
ver siguiente seccion), por ejemplo para probar desde Swagger o `curl`:

| Metodo | Ruta                      | Uso                                                          |
|--------|---------------------------|---------------------------------------------------------------|
| GET    | `/api/clm/empresas`       | Listar empresas                                                |
| POST   | `/api/clm/empresas`       | Crear (`razon_social`, `nit`, `pais` requeridos)               |
| PUT    | `/api/clm/empresas/:id`   | Editar (cualquier campo es opcional; solo se actualiza lo enviado) |
| DELETE | `/api/clm/empresas/:id`   | Eliminar                                                        |
| GET    | `/api/clm/contratos`      | Listar contratos                                                |
| POST   | `/api/clm/contratos`      | Crear (`id_empresa`, `titulo`, `contraparte_nombre` requeridos) |
| PUT    | `/api/clm/contratos/:id`  | Editar (incluye cambiar `estado`, validado por trigger)         |
| DELETE | `/api/clm/contratos/:id`  | Eliminar                                                        |
| GET    | `/api/clm/clausulas`      | Listar clausulas                                                |
| POST   | `/api/clm/clausulas`      | Crear (`id_contrato`, `orden`, `titulo`, `contenido` requeridos)|
| PUT    | `/api/clm/clausulas/:id`  | Editar                                                           |
| DELETE | `/api/clm/clausulas/:id`  | Eliminar                                                         |

Ejemplo con curl (primero hay que loguearse y guardar la cookie de sesion):

```bash
# 1. Login (guarda la cookie en cookies.txt)
curl -c cookies.txt -X POST http://localhost:3000/api/clm/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"clm12345"}'

# 2. Usar esa cookie en las siguientes peticiones
curl -b cookies.txt -X POST http://localhost:3000/api/clm/empresas \
  -H "Content-Type: application/json" \
  -d '{"razon_social":"Mi Empresa SRL","nit":"1122334455","pais":"Bolivia"}'
```

La respuesta de un POST trae el registro creado, incluido su `id_empresa`
(UUID) — ese valor es el que despues necesitas para crear un contrato con
`id_empresa`, y el `id_contrato` de un contrato es el que necesitas para
crear sus clausulas.

Errores comunes: `401` si no iniciaste sesion (o si vencio, dura 8h), `409`
si el NIT ya existe, `400` si el `id_empresa`/`id_contrato` no existe
todavia, el UUID esta mal escrito, o se viola una regla de negocio definida
por un trigger de Postgres (por ejemplo, una transicion de `estado` invalida
en un contrato, o editar una clausula marcada como no modificable).

### 6. Ver la documentacion / probar sin el dashboard

- Endpoints crudos (JSON, requieren sesion salvo `/auth/login`):
  `/api/clm/health`, `/api/clm/empresas`, `/api/clm/contratos`, `/api/clm/clausulas`
- Swagger dedicado solo a estas 3 tablas (sin Auth/Contacts/Groups):
  http://localhost:3000/api/clm-docs
- (El Swagger completo de la Agenda Telefonica sigue en
  http://localhost:3000/api/docs, con la tag "CLM" tambien incluida ahi)

Si el dashboard dice "Sin conexion a la base de datos" (esto es un problema
de Postgres, distinto de no poder iniciar sesion), revisa en este orden:

- **Con Supabase:** que copiaste bien el `DATABASE_URL` completo (incluida
  la contrasena, sin dejar `[YOUR-PASSWORD]` literal), y que el proyecto de
  Supabase no este pausado (los proyectos gratis se pausan solos si pasan
  varios dias sin uso — reactivalo desde el dashboard).
- **Con Postgres local:** que el servicio de Postgres este corriendo, que
  `PGPASSWORD` en `.env` sea correcto, y que `PGDATABASE` coincida con el
  nombre real de la base. Puedes ver el motivo exacto abriendo
  `http://localhost:3000/api/clm/health` directamente en el navegador (ya
  con sesion iniciada): trae un campo `detalle` con el mensaje real de
  Postgres.

## Variables de entorno

| Variable                 | Default                                  | Descripción                                              |
|---------------------------|------------------------------------------|-----------------------------------------------------------|
| PORT                       | 3000                                     | Puerto del servidor                                        |
| JWT_SECRET                 | agenda-dev-secret-change-in-production   | Secreto JWT de `/api/auth` (agenda telefonica)             |
| DATABASE_URL               | *(vacio)*                                | Cadena de conexion a Postgres (Supabase u otro), modulo CLM |
| PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD | localhost / 5432 / clm_db / postgres / *(sin default)* | Conexion a Postgres local, modulo CLM (se ignoran si hay `DATABASE_URL`) |
| CLM_JWT_SECRET             | clm-dev-secret-change-in-production      | Secreto para firmar la cookie de sesion del dashboard CLM  |
| CLM_ADMIN_USER             | admin                                    | Usuario del dashboard CLM                                  |
| CLM_ADMIN_PASSWORD_HASH    | *(hash de "clm12345")*                   | Hash bcrypt de la contraseña del dashboard CLM              |
