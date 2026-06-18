from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경변수 기반 설정. .env 파일 또는 OS 환경변수에서 로드."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # DB
    database_url: str = (
        "postgresql+psycopg://oblige:oblige_dev@localhost:5432/oblige"
    )

    # 인증 (JWT)
    jwt_secret: str = "change-me-in-prod-to-a-secure-32byte-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # CORS — Next.js(web) 개발 서버
    cors_origins: list[str] = ["http://localhost:3000"]

    # AI 모델 가중치 경로 (ai/ 에서 학습한 best.pt)
    model_path: str = "../ai/runs/detect/cosmetic_bottle/weights/best.pt"

    # AI 에이전트 (반납 어시스턴트) — Claude
    anthropic_api_key: str = ""
    agent_model: str = "claude-opus-4-8"


settings = Settings()
