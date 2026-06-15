import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import routes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export const printServerUrls = (port: number): void => {
  const base = `http://localhost:${port}`;
  console.log('');
  console.log('═'.repeat(50));
  console.log('  Credence Transaction API — Server running');
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  API Base:     ${base}/api/v1`);
  console.log(`  Swagger UI:   ${base}/api-docs`);
  console.log(`  OpenAPI JSON: ${base}/api-docs.json`);
  console.log(`  Health:       ${base}/api/v1/health`);
  console.log(`  Login:        ${base}/api/v1/auth/login`);
  console.log('');
};

const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Credence Transaction API',
  }));

  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
