from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routers import ai, auth, cart, orders, points, products, returns

app = FastAPI(
    title="OBLIGE API",
    version="0.1.0",
    description="비건·ESG 코스메틱 플랫폼 백엔드 (FastAPI)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health():
    """헬스체크 — DB 미접속 상태에서도 응답."""
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(returns.router)
app.include_router(points.router)
app.include_router(ai.router)
