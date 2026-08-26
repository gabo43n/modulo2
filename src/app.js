const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const groupRoutes = require('./routes/groupRoutes');
const clmRoutes = require('./routes/clmRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

require('./db/database');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Pagina estatica del visualizador CLM: http://localhost:3000/clm/
app.use('/clm', express.static(path.join(__dirname, '../public/clm')));

const openApiSpec = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Agenda Telefónica API',
  customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api/docs/openapi.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../openapi.yaml'));
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
