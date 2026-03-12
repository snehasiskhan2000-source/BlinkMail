import os
import random
import string
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Mount the static folder for CSS, JS, and HTML
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ephemeral Database for BlinkMail
inbox_db = {}

# 🪄 THE MASTER LIST: Real 5-letter names for premium generation
NAMES = [
    "james", "david", "chris", "sarah", "maria", "kevin", "jason", 
    "peter", "lucas", "simon", "frank", "harry", "julia", "alice", 
    "steve", "brian", "clara", "diana", "elena", "felix", "grace", 
    "henry", "irene", "jacob", "karen", "laura", "mason", "nolan", 
    "paula", "quinn", "roman", "scott", "tanya", "vance", "wendy"
]

# 🪄 Added @app.head to accept UptimeRobot pings!
@app.get("/")
@app.head("/")
async def home():
    """Serves the Premium Home Page"""
    return FileResponse("static/index.html")

@app.get("/inbox/{email}")
async def view_inbox(email: str):
    """Serves the Inbox Page"""
    return FileResponse("static/inbox.html")

@app.get("/api/generate")
async def generate_email():
    """Generates a realistic BlinkMail address 💀"""
    name = random.choice(NAMES)
    numbers = ''.join(random.choice(string.digits) for _ in range(3))
    email = f"{name}{numbers}@blinkmail.techbittu.co.uk"
    return {"email": email}

@app.get("/api/messages/{email}")
async def get_messages(email: str):
    return inbox_db.get(email, [])

class IncomingEmail(BaseModel):
    to: str
    sender: str
    subject: str
    text: str

@app.post("/api/webhook")
async def receive_email(email: IncomingEmail):
    """Cloudflare posts intercepted emails here"""
    recipient = email.to.lower()
    if recipient not in inbox_db:
        inbox_db[recipient] = []
        
    inbox_db[recipient].append({
        "sender": email.sender,
        "subject": email.subject,
        "text": email.text
    })
    return {"status": "success"}

# 🪄 Added @app.head to accept UptimeRobot pings!
@app.get("/ping")
@app.head("/ping")
async def ping():
    return {"status": "BlinkMail is alive 💀"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
    
