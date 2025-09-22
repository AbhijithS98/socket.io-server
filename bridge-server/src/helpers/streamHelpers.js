import { redis } from '../config/redisClient.js';
import { JOBS_STREAM, JOBS_GROUP, RESPONSES_STREAM, MAX_STREAM_LENGTH } from '../config/constants.js';
import { getClientSocket } from '../socket/clients.js';


// === Trim function  ===
export async function trimStream(streamName) {
  try {
    await redis.xTrim(streamName, 'MAXLEN', MAX_STREAM_LENGTH, { APPROXIMATED: true });
  } catch (err) {
    console.error(`❌ Failed trimming stream ${streamName}:`, err);
  }
}

export async function ensureGroups() {
  try {
    await redis.xGroupCreate(JOBS_STREAM, JOBS_GROUP, '0', { MKSTREAM: true });
    console.log(`Created group ${JOBS_GROUP}`);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('BUSYGROUP')) {
      // Group already exists → safe to ignore
      console.log(`Group ${JOBS_GROUP} already exists`);
    } else throw err;
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
  return redis.xAck(JOBS_STREAM, JOBS_GROUP, streamId);
}

// === Common reusable job processor ===
export async function processJob(message, consumerId, isReclaimed = false) {
  const job = JSON.parse(message.message.job);
  console.log(`📥 [${consumerId}] Got ${isReclaimed ? 'reclaimed' : 'new'} job:`, job);

  const { client, requestId } = job;
  const socket = getClientSocket(client);

  try {
    if (!socket) {
      console.warn(`⚠️ Skipping job ${requestId}: client ${client} not connected`);
      // Ack immediately to clean up this group's pending list
      await ackJob(message.id);
      return;
    }

    // forward job to client and include streamId for ack
    socket.emit('perform-job', { ...job, streamId: message.id });

    console.log(
      `➡️ Forwarded ${isReclaimed ? 'reclaimed ' : ''}job ${requestId} to client ${client}`,
    );
  } catch (err) {
    console.error('❌ Error forwarding job:', err);
    await addResponseToStream({ requestId, error: 'Error forwarding job' });
    await ackJob(message.id);
  }
}
