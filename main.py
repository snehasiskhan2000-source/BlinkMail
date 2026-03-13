import os
import random
import string
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

inbox_db = {}

# 🪄 THE MASSIVE MASTER LIST (Indian + Global Names)
NAMES = [
    "aarav", "aditya", "amit", "anjali", "arjun", "aryan", "ayush", "deepak", "divya", "gaurav",
    "harsh", "ishaan", "karan", "kavya", "kiran", "krishna", "manish", "meha", "neha", "nikhil",
    "nisha", "pooja", "pranav", "priya", "rahul", "raj", "riya", "rohan", "rohit", "sachin",
    "sameer", "sanjay", "sneha", "sumit", "sunil", "suraj", "swati", "tarun", "varun", "vikas",
    "vikram", "vishal", "yash", "zoya", "abhishek", "akash", "ankit", "ashish", "chetna", "darshan",
    "gautam", "hari", "isha", "jyoti", "kamal", "kunal", "lakshmi", "madhav", "manoj", "maya",
    "mohan", "mukesh", "naveen", "nitin", "pallavi", "pankaj", "piyush", "pradeep", "prakash", "pramod",
    "prashant", "praveen", "preeti", "radha", "raghav", "rajan", "rajesh", "rajiv", "rakesh", "ramesh",
    "ravi", "rekha", "rishabh", "ritu", "roshni", "sahil", "sandeep", "sangeeta", "sanjiv", "saurabh",
    "shankar", "shikha", "shilpa", "shivam", "shreya", "shruti", "shweta", "siddharth", "sonam", "sonia",
    "sourabh", "srinivas", "subhash", "sudhir", "sujata", "suresh", "sushil", "sushma", "swapnil", "sweta",
    "umesh", "upendra", "utkarsh", "vaibhav", "vandana", "vidya", "vijay", "vikash", "vinay", "vineet",
    "vinod", "vipul", "virendra", "vishnu", "vivek", "james", "david", "chris", "sarah", "maria", 
    "kevin", "jason", "peter", "lucas", "simon", "frank", "harry", "julia", "alice", "steve"
]

@app.get("/")
@app.head("/")
async def home():
    return FileResponse("static/index.html")

@app.get("/inbox/{email}")
@app.get("/mailbox")
async def view_mailbox():
    """Serves the secure, cloaked Inbox Page"""
    return FileResponse("static/inbox.html")

@app.get("/message")
async def view_message():
    """Serves the secure, cloaked Reader Page"""
    return FileResponse("static/read.html")
    
@app.get("/api/generate")
async def generate_email():
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
@app.head("/ping")
async def ping():
    return {"status": "BlinkMail is alive 💀"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
    
