# Slice 3: Task engine

Goal: Markpath can track multi-resource operations through valid state transitions, bind each approval to one resource/action, and retain an audit trail.

Done when: invalid transitions fail; task resources track independent status; approval for one action cannot authorize another; task completion requires every required resource to be verified; idempotent task creation is repeatable.

Files: task tables, state-machine and approval services, repositories, tests, and decision/progress logs.

Steps: add task-resource persistence; implement transitions and aggregate state; bind operations using a stable fingerprint; append audit activities; test all critical safety rules.

Tests: state transition, verified completion, idempotency, and approval-binding tests.

Risks / stubs: this slice records approvals but does not execute an external operation. GitHub/Figma executors must call this binding check in slice 5.
