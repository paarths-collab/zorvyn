from __future__ import annotations

"""Copy existing SQLite data into a target database without wiping rows.

Default behavior:
- source: local ./finance_v2.db
- target: DATABASE_URL from the environment

Usage examples:
  python -m backend.scripts.migrate_sqlite_to_target
  python -m backend.scripts.migrate_sqlite_to_target --target postgresql://...
  python -m backend.scripts.migrate_sqlite_to_target --source sqlite:///C:/path/to/finance_v2.db
"""

from argparse import ArgumentParser
from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.core.config import settings
from backend.db.session import Base
from backend.models.record import FinancialRecord
from backend.models.user import User


TABLE_ORDER = [User, FinancialRecord]


def _make_engine(database_url: str):
    kwargs = {}
    if database_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(database_url, **kwargs)


def _default_source_url() -> str:
    project_root = Path(__file__).resolve().parents[2]
    sqlite_path = project_root / "finance_v2.db"
    return f"sqlite:///{sqlite_path.as_posix()}"


def _resolve_url(cli_value: str | None, env_name: str, fallback: str) -> str:
    value = (cli_value or os.getenv(env_name) or "").strip()
    return value or fallback


def _row_data(obj, columns):
    return {column.name: getattr(obj, column.name) for column in columns}


def migrate(source_url: str, target_url: str) -> None:
    if source_url == target_url:
        raise ValueError("Source and target database URLs must be different.")

    source_engine = _make_engine(source_url)
    target_engine = _make_engine(target_url)

    Base.metadata.create_all(bind=target_engine)

    SourceSession = sessionmaker(bind=source_engine)
    TargetSession = sessionmaker(bind=target_engine)

    source_db: Session = SourceSession()
    target_db: Session = TargetSession()
    try:
        print(f"Source: {source_url}")
        print(f"Target: {target_url}")

        for model in TABLE_ORDER:
            rows = source_db.query(model).all()
            columns = model.__table__.columns
            print(f"Copying {len(rows)} rows from {model.__tablename__}...")

            for row in rows:
                data = _row_data(row, columns)
                existing = target_db.get(model, data["id"])
                if existing:
                    for key, value in data.items():
                        setattr(existing, key, value)
                    target_db.add(existing)
                else:
                    target_db.add(model(**data))

            target_db.commit()

        print("Migration completed successfully.")
    except Exception:
        target_db.rollback()
        raise
    finally:
        source_db.close()
        target_db.close()


def main() -> None:
    parser = ArgumentParser(description="Copy SQLite data into the target database without deleting existing rows.")
    parser.add_argument("--source", help="Source database URL. Defaults to local finance_v2.db or SOURCE_DATABASE_URL.")
    parser.add_argument("--target", help="Target database URL. Defaults to DATABASE_URL.")
    args = parser.parse_args()

    source_url = _resolve_url(args.source, "SOURCE_DATABASE_URL", _default_source_url())
    target_url = _resolve_url(args.target, "DATABASE_URL", settings.DATABASE_URL)
    migrate(source_url, target_url)


if __name__ == "__main__":
    main()
