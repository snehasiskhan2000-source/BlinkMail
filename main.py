import os
import random
import string
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Mount the static folder for CSS and JS
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ephemeral Database for BlinkMail
inbox_db = {}

@app.get("/")
async def home():
    """Serves the Premium Home Page"""
    return FileResponse("static/index.html")

@app.get("/inbox/{email}")
async def view_inbox(email: str):
    """Serves the Inbox Page (frontend JS will parse the URL)"""
    return FileResponse("static/inbox.html")

@app.get("/api/generate")
async def generate_email():
    """Generates the random BlinkMail address"""
    chars = string.ascii_lowercase + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(10))
    email = f"{random_str}@techbittu.co.uk"
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

@app.get("/ping")
async def ping():
    return {"status": "BlinkMail is alive 💀"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
    
