// @ts-nocheck — bundled by wrangler, not by Next; `.open-next/worker.js` exists only after `npm run cf:build`.
/**
 * Custom Worker entry wrapping OpenNext's generated handler to add a scheduled
 * job: once a day it checks every registry entry's documentation and website
 * and stores the snapshot in KV, served at /api/v1/status.
 *
 * The Durable Object classes OpenNext exports must be re-exported from here.
 */
import { default as handler } from "./.open-next/worker.js";
import { rankedSolutions } from "./data/solutions";
import { runLivenessChecks } from "./lib/liveness";

export default {
  fetch: handler.fetch,

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      runLivenessChecks(rankedSolutions).then((snapshot) =>
        env.LIVENESS.put("liveness:latest", JSON.stringify(snapshot)),
      ),
    );
  },
};

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
