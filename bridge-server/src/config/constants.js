// === Instance identity ===
const INSTANCE_ID = process.env.INSTANCE_ID || process.pid;

// === Stream names (static) ===
export const JOBS_STREAM = 'jobsStream';
export const RESPONSES_STREAM = 'responsesStream';

// === Dynamic group name (unique per instance) ===
export const JOBS_GROUP = `jobsGroup-${INSTANCE_ID}`;

// === Dynamic consumer IDs (unique per process) ===
export function createConsumerId() {
  return `io-${Math.floor(Math.random() * 10000)}-${INSTANCE_ID}`;
}
