# Message 모델과 관련된 CRUD 작업을 위한 함수
from pydantic import BaseModel

class SignupRequest(BaseModel):
    user_name: str
    password: str

class LoginRequest(BaseModel):
    user_name: str
    password: str

class MessageBase(BaseModel):
    user_name: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    user_id: int

    class Config:
        orm_mode = True
