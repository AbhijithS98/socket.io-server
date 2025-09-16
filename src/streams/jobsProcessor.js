import { redis } from '../config/redisClient.js';
import { JOBS_GROUP, JOBS_STREAM } from '../config/constants.js';
import { processJob} from '../helpers/streamHelpers.js';

const MIN_IDLE_TIME = 60000; // 60s → jobs older than this can be reclaimed
const RECLAIM_COUNT = 10;    // no. of jobs reclaim at once

let running = true;

// Main polling loop for new jobs 
export async function pollJobs(consumerId) {
  console.log('Starting pollJobs with consumer:', consumerId);

  while (running) {
    try {
      const jobs = await redis.xReadGroup(JOBS_GROUP, consumerId, [{ key: JOBS_STREAM, id: '>' }], {
        BLOCK: 5000,
        COUNT: 1,
      });
      if (!jobs) continue;

      for (const stream of jobs) {
        for (const message of stream.messages) { 
          await processJob(message, consumerId, false);
        }
      }
    } catch (err) {
      console.error('pollJobs error:', err);
      await new Promise((r) => setTimeout(r, 1000)); // avoid hot loop
    }
  }
}

export function stopJobsProcessor() {
  running = false;
}


// === Reclaim stuck jobs ===
export async function reclaimStuckJobs(consumerId) {
  try {
    const result = await redis.xAutoClaim(
      JOBS_STREAM,
      JOBS_GROUP,
      consumerId,
      MIN_IDLE_TIME,
      '0-0',
      { COUNT: RECLAIM_COUNT }
    );

    // Redis client returns object: { nextStartId, messages }
    const nextId = result.nextStartId;
    const reclaimed = result.messages || [];

    if (reclaimed.length > 0) {
      console.log(`-> [${consumerId}] Reclaimed ${reclaimed.length} stuck jobs`);

      for (const msg of reclaimed) {
        await processJob(msg, consumerId, true); // true = isReclaimed
      }
    }
  } catch (err) {
    console.error('reclaimStuckJobs error:', err);
  }
}
