export const JOBS_GROUP = 'jobsGroup';
export const JOBS_STREAM = 'jobsStream';
export const RESPONSES_GROUP = 'responsesGroup';
export const RESPONSES_STREAM = 'responsesStream';

export function createConsumerId() {
  return `io-${Math.floor(Math.random() * 10000)}`;
}
