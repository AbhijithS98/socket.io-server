import { redis } from '../config/redisClient.js';
import { JOBS_STREAM, JOBS_GROUP, RESPONSES_STREAM, RESPONSES_GROUP } from '../config/constants.js';

export async function ensureGroups() {
  try {
    await redis.xGroupCreate(JOBS_STREAM, JOBS_GROUP, '0', { MKSTREAM: true });
    console.log(`Created group ${JOBS_GROUP}`);
  } catch (err) {
    if ((err.message || '').includes('BUSYGROUP')) {
      console.log(`Group ${JOBS_GROUP} already exists`);
    } else throw err;
  }

  try {
    await redis.xGroupCreate(RESPONSES_STREAM, RESPONSES_GROUP, '0', {
      MKSTREAM: true,
    });
    console.log(`Created group ${RESPONSES_GROUP}`);
  } catch (err) {
    if ((err.message || '').includes('BUSYGROUP')) {
      console.log(`Group ${RESPONSES_GROUP} already exists`);
    } else throw err;
  }
}

export async function addResponseToStream(responseObj) {
  return redis.xAdd(RESPONSES_STREAM, '*', {
    response: JSON.stringify(responseObj),
  });
}

export async function ackJob(streamId) {
  return redis.xAck(JOBS_STREAM, JOBS_GROUP, streamId);
}
