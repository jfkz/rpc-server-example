import 'dotenv/config';

import Link from 'grenache-nodejs-link';
import _ from 'lodash';
import { GRAPE_URI } from './lib/consts';
import { RPCServer } from './lib/rpcServer';
import { scenario2 } from './scenarios/scenarios';

const link = new Link({
  grape: GRAPE_URI,
});
link.start();

void (async () => {
  const server = await new RPCServer(link).start();
  console.info(`This port: ${server.port}`);
  setInterval(() => {
    server.refreshRPCList();
  }, 5000);

  /** Client 2 scenario */
  server.applyScenario(scenario2);
  await server.startAuction('2', 60);
})();

process.on('exit', (code) => {
  link.stop();
  console.info(`Process exited with code: ${code}`);
});
