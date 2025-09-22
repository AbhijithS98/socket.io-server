export const INSTANCE_ID = `QPY-${process.pid}`;
export const JOBS_STREAM = "jobsStream";
export const RESPONSES_STREAM = "responsesStream";
export const RESPONSES_GROUP = `responsesGroup-${INSTANCE_ID}`;
export const RESPONSES_CONSUMER = `${Math.floor(Math.random() * 10000)}-${INSTANCE_ID}`;
export const MAX_STREAM_LENGTH = 10000;