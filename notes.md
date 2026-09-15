# Learning notes

## JWT Pizza code study and debugging

Completed from the checked-out source on 2026-09-14. This is a code trace, not a claim that the deployment or every UI activity was exercised. Four findings were reproduced with isolated mocks; no real database or factory was contacted. The sample credentials below are the worksheet examples, not verified working accounts.

Open `code-walkthrough.html` for the interactive companion: guided chapters, annotated source excerpts, and the issue review.

| User activity | Frontend component | Backend endpoints | Database SQL |
| --- | --- | --- | --- |
| View home page | Home — home.tsx | None for page content | None; static React content and images. |
| Register new user (t@jwt.com, pw: test) | Register — register.tsx | POST /api/auth | INSERT INTO user (name, email, password) VALUES (?, ?, ?); INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?); session INSERT below. |
| Login new user (t@jwt.com, pw: test) | Login — login.tsx | PUT /api/auth | SELECT * FROM user WHERE email=?; SELECT * FROM userRole WHERE userId=?; session INSERT below. bcrypt compares the supplied password to the stored hash. |
| Order pizza | Menu → Payment → Delivery | GET /api/order/menu; GET /api/franchise?page=0&limit=20&name=*; GET /api/user/me if token exists on Payment; POST /api/order; service → factory POST /api/order | SELECT * FROM menu; public franchise queries below; INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now()); for each item: SELECT id FROM menu WHERE id=?; INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?). |
| Verify pizza | Delivery — delivery.tsx | POST {factory URL}/api/order/verify, directly from browser | No local service SQL. Factory implementation is outside this repository. |
| View profile page | DinerDashboard — dinerDashboard.tsx | GET /api/order; user comes from App state (GET /api/user/me on initial load if token exists) | SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}; per order: SELECT id, menuId, description, price FROM orderItem WHERE orderId=?; /me itself returns JWT claims. |
| View franchise (as diner) | FranchiseDashboard — franchiseDashboard.tsx | GET /api/franchise/:userId when signed in | SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?; normally empty for a diner, so UI shows franchise information/promotion. |
| Logout | Logout — logout.tsx | DELETE /api/auth | DELETE FROM auth WHERE token=?; browser also removes localStorage token. |
| View About page | About — about.tsx | None for page content | None; static content. |
| View History page | History — history.tsx | None for page content | None; company/pizza history. Personal order history is on DinerDashboard. |
| Login as franchisee (f@jwt.com, pw: franchisee) | Login — login.tsx | PUT /api/auth | Same login SELECTs and session INSERT as any user. Account and franchise assignment must already exist. |
| View franchise (as franchisee) | FranchiseDashboard — franchiseDashboard.tsx | GET /api/franchise/:userId | SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?; SELECT id, name FROM franchise WHERE id in (...); franchise detail queries below. UI uses franchises[0]. |
| Create a store | CreateStore — createStore.tsx | POST /api/franchise/:franchiseId/store | Franchise detail queries check ownership; INSERT INTO store (franchiseId, name) VALUES (?, ?). |
| Close a store | CloseStore — closeStore.tsx | DELETE /api/franchise/:franchiseId/store/:storeId | Franchise detail queries check ownership; DELETE FROM store WHERE franchiseId=? AND id=?. |
| Login as admin (a@jwt.com, pw: admin) | Login — login.tsx | PUT /api/auth | Same login SELECTs and session INSERT. Database initialization seeds this admin only when creating a new database. |
| View Admin page | AdminDashboard — adminDashboard.tsx | GET /api/franchise?page=0&limit=3&name=*; filter uses limit=10 | Public franchise SELECT below, plus franchise detail queries for admins. |
| Create a franchise for t@jwt.com | CreateFranchise — createFranchise.tsx | POST /api/franchise (admin required) | SELECT id, name FROM user WHERE email=? for each assigned admin; INSERT INTO franchise (name) VALUES (?); INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?) adds franchisee with the new franchise ID. |
| Close the franchise for t@jwt.com | CloseFranchise — closeFranchise.tsx | DELETE /api/franchise/:franchiseId (currently missing auth checks) | Transaction: DELETE FROM store WHERE franchiseId=?; DELETE FROM userRole WHERE objectId=?; DELETE FROM franchise WHERE id=?; COMMIT on success, ROLLBACK on failure. |

### Shared queries and important distinctions

On application mount, `App` calls `getUser()`. If a token is present, this calls `GET /api/user/me`; otherwise no request is made. Even static pages can therefore have this startup request.

For requests with a bearer token, `setAuthUser` calls `SELECT userId FROM auth WHERE token=?`, using the JWT signature segment as the lookup key, then verifies the JWT. Routes must still explicitly enforce authentication and authorization.

Registration/login session insert:

```sql
INSERT INTO auth (token, userId) VALUES (?, ?)
ON DUPLICATE KEY UPDATE token=token;
```

Public franchise listing (`getFranchises`; interpolation shown as implemented):

```sql
SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset};
SELECT id, name FROM store WHERE franchiseId=?;
```

For admins, or franchisees loading their assigned franchises, `getFranchise` loads administrators and store revenue:

```sql
SELECT u.id, u.name, u.email FROM userRole AS ur
JOIN user AS u ON u.id=ur.userId
WHERE ur.objectId=? AND ur.role='franchisee';

SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue
FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId
RIGHT JOIN store AS s ON s.id=do.storeId
WHERE s.franchiseId=? GROUP BY s.id;
```

- `Role.Diner` means a customer role. Public registration correctly assigns it; it is not a restaurant association (i believe, will change that name probably). Admin-only franchise creation adds a franchise-scoped `franchisee` role to an existing user.
- The browser stores the login token in localStorage. The service stores its signature in `auth` so logout can revoke it. The factory-issued pizza JWT is a separate token carried to Delivery in route state.
- “Pay now” submits an order; this checkout contains no payment gateway integration.
- `/history` is static company history. Personal order history comes from `/api/order` on the profile page.
- `navItems.constraints` controls navigation visibility; `App` still creates every route. Backend checks are the security boundary.
- Existing sessions retain their original JWT role claims. Log in again to see newly granted roles reflected in `/me` and the profile.
- The provided code does not seed a franchisee account. Creating a franchise requires its assigned user to exist first.
