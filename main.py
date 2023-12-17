import json, os
from fastapi import FastAPI, WebSocket, Request, Depends, Response, HTTPException, APIRouter, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.logger import logger
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import SessionLocal
from database import engine, Base
from crud import create_user, get_user_by_username, get_user_friends, get_users_except_friends, add_friend, get_profile, update_profile, create_message, get_messages_by_room, create_chat_room, get_chat_rooms_for_user, get_participants_in_room, add_room_participant
from schema import LoginRequest, SignupRequest

from models import User, Friend, Message

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
Base.metadata.create_all(bind=engine)

IMAGE_STORE_PATH = "static/image"

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, room_id: int):
        self.active_connections[room_id].remove(websocket)
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.websocket("/ws/{room_id}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_name: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, room_id)
    add_room_participant(db, room_id, user_name)
    try:
        messages = get_messages_by_room(db, room_id)
        participants = get_participants_in_room(db, room_id)

        for message in messages:
            message_type = "send" if message.user_name == user_name else "receive"
            await websocket.send_json({"user_name": message.user_name, "content": message.content, "type": message_type, "participants": participants})
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            create_message(db=db, user_name=message_data['user_name'], room_id=room_id, content=message_data['content'])
            message_data['participants'] = participants

            json_message = json.dumps(message_data)
            await manager.broadcast(json_message, room_id)
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        await manager.disconnect(websocket, room_id)

@app.get("/")
async def client(request: Request):
    return templates.TemplateResponse("loginpage.html", {"request": request})

@app.get("/chat/{room_id}")
async def client(request: Request):
    return templates.TemplateResponse("chatpage.html", {"request": request})

@app.get("/api/chat/rooms/{username}")
async def get_user_chat_rooms(username: str, db: Session = Depends(get_db)):
    rooms = get_chat_rooms_for_user(db, username)
    return {"rooms": rooms}

@app.get("/friends")
async def client(request: Request):
    return templates.TemplateResponse("friendlist.html", {"request": request})

@app.get("/chatlist")
async def client(request: Request):
    return templates.TemplateResponse("chatlist.html", {"request": request})

@app.get("/profile/{username}")
async def profile(request: Request, username: str, db: Session = Depends(get_db)):
    profile_data = get_profile(db, username)
    if profile_data:
        return templates.TemplateResponse("profile.html", {
            "request": request,
            "username": profile_data.username,
            "description": profile_data.description  or "No description provided.",
            "image": profile_data.image or "/static/default_profile.jpg"
        })
    else:
        raise HTTPException(status_code=404, detail="Profile not found")
    
@app.get("/api/profile/{username}")
async def get_profile_data(username: str, db: Session = Depends(get_db)):
    try:
        profile_data = get_profile(db, username)
        if profile_data:
            return {
                "username": profile_data.username,
                "description": profile_data.description or "No description provided.",
                "image": profile_data.image or "/static/default_profile.jpg"
            }
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        # 오류 로깅을 위한 추가 코드
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/users")
async def get_users(request: Request, db: Session = Depends(get_db)):
    current_username = request.cookies.get('username')
    users = db.query(User).filter(User.user_name != current_username).all()
    return JSONResponse(status_code=200, content=[user.user_name for user in users])

@app.get("/friends/{username}")
async def get_friends(username: str, db: Session = Depends(get_db)):
    friends = get_user_friends(db, username)
    if friends is None:
        raise HTTPException(status_code=404, detail="User not found")
    return friends

@app.get("/users/except-friends/{username}")
async def get_users_except_friends_endpoint(username: str, db: Session = Depends(get_db)):
    try:
        users = get_users_except_friends(db, username)
        return JSONResponse(status_code=200, content=users)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.post("/login")
async def login(login_request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = get_user_by_username(db, login_request.user_name)
    if user and user.password == login_request.password:
        response.set_cookie(key="username", value=user.user_name, httponly=False)
        # 프론트엔드로 리다이렉트 URL을 JSON으로 응답
        return {"url": "/friends"}
    else:
        # 로그인 실패, 401 Unauthorized 응답
        raise HTTPException(status_code=401, detail="Incorrect username or password")

@app.post("/signup")
async def signup(signup_request: SignupRequest, db: Session = Depends(get_db)):
    user = get_user_by_username(db, signup_request.user_name)
    if user:
        raise HTTPException(status_code=400, detail="User ID already exists.")
    else:
        create_user(db=db, user_name=signup_request.user_name, password=signup_request.password)
        return {"message": "User created successfully. Please log in."}
    
@app.post("/addFriend")
async def add_friend(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    user_name = data['currentUsername']
    friend_name = data['friendName']

    # 이미 친구 관계가 있는지 확인합니다.
    existing_friend = db.query(Friend).filter_by(user_name=user_name, friend_name=friend_name).first()
    if existing_friend:
        return JSONResponse(status_code=400, content={"message": "이미 친구입니다."})

    # 친구 관계를 추가합니다.
    new_friend = Friend(user_name=user_name, friend_name=friend_name)
    db.add(new_friend)
    db.commit()
    return JSONResponse(status_code=200, content={"message": "친구가 추가되었습니다.", "success": True})

async def save_image_file(image_file: UploadFile) -> str:
    file_path = os.path.join(IMAGE_STORE_PATH, image_file.filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as file:
        content = await image_file.read()
        file.write(content)
    return f"/{file_path}"

@app.post("/api/profile/update/{username}")
async def update_profile_data(username: str, description: str = Form(...), image: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        image_path = await save_image_file(image)
        update_profile(db, username, description, image_path)
        return {"success": True, "message": "Profile updated successfully."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {e}"})

@app.post("/api/chat/create")
async def create_chat(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    room_name = data['room_name']

    user_name = request.cookies.get('username')
    if not user_name:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    new_room = create_chat_room(db, user_name, room_name)
    return {"success": True, "room_id": new_room.room_id}

def run():
    import uvicorn
    uvicorn.run(app)

if __name__ == "__main__":
    run()
