import { addResponseToStream, ackJob } from "../helpers/streamHelpers.js";

// Called when a client emits 'job-response'
export async function handleJobResponse(response) {
  try {
    // store raw response in responses stream
    await addResponseToStream(response);
    console.log(
      `📤 Stored response from client-${response.clientId} in stream`
    );
  } catch (err) {
    console.error("❌ Failed to add response to stream", err);
  }

  // If requestId and streamId exist, ack the original job
  if (response.requestId && response.streamId) {
    try {
      await ackJob(response.streamId);
      console.log(`✅ Acked job ${response.requestId}`);
    } catch (err) {
      console.error("❌ Failed to ack job:", err);
    }
  }
}
