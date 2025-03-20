from db import Base
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy import String, ForeignKey


class UserModel(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(50), unique=False, nullable=False)
    # Define the one-to-one relationship
    auth: Mapped["AuthModel"] = relationship("AuthModel", back_populates="user", uselist=False)


class AuthModel(Base):
    __tablename__ = "auth"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
        autoincrement=False,
        nullable=False,
    )
    password: Mapped[str] = mapped_column(String(255))

    # Define the one-to-one relationship
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="auth")