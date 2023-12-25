import 'dotenv/config';

import Link from 'grenache-nodejs-link';
import _ from 'lodash';
import { timeout } from './lib/common';
import { GRAPE_URI } from './lib/consts';
import { RPCServer } from './lib/rpcServer';

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

  /** Client 1 scenario */
  await timeout(20000);
  await server.startAuction('1', 75);
})();

process.on('exit', (code) => {
  link.stop();
  console.info(`Process exited with code: ${code}`);
});
