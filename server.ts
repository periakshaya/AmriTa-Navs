import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { campusEngine } from './src/services/graphEngine';
import { LocationType, MetricType, WalkabilityStatus } from './src/types/campus';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'amrita-admin-secure-2026';

  app.use(express.json());

  // CORS support
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // REST API Endpoints matching Java Spring Boot backend
  app.get('/api/locations', (req: Request, res: Response) => {
    res.json(campusEngine.getAllVertices());
  });

  app.get('/api/locations/search', (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    res.json(campusEngine.searchVertices(q));
  });

  app.get('/api/locations/:id', (req: Request, res: Response) => {
    const v = campusEngine.getVertex(req.params.id);
    if (!v) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(v);
  });

  app.get('/api/edges', (req: Request, res: Response) => {
    res.json(campusEngine.getAllEdges());
  });

  app.post('/api/routes', (req: Request, res: Response) => {
    const { originId, destinationId, metric = 'DISTANCE', algorithm = 'AStar', wheelchairOnly = false, returnAlternatives = true } = req.body;
    if (!originId || !destinationId) {
      res.status(400).json({ error: 'originId and destinationId are required.' });
      return;
    }

    const result = campusEngine.computeRoute(
      originId,
      destinationId,
      metric as MetricType,
      algorithm,
      Boolean(wheelchairOnly),
      Boolean(returnAlternatives)
    );

    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  });

  app.get('/api/nearest', (req: Request, res: Response) => {
    const { originId, type, metric = 'DISTANCE', wheelchairOnly = 'false' } = req.query;
    if (!originId || !type) {
      res.status(400).json({ error: 'originId and type are required' });
      return;
    }

    const nearest = campusEngine.findNearestFacility(
      originId as string,
      type as LocationType,
      metric as MetricType,
      wheelchairOnly === 'true'
    );

    if (!nearest) {
      res.status(404).json({ error: `No reachable ${type} facility found from ${originId}` });
      return;
    }
    res.json(nearest);
  });

  app.get('/api/graph/statistics', (req: Request, res: Response) => {
    res.json(campusEngine.getStatistics());
  });

  app.post('/api/benchmarks', (req: Request, res: Response) => {
    const { originId, destinationId, metric = 'DISTANCE', iterations = 50, wheelchairOnly = false } = req.body;
    if (!originId || !destinationId) {
      res.status(400).json({ error: 'originId and destinationId required' });
      return;
    }
    const result = campusEngine.runBenchmark(originId, destinationId, metric as MetricType, iterations, Boolean(wheelchairOnly));
    res.json(result);
  });

  // Admin dynamic closure management
  app.get('/api/admin/closures', (req: Request, res: Response) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_API_KEY) {
      res.status(401).json({ error: 'Unauthorized: Invalid X-Admin-Key header' });
      return;
    }
    res.json(campusEngine.getDynamicClosures());
  });

  app.post('/api/admin/closures', (req: Request, res: Response) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_API_KEY) {
      res.status(401).json({ error: 'Unauthorized: Invalid X-Admin-Key header' });
      return;
    }
    const { edgeId, status = 'TEMPORARILY_CLOSED' } = req.body;
    if (!edgeId) {
      res.status(400).json({ error: 'edgeId is required' });
      return;
    }
    const ok = campusEngine.setEdgeClosure(edgeId, status as WalkabilityStatus);
    if (!ok) {
      res.status(404).json({ error: `Edge not found: ${edgeId}` });
      return;
    }
    res.json({
      success: true,
      message: `Edge ${edgeId} updated to ${status}`,
      edgeId,
      status
    });
  });

  app.delete('/api/admin/closures/:edgeId', (req: Request, res: Response) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_API_KEY) {
      res.status(401).json({ error: 'Unauthorized: Invalid X-Admin-Key header' });
      return;
    }
    const { edgeId } = req.params;
    const ok = campusEngine.reopenEdge(edgeId);
    if (!ok) {
      res.status(404).json({ error: `Edge not found: ${edgeId}` });
      return;
    }
    res.json({
      success: true,
      message: `Edge ${edgeId} reopened for pedestrian transit`,
      edgeId,
      status: 'OPEN'
    });
  });

  // System & Capstone Lab Endpoints: Run JUnit tests on demand
  app.post('/api/system/run-junit', (req: Request, res: Response) => {
    exec('mvn -f backend/pom.xml test', { timeout: 60000 }, (error, stdout, stderr) => {
      const output = stdout + (stderr ? '\n' + stderr : '');
      const passed = !error;
      res.json({
        success: passed,
        exitCode: error ? error.code : 0,
        output
      });
    });
  });

  // Java Source Code Inspector API
  app.get('/api/system/java-sources', (req: Request, res: Response) => {
    const javaDir = path.resolve(__dirname, 'backend/src/main/java/edu/amrita/campusnav');
    const testDir = path.resolve(__dirname, 'backend/src/test/java/edu/amrita/campusnav');
    const pomPath = path.resolve(__dirname, 'backend/pom.xml');

    function readFilesRecursively(dir: string, baseName: string): { path: string; name: string; content: string }[] {
      const results: { path: string; name: string; content: string }[] = [];
      if (!fs.existsSync(dir)) return results;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(baseName, entry.name);
        if (entry.isDirectory()) {
          results.push(...readFilesRecursively(fullPath, relPath));
        } else if (entry.name.endsWith('.java')) {
          results.push({
            path: relPath,
            name: entry.name,
            content: fs.readFileSync(fullPath, 'utf-8')
          });
        }
      }
      return results;
    }

    const mainFiles = readFilesRecursively(javaDir, 'src/main/java');
    const testFiles = readFilesRecursively(testDir, 'src/test/java');
    const pomContent = fs.existsSync(pomPath) ? fs.readFileSync(pomPath, 'utf-8') : '';

    res.json({
      pomXml: pomContent,
      mainSources: mainFiles,
      testSources: testFiles
    });
  });

  // Vite middleware mounting in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Amrita Campus Navigator] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
