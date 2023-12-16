from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True)
    password = Column(String)

class Friend(Base):
    __tablename__ = "friends"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True)
    friend_name = Column(String, index=True)

class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, unique=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    room_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True) # 채팅방을 생성한 사용자
    room_name = Column(String, index=True) # 상대방 사용자
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True)
    room_id = Column(Integer)
    content = Column(String)
    created_at = Column(DateTime, index=True, default=datetime.utcnow)

class RoomParticipant(Base):
    __tablename__ = "room_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer)
    user_name = Column(String)