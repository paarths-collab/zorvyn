# Finance Dashboard Backend

## 1. What is this?

This project is the backend for a finance dashboard.
It stores money records, users, and summary insights.
It also makes sure each user only sees or changes what they are allowed to.

---

## 2. Who can use it?

| Role | What they can do |
| ---- | ---------------- |
| Viewer | View records and dashboard summaries only |
| Analyst | View records, create records, update their own records (with request flow), view summaries |
| Admin | Full access: view, create, update, delete, approve/reject updates, manage users |

Notes:

- Users have different access levels.
- Extra access can be given per user.
- Extra access can expire automatically.
- Original admin accounts are protected from downgrade/restriction.

---

## 3. What data is stored?

| Field | Meaning |
| ----- | ------- |
| amount | Money value of the record |
| type | Income or expense |
| category | Group of the record (salary, rent, etc.) |
| date | Transaction date |
| description | Optional note |
| payment_method | Cash, card, bank transfer, or UPI |
| reference_id | Optional external reference |
| created_by | Which user created the record |
| created_at | When the record was created |
| updated_at | When the record was last changed |
| approval_status | none, pending, approved, or rejected |
| is_deleted | Soft delete flag (hidden, not permanently removed) |

---

## 4. What does the system do?

- Secure login system for users
- User creation and role assignment
- User activation and deactivation
- Add, view, edit, and soft-delete finance records
- Filter records by type, category, and date
- Enforce access rules in backend APIs
- Support per-user permission overrides

---

## 5. Dashboard features

- Total income
- Total expense
- Net balance
- Category-wise totals
- Monthly trends
- Recent transactions

---

## 6. How the system works (simple flow)

API -> Business Logic -> Database

Input validation happens before data is saved.
Access checks happen before protected actions are allowed.

---

## 7. Main APIs

| Action | Endpoint |
| ------ | -------- |
| Register user | POST /api/v1/auth/register |
| Login | POST /api/v1/auth/login |
| Get current user + access | GET /api/v1/auth/me |
| List records | GET /api/v1/records/ |
| Create record | POST /api/v1/records/ |
| Update record | PUT /api/v1/records/{record_id} |
| Delete record (soft) | DELETE /api/v1/records/{record_id} |
| Approve update request | POST /api/v1/records/{record_id}/approve |
| Reject update request | POST /api/v1/records/{record_id}/reject |
| List users | GET /api/v1/users/ |
| Update user | PATCH /api/v1/users/{user_id} |
| Deactivate user | POST /api/v1/users/{user_id}/deactivate |
| Dashboard summary | GET /api/v1/analytics/dashboard |
| Summary totals | GET /api/v1/analytics/summary |
| Category totals | GET /api/v1/analytics/categories |
| Trend data | GET /api/v1/analytics/trends |

---

## 8. How to run (short)

1. Backend setup

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python serve.py
```

2. Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

---

## 9. Test users

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | alice.admin@gmail.com | password123 |
| Analyst | bob.analyst@gmail.com | password123 |
| Viewer | eve.viewer@gmail.com | password123 |

More sample users in seed data:

- Admin: henry.admin@gmail.com
- Analysts: carol.analyst@gmail.com, david.analyst@gmail.com, iris.analyst@gmail.com, karen.analyst@gmail.com
- Viewers: frank.viewer@gmail.com, grace.viewer@gmail.com, jack.viewer@gmail.com

---

## 10. Why these decisions

- SQLite is used for easy local setup.
- Email pattern is used for simple role assignment in this demo.
- Business logic is separated from API routes for cleaner code.
- Soft delete is used to avoid permanent data loss.
- Access checks are kept in backend so rules are always enforced.

---

## 11. How the system is designed and why it is efficient

### Simple design approach

| Design choice | Why it helps |
| ------------- | ------------ |
| API layer for endpoints | Keeps request handling clean and easy to follow |
| Logic layer for rules | Keeps business rules in one place |
| Database models for data | Makes data structure consistent |
| Input validation before save | Prevents bad data from entering the system |
| Access checks in backend | Security does not depend on frontend behavior |

### Why this is efficient

- Clear separation means faster debugging and easier updates.
- Reusable logic avoids repeating the same code in many places.
- Soft delete avoids risky hard deletes and supports recovery.
- Permission checks happen once in backend flow, so behavior stays consistent.
- Summary APIs return ready-to-use dashboard data in fewer calls.

### Why this scales better than a mixed design

- New endpoints can reuse existing service logic.
- New roles or permissions can be added with minimal changes.
- Database can move from SQLite to PostgreSQL without rewriting core logic.

---

## 12. Future improvements (optional)

- Add full migration history tooling
- Add more automated tests
- Add pagination metadata in responses
- Add rate limiting and audit logs
- Add refresh token support

---

## 13. Assignment requirement mapping

| Assignment requirement | What is implemented in this project | Status |
| ---------------------- | ----------------------------------- | ------ |
| User and role management | User registration, role derivation from email, user list/update/deactivate, active/inactive state | ✅ |
| Financial records management | Create, read, update, soft delete, filtering by type/category/date, pagination with skip/limit | ✅ |
| Dashboard summary APIs | Summary totals, category totals, monthly trends, recent transactions, combined dashboard API | ✅ |
| Access control logic | Backend permission checks for all protected actions, role + per-user override handling | ✅ |
| Validation and error handling | Input validation on schemas, custom error responses, correct HTTP status codes | ✅ |
| Data persistence | SQLite for local development, PostgreSQL-ready deployment path | ✅ |

---

## 14. Optional enhancement status

| Optional enhancement | Status | Notes |
| -------------------- | ------ | ----- |
| Authentication using tokens | ✅ | Secure login system with access token |
| Pagination for records | ✅ | `skip` and `limit` on records list API |
| Search support | ❌ | Not implemented yet |
| Soft delete | ✅ | Record delete marks `is_deleted=true` |
| Rate limiting | ❌ | Planned in future improvements |
| Unit/integration tests | ✅ | RBAC and core flow tests under `tests/` |
| API documentation | ✅ | Swagger/OpenAPI available at `/docs` |

---

## 15. Assumptions and tradeoffs

- Role is inferred from email format to keep onboarding simple for assignment review.
- SQLite is used locally for quick setup and low complexity.
- PostgreSQL is targeted for hosted deployment.
- Soft delete is preferred over hard delete to reduce data loss risk.
- The project favors clear structure and maintainability over extra complexity.

---

## 16. Submission checklist

Use this section when submitting:

- Repository link: `<add your GitHub repo URL>`
- Backend deployment link: `<add your Render API URL>`
- Frontend deployment link: `<add your Vercel URL>`
- API docs link: `<backend-url>/docs`

