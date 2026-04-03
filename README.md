# DBA

## Advanced DBA Features Implemented

### 1. Audit Log & Triggers
- Automatic MySQL triggers (\AFTER INSERT\, \AFTER UPDATE\, \AFTER DELETE\) attached to core tables.
- A centralized \udit_log\ table tracking the exact state changes (\old_value\ -> \
ew_value\).
- Frontend Audit Log viewer for administrators.

### 8. Query Analyzer / Slow Query Monitor
- Created a wrapper around Node MySQL queries to log execution time.
- Implemented \GET /query-logs\ and \GET /slow-queries\.
- Created \query-analyzer.html\ to display DB performance with Chart.js and manual arbitrary sql statements capability.
