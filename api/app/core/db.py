from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """모든 ORM 모델의 베이스. db/schema.sql 의 테이블과 매핑된다."""


def get_db():
    """요청 단위 DB 세션 의존성."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
