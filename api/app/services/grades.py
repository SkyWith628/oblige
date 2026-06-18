"""등급 재계산. 누적 반납 수에 해당하는 최고 등급으로 갱신. commit 하지 않는다."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import MembershipGrade, User


def recalc(db: Session, user: User) -> str:
    grade = db.scalar(
        select(MembershipGrade.grade)
        .where(MembershipGrade.min_return_count <= user.bottle_return_count)
        .order_by(MembershipGrade.min_return_count.desc())
        .limit(1)
    )
    if grade:
        user.grade = grade
    return user.grade
