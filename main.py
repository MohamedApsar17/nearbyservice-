from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import get_db, get_engine, Base
from sqlalchemy.ext.asyncio import AsyncSession
from db_queries import SimplePasswordAuthDAO,SimplePasswordAuthService
from models import AuthModel
from loguru import logger
from fastapi import status 
from contextlib import asynccontextmanager
from pydantic import SecretStr 
import datetime as dt 

@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = await get_engine()
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("lifespan started")
    yield
    # Base.metadata.drop_all(bind=engine)

auth_tokens = dict()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or specify specific origins)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

async def get_auth_model():
    model = AuthModel()
    return model 

async def get_auth_dao(db: AsyncSession = Depends(get_db),
                 auth_model: AuthModel = Depends(get_auth_model)
                ):
    auth_dao = SimplePasswordAuthDAO(db, auth_model)
    return auth_dao

async def get_auth_service(
        db: AsyncSession = Depends(get_db),
        auth_dao: SimplePasswordAuthDAO = Depends(get_auth_dao)
):
    auth_service = SimplePasswordAuthService(db, auth_dao)
    return auth_service

@app.post("/login")
async def login(
    request: Request,
    auth_service: SimplePasswordAuthService = Depends(get_auth_service)
) -> dict[str, str]:
    try:
        body = await request.json()

        token = await auth_service.authenticate(body.get("username"), SecretStr( body.get("password") ))
    except HTTPException as e:
        logger.error(f"Error while authenticating user: {e}")
        raise e
    except Exception as e:
        logger.error(f"Error while authenticating user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=1)  # Token expires in 1 day

    auth_tokens[token] = body["username"] 
    logger.debug(f"Token Generated is: {token}")
    return {
        "token": token,
        "expires_at": expires_at.isoformat() + "Z"  # ISO 8601 format with UTC timezone
    }

@app.post("/is_valid_token")
async def is_valid_token(r: Request):
    token = r.headers.get("Authorization")
    logger.debug(r.headers)
    logger.debug(token)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    
    token = token.split(" ")[1].strip()
    if auth_tokens.get( token ) is not None:
        status = True
        return {
            "valid": status
        }
    logger.debug(f"Status of Auth Token: {auth_tokens} is {status}")
    return {
        "valid": status
    }

@app.post("/register")
async def register(
    request: Request,
    auth_service: SimplePasswordAuthService = Depends(get_auth_service)
    ):
    try:
        body = await request.json()
        print(body)
        resp = await auth_service.create_auth_user(body.get("username"), body.get("location"), SecretStr( body.get("password") ))
    except HTTPException as e:
        raise e 
    except Exception as e:
        logger.error(f"Error while registering user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return {}