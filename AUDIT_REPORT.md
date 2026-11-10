# Smoke & Char Restaurant System — End-to-End Audit Report

**Audit date:** 2026-10-04  
**Scope:** Customer web app, admin app, mobile app, Django backend, and the integrated restaurant workflows requested for this audit.  
**Audit mode:** Verification only. No production behavior or application code was changed during this audit.

## 1. Overall status

**FAIL — needs fixes before further end-to-end testing.**

Two backend tests demonstrate defects in public QR geofence validation and closed-table session-token handling. The admin app build also fails TypeScript checking, and customer-app lint fails. Most complete staff/customer workflows could not be exercised in this environment, and real-device GPS testing was unavailable.

### Evidence levels

- **Code inspected:** Yes.
- **Automated tests:** Yes; results below, including failures.
- **UI tested:** Partial. Local services were started and the customer and admin app URLs responded, but complete authenticated workflows were not completed.
- **Real device tested:** No.
- **Production/deployed environment tested:** No.
- **Application code changed:** No.

## 2. Test summary

The prior audit tracked the 22 requested major requirement groups as follows:

| Result | Count |
|---|---:|
| Passed | 3 |
| Failed | 2 |
| Blocked | 16 |
| Skipped | 1 |
| **Total** | **22** |

These are group-level outcomes, not a count of individual assertions. “Passed” is limited to the checks described in this report; it does not imply that every subtest in a requirement group passed.

## 3. Critical and high-severity findings

### Finding 1 — QR order accepts missing or stale GPS

- **Feature:** Public customer QR order geofence validation
- **Severity:** Critical
- **Reproduction:** Submit a QR order through the public order flow with missing location data or a stale `location_timestamp`.
- **Expected:** Reject the request (the failing test expects HTTP 400) and create no order.
- **Actual:** The request returned HTTP 201 in the failing test; invalid/missing GPS was not rejected.
- **Surface:** Backend API and resulting database state.
- **Relevant files:** [orders/views.py](../restaurant-backend/orders/views.py), [common/geofence.py](../restaurant-backend/common/geofence.py), [tables/tests.py](../restaurant-backend/tables/tests.py)
- **Evidence:** `test_geofence_rejects_missing_or_stale_customer_gps` failed with `AssertionError: 201 != 400`.
- **Code-path observation:** The public order view replaces the supplied location timestamp with the current time before validation, defeating the stale-timestamp check. No fix was made during this audit.

### Finding 2 — Closed table’s old session token still resolves

- **Feature:** Customer table-session/realtime access
- **Severity:** High
- **Reproduction:** Capture a table session token, close the table, then resolve/use the old token through the realtime table-session consumer path.
- **Expected:** A closed table’s old token should not resolve to an active table.
- **Actual:** The test resolver returned table id `1` rather than `None`.
- **Surface:** Backend session/API behavior and database-backed table state.
- **Relevant files:** [realtime/consumers.py](../restaurant-backend/realtime/consumers.py), [tables/models.py](../restaurant-backend/tables/models.py), [realtime/tests.py](../restaurant-backend/realtime/tests.py)
- **Evidence:** `test_a_closed_tables_old_token_resolves_to_none` failed with `AssertionError: 1 is not None`.
- **Code-path observation:** The close flow leaves the session token available, while the consumer’s lookup does not reject the table based on its closed/empty state. No fix was made during this audit.

## 4. GPS test result

| Check | Result |
|---|---|
| Real device used | No; no physical phone/GPS device was available |
| Location permission | Not tested |
| Coordinates received from device | Not tested |
| Device accuracy/timestamp | Not tested |
| Configured 2 m radius end-to-end | Not verified on a real device |
| Inside-radius device result | Not tested |
| Outside-radius device result | Not tested |
| Location-off result | Not tested |
| Permission-denied result | Not tested |
| Backend rejection of missing/stale location | **No** — automated test shows the request was accepted |
| Customer-facing exposure of exact branch coordinates | Source inspection found no unnecessary exposure in the unauthenticated customer API path reviewed; not a complete API security audit |

The required physical GPS test was not performed. The failed backend test is separate evidence that the public order path accepted missing/stale location data under the test case; it does not establish how a real device’s valid location would behave.

## 5. Complete order flow

| Stage | Result |
|---|---|
| Admin/manager configures branch location and radius | Not completed end-to-end |
| Create table and generate/print QR | Not completed end-to-end |
| Scan QR on a physical phone and preserve table context | Not tested |
| Customer cart and order submission | Not completed end-to-end |
| Cashier review and waiter assignment | Not completed end-to-end |
| Waiter confirmation and kitchen handoff | Not completed end-to-end |
| Kitchen preparation/ready flow | Not completed end-to-end |
| Stock deduction at dispatch | Code path inspected; full workflow and database delta not verified |
| Payment and payment idempotency | Not completed end-to-end |
| KOT and customer receipt printing | Not tested |
| Explicit table release and new-order behavior | Not completed end-to-end |
| Sales report reconciliation | Not completed end-to-end |

The backend, admin app, and customer app were started locally during the audit. Backend login/API checks were exercised, and the customer app at `localhost:3000` and admin app at `localhost:5173` were available. This is not evidence that the full workflow above passed.

## 6. Inventory, recipe, and availability

| Requirement | Result |
|---|---|
| Product recipe and ingredient branch ownership | Partially inspected; not fully validated through UI and database |
| Missing recipe is unsaleable | Not fully exercised end-to-end |
| Zero, insufficient, negative, and sufficient stock cases | Not fully exercised end-to-end |
| Multiple ingredients with one insufficient | Not fully exercised end-to-end |
| Availability consistency across menu, cashier, waiter, and direct API | Not fully verified |
| Stock deduction equals recipe quantity × ordered quantity | Code path inspected; no complete order/database-delta verification |
| Concurrent dispatch cannot oversell | Not verified with a concurrency test |
| Stock restoration restores availability | Not fully verified |
| Cashier/waiter inventory restrictions | Permission code was not exhaustively tested via role-authenticated direct API calls |
| Branch isolation | Not fully validated end-to-end |

## 7. Payment and reports

Cash, card, tips, split payments, duplicate payment retries, receipt totals, payment history, and sales-report totals were **not** verified through a complete UI/API/database flow. Paid-only reporting, payment-method amounts, date filters, and branch isolation remain unverified.

## 8. Role and API security

- Initial backend authentication/API checks were performed; valid staff authentication and an authorized branch fetch worked.
- No unauthorized access was confirmed in the limited checks executed.
- A complete Admin/Manager/Cashier/Waiter/Kitchen/Customer permission matrix was **not** run.
- Direct API attempts for every prohibited endpoint, cross-branch ID changes, unrelated waiter orders, table IDs, and order IDs were not exhaustively tested.
- Therefore, the role matrix is **incomplete**, not passed.
- The stale table-session finding is a confirmed access-control/session-integrity concern.

## 9. Realtime, notifications, and history

| Check | Result |
|---|---|
| Role-targeted notification delivery | Not fully tested |
| Bell/unread count/toast/sound | Not tested end-to-end |
| Notification click-through and read-state persistence | Not tested |
| Reconnect/refresh resynchronization | Not tested |
| Duplicate notification prevention | Not tested |
| Cross-role relevance | Not fully tested |
| OrderHistory and database consistency across workflow | Not fully verified |

The stale table token finding applies to the customer table-session/realtime path. Staff notification behavior across cashier, waiter, kitchen, and admin sessions remains unverified.

## 10. Regression checks

### Django backend

Command used:

```powershell
Set-Location 'C:\Users\momina\Documents\GitHub\Nexgen-projects\restaurant-backend'
$env:DATABASE_URL='sqlite:///:memory:'
.\venv\Scripts\python.exe manage.py test --verbosity 1
```

Result:

- **97 tests run**
- **95 passed**
- **2 failed**
- **1 skipped**
- Runtime reported: **274.670 seconds**
- Overall: `FAILED (failures=2, skipped=1)`

Failures:

- `realtime.tests.test_a_closed_tables_old_token_resolves_to_none`
- `tables.tests.test_geofence_rejects_missing_or_stale_customer_gps`

Django system checks and migration consistency checks passed using the isolated test configuration. The default test database setup also encountered an existing Neon test-database conflict; the test suite was run against in-memory SQLite to avoid modifying that database.

### Admin app

Command:

```powershell
Set-Location 'C:\Users\momina\Documents\GitHub\Nexgen-projects\restaurant-admin'
npm run build
```

Result: **Failed** during TypeScript checking.

Reported issues:

- Product mock objects omit required `isOrderable`: [src/mocks/products.ts](../restaurant-admin/src/mocks/products.ts)
- Translation key type mismatch in the Sales page: [src/pages/admin/reports/SalesPage.tsx](../restaurant-admin/src/pages/admin/reports/SalesPage.tsx)

Admin RTL/locale validation passed.

### Customer web app

- Production build: **Passed**.
- ESLint command: `npx eslint app components context lib types`
- ESLint result: **Failed** due to a `setState`-inside-effect pattern in [components/SmoothScroll.jsx](components/SmoothScroll.jsx).

### Mobile app

Mobile TypeScript validation was not completed in the recorded audit results.

## 11. Remaining issues and limits

Confirmed:

1. Public QR order accepts missing/stale GPS under the failing automated test.
2. A closed table’s old session token still resolves under the failing automated test.
3. Admin TypeScript build fails.
4. Customer app lint fails.

Not completed:

- Real phone GPS/geofence acceptance and rejection tests.
- Full role-by-role UI and direct API security matrix.
- Full order-to-payment-to-release-to-report lifecycle with database verification.
- Multi-device realtime, notification, reconnect, and duplicate-event tests.
- Mobile TypeScript validation and deployed/production testing.

## 12. Final recommendation

**Needs fixes before further end-to-end testing.**

The audit verified two backend failures and frontend validation failures. The rest of the requested system-level workflow is incomplete or blocked and must not be represented as passed. No fixes were applied as part of this report.
