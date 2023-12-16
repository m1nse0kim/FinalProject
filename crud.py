# 메시지를 생성하고 조회하는 함수
from sqlalchemy.orm import Session

from models import Message

def get_messages(db: Session):
    return db.query(Message).all()

def create_message(db: Session, user_id: str, content: str):
    db_message = Message(user_id=user_id, content=content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message
