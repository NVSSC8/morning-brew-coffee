import json
import os
import logging

logger = logging.getLogger(__name__)

def get_db_credentials_from_secrets_manager():
    """
    Retrieves database credentials from AWS Secrets Manager if configured.
    Falls back gracefully if AWS credentials are not set or running in local dev.
    """
    secret_name = os.getenv("AWS_SECRET_NAME")
    region_name = os.getenv("AWS_REGION", "us-east-1")

    if not secret_name:
        # Not using Secrets Manager (standard local or env-variable mode)
        return None

    try:
        import boto3
        from botocore.exceptions import ClientError

        client = boto3.client("secretsmanager", region_name=region_name)
        response = client.get_secret_value(SecretId=secret_name)
        
        if "SecretString" in response:
            secret = json.loads(response["SecretString"])
            logger.info("Successfully fetched secrets from AWS Secrets Manager.")
            return secret
        return None
    except Exception as e:
        logger.warning(f"Failed to fetch secrets from AWS Secrets Manager: {e}. Falling back to environment variables.")
        return None
