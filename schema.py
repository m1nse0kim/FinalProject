# Message 모델과 관련된 CRUD 작업을 위한 함수
from pydantic import BaseModel

class MessageBase(BaseModel):
    user_id: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int

    class Config:
        orm_mode = True
