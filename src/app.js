const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const groupRoutes = require('./routes/groupRoutes');
const clmRoutes = require('./routes/clmRoutes');
const { requireAuthPage } = require('./middleware/clmAuth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

require('./db/database');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// cookie-parser rellena req.cookies a partir del header "Cookie" que manda
// el navegador. Sin esto, requireAuthPage/requireAuthApi (en clmAuth.js) no
// podrian leer la cookie de sesion "clm_token".
app.use(cookieParser());

// Pagina de login del modulo CLM: publica, no pasa por requireAuthPage.
app.get('/clm/login.html', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/clm/login.html'));
});

// Dashboard del modulo CLM: protegido. Si no hay sesion valida,
// requireAuthPage redirige a /clm/login.html en vez de servir el HTML.
// Registramos las 3 formas en las que alguien podria pedir esta pagina
// (con o sin la barra final, o pidiendo el archivo por su nombre).
app.get(['/clm', '/clm/', '/clm/index.html'], requireAuthPage, (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/clm/index.html'));
});

const openApiSpec = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Agenda Telefónica API',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api/docs/openapi.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi.yaml'));
});

// Swagger dedicado SOLO al modulo CLM (empresa_cliente/contrato/clausula),
// separado del spec completo de arriba para no mezclarlo con Auth/Contacts/
// Groups. swagger-ui-express permite montar varias instancias en la misma
// app, cada una en su propia ruta; por eso usamos swaggerUi.serveFiles en
// vez de swaggerUi.serve en la segunda (evita servir los mismos assets
// estaticos dos veces bajo rutas distintas).
const clmOpenApiSpec = YAML.load(path.join(__dirname, '../openapi-clm.yaml'));
app.use('/api/clm-docs', swaggerUi.serveFiles(clmOpenApiSpec, {}), swaggerUi.setup(clmOpenApiSpec, {
  customSiteTitle: 'CLM - Contratos (PostgreSQL)',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api/clm-docs/openapi-clm.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi-clm.yaml'));
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'agenda-telefonica-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/clm', clmRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
