import os
from dotenv import load_dotenv
from aws_secrets import get_db_credentials_from_secrets_manager

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "morning-brew-secret-key-super-secure-dawn-2026")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Check if database credentials should come from AWS Secrets Manager
    secrets = get_db_credentials_from_secrets_manager()
    if secrets:
        # Expected keys in AWS Secret: username, password, host, port, dbname
        user = secrets.get("username", "postgres")
        password = secrets.get("password", "")
        host = secrets.get("host", "localhost")
        port = secrets.get("port", 5432)
        dbname = secrets.get("dbname", "coffee_db")
        SQLALCHEMY_DATABASE_URI = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    else:
        # Fall back to DATABASE_URL environment variable, or local SQLite for easy instant run
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "DATABASE_URL", 
            f"sqlite:///{os.path.join(os.path.abspath(os.path.dirname(__file__)), 'coffee_shop.db')}"
        )
