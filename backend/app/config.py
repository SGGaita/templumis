from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_user: str = "templumis"
    postgres_password: str = "changeme_secure_password"
    postgres_db: str = "templumis_db"
    postgres_host: str = "db"
    postgres_port: int = 5432

    backend_secret_key: str = "changeme_jwt_secret_key"
    backend_debug: bool = True

    cors_origins_str: str = "http://localhost:3000,http://localhost"
    app_base_url: str = "http://localhost:3000"
    
    # Email settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "TemplumIS <no-reply@templumis.org>"

    # Optional Ahrefs API v3 token for live Webometrics Visibility (referring domains)
    ahrefs_api_token: str = ""
    
    @property
    def SMTP_HOST(self) -> str:
        return self.smtp_host
    
    @property
    def SMTP_PORT(self) -> int:
        return self.smtp_port
    
    @property
    def SMTP_USER(self) -> str:
        return self.smtp_user
    
    @property
    def SMTP_PASSWORD(self) -> str:
        return self.smtp_password
    
    @property
    def FROM_EMAIL(self) -> str:
        return self.from_email

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",")]

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
