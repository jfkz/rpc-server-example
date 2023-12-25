import 'dotenv/config';

import Link from 'grenache-nodejs-link';
import _ from 'lodash';
import { RPCServer } from './lib/rpcServer';
import { scenario3 } from './scenarios/scenarios';

const link = new Link({
  grape: process.env.GRAPE_URI,
});
link.start();

void (async () => {
  const server = await new RPCServer(link).start();
  console.info(`This port: ${server.port}`);
  setInterval(() => {
    server.refreshRPCList();
  }, 5000);

  /** Client 3 scenario */
  server.applyScenario(scenario3);
})();

process.on('exit', (code) => {
  link.stop();
  console.info(`Process exited with code: ${code}`);
});
