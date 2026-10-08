import { createGameServer } from './server.js';
const { server } = createGameServer(process.argv.includes('--foundation'));
await server.listen(Number(process.env.PORT ?? 2567), '127.0.0.1');
