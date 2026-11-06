export const taskStates = ["RECEIVED", "ASSESSING", "AUDITING", "PLAN_READY", "AWAITING_APPROVAL", "APPROVED", "IMPLEMENTING", "VERIFYING", "COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "REJECTED"] as const;
export type TaskState = (typeof taskStates)[number];

const transitions: Record<TaskState, readonly TaskState[]> = {
  RECEIVED: ["ASSESSING", "FAILED"],
  ASSESSING: ["AUDITING", "PLAN_READY", "FAILED"],
  AUDITING: ["PLAN_READY", "FAILED"],
  PLAN_READY: ["AWAITING_APPROVAL", "REJECTED", "FAILED"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED", "FAILED"],
  APPROVED: ["IMPLEMENTING", "FAILED"],
  IMPLEMENTING: ["VERIFYING", "PARTIALLY_COMPLETED", "FAILED"],
  VERIFYING: ["COMPLETED", "PARTIALLY_COMPLETED", "FAILED"],
  COMPLETED: [], PARTIALLY_COMPLETED: [], FAILED: [], REJECTED: []
};

export function canTransition(from: TaskState, to: TaskState) { return transitions[from].includes(to); }
export function assertTransition(from: TaskState, to: TaskState) {
  if (!canTransition(from, to)) throw new Error(`Invalid task transition: ${from} → ${to}.`);
}
