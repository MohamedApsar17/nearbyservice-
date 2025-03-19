from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from models import AuthModel
from models import UserModel
from pydantic import SecretStr
from loguru import logger
import string
import secrets


class SimplePasswordAuthDAO:
    def __init__(self, session: AsyncSession, model: type[AuthModel] = AuthModel):
        self.session = session
        self.model = model

    async def authenticate(self, username: str, password: str) -> Optional[AuthModel]:
        """
        Authenticate a user by username and password.
        Returns the AuthModel instance if authentication succeeds, otherwise None.
        """
        # Join User and Auth tables to fetch the relevant data
        query = (
            select(AuthModel)
            .join(UserModel, UserModel.id == AuthModel.user_id)
            .where(UserModel.username == username)
        )
        result = await self.session.execute(query)
        auth = result.scalars().first()

        # Check if the user exists and the password matches
        if auth and bcrypt.checkpw(
            password.encode("utf-8"),
            auth.password.encode("utf-8"),
        ):
            return auth
        else:
            return None
        
    async def create_user(self, username: str, location: str, password: str) -> dict:
        """
        Creates a new user and their associated authentication record.
        Ensures ACID properties using a database transaction.
        """
        # Hash the password before storing it
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        try:
            # Start a transaction
            async with self.session.begin():
                # Create the UserModel instance
                user = UserModel(username=username, location=location)
                self.session.add(user)

                # Flush to generate the user ID (required for the foreign key in AuthModel)
                await self.session.flush()

                print("before auth")
                # Create the AuthModel instance
                auth = AuthModel(user_id=user.id, password=hashed_password.decode("utf-8"))
                self.session.add(auth)
                print("after auth")


            # Return the created user and auth details
            print("after session")
            # return {
            #     "user_id": user.id,
            #     "username": user.username,
            #     "message": "User created successfully",
            # }

        except IntegrityError as e:
            # Handle unique constraint violations (e.g., duplicate username or email)
            logger.error( f"Failed to create user: {str(e)}, {str(e.orig)}" )
            raise e
        
def generate_token(length: int = 32) -> str:
    """Generate a secure random session token.

    Args:
        length (int): The length of the token. Default is 32 characters.

    Returns:
        str: A secure random session token.
    """
    # Define the character set: letters and digits
    characters = string.ascii_letters + string.digits

    # Generate a secure random token
    token = "".join(secrets.choice(characters) for _ in range(length))

    return token


from fastapi import HTTPException
from fastapi import status
class SimplePasswordAuthService:
    def __init__(
        self,
        session: AsyncSession,
        auth_dao: SimplePasswordAuthDAO,
    ) -> None:
        self.session = session
        self.auth_dao = auth_dao

    async def authenticate(self, username: str, password: SecretStr):

        auth_status = await self.auth_dao.authenticate(
            username, password.get_secret_value()
        )
        if auth_status:
            logger.info("User authenticated successfully, Generating token")
            token = generate_token()
            logger.info("Token generated")
            return token

        logger.info("Invalid username or password, User not authenticated")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    async def create_auth_user(self, username: str, location: str, password: SecretStr):
        try:
            auth = await self.auth_dao.create_user(username, location, password.get_secret_value())
        except IntegrityError as e:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="User Already Exist")
        
        return auth