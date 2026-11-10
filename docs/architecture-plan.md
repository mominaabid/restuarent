# Smoke & Char Platform — Architecture Plan

Frontend architecture plan for the restaurant management SaaS, split into two projects:

- **restaurant-website** — Next.js (App Router), Tailwind, GSAP. Public site + customer QR ordering.
- **restaurant-admin** — React + Vite, React Router, Tailwind. POS, KDS, admin dashboard.

Current phase: frontend only, no backend, no database — all data mocked/local, structured so swapping in a real API later is a small change, not a rewrite.

## Decisions locked in

- Migrate the existing `burger_web` repo into `restaurant-website` — it's the real start, not a throwaway.
- TypeScript for both new projects, so each project's local model types (§06) catch shape mistakes at build time even without a shared package.
- QR tables use a **rotating session token**, minted when staff open a seating in POS and invalidated on close-out.
- Multi-branch modeled from day one — every entity carries `branchId`, hardcoded to one default branch for now.
- Customers stay guest-only — no login, password, or account. But every QR order captures a **phone number**, used to look up-or-create a lightweight `Customer` record for repeat-visit reporting.
- Payments are bookkeeping-only — amount, method, tip. No gateway integration fields yet.
- Phone number is **required** to submit a QR order — validated before send-to-kitchen. Optional on POS (dine-in customers are already identified by table).
- **No shared package, for now.** `restaurant-website` and `restaurant-admin` are two fully independent, loosely-coupled projects — no workspace, no `shared/` folder, no cross-project import. A future customer-facing mobile app (scan → menu → order) is easier to bolt on later if the two web projects never depended on each other's tooling in the first place. Data-model shapes stay in sync by both following this document, not by importing shared code — see the revised §05.
- **UI direction:** light theme only, professional and compact. Dedicated pages for create/edit/payment flows instead of modals. One consistent internal component kit per project — see the new §12.
- **Role-based login, one admin project.** `restaurant-admin` already held both POS and KDS as routes in one app (§04) — that doesn't change. What's added: after login, `Staff.role` decides the landing view — `kitchen` → `/kds`, `cashier`/`manager`/`owner` → `/pos` (with `/admin/*` reachable for `manager`/`owner` only). One login, one app, role-gated routing — not three separate logins.
- **Workspace = sibling folders, not shared tooling.** `restaurant-admin` now lives at `../restaurant-admin`, next to this repo, under the same `Nexgen-projects` parent — purely so both are visible/editable together. This is not the npm/pnpm workspace idea ruled out in §05 — no shared `package.json`, no cross-project import, still two fully independent projects that happen to sit side by side on disk.

---

## 00. Framing

No shared backend and no monorepo tooling yet — two independently deployable frontends that need to agree on shapes, not on infrastructure.

| Project | Stack | Audience | Priorities |
|---|---|---|---|
| **Website** | Next.js App Router, Tailwind, GSAP | Public + customers scanning a table QR | SEO, mobile load speed, animation polish |
| **Admin** | React + Vite, React Router, Tailwind | Staff and owners, behind login | Dev/build speed, information density, real-time feel |

The current `burger_web` repo (plain JS/JSX, GSAP + Lenis, Tailwind 4) becomes the seed for **Website** rather than being discarded — its `CartContext`, `Menu`, `ProductDetail`, and `menuData` carry forward.

---

## 01. Module breakdown

Admin owns every write. Website only reads. That single-writer rule is what keeps the two projects' mock data from quietly diverging.

| Module | Responsibility | Project |
|---|---|---|
| Marketing site | Home, about, brand story, contact | Website |
| Menu browsing | Public catalog browsing, no table context | Website |
| QR ordering | Table-scoped live menu → cart → send order → track status | Website |
| POS | Order entry, table map, payment capture, receipts | Admin |
| KDS | Real-time incoming order queue, per-item status | Admin |
| Catalog management | Products, categories, availability, pricing | Admin |
| Inventory & purchasing | Stock levels, recipes, purchase orders, suppliers | Admin |
| Staff & shifts | Accounts, roles/permissions, clock in/out | Admin |
| Table management | Table list, statuses, QR generation per table | Admin |
| Reports & analytics | Sales, product performance, cost/margin, wastage | Admin |
| Settings | Restaurant profile, branch config, tax/currency | Admin |

---

## 02. Screens per module

### Website
- **Home** `/` — hero, featured items, CTA to menu/order
- **About** `/about`
- **Menu browse** `/menu` — category filter, search, availability badges
- **Product detail** `/menu/[id]` — images, description, add-to-cart
- **Cart** `/cart` — line items, quantity edit, totals
- **QR landing** `/t/[tableCode]` — resolves table, shows "You're ordering for Table X"
- **QR menu** `/t/[tableCode]/menu` — available items only, table context persists
- **QR cart / send to kitchen** `/t/[tableCode]/cart` — required phone field, submits an Order tied to the Table
- **Order tracking** `/t/[tableCode]/order/[orderId]` — received → preparing → ready → served

### Admin — POS
- **Login** `/login` — on success, redirects by `Staff.role`: `kitchen` → `/kds`, everyone else → `/pos`
- **Table map** `/pos` — grid of tables, status at a glance, open/close seating
- **Order builder** `/pos/table/:tableId` — category tabs, running ticket, modifiers, send-to-kitchen
- **Payment** `/pos/table/:tableId/payment` — split bill, method, tip, receipt print

### Admin — KDS
- **Kitchen queue** `/kds` — columns by status, per-item bump/complete, elapsed-time indicators

### Admin — Catalog, Inventory, Staff, Tables, Reports, Settings

Every create/edit flow below is its own route, not a modal — see §12. Only small, low-stakes confirmations (delete, void) stay as a lightweight confirm dialog.

- **Products** `/admin/products`, new at `/admin/products/new`, edit at `/admin/products/:id`; **Categories** `/admin/categories`, new at `/admin/categories/new`
- **Stock** `/admin/inventory/stock`; **Recipes** `/admin/inventory/recipes`, editor at `/admin/inventory/recipes/:productId`; **Purchases** `/admin/inventory/purchases`, new PO at `/admin/inventory/purchases/new`; **Suppliers** `/admin/inventory/suppliers`, new at `/admin/inventory/suppliers/new`
- **Staff** `/admin/staff`, new at `/admin/staff/new`, detail/shifts at `/admin/staff/:id`
- **Tables** `/admin/tables`, new at `/admin/tables/new` — generate/rotate QR codes on the table's own detail view, not a popup
- **Reports** `/admin/reports` plus one route per report — sales, product-performance, peak-hours, margins, table-turnover, wastage, repeat-customers
- **Settings** `/admin/settings`

---

## 03. Website folder structure (Next.js App Router)

Note for this project's Next version specifically: `middleware.js` is renamed `proxy.js` — relevant once table-session tokens need validating on the way in.

```
app/
  layout.js                        # root layout: fonts, globals.css
  page.js                          # home
  globals.css

  (marketing)/
    layout.jsx                     # Navbar, Footer, GSAP hero wrapper
    about/page.jsx

  (catalog)/
    layout.jsx                     # shares nav/footer via root; adds CartProvider
    menu/
      page.jsx                     # existing — public browse
      [id]/page.jsx                # existing — ProductDetail
    cart/page.jsx                  # existing — generic cart

  t/[tableCode]/
    layout.jsx                     # resolves table (server), TableSessionProvider,
                                    # persistent "Table X" banner
    page.jsx                       # QR landing → redirect to menu
    menu/page.jsx                  # scoped live menu, available items only
    cart/page.jsx                  # required phone field, "Send to Kitchen"
    order/[orderId]/page.jsx       # live status tracking

  api/                             # route handlers — stubbed, for a future backend proxy
  proxy.js                         # validates table session tokens, redirects stale QR links

components/
  cart/            CartSummary, CartItemRow, CartTotals
  catalog/         Menu.jsx, ProductCard, ProductDetail.jsx, CategoryFilter
  ordering/        TableBanner, PhoneCaptureField, OrderStatusTimeline
  layout/          Navbar.jsx, Footer.jsx, SmoothScroll.jsx
  marketing/       Hero.jsx, Testimonials.jsx

context/
  CartContext.jsx          # existing, moved out of components/
  TableSessionContext.jsx  # tableId, sessionToken, table status

lib/api/   products.ts · tables.ts · orders.ts · customers.ts
lib/       format.ts · constants.ts
mocks/     menuData.ts (moved, price becomes numeric) · tables.ts

types/     Product.ts · Order.ts · Table.ts · Customer.ts · … (local copy, see §05)
```

---

## 04. Admin folder structure (React + Vite)

Mirrors the website's `lib/api` shape deliberately — same mock-to-real pattern, different router.

```
src/
  main.jsx
  App.jsx                    # router shell + providers
  router.jsx

  pages/
    login/LoginPage.jsx
    pos/          TableMapPage · OrderBuilderPage · PaymentPage
    kds/          KitchenQueuePage
    admin/
      dashboard/  DashboardPage
      products/   ProductListPage · ProductEditorPage · CategoriesPage
      inventory/  StockPage · RecipesPage · PurchasesPage · SuppliersPage
      staff/      StaffListPage · StaffDetailPage
      tables/     TableListPage
      reports/    OverviewPage · SalesPage · ProductPerformancePage ·
                  PeakHoursPage · MarginsPage · TableTurnoverPage ·
                  WastagePage · RepeatCustomersPage
      settings/   SettingsPage

  components/
    ui/           Button, ConfirmDialog, DataTable, Toast, Sidebar, PageHeader, StatusPill
    pos/          TableGrid, TicketPanel, ItemGrid, ModifierPicker
    kds/          OrderCard, StatusColumn
    reports/      KpiTile, ChartWrapper

  context/
    AuthContext.jsx           # logged-in staff, role
    LiveOrdersStore.ts        # Zustand-style store (see §07)

  lib/api/        products.ts · orders.ts · tables.ts · inventory.ts · staff.ts · customers.ts · reports.ts
  lib/            eventBus.ts · format.ts
  mocks/          products.ts · tables.ts · orders.ts · inventory.ts · staff.ts

  types/          Product.ts · Order.ts · Table.ts · Customer.ts · … (local copy, see §05)
```

---

## 05. No shared package — two independent projects

Revised: skip the workspace/shared-package idea for now. `restaurant-website` and `restaurant-admin` are separate repos or separate top-level folders with **no dependency on each other** — separate `package.json`, separate `node_modules`, separate deploys, nothing imported across the boundary.

**Why the reversal:** a future native/PWA mobile app for customer QR scanning is already on the roadmap. If the website and admin were wired together through a shared workspace package now, that coupling has to be undone (or the mobile app has to join the same workspace) later. Keeping both projects fully independent today means a third client — the mobile app — can be added the same way either of these two was: as its own project, talking to whatever API exists, with no workspace plumbing to extend.

**How the model shapes stay in sync without shared code:** each project keeps its own local `types/` folder with its own copy of the interfaces in §06. This document is the source of truth both copies are written against — when a model changes, update it here first, then mirror the change into both projects' `types/`. It's manual duplication, on purpose, in exchange for zero cross-project coupling during the demo phase.

```
/restaurant-website
  src/types/        # Product, Order, Table, Customer, … — local copy
/restaurant-admin
  src/types/         # same shapes, same names, separate file
```

If this manual sync becomes painful once a backend and a mobile app are both in the picture, that's the point to revisit a shared package — not before.

---

## 06. Core data models

The reference shapes — mirrored by hand into each project's own local `types/` folder (see §05), not imported from anywhere shared. IDs are strings throughout — UUID-ready for a real backend. Every entity carries `branchId`. `OrderItem` snapshots price and name at time of sale and never re-reads the live `Product`.

```ts
interface Branch { id: string; name: string; address: string; timezone: string }

interface Category { id: string; branchId: string; name: string; sortOrder: number }

interface Product {
  id: string; branchId: string; categoryId: string
  name: string; description: string
  price: number            // numeric — not "$8.99"
  costPrice: number         // derived from Recipe, or overridden
  image: string
  isAvailable: boolean      // drives "available items only" on QR menu
  badge?: 'New' | 'Popular' | null
}

interface RecipeItem { inventoryItemId: string; quantity: number; unit: string }
interface Recipe { productId: string; items: RecipeItem[] }

interface InventoryItem {
  id: string; branchId: string; name: string; unit: string
  currentStock: number; parLevel: number; costPerUnit: number; supplierId?: string
}
interface Supplier { id: string; name: string; contactInfo: string }

interface Purchase {
  id: string; branchId: string; supplierId: string
  items: { inventoryItemId: string; quantity: number; unitCost: number }[]
  status: 'draft' | 'ordered' | 'received'
  orderedAt: string; receivedAt?: string
}

interface StockMovement {
  id: string; inventoryItemId: string; quantityDelta: number
  reason: 'sale' | 'purchase' | 'waste' | 'adjustment'
  orderId?: string; createdAt: string
}

interface Table {
  id: string; branchId: string; label: string
  qrCode: string
  sessionToken?: string     // minted on "open table", cleared on close-out
  status: 'empty' | 'occupied' | 'needs-bill'
}

interface Customer {                // identifier, not an account — no password/session
  id: string; branchId: string
  phone: string              // unique per branch, primary lookup key
  name?: string
  createdAt: string; lastOrderAt?: string
}

interface OrderItem {
  id: string; productId: string
  nameSnapshot: string; priceSnapshot: number
  quantity: number
  status: 'pending' | 'fired' | 'preparing' | 'ready' | 'served' | 'voided'
  notes?: string
}

interface Payment {
  id: string; amount: number
  method: 'cash' | 'card' | 'other'; tip?: number; paidAt: string
}

interface Order {
  id: string; branchId: string
  tableId?: string; customerId?: string    // resolved/created from phone
  source: 'pos' | 'qr'; staffId?: string
  items: OrderItem[]
  status: 'open' | 'sent' | 'preparing' | 'ready' | 'served' | 'closed' | 'cancelled'
  payments: Payment[]
  openedAt: string; closedAt?: string
}

interface Staff {
  id: string; branchId: string; name: string
  role: 'owner' | 'manager' | 'cashier' | 'kitchen'; pin: string
}
interface Shift { id: string; staffId: string; clockIn: string; clockOut?: string }
```

---

## 07. State management

### Website
- `CartContext` — already exists, client state, localStorage-persisted. Unchanged.
- `TableSessionContext` — new. Table id + session token, held in sessionStorage (survives refresh, not shared across tabs — matches one phone per customer).
- Product/menu data fetched in Server Components from `lib/api` — no context, just props.
- Everything else — accordions, form inputs, gallery selection — local `useState`.

### Admin
- `AuthContext` — logged-in staff and role, changes rarely, Context is fine here. Also owns the post-login redirect (`kitchen` → `/kds`, else → `/pos`) and gates `/admin/*` to `manager`/`owner`.
- Live order/table state (POS ↔ KDS) — a small external store (Zustand or similar) rather than Context, since updates are frequent and only specific components need them; Context here would cause broad re-renders across the dashboard.
- Forms, confirm dialogs, filters — local state.

**The pattern that actually matters:** every entity gets a `lib/api/<entity>.ts` module exposing async functions — `getProducts()`, `createOrder()` — that today read/write an in-memory or localStorage-backed mock, wrapped in a resolved promise. Components only ever call these functions, never touch mock data directly. Swapping to a real backend later means rewriting the inside of roughly ten files to use `fetch`, with zero changes to any component.

---

## 08. Real-time, mocked now

Needs real-time: KDS seeing new orders, table status in POS, low-stock alerts, customer order tracking.

- **Mockable today, same app (POS ↔ KDS):** a small pub/sub `eventBus.ts` that every mutating `lib/api` call publishes to after updating the mock store. Components subscribe in `useEffect`. This interface maps directly onto a future WebSocket handler — only the publish side changes later.
- **Cross-device within admin** (POS on one device, KDS on another, same origin): use the browser's `BroadcastChannel` API as the transport instead of an in-memory emitter — genuinely real same-origin real-time today.

**Not mockable without a backend:** the website (customer tracking) and admin (KDS/POS) are different origins with separate mock data. A customer's tracking page cannot reflect a real admin status change until there's a shared API. Treat that page as a stubbed/static UI until Phase 8 rather than polling against nothing.

---

## 09. Build order

| Phase | Title | Notes |
|---|---|---|
| 0 | Foundations | Finalize the data models in §06, mirror them into each project's local `types/`, establish the `lib/api` mock pattern in both projects independently, fix the price-as-string issue in the existing menu data, set up TypeScript. |
| 1 | Catalog — the data root | Product/Category mocked locally in each project per §06. POS, KDS, and the QR menu only read products, so they build in parallel against the mock dataset while Admin's product-editing UI comes alongside. |
| 2 | Tables, POS core, QR ordering | Table model with rotating session tokens, POS table map + order builder, website QR landing → scoped menu → send-to-kitchen with required phone capture. |
| 3 | KDS + real-time | Depends on Order/OrderItem from Phase 2. Build the event bus here, once POS is actually producing orders for KDS to consume. |
| 4 | Inventory | InventoryItem, Recipe, stock deduction wired to order fulfillment; Purchases and Suppliers. |
| 5 | Staff, shifts, roles | Auth and permission gating across POS and Admin. |
| 6 | Reports | Deliberately last — reports need realistic historical mock data from Phases 2–4 to be meaningfully testable. |
| 7 | Polish | SEO/metadata, animation pass on the website, offline-handling scaffolding, split bills, multi-branch UI. |
| 8 | Later — out of scope now | Real backend, AI forecasting and menu optimization. |

---

## 10. Reports & analytics

This is the product's actual sales pitch. The load-bearing design point: `OrderItem` must snapshot price and cost at time of sale, and `StockMovement` must log a reason on every deduction, from the first mock implementation — neither can be retrofitted onto historical data later.

| Report | Needs |
|---|---|
| Sales overview | `Order.openedAt/closedAt`, `OrderItem.priceSnapshot` |
| Best / worst performing products | `OrderItem.productId + priceSnapshot + quantity` aggregated per period |
| Category performance | Same, grouped by `Product.categoryId` |
| Peak hours / days | `Order.openedAt` timestamps |
| Food cost % / margin | `Recipe` → `InventoryItem.costPerUnit` rolled up vs `OrderItem.priceSnapshot` |
| Table turnover | `Order.tableId`, `openedAt` vs `closedAt` |
| Wastage | `StockMovement` rows with `reason: 'waste'` vs recipe-expected usage |
| Payment method breakdown | `Payment.method` across orders |
| Staff performance | `Order.staffId`, void counts |
| Inventory valuation / low stock | `InventoryItem.currentStock × costPerUnit` vs `parLevel` |
| Repeat customers | `Order.customerId` grouped over time — first-visit vs returning, spend per repeat customer |

---

## 11. Risks & decisions that are expensive to change later

- **Order modification after submission** — model status per `OrderItem`, not just per Order, with a `voided` state carrying a reason — needed for kitchen workflow and for reports to not count a voided item as lost revenue.
- **Split bills** — model as `Order.payments: Payment[]` rather than splitting the order itself — matches how POS systems actually reconcile.
- **Offline POS** — route all POS writes through the single `lib/api` mutation layer now, so that if offline-first sync becomes a real requirement, only that layer changes. True offline support is a significant scope increase — worth deciding as hard-requirement-or-not before backend selection.
- **Stock deduction timing** — deduct on kitchen "fired," not on placement or completion — balances overselling risk against accuracy; reconcile drift via periodic counts logged as `adjustment` movements.
- **Price/cost snapshot discipline** — reports never re-read live `Product.price` — always `OrderItem.priceSnapshot`. Same for cost.
- **Numeric pricing** — the existing `menuData.js` stores price as `"$8.99"` and `CartContext.jsx` regexes it back into a number — fix before more logic depends on the string format.
- **Catalog single source of truth** — admin owns writes, website only reads — settled now so the two mock catalogs never need manual syncing.

---

## 12. UI/UX direction

Demo-ready and professional, not a stitched-together set of screens. Applies to both projects independently — each gets its own internal component kit, but the *feel* should be consistent within each.

**Light theme only, for now.** No dark-mode toggle in this phase — one polished light palette per project, admin skewing neutral/utilitarian, website allowed a bit more warmth (see the CartContext `"smoke-and-char"` branding already in the repo). Don't spend demo time building a second theme nobody asked for yet.

**Pages, not modals.** Every create/edit/payment flow gets its own route (already reflected in §02's admin routes above): new product, new purchase order, recipe editor, table QR management, POS payment/split-bill. This matches how real POS/back-office software behaves (Toast, Square, Lightspeed all navigate, they don't stack dialogs), keeps browser back/forward working, and avoids the trapped-in-a-dialog feel. Reserve modals for genuinely small, low-stakes confirmations only — "delete this product?", "void this item?" — never for a form with more than 2–3 fields.

**Compact, information-dense layout.** No large marketing-style whitespace in the admin project — POS, KDS, and reports need to show a lot at a glance (a table map, a kitchen queue, a data table of products). Tight paddings, small consistent gaps, small type scale for dense tables, comfortable but not generous line-height. The website can breathe a little more since it's customer-facing, but "compact and professional" beats "airy and spacious" in both.

**One consistent UI kit per project.** `components/ui/` in each project (Button, Input, Select, Table, StatusPill, PageHeader, Toast) gets built once and reused everywhere — POS, KDS, and every admin screen share the same primitives so they read as one product. Same discipline on the website: one set of primitives shared by marketing pages, menu, cart, and the QR ordering flow.

**Status as color + shape, not just text.** Order status, table status, and stock-level warnings use a small consistent set of status pills/badges (e.g. `open` / `preparing` / `ready` / `served`, `empty` / `occupied` / `needs-bill`, `low-stock`) — same colors and shapes everywhere they appear, so a glance at KDS and a glance at the table map read the same visual language.

---

## 13. Execution phases (revised)

§09 above is the module-dependency ordering; this is the actual phase count we're executing against. Six phases, with phases 1–3 being the meaningful demo milestone — a customer order that a kitchen actually sees and completes — well before reports or polish.

| # | Phase | Delivers |
|---|---|---|
| 1 | Website foundations + QR ordering | TypeScript, `types/`, `lib/api` mock layer, customer browses menu → scans table → orders |
| 2 | Admin foundations + POS | Scaffold `restaurant-admin`, role-based login → `/pos` or `/kds`, table map, order builder, payment |
| 3 | KDS + real-time | Kitchen queue (same project, role-gated), event bus so POS → KDS updates live |
| 4 | Inventory & recipes | Stock, purchases, suppliers, recipe-based deduction tied to orders |
| 5 | Staff/shifts + Reports | Full role permissions, all report screens |
| 6 | Polish | SEO/animation on website, split bills, offline scaffolding, multi-branch UI |

---

*Smoke & Char — architecture plan, frontend phase — 2026-09-15*
