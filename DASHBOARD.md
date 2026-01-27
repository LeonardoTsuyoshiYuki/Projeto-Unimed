# Dashboard API Contract & KPIs

## Overview
The dashboard provides administrative insights into the credentialing process.

## Metrics (KPIs)

| Metric | Description | Source |
|Text|Text|Text|
| **Total Conversions** | Total number of professionals in the system | `Count(Professional)` |
| **Pending Review** | Number of professionals waiting for analysis | `Count(status='PENDING')` |
| **Efficiency** | Average time from submission to approval | `Avg(last_status_update - submission_date)` |

## API Contract

### `GET /api/dashboard/`

**Response Example:**
```json
{
  "kpis": {
    "total": 152,
    "pending": 45,
    "efficiency_days": 3.4
  },
  "status_counts": [
    { "status": "PENDING", "count": 45 },
    { "status": "APPROVED", "count": 100 },
    { "status": "REJECTED", "count": 5 },
    { "status": "ADJUSTMENT_REQUESTED", "count": 2 }
  ],
  "yearly_variation": [
    { "month": "2023-01-01", "count": 12 },
    { "month": "2023-02-01", "count": 15 },
    ...
  ]
}
```

## Visualization Plan
1. **KPI Cards**: Top row, immediate numbers.
2. **Line Chart**: "Yearly Variation" - Trends of incoming submissions.
3. **Pie/Donut Chart**: "Status Distribution" - Workload snapshot.
