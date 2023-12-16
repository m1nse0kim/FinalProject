import json
from fastapi import FastAPI, WebSocket, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.logger import logger
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import SessionLocal
from database import engine, Base
from crud import create_message, get_messages

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")
Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
                await connection.send_text(message)

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        messages = get_messages(db)
        for message in messages:
            message_type = "send" if message.user_id == user_id else "receive"
            await websocket.send_json({"user_id": message.user_id, "content": message.content, "type": message_type})
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            create_message(db=db, user_id=message_data['user_id'], content=message_data['content'])

            json_message = json.dumps(message_data)
            await manager.broadcast(json_message)
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        await manager.disconnect(websocket)

@app.get("/")
async def client(request: Request):
    return templates.TemplateResponse("loginpage.html", {"request": request})

@app.get("/chat")
async def client(request: Request):
    return templates.TemplateResponse("chatpage.html", {"request": request})

@app.get("/friendlist")
async def client(request: Request):
    return templates.TemplateResponse("friendlist.html", {"request": request})

@app.get("/chatlist")
async def client(request: Request):
    return templates.TemplateResponse("chatlist.html", {"request": request})

@app.get("/profile")
async def client(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

def run():
    import uvicorn
    uvicorn.run(app)

if __name__ == "__main__":
    run()
