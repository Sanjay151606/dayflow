from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.schemas.user import UserRegister, UserLogin, Token, TokenRefresh, UserResponse
from app.api.deps import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    # Check if email exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    # Check if employee_id exists
    if db.query(User).filter(User.employee_id == user_in.employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this employee ID already exists"
        )

    # Create User
    new_user = User(
        employee_id=user_in.employee_id,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_verified=True,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create associated employee profile
    new_employee = Employee(
        user_id=new_user.id,
        first_name=user_in.first_name or "New",
        last_name=user_in.last_name or "Employee",
        department="General",
        designation=user_in.role.value
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db,
        user_id=new_user.id,
        action="REGISTER",
        entity="USER",
        entity_id=str(new_user.id),
        new_value={"email": new_user.email, "role": new_user.role.value},
        ip_address=request.client.host if request.client else None
    )

    return new_user


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    log_audit_event(
        db,
        user_id=user.id,
        action="LOGIN",
        entity="USER",
        entity_id=str(user.id),
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "employee_id": user.employee_id,
        "email": user.email
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    payload = decode_token(refresh_data.refresh_token, settings.REFRESH_TOKEN_SECRET)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "employee_id": user.employee_id,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    payload = decode_token(token, settings.SECRET_KEY)
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user:
        user.is_verified = True
        db.commit()
        return {"message": "Email verified successfully"}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
