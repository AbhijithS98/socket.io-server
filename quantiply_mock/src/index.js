import { pollResponses } from "./redis/responses.js";
import { sendJob } from "./redis/jobs.js";
import { TEST_JOBS } from "./testJobs.js";

// Start listening for responses
pollResponses();

// Example usage
(async () => {
  const job = TEST_JOBS[0];
  try {
    const response = await sendJob(
      job.client,
      job.endpoint,
      job.method,
      job.headers,
      job.payload
    );
    console.log(`🎉 Final Response:`, response);
  } catch (err) {
    console.error(`❌ Error:`, err.message);
  }
})();
