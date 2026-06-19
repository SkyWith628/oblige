from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..deps import get_current_user
from ..models import CartItem, Product, User
from ..schemas import CartItemIn, CartItemOut, CartQuantityUpdate

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=list[CartItemOut])
def list_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(CartItem).where(CartItem.user_id == user.id)))


@router.post("", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    data: CartItemIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.get(Product, data.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "상품을 찾을 수 없습니다")

    item = db.scalar(
        select(CartItem).where(
            CartItem.user_id == user.id, CartItem.product_id == data.product_id
        )
    )
    if item:
        item.quantity += data.quantity
    else:
        item = CartItem(user_id=user.id, product_id=data.product_id, quantity=data.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=CartItemOut)
def update_quantity(
    item_id: int,
    data: CartQuantityUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(CartItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "장바구니 항목을 찾을 수 없습니다")
    item.quantity = data.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(CartItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "장바구니 항목을 찾을 수 없습니다")
    db.delete(item)
    db.commit()
