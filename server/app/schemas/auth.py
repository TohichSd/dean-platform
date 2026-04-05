from pydantic import BaseModel


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class AuthMeResponse(BaseModel):
    user_id: int
    login: str
    role_id: int
    role_name: str
    first_name: str
    last_name: str
    surname: str | None = None