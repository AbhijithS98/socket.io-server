import { redis } from '../config/redisClient.js';
import {
  JOBS_STREAM,
  JOBS_GROUP,
  RESPONSES_STREAM,
  MAX_STREAM_LENGTH,
} from '../config/constants.js';
import { getClientSocket } from '../socket/clients.js';
import { logger } from '../config/logger.js';

// === Trim function  ===
export async function trimStream(streamName) {
  try {
    await redis.xTrim(streamName, 'MAXLEN', MAX_STREAM_LENGTH, { APPROXIMATED: true });
    logger.debug(`Trimmed stream ${streamName}`);
  } catch (err) {
    logger.error(`Failed trimming stream ${streamName}: ${err.message}`, { stack: err.stack });
  }
}

export async function ensureGroups() {
  try {
    await redis.xGroupCreate(JOBS_STREAM, JOBS_GROUP, '0', { MKSTREAM: true });
    logger.info(`Created group ${JOBS_GROUP}`);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('BUSYGROUP')) {
      // Group already exists → safe to ignore
      logger.debug(`Group ${JOBS_GROUP} already exists`);
    } else {
      logger.error(`Error creating group ${JOBS_GROUP}: ${err.message}`, { stack: err.stack });
      throw err;
    }
  }
}

export async function addResponseToStream(responseObj) {
  const id = await redis.xAdd(RESPONSES_STREAM, '*', {
    response: JSON.stringify(responseObj),
  });

  await trimStream(RESPONSES_STREAM);
  return id;
}

export async function ackJob(streamId) {
  try {
    const res = await redis.xAck(JOBS_STREAM, JOBS_GROUP, streamId);
    logger.debug(`Acked job with streamId: ${streamId}, result: ${res}`);
    return res;
  } catch (err) {
    logger.error(`Failed to ack job with streamId ${streamId}: ${err.message}`, { stack: err.stack });
    throw err;
  }
}

// === Common reusable job processor ===
export async function processJob(message, consumerId, isReclaimed = false) {
  let job;
  try {
    job = JSON.parse(message.message.job);
  } catch (err) {
    logger.error(`Failed to parse job message: ${err.message}`, { stack: err.stack });
    await ackJob(message.id);
    return;
  }

  logger.info(
    `[${consumerId}] Got ${isReclaimed ? 'reclaimed' : 'new'} job: ${JSON.stringify(job)}`,
  );

  const { client, requestId } = job;
  const socket = getClientSocket(client);

  try {
    if (!socket) {
      logger.warn(`Skipping job ${requestId}: client ${client} not connected`);
      // Ack immediately to clean up this group's pending list
      await ackJob(message.id);
      return;
    }

    // forward job to client and include streamId for ack
    socket.emit('perform-job', { ...job, streamId: message.id });

    logger.info(`Forwarded ${isReclaimed ? 'reclaimed ' : ''}job ${requestId} to client ${client}`);
  } catch (err) {
    logger.error(`Error forwarding job ${requestId}: ${err.message}`, { stack: err.stack });
    await addResponseToStream({ requestId, error: 'Error forwarding job' });
    await ackJob(message.id);
  }
}
