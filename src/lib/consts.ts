export const WORKER_NAME = 'bid_worker';
export const SUB_NAME = 'bid_pub';
export const enum ANNOUNCE_COMMANDS {
  'started' = 'started',
}
export const GRAPE_URI = process.env.GRAPE_URI || 'http://127.0.0.1:30001';
