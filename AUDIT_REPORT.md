# AK Uniforms — Complete Application Audit Report

**Audit date:** 2026-06-30
**Auditor:** Automated code + database review
**Project:** AK Uniforms — Uniform Cloth Ordering Portal
**Stack:** React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + Supabase (Postgres + Storage + Edge Functions)

---

## 1. Project Overview

### Purpose
A customer-facing ordering portal for **AK Uniforms**, a business that sells uniform cloth (material only — no stitching) to college students. Customers place orders online with **Cash on Delivery** and pick them up on campus. An admin panel lets the owner manage orders, products, settings, and view statistics.

### Target users
| User type | Role | Access |
|---|---|---|
| College students | Customer (anonymous) | Browse products, place orders, track orders, leave feedback |
| Business owner | Admin (single shared password) | Full CRUD on orders/products/settings, CSV export, stats |

### Main features
- Product catalog with stock levels and images
- Multi-step order flow: student details → product selection → review → confirmation
- Cash-on-delivery ordering with WhatsApp notification to the owner
- Order tracking by Order ID
- Customer feedback/reviews with star ratings
- Admin dashboard: order management, product management (price/stock/image), statistics, CSV export, logo upload, Google Sheets sync, "clear all orders"
- Edge function for email notifications (Resend) and Google Sheets sync

### Business workflow
1. Student fills name/phone/department/year → selects cloth items → reviews → confirms.
2. Order is inserted into `orders` + `order_items`; a WhatsApp message opens to the owner; (optionally) syncs to Google Sheets.
3. Owner opens Admin panel (password-gated), sees new-order badge, updates status (Received → Processing → Ready → Delivered, or Cancelled).
4. Student tracks status by Order ID; after delivery, can submit a review.

---

## 2. Frontend Analysis

### Framework and libraries
| Dependency | Version | Purpose |
|---|---|---|
| react / react-dom | ^18.3.1 | UI framework |
| @supabase/supabase-js | ^2.57.4 | Backend client (DB + Storage) |
| lucide-react | ^0.344.0 | Icons |
| vite | ^5.4.2 | Build tool / dev server |
| tailwindcss | ^3.4.1 | Styling |
| typescript | ^5.5.3 | Type safety |

No router (react-router etc.), no state library, no form library, no query/cache library. All state is hand-rolled with `useState`/`useEffect`.

### Component structure
```
src/
├── App.tsx                  # Root: hand-rolled page switcher + global state
├── main.tsx                 # React entry
├── index.css                # Tailwind + custom utilities
├── lib/supabase.ts          # Supabase client (anon key)
├── types/index.ts           # Shared TS interfaces
├── components/
│   ├── Navbar.tsx           # Top nav, mobile menu
│   ├── Footer.tsx           # Contact + quick links
│   └── Logo.tsx             # Logo (fetches logo_url from site_settings)
└── pages/
    ├── HomePage.tsx          # Hero, features, reviews, contact
    ├── StudentDetailsPage.tsx# Step 1: customer details form
    ├── ProductsPage.tsx      # Step 2: product selection / cart
    ├── OrderReviewPage.tsx   # Step 3: review + submit order
    ├── OrderConfirmationPage.tsx
    ├── TrackOrderPage.tsx    # Track by Order ID
    ├── FeedbackPage.tsx      # Submit review (requires delivered order)
    ├── AdminLoginPage.tsx    # Password gate
    └── AdminPage.tsx         # Dashboard (orders/products/stats/settings)
```

### Routing architecture
**No router.** `App.tsx` uses `useState<Page>` and a `switch` block (`renderPage()`). Navigation is via `handleNavigate(page)` callbacks passed through props. Consequences:
- No URL changes → no deep linking, no back/forward, no shareable URLs, refresh loses state.
- `window.scrollTo(0,0)` is the only "history" behavior.
- SEO is effectively impossible (single URL, client-rendered).

### State management
All global state lives in `App.tsx` via `useState`:
- `currentPage`, `customerDetails`, `cartItems`, `confirmedOrderId`, `isAdminLoggedIn`, `adminLoginError`, `newOrdersCount`.
- State is drilled via props to pages. No Context, no store.
- `newOrdersCount` is computed in `App` but never actually fetched (always 0) — the real fetch happens inside `AdminPage`. The navbar badge is therefore dead.

### Responsive design implementation
- Tailwind responsive breakpoints used throughout (`sm:`, `md:`, `lg:`).
- Mobile hamburger menu in Navbar.
- Grid layouts collapse from multi-column to single-column on mobile.
- Generally solid responsive coverage. No obvious overflow issues.

### Performance issues
| Issue | Location | Severity |
|---|---|---|
| **N+1 query**: admin fetches all orders, then per-order fetches items in a `Promise.all` of separate queries | `AdminPage.tsx:216-225` | High |
| **Duplicate product fetch**: `ProductsPage` and `OrderReviewPage` both independently fetch the full product list | `ProductsPage.tsx:21`, `OrderReviewPage.tsx:23` | Medium |
| **Reviews fetched twice**: one query for displayed reviews, then a second query for *all* ratings to compute average | `HomePage.tsx:36-55` | Low |
| **No caching**: every navigation re-fetches data; no SWR/React Query | All pages | Medium |
| **`lucide-react` excluded from optimizeDeps** | `vite.config.ts:8` | Low (slower dev cold start) |
| **Logo component fetches `site_settings` on every mount** (Navbar, Footer, HomePage hero all render `<Logo>`) | `Logo.tsx:13-31` | Medium (3+ duplicate queries per page) |
| **Polling every 30s** for new orders while admin tab open | `AdminPage.tsx:65` | Low |
| **No code splitting / lazy loading** — entire app in one bundle | `App.tsx` imports all pages eagerly | Medium |

### Accessibility issues
| Issue | Location |
|---|---|
| Modal dialogs (`HomePage` payment notice, `AdminPage` clear-orders confirm) have no focus trap, no `role="dialog"`, no `aria-modal`, no Escape-to-close | `HomePage.tsx:88`, `AdminPage.tsx:656` |
| Star-rating buttons in FeedbackPage have no `aria-label` | `FeedbackPage.tsx:173-190` |
| Icon-only buttons (copy, remove image, edit) rely on `title` only or nothing | `OrderConfirmationPage.tsx:46`, `AdminPage.tsx:884-908` |
| Color contrast: gray-500 text on dark-950 may fail WCAG AA in several places | multiple |
| Form inputs use `<label>` but lack `htmlFor`/`id` association | `StudentDetailsPage.tsx`, `AdminLoginPage.tsx` |
| No skip-to-content link | `App.tsx` |
| `select` elements have no accessible label association | multiple |

---

## 3. Backend Analysis

### API architecture
There is **no custom REST API**. The frontend talks directly to Supabase:
- **Postgres** via `@supabase/supabase-js` (anon key, RLS-enforced).
- **Storage** via `supabase.storage.from('product-images')`.
- **Edge Function** `send-order-notification` (Deno) — intended for email/Sheets sync, but **never invoked by the frontend** (see Dead Code).

### Database structure
5 tables in `public` schema (all RLS-enabled):

| Table | Rows | Purpose |
|---|---|---|
| `products` | 3 | Cloth items (name, price, meters_per_unit, stock, image_url, is_active) |
| `orders` | 2 | Customer orders (order_id AK001, status, total, payment fields) |
| `order_items` | 4 | Line items per order |
| `reviews` | 0 | Customer feedback (rating 1-5, comment, is_displayed) |
| `site_settings` | 8 | Key-value config (logo_url, site_name, google_sheets_webhook_url, …) |

Relationships:
```
products 1───∞ order_items ∞───1 orders 1───∞ reviews
```
- `order_items.order_id` → `orders.id` (ON DELETE CASCADE)
- `order_items.product_id` → `products.id` (no cascade — **orphan risk**)
- `reviews.order_id` → `orders.id` (ON DELETE CASCADE)

### Authentication system
**There is no Supabase Auth.** The admin "auth" is a **hardcoded plaintext password** compared in the browser:
```ts
// src/App.tsx:15
const ADMIN_PASSWORD = 'ak@uniforms@61';
```
- Visible in the client bundle to anyone.
- `isAdminLoggedIn` is client-only `useState` — trivially bypassed.
- No session, no token, no expiry.

### Authorization and permissions
**None.** All RLS policies are scoped to `public` (anon + authenticated share the same open policies). There is no role distinction between customer and admin at the database level. See §6 for details.

### File storage implementation
- Single public bucket `product-images` (public read).
- Used for product images and the site logo (stored under `products/` and `site/` prefixes).
- Uploads happen **directly from the browser** using the anon key — no auth gate.

### Edge functions
| Slug | Status | verifyJWT | Invoked by frontend? |
|---|---|---|---|
| `send-order-notification` | ACTIVE | false | **No** — dead code |

The function is fully written (Resend email + Google Sheets sync) but `OrderReviewPage.handleSubmitOrder` never calls it. The frontend instead does its own client-side `fetch` to Google Sheets and opens WhatsApp via `window.open`.

---

## 4. Database Audit

### All tables
(see §3)

### Relationships
(see §3 diagram)

### Unused tables or columns
| Object | Status | Evidence |
|---|---|---|
| `orders.payment_screenshot_url` | **Unused** — added by migration 005 but no UI writes/reads it | not referenced in any `.tsx` |
| `orders.payment_status` | **Unused** | default `'Waiting for Payment Screenshot'`, never queried |
| `orders.advance_payment_amount` | **Unused** | default 20, never read |
| `orders.payment_uploaded_at` | **Unused** | never written |
| `orders.payment_verified_at` | **Unused** | never written |
| `orders.payment_verified_by` | **Unused** | never written |
| `site_settings` rows beyond `logo_url` / `google_sheets_webhook_url` | 8 rows exist; only 2 keys used by UI | `AdminPage.tsx:74` |
| Edge function `send-order-notification` | deployed but never called | `OrderReviewPage.tsx` |

The entire **payment system** (migration 005) appears to have been added to the DB but never wired into the frontend — the UI still says "Cash on Delivery" only.

### Indexes
| Table | Index | Type |
|---|---|---|
| orders | `orders_pkey` (id) | unique btree |
| orders | `orders_order_id_key` (order_id) | unique btree |
| orders | `idx_orders_order_id` (order_id) | btree — **redundant** with unique key above |
| orders | `idx_orders_created_at` (created_at DESC) | btree |
| order_items | `order_items_pkey` (id) | unique |
| order_items | `idx_order_items_order_id` (order_id) | btree |
| products | `products_pkey` (id) | unique |
| reviews | `reviews_pkey` (id) | unique |
| reviews | `idx_reviews_created_at` (created_at DESC) | btree |
| site_settings | `site_settings_pkey` (id) | unique |
| site_settings | `site_settings_setting_key_key` (setting_key) | unique |

**Missing indexes:** `products.is_active` (filtered on every catalog query), `orders.viewed` (filtered for new-order count), `orders.status` (filtered in stats).

### Constraints
| Table | Constraint | Type |
|---|---|---|
| all | primary keys | PK |
| orders | `order_id` UNIQUE | unique |
| site_settings | `setting_key` UNIQUE | unique |
| order_items | FK order_id → orders(id) ON DELETE CASCADE | FK |
| order_items | FK product_id → products(id) | FK (no cascade) |
| reviews | FK order_id → orders(id) ON DELETE CASCADE | FK |
| reviews | `rating >= 1 AND rating <= 5` | CHECK |

**Missing constraints:**
- `products.price`, `order_items.quantity`, `order_items.price_per_unit` have no `CHECK (>= 0)` — negative values allowed.
- `orders.total_amount` no CHECK.
- `order_items.quantity` no `NOT NULL` enforcement beyond app.
- `products.is_active` nullable (should be `NOT NULL DEFAULT true`).
- `orders.status` free-text — no enum or CHECK restricting to valid statuses.

### Data integrity risks
- **Order ID generation is race-prone**: `OrderReviewPage.generateOrderId` reads the latest `order_id`, increments, and inserts — two concurrent orders can collide (mitigated only by the unique constraint, which would throw an unhandled error).
- **Stock not decremented** on order placement — `products.stock` is never reduced, so "X left" is manual.
- **No transaction** wrapping order + order_items insert — partial orders possible if the second insert fails (the first order row would remain).
- `order_items.product_id` FK has no cascade — deleting a product leaves dangling references (or blocks deletion).

---

## 5. Supabase Security Audit

### RLS policy review
All policies are `TO public` (anon + authenticated). Summary:

| Table | Policy | Cmd | qual / with_check | Risk |
|---|---|---|---|---|
| products | select_active_products | SELECT | `is_active = true` | OK (intended public read) |
| products | select_all_products_admin | SELECT | `true` | **Over-exposes inactive products to anyone** |
| products | insert_products_admin | INSERT | `true` | **Anyone can create products** |
| products | update_products_admin | UPDATE | `true` / `true` | **Anyone can edit price/stock/image** |
| orders | insert_orders_public | INSERT | `true` | OK (intended) but no validation |
| orders | select_orders_admin | SELECT | `true` | **Anyone can read ALL orders (names, phones)** |
| orders | update_orders_admin | UPDATE | `true` / `true` | **Anyone can change any order's status** |
| order_items | insert_order_items_public | INSERT | `true` | OK (intended) |
| order_items | select_order_items_admin | SELECT | `true` | **Anyone can read all line items** |
| reviews | insert_reviews_public | INSERT | `true` | OK (intended) |
| reviews | select_displayed_reviews | SELECT | `is_displayed = true` | OK |
| reviews | select_all_reviews_admin | SELECT | `true` | **Anyone can read unapproved reviews** |
| reviews | update_reviews_admin | UPDATE | `true` / `true` | **Anyone can approve/edit reviews** |
| site_settings | select_settings_public | SELECT | `true` | Exposes `google_sheets_webhook_url` to anyone |
| site_settings | insert_settings_admin | INSERT | `true` | **Anyone can add settings** |
| site_settings | update_settings_admin | UPDATE | `true` / `true` | **Anyone can change logo / webhook URL** |

### Policies using `USING (true)` or `WITH CHECK (true)`
Every "admin" policy uses `true` on both sides — **11 policies**. There is no `auth.uid()` or role check anywhere in the entire schema. The "admin" naming is misleading: these policies grant access to the **entire public**.

### Tables vulnerable to unauthorized access
| Table | Exposure |
|---|---|
| orders | Full PII (name, phone) readable by anyone; status writable by anyone |
| order_items | Fully readable by anyone |
| products | Insert/update by anyone (deface catalog, change prices) |
| reviews | Read unapproved + approve/edit by anyone |
| site_settings | Read/insert/update by anyone (swap webhook URL, change logo) |

### Storage bucket permissions
Bucket `product-images` is **public** (read OK for images). But write policies:
| Policy | Cmd | qual/with_check | Risk |
|---|---|---|---|
| Allow anon uploads | INSERT | `bucket_id = 'product-images'` | **Anyone can upload arbitrary files** |
| Allow anon updates | UPDATE | `bucket_id = 'product-images'` | **Anyone can overwrite any image** |
| Allow anon deletes | DELETE | `bucket_id = 'product-images'` | **Anyone can delete any image** |
| Authenticated write access | ALL | `auth.role() = 'authenticated'` | Redundant given anon policies |

This is an open file upload endpoint with no auth, no file-type/size check, and no path scoping — a serious abuse vector (malware uploads, logo hijacking).

### Authentication configuration
- **Supabase Auth is not used at all.** No `auth.users`, no sessions, no JWTs.
- Admin "login" is a client-side string compare against a hardcoded password shipped in the JS bundle.
- Edge function `verify_jwt: false` (acceptable for a public webhook, but it's also unused).

### Secure replacements (recommended)
For a no-auth customer-facing app, the customer-facing writes (insert order, insert review, insert order_items) can stay open, but **all admin operations must be gated**. Two viable options:

**Option A — Enable Supabase Auth (recommended):**
1. Create an `admins` table or use `auth.users` + a `role` claim.
2. Replace every `*_admin` policy with `TO authenticated` + `auth.uid()` ownership (or a custom `is_admin()` function).
3. Storage: remove anon INSERT/UPDATE/DELETE; keep only `TO authenticated` for writes.

**Option B — Service-role only (no RLS admin):**
1. Remove all `*_admin` policies.
2. Perform admin operations via a server function (edge function using `SERVICE_ROLE_KEY`) — never expose the service key to the client.

Minimum secure policy set for `orders` (Option A):
```sql
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);  -- requires adding user_id
CREATE POLICY "insert_orders_public" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
-- Admin reads/writes via service role (bypasses RLS) in an edge function.
```

---

## 6. Feature Inventory

### Implemented features
| Feature | Status | Notes |
|---|---|---|
| Product catalog (active products) | Complete | |
| Student details form w/ validation | Complete | |
| Cart with quantity/stock limits | Complete | |
| Order review + submit | Complete | Race condition in ID gen |
| Order confirmation page | Complete | |
| Order tracking by ID | Complete | |
| Feedback/review submission | Complete | Requires delivered order |
| Homepage reviews display | Complete | Only `is_displayed` reviews |
| Admin: order list + status update | Complete | |
| Admin: cancel order | Complete | |
| Admin: mark orders viewed | Complete | |
| Admin: product price/stock edit | Complete | |
| Admin: product image upload/remove | Complete | |
| Admin: logo upload/remove | Complete | |
| Admin: CSV export | Complete | |
| Admin: statistics tab | Complete | |
| Admin: Google Sheets URL config | Complete | |
| Admin: clear all orders | Complete | Destructive, no undo |
| WhatsApp notification on order | Complete | Client-side `window.open` |
| Google Sheets sync (client) | Complete | `no-cors` fetch |
| Edge function (email + sheets) | **Deployed but unused** | Never called |

### Partially implemented features
| Feature | Gap |
|---|---|
| Payment system | DB columns exist (`payment_screenshot_url`, `payment_status`, `advance_payment_amount`, etc.) but **no UI** — migration 005 was applied but frontend never wired |
| Review management in admin | "Load Reviews" button only `console.log`s results — no approve/reject UI (`AdminPage.tsx:1232-1251`) |
| New-order badge in Navbar | `newOrdersCount` in `App.tsx` is always 0; real count lives only inside `AdminPage` |
| Edge function notifications | Written but not invoked |

### Unused code / dead code
| Item | Location |
|---|---|
| `send-order-notification` edge function | `supabase/functions/send-order-notification/index.ts` — deployed, never called |
| `newOrdersCount` state in `App.tsx` | `App.tsx:24` — always 0, passed to Navbar |
| `onNavigate` prop on `AdminPage` | `AdminPage.tsx:32` — declared but never used |
| `Link`, `ExternalLink` imports | `AdminPage.tsx:24-25` — `Link` unused |
| `Star` import in `OrderConfirmationPage` | `OrderConfirmationPage.tsx:3` — unused |
| Payment DB columns (6) | `orders` table — never read/written by app |
| `site_name` setting | inserted but never read by UI |
| `RefreshCw`, `Edit3`, `Save`, `X`, `XCircle` | some used, verify — `Link` definitely unused |

### Missing functionality
- **No real authentication** (admin or customer).
- **No stock decrement** on order — inventory is decorative.
- **No order history per customer** (no accounts).
- **No search/filter** on products.
- **No pagination** on admin order list.
- **No real-time updates** (polling only).
- **No email notifications** actually sent (edge function unused).
- **No admin review moderation UI**.
- **No payment flow** despite DB schema for it.
- **No sitemap, robots.txt, or structured data.**

---

## 7. Admin Panel Analysis

### Admin capabilities
- View all orders (expandable, with items)
- Update order status (Received/Processing/Ready/Delivered)
- Cancel orders
- Mark orders as viewed / clear new-order badge
- Edit product price & stock
- Upload/remove product images
- Upload/remove site logo
- Configure Google Sheets webhook URL
- Export orders to CSV
- View statistics (counts, revenue, status breakdown, recent orders)
- **Clear all orders** (destructive)

### Admin authentication
- **Hardcoded plaintext password** in `src/App.tsx:15`: `'ak@uniforms@61'`.
- Compared in the browser; the "secret" is shipped to every visitor.
- `isAdminLoggedIn` is a React state boolean — bypassable via devtools or by directly rendering `AdminPage`.
- No rate limiting, no lockout, no audit log.

### Role-based access control
**None.** There is exactly one role (the password) and it grants full admin. There is no DB-level distinction between admin and customer — all RLS policies are `public`.

### Security weaknesses
| Weakness | Impact |
|---|---|
| Password in JS bundle | Anyone can read it |
| Client-only auth flag | Trivially bypassed |
| RLS grants admin writes to `public` | Even without the password, anyone can hit the API directly |
| Storage open to anon writes | Logo/product image hijack, malware hosting |
| "Clear all orders" has no confirmation beyond a modal and no undo | Catastrophic accidental data loss |
| No CSRF protection on Google Sheets webhook | Low (no-cors) |
| Google Sheets webhook URL exposed via `site_settings` SELECT `true` | Anyone can read/replace it |

---

## 8. Performance Audit

### Large bundles
- No code splitting; all 9 pages + lucide icons in one chunk.
- `lucide-react` is `exclude`d from `optimizeDeps` (`vite.config.ts:8`) — slows dev cold start; tree-shaking still works for prod but the dev experience suffers.
- No bundle analysis configured.

### Slow queries
- **N+1 in admin**: `fetchData` fetches all orders, then issues one `order_items` query per order (`AdminPage.tsx:216-225`). Should be a single join: `orders` ← `order_items` via `select('*, order_items(*)')`.
- `HomePage` issues two reviews queries (displayed list + all ratings for average) — could be one query or a Postgres view/`avg()`.
- Missing indexes on `products.is_active`, `orders.viewed`, `orders.status`.

### Unnecessary re-renders
- `Logo` fetches `site_settings` on every mount; Navbar/Footer/HomePage all render Logo → 3+ duplicate fetches per page.
- `App.tsx` re-renders the entire tree on any state change (no memoization).
- `AdminPage` polls every 30s and re-fetches everything.

### Duplicate API calls
- Products fetched separately in `ProductsPage` and `OrderReviewPage`.
- `site_settings` fetched by `Logo` (per mount), `AdminPage.fetchLogo`, `AdminPage.fetchSettings`, `OrderReviewPage.syncToGoogleSheets`.

### Optimization opportunities
1. Replace N+1 with a single Supabase join query.
2. Add a `useMemo`/Context for products + settings; or adopt React Query/SWR.
3. Lazy-load admin page (`React.lazy`) — most users never visit it.
4. Add the missing indexes.
5. Compute review average in SQL (`avg(rating)`).
6. Stop polling; use Supabase realtime subscriptions.

---

## 9. SEO Audit

| Item | Status | Notes |
|---|---|---|
| `<title>` | Present | `index.html:9` |
| Meta description | Present | `index.html:7` |
| Meta keywords | Present (low SEO value) | `index.html:8` |
| Viewport | Present | `index.html:6` |
| Open Graph tags | **Missing** | No `og:title`, `og:image`, `og:url` |
| Twitter Card tags | **Missing** | |
| Canonical URL | **Missing** | |
| Structured data (JSON-LD) | **Missing** | No `Product`, `Offer`, `Organization`, `BreadcrumbList` |
| Sitemap (`sitemap.xml`) | **Missing** | |
| `robots.txt` | **Missing** | |
| `lang` attribute | Present (`en`) | `index.html:2` |
| Favicon | Present (inline SVG) | `index.html:5` |
| SSR / prerender | **None** — pure CSR SPA | Single URL, content not in initial HTML |
| Semantic headings | Mostly OK | Some `h3` used as section titles under `h2` |

### Recommendations
1. Add Open Graph + Twitter Card meta tags (dynamic per product would require SSR/router).
2. Add `robots.txt` and `sitemap.xml` (requires real routes).
3. Add JSON-LD `Organization` and `Product` structured data.
4. Adopt a router (react-router or TanStack Router) with real URLs per page — prerequisite for indexing, sitemap, and share links.
5. Consider prerendering the homepage (vite-plugin-ssr / Astro export) for initial HTML.

---

## 10. Deployment & Infrastructure

### Hosting configuration
- **Frontend:** Vite SPA (build via `npm run build` → static `dist/`). No deployment config in repo (assumed Bolt hosting).
- **Backend:** Supabase project `xnaukuxlwwayqttuumfu` (Postgres, Storage, Edge Functions).

### Environment variables
| Variable | Used in | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Supabase anon key (public) |

**Not exposed to the client (correctly):** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` exist in the host env but are not prefixed with `VITE_` so not shipped to the browser. The edge function reads `RESEND_API_KEY`, `NOTIFICATION_EMAIL`, `GOOGLE_SHEETS_WEBHOOK_URL` from Deno env (could not list — permission denied).

### External services integrated
| Service | How | Status |
|---|---|---|
| Supabase Postgres | direct client | Active |
| Supabase Storage | direct client | Active |
| WhatsApp (`wa.me`) | `window.open` | Active |
| Google Sheets Apps Script | client `fetch` no-cors + edge function | Partially active (client path) |
| Resend (email) | edge function | **Configured but unused** (function never called) |

### Domain configuration
Not visible in repo. SSL is handled by the hosting platform (assumed).

---

## 11. Code Quality Review

### Bugs
| # | Bug | Location | Severity |
|---|---|---|---|
| B1 | Order ID race condition — two concurrent orders can generate the same ID; unique constraint throws unhandled | `OrderReviewPage.tsx:55-73` | High |
| B2 | Order + order_items inserted in two separate calls with no transaction — partial order on second failure | `OrderReviewPage.tsx:144-172` | High |
| B3 | `OrderReviewPage` calls `onNavigate('student-details')` during render when `customerDetails` is null — setState during render warning | `OrderReviewPage.tsx:196-198` | Medium |
| B4 | `ProductsPage` auto-fills cart with all products at quantity 0 only when `cartItems.length === 0` — if cart is non-empty (e.g. navigated back), new products never appear | `ProductsPage.tsx:37` | Low |
| B5 | `AdminPage` "Load Reviews" only `console.log`s — no UI | `AdminPage.tsx:1241` | Low |
| B6 | Navbar new-order badge never updates (state lives in App, fetch in AdminPage) | `App.tsx:24`, `Navbar.tsx:51` | Low |
| B7 | `syncToGoogleSheets` uses `mode: 'no-cors'` — response is opaque; failures silently swallowed | `OrderReviewPage.tsx:113-127` | Medium |
| B8 | Stock never decremented on order — inventory numbers are meaningless | `OrderReviewPage.tsx` | Medium |
| B9 | `handleClearAllOrders` deletes via `.neq('id', zero-uuid)` — works but fragile; a real `delete().neq('id','')` or `not.is.null` would be clearer | `AdminPage.tsx:180-193` | Low |

### Technical debt
- Hand-rolled router/state instead of a router + data library.
- No Supabase Auth — security model is a placeholder.
- Payment system half-built (DB only).
- Edge function written but not wired.
- No tests, no CI config, no lint config content (`eslint.config.js` is empty).

### Dead code
(see §6 "Unused code")

### Security vulnerabilities
| # | Vulnerability | Severity |
|---|---|---|
| S1 | Hardcoded admin password in client bundle | **Critical** |
| S2 | All admin RLS policies `USING(true)`/`WITH CHECK(true)` → full read/write to public | **Critical** |
| S3 | Storage bucket open to anon insert/update/delete | **Critical** |
| S4 | All orders PII (name, phone) world-readable | **High** |
| S5 | `site_settings` (incl. webhook URL) world-readable/writable | **High** |
| S6 | No rate limiting on order insert → spam orders | Medium |
| S7 | No input sanitization on review comment → stored XSS risk if ever rendered as HTML | Medium |
| S8 | Google Sheets webhook URL exfiltration/swap | Medium |
| S9 | `window.open` WhatsApp popups may be blocked by browsers | Low |

### Refactoring opportunities
- Extract data fetching into a `hooks/` directory (`useProducts`, `useOrders`, `useSettings`).
- Centralize Supabase queries in a `api/` layer.
- Replace `switch` router with react-router.
- Split `AdminPage` (1258 lines) into `AdminOrders`, `AdminProducts`, `AdminStats`, `AdminSettings`.
- Move order submission logic into an edge function (atomic, secure, can decrement stock).

### Best practice violations
- Secrets in client code.
- `console.error`/`console.log` left in production code (multiple files).
- Inline `style={{}}` for box-shadows instead of Tailwind classes.
- No error boundary — a render error anywhere whitescreens the app.
- `eslint.config.js` is empty — linting effectively off.
- No `.gitignore` review (file exists but not audited).

---

## 12. Project Documentation

### Folder structure
```
.
├── index.html                # HTML entry
├── package.json               # deps + scripts
├── vite.config.ts             # Vite config
├── tailwind.config.js         # theme (navy + dark ramps)
├── postcss.config.js
├── tsconfig*.json             # TS config (app + node)
├── eslint.config.js           # empty
├── src/                       # application (see §2)
└── supabase/
    ├── functions/send-order-notification/index.ts
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_storage_bucket.sql
        ├── 003_add_new_features.sql
        ├── 004_site_settings.sql
        └── 005_payment_system.sql   (applied to DB, not on disk)
```

### Database schema diagram
```
┌─────────────┐       ┌──────────────┐       ┌──────────┐
│  products   │       │   orders     │       │ reviews  │
│ id (PK)     │◄──┐   │ id (PK)      │◄──┐   │ id (PK)  │
│ name        │   │   │ order_id (U) │   │   │ order_id │
│ price       │   │   │ full_name    │   └───│ rating   │
│ meters/unit │   │   │ phone_number │       │ comment  │
│ stock       │   │   │ status       │       │ is_disp  │
│ image_url   │   │   │ total_amount │       └──────────┘
│ is_active   │   │   │ viewed       │
└─────────────┘   │   │ cancelled_at │
                  │   │ payment_*    │ (unused)
                  │   └──────────────┘
                  │          ▲
                  │          │
                  │   ┌──────────────┐
                  └───│ order_items  │
                      │ id (PK)      │
                      │ order_id (FK)│
                      │ product_id   │
                      │ quantity     │
                      │ price_per_u  │
                      └──────────────┘

┌──────────────┐
│ site_settings│  key/value config (logo_url, google_sheets_webhook_url, …)
└──────────────┘
```

### API documentation
There is no custom API. The frontend uses the Supabase JS client directly against these tables:

| Operation | Table | Method | RLS gate |
|---|---|---|---|
| List active products | products | select `.eq('is_active', true)` | public |
| Insert order | orders | insert | public (WITH CHECK true) |
| Insert order items | order_items | insert | public |
| Track order | orders | select `.eq('order_id', …).single()` | public (true) |
| Insert review | reviews | insert | public |
| List displayed reviews | reviews | select `.eq('is_displayed', true)` | public |
| Admin: list orders + items | orders, order_items | select | public (true) |
| Admin: update order status | orders | update | public (true) |
| Admin: update product | products | update | public (true) |
| Admin: upsert settings | site_settings | upsert | public (true) |
| Storage: upload/getPublicUrl | product-images bucket | storage | anon open |

Edge function `send-order-notification` (POST, no JWT):
- Body: `{ orderId, customer, items, total }`
- Sends email via Resend if `RESEND_API_KEY` + `NOTIFICATION_EMAIL` set.
- Syncs to Google Sheets if `GOOGLE_SHEETS_WEBHOOK_URL` set.
- **Not invoked by the frontend.**

### Environment variable documentation
| Variable | Scope | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | client | yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | yes | Supabase anon public key |
| `RESEND_API_KEY` | edge fn | optional | Resend email API key |
| `NOTIFICATION_EMAIL` | edge fn | optional | Recipient for order emails |
| `GOOGLE_SHEETS_WEBHOOK_URL` | edge fn | optional | Apps Script webhook URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | yes (host) | Never expose to client |
| `SUPABASE_DB_URL` | server only | yes (host) | Postgres connection string |

### Setup instructions
1. `npm install`
2. Copy `.env` (already populated in this project): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. `npm run dev` (dev server) — or `npm run build` for production.
4. Supabase migrations are pre-applied; to re-apply, use the Supabase MCP `apply_migration` tool (CLI not supported).

### Deployment instructions
- Frontend: `npm run build` → deploy `dist/` to static host (Bolt handles this).
- Edge functions: deploy via Supabase MCP `deploy_edge_function` (source must be on disk under `supabase/functions/<slug>/`).
- Storage bucket `product-images` already created and public.
- No CI/CD pipeline in repo.

---

## 13. Improvement Roadmap

### Critical (do before any production use)
1. **Remove the hardcoded admin password** from `src/App.tsx:15`. Enable Supabase Auth (email/password) and gate the admin panel behind a real session.
2. **Lock down RLS**: replace every `USING(true)`/`WITH CHECK(true)` admin policy with `TO authenticated` + an ownership/role check (or move admin writes to a service-role edge function). Customers should only insert orders/reviews, not read/modify them.
3. **Lock down storage**: remove anon INSERT/UPDATE/DELETE policies on `product-images`; allow only `authenticated` (admin) writes.
4. **Make order submission atomic and secure**: move `OrderReviewPage.handleSubmitOrder` into an edge function that generates the ID server-side, inserts order + items in a transaction, decrements stock, and sends notifications — eliminating the race condition, partial-order risk, and stock bug.
5. **Stop shipping PII to the public**: restrict `orders`/`order_items` SELECT to the owning customer (via `order_id` lookup) + admin.

### High priority
6. Add the missing indexes (`products.is_active`, `orders.viewed`, `orders.status`).
7. Fix the admin N+1 query (single join).
8. Wire up (or remove) the `send-order-notification` edge function.
9. Either build the payment UI or drop the 6 unused `orders.payment_*` columns.
10. Add an error boundary and replace `console.error` with user-visible error states.
11. Add input validation/sanitization on review comments (stored XSS prevention).
12. Add rate limiting / reCAPTCHA on order insert.

### Medium priority
13. Adopt a real router (react-router) with URLs per page — enables SEO, deep links, back button.
14. Add React Query / SWR for caching and dedup.
15. Split `AdminPage` into sub-components; extract data hooks.
16. Add Open Graph, Twitter Card, JSON-LD, `robots.txt`, `sitemap.xml`.
17. Build the admin review-moderation UI (approve/reject).
18. Add product search/filter and pagination.
19. Replace 30s polling with Supabase realtime subscriptions.
20. Add a `CHECK` constraint on `orders.status` (enum) and non-negative checks on money/quantity columns.

### Nice-to-have
21. Lazy-load the admin bundle.
22. Add a proper design-system / component library (the Tailwind config is a good start).
23. Add unit + integration tests (none exist).
24. Populate `eslint.config.js` and enforce lint in CI.
25. Add bundle analysis (`rollup-plugin-visualizer`).
26. Customer accounts + order history.
27. Multi-language support (i18n).
28. Dark/light theme toggle (currently dark-only).

---

## 14. Final Summary

### Scores

| Dimension | Score | Justification |
|---|---|---|
| **Overall** | **4 / 10** | Functional MVP but fundamentally insecure for production |
| **Security** | **2 / 10** | Hardcoded password in bundle; all RLS policies `public` with `true`; storage open to the world; PII exposed |
| **Performance** | **6 / 10** | Small app, acceptable; N+1 admin query, no caching, no code splitting, duplicate fetches |
| **Maintainability** | **5 / 10** | Clean-ish components but 1258-line AdminPage, no router, no tests, no lint, half-built features, dead code |
| **Production readiness** | **2 / 10** | Not safe to deploy as-is; critical auth + RLS + storage fixes required first |

### Key takeaways
- The app is a **well-presented prototype** with a coherent customer flow and a feature-rich admin panel.
- It is **not production-ready**: the security model is effectively absent (client-side password + fully open RLS + open storage).
- There is **significant dead/half-built work**: the entire payment system (DB columns) and the edge function are unused.
- The highest-leverage fix is to **move all admin operations behind real auth + locked RLS (or a service-role edge function)** and to **make order submission atomic server-side**.
