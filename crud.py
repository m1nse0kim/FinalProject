# 메시지를 생성하고 조회하는 함수
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, and_, func
from models import User, Message, Friend, Profile, ChatRoom, RoomParticipant

def create_user(db: Session,  user_name: str, password: str) -> User:
    db_user = User(user_name=user_name, password=password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    default_image = "/static/image/basic_profile.jpg"
    create_profile(db=db, username=user_name, description=None, image=default_image)
    return db_user

def get_user_by_username(db: Session, user_name: str) -> User:
    return db.query(User).filter(User.user_name == user_name).first()

def get_user_friends(db: Session, user_name: str):
    user = db.query(User).filter(User.user_name == user_name).first()
    if not user:
        return None

    friends_relationship = db.query(Friend).filter(Friend.user_name == user_name).all()
    friends_list = [relationship.friend_name for relationship in friends_relationship]
    return friends_list

def get_users_except_friends(db: Session, username: str):
    # 현재 사용자의 친구 목록을 가져옵니다.
    current_user_friends = db.query(Friend).filter(Friend.user_name == username).all()

    # 친구 이름 목록을 추출합니다. 친구 목록이 없는 경우 빈 리스트를 사용합니다.
    friend_names = [friend.friend_name for friend in current_user_friends] if current_user_friends else []
    
    # 현재 사용자와 친구를 제외한 모든 사용자를 가져옵니다.
    all_users_except_friends = db.query(User).filter(~User.user_name.in_(friend_names + [username])).all()
    return [user.user_name for user in all_users_except_friends]

def add_friend(db: Session, user_name: str, friend_name: str):
    db_friend = Friend(user_name=user_name, friend_name=friend_name)
    db.add(db_friend)
    db.commit()
    db.refresh(db_friend)
    return db_friend

def get_profile(db: Session, username: str) -> Profile:
    profile = db.query(Profile).filter(Profile.username == username).first()

    if not profile:
        # If not exist, create a new profile with default values
        profile = Profile(
            username=username, 
            description=None, 
            image="/static/image/basic_profile.jpg"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def create_profile(db: Session, username: str, description: str, image: str) -> Profile:
    db_profile = Profile(username=username, description=description, image=image)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_profile(db: Session, username: str, description: str, image: str):
    db_profile = get_profile(db, username)
    if db_profile:
        db_profile.description = description
        db_profile.image = image
        db.commit()
        db.refresh(db_profile)
    return db_profile

def create_chat_room(db: Session, user_name: str, room_name: str):
    existing_room = db.query(ChatRoom).filter(
        or_(
            and_(ChatRoom.user_name == user_name, ChatRoom.room_name == room_name),
            and_(ChatRoom.user_name == room_name, ChatRoom.room_name == user_name)
        )
    ).first()
    if existing_room:
        return existing_room
    
    new_room = ChatRoom(user_name=user_name, room_name=room_name)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

def get_messages_by_room(db: Session, room_id: int):
    return db.query(Message).filter(Message.room_id == room_id).all()

def get_chat_rooms_for_user(db: Session, user_name: str):
    rooms = db.query(
        ChatRoom.room_id,
        ChatRoom.user_name,
        ChatRoom.room_name,
        func.max(Message.created_at).label('last_message_time'),
        func.max(Message.content).label('last_message')
    ).outerjoin(Message, ChatRoom.room_id == Message.room_id) \
    .filter(or_(ChatRoom.user_name == user_name, ChatRoom.room_name == user_name)) \
    .group_by(ChatRoom.room_id, ChatRoom.user_name, ChatRoom.room_name) \
    .order_by(func.max(Message.created_at).desc()) \
    .all()

    return [{
        'room_id': room.room_id,
        'room_name': room.room_name if room.user_name == user_name else room.user_name,
        'last_message': room.last_message
    } for room in rooms]

    return [{
        'room_id': room.room_id,
        'room_name': room.room_name,
        'last_message': room.last_message,
        'last_message_time': room.last_message_time.isoformat() if room.last_message_time else None
    } for room in rooms]


def get_participants_in_room(db: Session, room_id: int):
    participants = db.query(RoomParticipant.user_name).filter(RoomParticipant.room_id == room_id).distinct().all()
    return [participant.user_name for participant in participants]

def add_room_participant(db: Session, room_id: int, user_name: str):
    existing_participant = db.query(RoomParticipant).filter_by(room_id=room_id, user_name=user_name).first()
    if not existing_participant:
        new_participant = RoomParticipant(room_id=room_id, user_name=user_name)
        db.add(new_participant)
        db.commit()

def create_message(db: Session, user_name: str, room_id: int, content: str):
    db_message = Message(user_name=user_name, room_id=room_id, content=content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message