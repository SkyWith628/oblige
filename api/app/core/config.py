from pydantic import field_validator
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

    # AI 에이전트 (반납 어시스턴트) — 백엔드 선택: "gemini"(기본) | "claude"
    #   gemini : Gemini 2.5 Flash, GOOGLE_API_KEY 필요, 배포 가능.
    #   claude : Claude Agent SDK(구독 인증), 로컬 전용(배포 서버엔 로그인 없음).
    agent_backend: str = "gemini"

    # Gemini (현행) — GOOGLE_API_KEY 환경변수에서 로드.
    google_api_key: str = ""
    agent_model: str = "gemini-2.5-flash"

    # Claude (구독, Claude Agent SDK). None 이면 Claude Code CLI 기본 모델 사용.
    agent_model_claude: str | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_db_scheme(cls, v: str) -> str:
        """psycopg3 드라이버 스킴 강제.

        Railway 등 매니지드 Postgres는 `postgresql://`(또는 구형 `postgres://`)
        스킴을 주는데, SQLAlchemy는 이 경우 기본 드라이버로 psycopg2를 찾는다.
        우리는 psycopg3(`psycopg[binary]`)만 설치하므로 명시적으로
        `postgresql+psycopg://`로 교정해 부팅 시 ModuleNotFoundError를 막는다.
        """
        if not isinstance(v, str):
            return v
        if v.startswith("postgresql+"):  # 이미 드라이버 명시됨
            return v
        for prefix in ("postgresql://", "postgres://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v


settings = Settings()
