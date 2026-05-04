# Heartbeat — Everything Code augmentation

When the heartbeat skill kicks in, before exiting:

1. Check whether `everything_code__quality_gate` was run on the touched project this hour. If not, run it as part of step 7 (Update).
2. If a CI failure was recorded for this issue (`everything_code/build-failure` entity), prefer addressing it before any new feature work.
3. When closing a comment thread, check whether the thread contains a strong instinct candidate ("always", "never", "prefer"). If so, queue an `everything_code__instinct_extract` call.
