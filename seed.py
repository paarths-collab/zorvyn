from sqlalchemy.orm import Session
from backend.db.session import SessionLocal, engine, Base
from backend.models.user import User, UserRole
from backend.models.record import FinancialRecord, RecordType, RecordCategory, PaymentMethod, ApprovalStatus
from backend.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ════════════════════════════════════════════════════════
        # 1. SEED USERS (Admin, Analysts, Viewers)
        # ════════════════════════════════════════════════════════
        users_to_create = [
            ("alice.admin@gmail.com", "Alice Johnson", UserRole.ADMIN),
            ("bob.analyst@gmail.com", "Bob Smith", UserRole.ANALYST),
            ("carol.analyst@gmail.com", "Carol Davis", UserRole.ANALYST),
            ("david.analyst@gmail.com", "David Wilson", UserRole.ANALYST),
            ("eve.viewer@gmail.com", "Eve Martinez", UserRole.VIEWER),
            ("frank.viewer@gmail.com", "Frank Brown", UserRole.VIEWER),
            ("grace.viewer@gmail.com", "Grace Lee", UserRole.VIEWER),
            ("henry.admin@gmail.com", "Henry Taylor", UserRole.ADMIN),
            ("iris.analyst@gmail.com", "Iris Anderson", UserRole.ANALYST),
            ("jack.viewer@gmail.com", "Jack Thomas", UserRole.VIEWER),
            ("karen.analyst@gmail.com", "Karen Jackson", UserRole.ANALYST),
        ]
        
        print("\n📦 SEEDING USERS...")
        user_ids = {}
        for email, full_name, role in users_to_create:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                new_user = User(
                    email=email,
                    full_name=full_name,
                    hashed_password=get_password_hash("password123"),
                    role=role,
                    is_active=True
                )
                db.add(new_user)
                db.flush()
                user_ids[email] = new_user.id
                print(f"  ✓ {role.value:8} | {email:30} | {full_name}")
            else:
                user_ids[email] = user.id
                print(f"  ↻ {role.value:8} | {email:30} | Already exists")
        
        db.commit()
        
        # ════════════════════════════════════════════════════════
        # 2. SEED FINANCIAL RECORDS (Income + Expenses)
        # ════════════════════════════════════════════════════════
        print("\n💰 SEEDING FINANCIAL RECORDS...")
        
        # Sample data generators
        income_records = [
            {"type": RecordType.INCOME, "category": RecordCategory.SALARY, "amount": 5000, "desc": "Monthly salary", "ref": "SAL-2026-04-01", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.CLIENT_PAYMENT, "amount": 2500, "desc": "Client invoice paid", "ref": "INV-2026-001", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.PRODUCT_SALES, "amount": 1200, "desc": "Product sale", "ref": "PROD-2026-042", "payment": PaymentMethod.CARD},
            {"type": RecordType.INCOME, "category": RecordCategory.FUNDING, "amount": 10000, "desc": "Investment round", "ref": "FUND-2026-A1", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.SUBSCRIPTION, "amount": 500, "desc": "Subscription revenue", "ref": "SUB-2026-001", "payment": PaymentMethod.CARD},
            {"type": RecordType.INCOME, "category": RecordCategory.CLIENT_PAYMENT, "amount": 3000, "desc": "Consulting payment", "ref": "CONS-2026-005", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.PRODUCT_SALES, "amount": 800, "desc": "Digital product sale", "ref": "DIG-2026-032", "payment": PaymentMethod.CARD},
            {"type": RecordType.INCOME, "category": RecordCategory.SALARY, "amount": 5000, "desc": "Monthly salary", "ref": "SAL-2026-03-01", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.CLIENT_PAYMENT, "amount": 4500, "desc": "Large project payment", "ref": "PROJ-2026-015", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.INCOME, "category": RecordCategory.FUNDING, "amount": 50000, "desc": "Series A funding", "ref": "FUND-2026-B1", "payment": PaymentMethod.BANK_TRANSFER},
        ]
        
        expense_records = [
            {"type": RecordType.EXPENSE, "category": RecordCategory.RENT, "amount": 1200, "desc": "Office rent", "ref": "RENT-2026-04", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.EXPENSE, "category": RecordCategory.UTILITIES, "amount": 350, "desc": "Electricity, water, internet", "ref": "UTIL-2026-04", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.EXPENSE, "category": RecordCategory.SOFTWARE, "amount": 199, "desc": "Subscription service", "ref": "SOFT-2026-001", "payment": PaymentMethod.CARD},
            {"type": RecordType.EXPENSE, "category": RecordCategory.MARKETING, "amount": 2000, "desc": "Google Ads campaign", "ref": "MKT-2026-015", "payment": PaymentMethod.CARD},
            {"type": RecordType.EXPENSE, "category": RecordCategory.TRAVEL, "amount": 450, "desc": "Flight to client meeting", "ref": "TRV-2026-042", "payment": PaymentMethod.CARD},
            {"type": RecordType.EXPENSE, "category": RecordCategory.SUBSCRIPTION, "amount": 99, "desc": "Software license", "ref": "SUB-2026-LIC", "payment": PaymentMethod.CARD},
            {"type": RecordType.EXPENSE, "category": RecordCategory.SALARY, "amount": 2500, "desc": "Contractor payment", "ref": "CONT-2026-003", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.EXPENSE, "category": RecordCategory.SOFTWARE, "amount": 29, "desc": "Cloud storage upgrade", "ref": "CLOUD-2026-001", "payment": PaymentMethod.CARD},
            {"type": RecordType.EXPENSE, "category": RecordCategory.MARKETING, "amount": 500, "desc": "Influencer collaboration", "ref": "MKT-2026-016", "payment": PaymentMethod.BANK_TRANSFER},
            {"type": RecordType.EXPENSE, "category": RecordCategory.TRAVEL, "amount": 200, "desc": "Hotel accommodation", "ref": "HTL-2026-008", "payment": PaymentMethod.CARD},
        ]
        
        # Generate dates (last 30 days)
        today = datetime.utcnow().date()
        dates = [today - timedelta(days=i) for i in range(30)]
        
        # Analysts (creators)
        analysts = ["bob.analyst@gmail.com", "carol.analyst@gmail.com", "david.analyst@gmail.com", "iris.analyst@gmail.com", "karen.analyst@gmail.com"]
        admin_id = user_ids["alice.admin@gmail.com"]
        
        record_count = 0
        
        # Add income records
        for i, record_data in enumerate(income_records):
            existing = db.query(FinancialRecord).filter(
                FinancialRecord.reference_id == record_data["ref"]
            ).first()
            
            if not existing:
                analyst_email = random.choice(analysts)
                created_by_id = user_ids[analyst_email]
                
                record = FinancialRecord(
                    amount=record_data["amount"],
                    type=record_data["type"],
                    category=record_data["category"],
                    date=random.choice(dates),
                    description=record_data["desc"],
                    payment_method=record_data["payment"],
                    reference_id=record_data["ref"],
                    created_by=created_by_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    approval_status=ApprovalStatus.NONE,
                    is_deleted=False
                )
                db.add(record)
                record_count += 1
                print(f"  ✓ Income  | ${record_data['amount']:6.0f} | {record_data['category'].value:16} | {record_data['ref']}")
        
        # Add expense records
        for i, record_data in enumerate(expense_records):
            existing = db.query(FinancialRecord).filter(
                FinancialRecord.reference_id == record_data["ref"]
            ).first()
            
            if not existing:
                analyst_email = random.choice(analysts)
                created_by_id = user_ids[analyst_email]
                
                record = FinancialRecord(
                    amount=record_data["amount"],
                    type=record_data["type"],
                    category=record_data["category"],
                    date=random.choice(dates),
                    description=record_data["desc"],
                    payment_method=record_data["payment"],
                    reference_id=record_data["ref"],
                    created_by=created_by_id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    approval_status=ApprovalStatus.NONE,
                    is_deleted=False
                )
                db.add(record)
                record_count += 1
                print(f"  ✓ Expense | ${record_data['amount']:6.0f} | {record_data['category'].value:16} | {record_data['ref']}")
        
        db.commit()
        
        # ════════════════════════════════════════════════════════
        # 3. SUMMARY
        # ════════════════════════════════════════════════════════
        print(f"\n✨ SEEDING COMPLETE!")
        total_users = db.query(User).count()
        total_records = db.query(FinancialRecord).count()
        print(f"  👤 Users:          {total_users}")
        print(f"  💰 Records:        {total_records}")
        print(f"\n🔑 TEST CREDENTIALS:")
        print(f"  Admin:   alice.admin@gmail.com   / password123")
        print(f"  Analyst: bob.analyst@gmail.com   / password123")
        print(f"  Viewer:  eve.viewer@gmail.com    / password123")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
