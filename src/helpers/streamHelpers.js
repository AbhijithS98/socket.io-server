import { redis } from '../config/redisClient.js';
import { JOBS_STREAM, JOBS_GROUP, RESPONSES_STREAM, RESPONSES_GROUP } from '../config/constants.js';
import { getClientSocket } from '../socket/clients.js';

let ioInstance = null;
export function setIoInstance(i) {
  ioInstance = i;
}

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

// === Common reusable job processor ===
export async function processJob(message, consumerId, isReclaimed = false) {
  const job = JSON.parse(message.message.job);
  console.log(`📥 [${consumerId}] Got ${isReclaimed ? 'reclaimed' : 'new'} job:`, job);

  const { client, requestId } = job;
  // const socket = getClientSocket(client);

  if (!ioInstance) {
    console.error('❌ Socket.IO instance not set yet');
    await addResponseToStream({ requestId, error: 'Socket.IO not initialized' });
    await ackJob(message.id);
    return;
  }

  try {
    // Check presence cluster-wide
    const sockets = await ioInstance.in(client).allSockets();
    if (!sockets || sockets.size === 0) {
      console.error(`❌ Client ${client} not connected`);
      await addResponseToStream({
        requestId,
        error: isReclaimed ? 'Client not connected (reclaimed)' : 'Client not connected',
      });
      await ackJob(message.id);
      return;
    }

    // deliver to the client's room (adapter will route to correct server)
    ioInstance.to(client).emit('perform-job', { ...job, streamId: message.id });

    console.log(
      `➡️ Forwarded ${isReclaimed ? 'reclaimed ' : ''}job ${requestId} to client ${client}`,
    );
  } catch (err) {
    console.error('❌ Error forwarding job:', err);
    await addResponseToStream({ requestId, error: 'Error forwarding job' });
    await ackJob(message.id);
  }
}
