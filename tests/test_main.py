from backend.main import app
from jose import jwt
from backend.core.config import settings

def test_register_and_login(client):
    # Register admin role via email pattern
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "adminuser.admin@gmail.com", "password": "password"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "adminuser.admin@gmail.com", "password": "password"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token is not None

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["role"] == "admin"
    assert payload["user_id"] == payload["sub"] or payload["user_id"] == int(payload["sub"])

def test_register_rejects_invalid_role_pattern(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "rahul.superadmin@gmail.com", "password": "password"},
    )
    assert response.status_code == 400

    response = client.post(
        "/api/v1/auth/register",
        json={"email": "rahuladmin@gmail.com", "password": "password"},
    )
    assert response.status_code == 400

def test_rbac_records(client):
    # 1. Register ALL roles first (derived from email)
    client.post("/api/v1/auth/register", json={"email": "sara.admin@gmail.com", "password": "password"})
    client.post("/api/v1/auth/register", json={"email": "nik.analyst@gmail.com", "password": "password"})
    client.post("/api/v1/auth/register", json={"email": "tom.viewer@gmail.com", "password": "password"})

    # 2. Login as Analyst and create record
    response = client.post("/api/v1/auth/login", data={"username": "nik.analyst@gmail.com", "password": "password"})
    assert response.status_code == 200
    analyst_token = response.json()["access_token"]      
    headers = {"Authorization": f"Bearer {analyst_token}"}

    record_data = {
        "amount": 1000.0,
        "type": "income",
        "category": "salary",
        "date": "2024-04-02",     
        "description": "April Salary",
        "payment_method": "bank_transfer",
        "reference_id": "INV-2026-001"
    }
    response = client.post("/api/v1/records/", json=record_data, headers=headers)
    assert response.status_code == 200
    record_id = response.json()["id"]

    # 3. Login as Viewer and try to add record (FORBIDDEN)
    viewer_response = client.post("/api/v1/auth/login", data={"username": "tom.viewer@gmail.com", "password": "password"})
    assert viewer_response.status_code == 200
    viewer_token = viewer_response.json()["access_token"]
    headers_viewer = {"Authorization": f"Bearer {viewer_token}"}
    response = client.post("/api/v1/records/", json=record_data, headers=headers_viewer)
    assert response.status_code == 403
    
    # 4. Analyst try to delete record (FORBIDDEN)
    response = client.delete(f"/api/v1/records/{record_id}", headers=headers)
    assert response.status_code == 403
    
    # 5. Admin try to delete record (SUCCESS)
    admin_login_res = client.post("/api/v1/auth/login", data={"username": "sara.admin@gmail.com", "password": "password"})
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/api/v1/records/{record_id}", headers=headers_admin)
    assert response.status_code == 204

    # 6. Deleted record should not appear in default list (soft delete)
    response = client.get("/api/v1/records/", headers=headers_admin)
    assert response.status_code == 200
    ids = [row["id"] for row in response.json()]
    assert record_id not in ids

    # 7. Admin can inspect deleted rows when explicitly requested
    response = client.get("/api/v1/records/?include_deleted=true", headers=headers_admin)
    assert response.status_code == 200
    row = [r for r in response.json() if r["id"] == record_id][0]
    assert row["is_deleted"] is True


def test_admin_user_management(client):
    client.post("/api/v1/auth/register", json={"email": "boss.admin@gmail.com", "password": "password"})
    client.post("/api/v1/auth/register", json={"email": "read.viewer@gmail.com", "password": "password"})

    viewer_login = client.post("/api/v1/auth/login", data={"username": "read.viewer@gmail.com", "password": "password"})
    viewer_headers = {"Authorization": f"Bearer {viewer_login.json()['access_token']}"}

    forbidden = client.get("/api/v1/users/", headers=viewer_headers)
    assert forbidden.status_code == 403

    admin_login = client.post("/api/v1/auth/login", data={"username": "boss.admin@gmail.com", "password": "password"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    allowed = client.get("/api/v1/users/", headers=admin_headers)
    assert allowed.status_code == 200
    assert len(allowed.json()) >= 2


def test_analyst_ownership_and_approval(client):
    # Register two analysts and one admin
    client.post("/api/v1/auth/register", json={"email": "alice.analyst@gmail.com", "password": "password"})
    client.post("/api/v1/auth/register", json={"email": "bob.analyst@gmail.com", "password": "password"})
    client.post("/api/v1/auth/register", json={"email": "chief.admin@gmail.com", "password": "password"})

    # Alice creates a record
    alice_login = client.post("/api/v1/auth/login", data={"username": "alice.analyst@gmail.com", "password": "password"})
    alice_token = alice_login.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    record_data = {
        "amount": 5000.0,
        "type": "expense",
        "category": "marketing",
        "date": "2024-04-05",
        "description": "Q2 Marketing Campaign",
        "payment_method": "card",
        "reference_id": "TXN-2026-001"
    }
    response = client.post("/api/v1/records/", json=record_data, headers=alice_headers)
    assert response.status_code == 200
    record_id = response.json()["id"]
    assert response.json()["approval_status"] == "none"

    # Alice can update her own record (requests approval)
    update_data = {"amount": 5500.0, "description": "Increased marketing spend"}
    response = client.put(f"/api/v1/records/{record_id}", json=update_data, headers=alice_headers)
    assert response.status_code == 200
    assert response.json()["approval_status"] == "pending"

    # Bob cannot update Alice's record
    bob_login = client.post("/api/v1/auth/login", data={"username": "bob.analyst@gmail.com", "password": "password"})
    bob_token = bob_login.json()["access_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}
    response = client.put(f"/api/v1/records/{record_id}", json=update_data, headers=bob_headers)
    assert response.status_code == 403

    # Admin approves the update request
    admin_login = client.post("/api/v1/auth/login", data={"username": "chief.admin@gmail.com", "password": "password"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post(f"/api/v1/records/{record_id}/approve?notes=Looks%20good", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["approval_status"] == "approved"

