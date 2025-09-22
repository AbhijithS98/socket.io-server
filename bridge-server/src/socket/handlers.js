import { addResponseToStream, ackJob } from '../helpers/streamHelpers.js';
import { logger } from '../config/logger.js';

// Called when a client emits 'job-response'
export async function handleJobResponse(response) {
  try {
    // store raw response in responses stream
    await addResponseToStream(response);
    logger.info(`Stored response from client-${response.clientId} in stream`);
  } catch (err) {
    logger.error(`Failed to add response from client-${response.clientId} to stream: ${err.message}`, { stack: err.stack });
  }

  // If requestId and streamId exist, ack the original job
  if (response.requestId && response.streamId) {
    try {
      await ackJob(response.streamId);
    } catch (err) {
      logger.error(`Failed to ack job ${response.requestId}: ${err.message}`, { stack: err.stack });
    }
  } else {
    logger.warn(`Response for client ${response.clientId} missing requestId or streamId`);
  }
}
