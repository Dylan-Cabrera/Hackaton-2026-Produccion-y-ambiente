# Backend — Marketplace de productores locales (Formosa)

API REST para una plataforma que conecta productores locales con consumidores (personas e instituciones), con exploración pública sin registro, matching B2B de insumos, publicación de necesidades con recomendación de productores, telemetría de demanda y dashboards de analítica para productores y administradores.

## Stack

- **Runtime:** Node.js + TypeScript (ESM), servido con [`tsx`](https://github.com/privatenumber/tsx) en desarrollo y compilado con `tsc` para producción.
- **Framework HTTP:** Express 4.
- **Base de datos:** PostgreSQL 16 + [PostGIS](https://postgis.net/) 3.4 (vía `docker-compose.yml`), accedida con Sequelize 6.
- **Autenticación:** JWT, viaja en una cookie `HttpOnly` o en el header `Authorization: Bearer <token>`.
- **Validación:** `express-validator`.
- **Passwords:** `bcryptjs`.

## Arquitectura

Capas estrictas, de afuera hacia adentro:

```
routes → controllers → services → repositories → models
```

- **`routes/`**: define método HTTP + path, encadena middlewares (`authenticateToken`, `requireRole`, `optionalAuth`, validators, `validateRequest`) y delega en el controller.
- **`controllers/`**: adaptador HTTP puro. Lee `req`, llama al service correspondiente y arma `{ message, data }`. No tiene lógica de negocio.
- **`services/`**: casos de uso. Toda la lógica de negocio vive acá. Dependen únicamente de **interfaces** (`interfaces/*-repository.interface.ts`, `*-service.interface.ts`), nunca de Sequelize directamente — así se pueden testear con dobles.
- **`repositories/`**: única capa que conoce Sequelize y SQL. Traducen entre los modelos y las formas que esperan los services (`*Record`). Todo valor del usuario que entra en SQL crudo (`sequelize.query`, `sequelize.literal`) va con `replacements`, nunca interpolado en el string.
- **`mappers/`**: traducen entre el body de la API, la fila de la base y la respuesta pública. Responsabilidad única, sin estado, métodos estáticos.
- **`models/`**: definición de tablas y asociaciones (Sequelize). `models/index.ts` es el composition root de las asociaciones; se importa una única vez, antes de sincronizar la base.
- **`interfaces/`**: contratos (Dependency Inversion + Interface Segregation) y tipos de cada módulo (`*.types.ts`).
- **`config/container.ts`**: composition root de toda la app — único lugar donde se instancian clases concretas y se inyectan unas en otras. El resto del código solo importa interfaces.
- **`middlewares/`**: autenticación/autorización, validación de `express-validator` y manejo centralizado de errores.
- **`validators/`**: reglas de `express-validator` por endpoint.
- **`utils/`**: funciones puras compartidas (geolocalización, normalización de texto).
- **`scripts/`**: scripts de mantenimiento (`seed-all.ts`).

Las respuestas HTTP siempre tienen la forma `{ message: string, data: ... }` (los listados paginados agregan `pagination: { limit, offset, total }`).

## Puesta en marcha

### Requisitos
- Node.js 20+
- Docker (para PostgreSQL + PostGIS)

### Pasos

```bash
# 1. Base de datos (Postgres + PostGIS en Docker)
docker compose up -d

# 2. Variables de entorno
cp .env.example .env
# completar .env (ver tabla de abajo)

# 3. Dependencias
npm install

# 4. Levantar el servidor en desarrollo (con recarga automática)
npm run dev

# 5. (Opcional pero recomendado) Poblar la base con datos de demo
npm run seed
```

Al arrancar, `connectDatabase()` habilita las extensiones `postgis` y `unaccent`, y ejecuta `sequelize.sync()` (crea tablas nuevas, no altera las existentes). Si cambiás un modelo existente en desarrollo, la forma más simple de aplicar el cambio es recrear la base: `docker compose down -v && docker compose up -d` y volver a correr `npm run seed`.

### Variables de entorno (`.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `NODE_ENV` | Entorno de ejecución. El seed se niega a correr si es `production` | `development` |
| `FRONTEND_URL` | Origen permitido por CORS (para que las cookies crucen dominios) | `http://localhost:5173` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base | `auth_db` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `JWT_SECRET` | Secreto para firmar los tokens | (generar uno propio) |
| `JWT_EXPIRES_IN` | Vencimiento del token | `24h` |

### Scripts de `package.json`

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor con recarga automática (`tsx watch`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Corre el build compilado (`node dist/server.js`) |
| `npm run seed` | Recrea el esquema (`sequelize.sync({ force: true })`, **borra todos los datos**) y lo puebla con datos de demo. Se niega a correr si `NODE_ENV=production` |

## Modelo de datos

Una única tabla `users` para los tres roles, para que necesidades y telemetría tengan una sola FK y exista un solo login.

### `users`
Datos de cuenta comunes a los tres roles.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `role` | ENUM `CONSUMER` \| `PRODUCER` \| `ADMIN` | Indexado. El admin no se registra por API, solo existe vía seed |
| `name` | STRING(100) | Persona o referente de la institución |
| `email` | STRING(100) | Único, se normaliza a minúsculas |
| `password` | STRING(255) | Hash bcrypt |
| `phone` | STRING(15) | Obligatorio para `PRODUCER` y para publicar necesidades |
| `locality` | STRING(80) | Validada contra el catálogo de `LOCALITIES` |
| `coordinates` | GEOMETRY(POINT, 4326) | Índice GIST. Si no se envía pero hay `locality`, se infiere el centroide |
| `accountType` | ENUM `PERSONA` \| `INSTITUCION` | Solo aplica a `CONSUMER` |
| `organizationName` | STRING(120) | Obligatorio si `accountType = INSTITUCION` |
| `institutionType` | ENUM (ver catálogo) | Opcional: `Comedor`, `Escuela`, `ONG`, `Municipio`, `Comercio`, `Otro` |
| `createdAt` | DATE | |

### `producer_profiles`
Datos del emprendimiento, 1 a 1 con `users` (`PK = FK = userId`, `onDelete: CASCADE`).

| Campo | Tipo | Notas |
|---|---|---|
| `userId` | INTEGER PK/FK | |
| `businessName` | STRING(100) | |
| `category` | ENUM (ver catálogo de categorías) | |
| `address` | STRING(255) | Referencia de entrega, opcional |
| `paymentMethods` | ARRAY(STRING) | Default `[]` |
| `deliveryOptions` | ARRAY(STRING) | Default `[]` |
| `bio` | TEXT | Opcional |

### `products`
Publicación de un productor: producto normal u oferta de excedente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `producerId` | INTEGER FK `users.id` | Indexado |
| `title` | STRING(120) | |
| `description` | TEXT | Opcional |
| `category` | ENUM | Si no se envía, toma el rubro del productor |
| `price` | DECIMAL(10,2) | > 0 |
| `offerPrice` | DECIMAL(10,2) | Obligatorio si `isOffer = true`, y debe ser menor que `price` |
| `isOffer` | BOOLEAN | Default `false`, indexado |
| `stockUnit` | ENUM (ver catálogo de unidades) | |
| `imageUrl` | STRING(500) | URL http/https válida |
| `available` | BOOLEAN | Default `true`, indexado |
| `createdAt` | DATE | |

### `needs`
Necesidad publicada por cualquier rol: qué le falta conseguir a alguien (comedores, escuelas, otros productores, etc.), con matching automático de productores.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `userId` | INTEGER FK `users.id` | Indexado, `onDelete: CASCADE` |
| `title` | STRING(120) | |
| `description` | TEXT | Opcional |
| `category` | ENUM | Indexado |
| `quantity` | DECIMAL(10,2) | > 0 |
| `unit` | ENUM (ver catálogo de unidades) | |
| `frequency` | ENUM `UNICA` \| `SEMANAL` \| `QUINCENAL` \| `MENSUAL` | Default `UNICA` |
| `locality` | STRING(80) | Por defecto, la del usuario |
| `coordinates` | GEOMETRY(POINT, 4326) | Índice GIST. Por defecto, las del usuario o el centroide de su localidad |
| `radiusKm` | INTEGER | Default `30`, entre `5` y `200` |
| `status` | ENUM `OPEN` \| `RESOLVED` \| `CLOSED` | Default `OPEN`, indexado |
| `createdAt` | DATE | |

### `demand_metrics`
Telemetría de demanda: búsquedas y clics de contacto por WhatsApp. Sin `sesión` obligatoria (`userId` nullable).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `eventType` | ENUM `SEARCH_HIT` \| `SEARCH_FAIL` \| `WHATSAPP_CLICK` | |
| `queryTerm` | STRING(80) | Normalizado a minúsculas |
| `category` | ENUM | Opcional, se infiere cuando falta |
| `locality` | STRING(80) | Opcional |
| `coordinates` | GEOMETRY(POINT, 4326) | Índice GIST, opcional |
| `productId` | INTEGER FK `products.id` | `onDelete: SET NULL` |
| `producerId` | INTEGER FK `users.id` | `onDelete: SET NULL` |
| `userId` | INTEGER FK `users.id` | Nunca se acepta del body: sale del token, o `null` si es anónimo. `onDelete: SET NULL` |
| `needId` | INTEGER FK `needs.id` | `onDelete: SET NULL` (reservado para uso futuro) |
| `timestamp` | DATE | Propio (no usa `createdAt`) |

### Catálogos compartidos (`src/constants/`)

- **Categorías** (`catalog.constants.ts`): `Frutas Frescas`, `Verduras/Hortalizas`, `Tubérculos/Raíces`, `Dulces/Mermeladas`, `Snacks/Frituras`, `Apicultura`, `Aceites`, `Envases/Frascos`, `Lácteos/Quesos`, `Carnes/Huevos`, `Panificados`, `Artesanías/Textil`, `Otros`.
- **Unidades de stock**: `kg`, `atado`, `litro`, `unidad`, `caja`, `docena`, `frasco`.
- **Tipos de institución**: `Comedor`, `Escuela`, `ONG`, `Municipio`, `Comercio`, `Otro`.
- **Frecuencias de necesidad**: `UNICA`, `SEMANAL`, `QUINCENAL`, `MENSUAL`.
- **Localidades** (`localities.constants.ts`): Formosa, Clorinda, Pirané, El Colorado, Ibarreta, Las Lomitas, Laguna Blanca, Ingeniero Juárez — cada una con un centroide `{ lat, lng }` aproximado, usado como fallback de coordenadas.
- **Matriz de insumos B2B** (`supply-matrix.constants.ts`): qué categorías suele necesitar cada rubro de productor (HU-05).

Todos se exponen sin autenticación en `GET /api/meta`, para que el frontend no mantenga copias propias desactualizadas.

## Autenticación y roles

- El registro (`POST /api/auth/register`) crea la cuenta según el `role` enviado (`CONSUMER` o `PRODUCER`; **no se puede registrar un `ADMIN`** por API). Devuelve `{ user, token }` y setea la cookie `token`.
- El login es único para los tres roles; el JWT incluye `{ id, email, role }`.
- `authenticateToken`: exige sesión válida (cookie o header `Authorization: Bearer`). Responde `401` sin token, `403` si es inválido/expiró.
- `requireRole(...roles)`: se usa después de `authenticateToken`; responde `403` si el rol no está permitido.
- `optionalAuth`: si hay token válido completa `req.user`; si no, sigue como visitante anónimo. **Nunca** responde 401/403. La usan la telemetría y el listado público de necesidades.
- La navegación, búsqueda y contacto por WhatsApp **no requieren cuenta**.

## Reglas de negocio destacadas

- **Ofertas de producto:** si `isOffer = true`, `offerPrice` es obligatorio y debe ser menor a `price`. Al desactivar la oferta, el service fuerza `offerPrice = null`.
- **Búsqueda pública** (`GET /api/products`): ignora acentos y mayúsculas (`unaccent` + `ILIKE`), siempre filtra `available = true`. Con `lat`/`lng` ordena por cercanía real (`ST_Distance` sobre `geography`).
- **Recomendación B2B** (`GET /api/recommendations/b2b`): a partir del rubro del productor autenticado, usa `SUPPLY_MATRIX` para saber qué insumos buscar, y ordena por oferta > cercanía > precio.
- **Matching de necesidades** (`GET /api/needs/:id/matches`): productores dentro del `radiusKm` de la necesidad, puntuados por coincidencia de texto (0.40), categoría (0.20), cercanía (0.25), unidad compatible (0.10) y actividad reciente de WhatsApp (0.05), con motivos legibles (`reasons[]`).
- **Privacidad del teléfono en necesidades:** en los listados públicos siempre se muestra `authorDisplayName`, `accountType`, `institutionType` y `locality`; el `phone` del autor **solo** se incluye si quien consulta es `PRODUCER` o el propio autor.
- **Recomendaciones personalizadas** (`GET /api/recommendations/for-you`): pondera afinidad por categoría (con decaimiento temporal sobre la telemetría propia del usuario, 0.45), coincidencia con búsquedas recientes (0.30), cercanía (0.15) y ofertas vigentes (0.10); máximo 3 productos por productor. Sin historial, cae a un feed de "arranque en frío" (`coldStart: true`) con lo más popular cerca.
- **Privacidad de la telemetría:** `DELETE /api/users/me/activity` desvincula al usuario de sus propios eventos (`userId = null`) sin perder los agregados que usan los dashboards.
- **Dashboards nunca exponen datos por usuario individual**, solo agregados (conteos, promedios, rankings).
- **Regla de seguridad SQL:** todo valor que venga del usuario y entre en SQL crudo (`sequelize.query`, `sequelize.literal`) va con `replacements`; nunca se interpola en el string.

## Endpoints

Formato de respuesta uniforme: `{ message, data }` (los listados agregan `pagination`).

### Catálogos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/meta` | Público |

### Autenticación y cuenta

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crea la cuenta (`CONSUMER` o `PRODUCER`) |
| POST | `/api/auth/login` | Público | Login único para todos los roles |
| POST | `/api/auth/logout` | Público | Limpia la cookie de sesión |
| GET | `/api/auth/profile` | Protegido | Perfil propio (incluye `producerProfile` si es `PRODUCER`) |
| PUT | `/api/users/me` | Protegido | Edita datos de cuenta |
| DELETE | `/api/users/me` | Protegido | Elimina la cuenta (cascada: perfil, productos, necesidades) |
| DELETE | `/api/users/me/activity` | Protegido | Desvincula al usuario de su propia telemetría |

### Productores

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/producers/:id` | Público | Perfil público del emprendimiento |
| PUT | `/api/producers/profile` | `PRODUCER` | Edita el emprendimiento (y datos de cuenta relacionados, en una transacción) |
| GET | `/api/producers/:id/products` | Público | Catálogo del productor (solo disponibles) |

### Productos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/products` | Público | Búsqueda/exploración: `q`, `category`, `isOffer`, `lat`/`lng`/`maxDistance`, `limit`/`offset` |
| POST | `/api/products` | `PRODUCER` | Alta rápida de producto/oferta |
| GET | `/api/products/mine` | `PRODUCER` | Inventario propio completo (incluye pausados) |
| PATCH | `/api/products/:id` | `PRODUCER`, dueño | Edición parcial (precio, oferta, disponibilidad, etc.) |

### Recomendaciones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/recommendations/b2b` | `PRODUCER` | Insumos recomendados según el rubro propio |
| GET | `/api/recommendations/for-you` | `CONSUMER`, `PRODUCER` | Feed personalizado según historial propio (o `coldStart` sin historial) |

### Telemetría

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/telemetry/event` | Público (`optionalAuth`) | Registra `SEARCH_HIT` / `SEARCH_FAIL` / `WHATSAPP_CLICK`. Nunca falla de cara al cliente |

### Necesidades

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/needs` | `CONSUMER`, `PRODUCER` | Publica una necesidad (exige `phone` en el perfil). Devuelve `matchCount` + los 3 mejores matches |
| GET | `/api/needs` | Público (`optionalAuth`) | Necesidades `OPEN`. Filtros: `category`, `locality`, `lat`/`lng`, paginación |
| GET | `/api/needs/mine` | `CONSUMER`, `PRODUCER` | Necesidades propias (cualquier estado), con `matchCount` |
| GET | `/api/needs/for-me` | `PRODUCER` | Necesidades abiertas que el productor podría cubrir |
| GET | `/api/needs/:id` | Público (`optionalAuth`) | Detalle de una necesidad |
| PATCH | `/api/needs/:id` | Autor | Edita campos o cambia `status` |
| GET | `/api/needs/:id/matches` | Autor o `ADMIN` | Productores recomendados, con toda su información de contacto |

### Analítica

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/analytics/producer-demand` | `PRODUCER` | Dashboard propio: clics por localidad, términos más buscados, necesidades cercanas cubribles |
| GET | `/api/analytics/admin-summary` | `ADMIN` | Métricas macro de toda la plataforma |
| GET | `/api/analytics/unmet-demand-map` | `ADMIN` | Oferta vs. demanda insatisfecha: mapa de calor de búsquedas fallidas, necesidades sin match y ranking de localidades |

## Datos de demo (`npm run seed`)

El seed (`src/scripts/seed-all.ts`) recrea el esquema desde cero y reutiliza los mismos mappers y el mismo hasher de contraseñas que usa la API en producción, para que los datos queden exactamente como si se hubieran cargado por los endpoints reales. Se niega a correr si `NODE_ENV=production`.

Genera: 1 admin, 10 productores repartidos entre localidades y rubros (incluyendo un productor de `Tubérculos/Raíces` deliberadamente fuera del radio de búsqueda por defecto), 21 productos (7 en oferta), 5 consumidores (un `Comedor` y una `Escuela` con teléfono, habilitados para publicar necesidades), 5 necesidades (una sin ningún productor que la cubra, a propósito, para verse en el mapa de vacíos) y 60+ eventos de telemetría distribuidos en los últimos 30 días.

**Todas las cuentas de demo comparten la contraseña `Demo1234`.**

| Cuenta | Rol / tipo |
|---|---|
| `admin@demo.local` | `ADMIN` |
| `crocante@demo.local` | `PRODUCER` — Snacks/Frituras (Formosa) |
| `chacraalamos@demo.local` | `PRODUCER` — Tubérculos/Raíces (Formosa) |
| `donarosa@demo.local` | `PRODUCER` — Tubérculos/Raíces (Pirané) |
| `quebracho@demo.local` | `PRODUCER` — Tubérculos/Raíces (Ingeniero Juárez, fuera de radio) |
| `aceitesdelmonte@demo.local` | `PRODUCER` — Aceites (Clorinda) |
| `lacolmena@demo.local` | `PRODUCER` — Apicultura (El Colorado) |
| `dulcesabuela@demo.local` | `PRODUCER` — Dulces/Mermeladas (Ibarreta) |
| `envasesnorte@demo.local` | `PRODUCER` — Envases/Frascos (Laguna Blanca) |
| `laesperanza@demo.local` | `PRODUCER` — Lácteos/Quesos (Formosa) |
| `elnido@demo.local` | `PRODUCER` — Carnes/Huevos (Las Lomitas) |
| `consumidor@demo.local` | `CONSUMER` (persona) — historial con búsquedas fallidas de "miel" y "queso de cabra"; el producto "Queso de Cabra" se creó después, para el motivo `NOW_AVAILABLE` |
| `comedor@demo.local` | `CONSUMER` (institución `Comedor`) — publica la necesidad central de mandioca |
| `escuela.lomitas@demo.local` | `CONSUMER` (institución `Escuela`) — publica una necesidad sin matches, a propósito |
| `familia.perez@demo.local` | `CONSUMER` (persona) |
| `vecino.pirane@demo.local` | `CONSUMER` (persona) |

## Manejo de errores

Jerarquía de errores de dominio (`src/errors/app-error.ts`), cada uno con su `statusCode`: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409). Los controllers solo hacen `catch (error) { next(error) }`; `error-handler.ts` centraliza la respuesta HTTP.
