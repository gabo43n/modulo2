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

## Modulo CLM (PostgreSQL) — visualizador de contratos

Ademas de la agenda telefonica, este proyecto incluye un modulo aparte, de
solo lectura, que se conecta a una base de datos PostgreSQL con el schema
de un CLM (Contract Lifecycle Management: `empresa_cliente`, `contrato`,
`clausula`) y permite visualizarla. Es independiente del resto de la API:
usa su propia conexion (`src/db/postgres.js`) y no toca `data/agenda.json`.

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

### 3. Levantar el proyecto (igual que siempre)

```
npm install
npm start
```

### 4. Agregar datos (crear registros)

Ademas de los 4 endpoints de lectura, el modulo tiene 3 endpoints para crear
datos directamente desde la API (antes solo se podia por SQL):

| Metodo | Ruta                 | Body minimo requerido                                   |
|--------|----------------------|-----------------------------------------------------------|
| POST   | `/api/clm/empresas`  | `razon_social`, `nit`, `pais`                             |
| POST   | `/api/clm/contratos` | `id_empresa` (UUID de una empresa existente), `titulo`, `contraparte_nombre` |
| POST   | `/api/clm/clausulas` | `id_contrato` (UUID de un contrato existente), `orden`, `titulo`, `contenido` |

Se pueden probar desde Swagger (http://localhost:3000/api/docs, boton "Try it
out" en cada POST) o con curl, por ejemplo:

```bash
curl -X POST http://localhost:3000/api/clm/empresas \
  -H "Content-Type: application/json" \
  -d '{"razon_social":"Mi Empresa SRL","nit":"1122334455","pais":"Bolivia"}'
```

La respuesta trae el registro creado, incluido su `id_empresa` (UUID) — ese
valor es el que despues necesitas para crear un contrato con `id_empresa`, y
el `id_contrato` de un contrato es el que necesitas para crear sus clausulas.

Errores comunes: `409` si el NIT ya existe, `400` si el `id_empresa` /
`id_contrato` no existe todavia o el UUID esta mal escrito.

### 5. Ver los datos

- Pagina HTML simple: http://localhost:3000/clm/
- Endpoints crudos (JSON): `/api/clm/health`, `/api/clm/empresas`,
  `/api/clm/contratos`, `/api/clm/clausulas`
- Swagger dedicado solo a estas 3 tablas (sin Auth/Contacts/Groups):
  http://localhost:3000/api/clm-docs
- (El Swagger completo de la Agenda Telefonica sigue en
  http://localhost:3000/api/docs, con la tag "CLM" tambien incluida ahi)

Si la pagina dice "Sin conexion a la base de datos", revisa en este orden:

- **Con Supabase:** que copiaste bien el `DATABASE_URL` completo (incluida
  la contrasena, sin dejar `[YOUR-PASSWORD]` literal), y que el proyecto de
  Supabase no este pausado (los proyectos gratis se pausan solos si pasan
  varios dias sin uso — reactivalo desde el dashboard).
- **Con Postgres local:** que el servicio de Postgres este corriendo, que
  `PGPASSWORD` en `.env` sea correcto, y que `PGDATABASE` coincida con el
  nombre real de la base.

## Variables de entorno

| Variable     | Default                          | Descripción        |
|--------------|----------------------------------|--------------------|
| PORT         | 3000                             | Puerto del servidor |
| JWT_SECRET   | agenda-dev-secret-change-in-production | Secreto JWT |
