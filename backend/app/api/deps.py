from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.employee import Employee

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token, settings.SECRET_KEY)
    if payload is None:
        raise credentials_exception
    user_id_str: Optional[str] = payload.get("sub")
    token_type: Optional[str] = payload.get("type")
    if user_id_str is None or token_type != "access":
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user


def get_current_active_employee(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee and current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )
    return employee


class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return user


require_admin = RoleChecker([UserRole.ADMIN])
require_hr_or_admin = RoleChecker([UserRole.ADMIN, UserRole.HR])
require_any_role = RoleChecker([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE])
