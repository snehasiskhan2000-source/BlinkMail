import os
import random
import string
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# The "Database" - since Render spins down, free ephemeral memory is perfect for temporary mail!
inbox_db = {}

# --- The Premium HTML/CSS/JS Template ---
# We are embedding it here so everything runs from one deadly script.
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Mail | TechBittu</title>
    <style>
        :root {
            --bg-color: #050505;
            --panel-bg: #111111;
            --neon-blue: #00e5ff;
            --text-main: #ffffff;
            --text-muted: #888888;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .header {
            margin-top: 50px;
            text-align: center;
            animation: fadeInDown 1s ease-out;
        }
        .header h1 {
            font-size: 2.5rem;
            margin: 0;
            text-shadow: 0 0 10px var(--neon-blue);
        }
        .header span { color: var(--neon-blue); }
        
        .email-box {
            background-color: var(--panel-bg);
            border: 1px solid var(--neon-blue);
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
            border-radius: 12px;
            padding: 20px 40px;
            margin-top: 40px;
            display: flex;
            align-items: center;
            gap: 20px;
            animation: pulse 2s infinite;
        }
        .email-text { font-size: 1.5rem; font-weight: bold; letter-spacing: 1px; }
        .btn {
            background-color: transparent;
            color: var(--neon-blue);
            border: 1px solid var(--neon-blue);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background-color: var(--neon-blue);
            color: #000;
            box-shadow: 0 0 15px var(--neon-blue);
        }
        
        .inbox-container {
            width: 90%;
            max-width: 800px;
            margin-top: 50px;
            animation: fadeInUp 1s ease-out;
        }
        .inbox-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: var(--text-muted);
        }
        .message-card {
            background-color: var(--panel-bg);
            border-left: 4px solid var(--neon-blue);
            padding: 15px 20px;
            border-radius: 6px;
            margin-bottom: 15px;
            transition: transform 0.2s;
        }
        .message-card:hover { transform: translateX(10px); }
        .msg-sender { font-weight: bold; color: var(--neon-blue); margin-bottom: 5px; }
        .msg-subject { font-size: 1.1rem; margin-bottom: 10px; }
        .msg-body { color: var(--text-muted); font-size: 0.9rem; }
        
        .loader {
            display: inline-block;
            width: 20px; height: 20px;
            border: 3px solid rgba(0,229,255,0.3);
            border-radius: 50%;
            border-top-color: var(--neon-blue);
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 15px rgba(0, 229, 255, 0.1); } 50% { box-shadow: 0 0 25px rgba(0, 229, 255, 0.4); } 100% { box-shadow: 0 0 15px rgba(0, 229, 255, 0.1); } }
    </style>
</head>
<body>

    <div class="header">
        <h1>Tech<span>Bittu</span> Mail 💀</h1>
        <p>Ultra-Premium Disposable Inbox</p>
    </div>

    <div class="email-box">
        <div class="email-text" id="email-display">{{ email_address }}</div>
        <button class="btn" onclick="copyEmail()">Copy</button>
        <button class="btn" onclick="window.location.href='/'">New ♻️</button>
    </div>

    <div class="inbox-container">
        <div class="inbox-header">
            <div>Inbox for <b>{{ email_address }}</b></div>
            <div>Waiting for emails <span class="loader"></span></div>
        </div>
        
        <div id="messages-area">
            <div style="text-align:center; color:#888; margin-top:40px;">
                Your inbox is currently empty.<br>Incoming emails will appear here instantly.
            </div>
        </div>
    </div>

    <script>
        const currentEmail = "{{ email_address }}";
        
        function copyEmail() {
            navigator.clipboard.writeText(currentEmail);
            alert("Email copied to clipboard! 💀");
        }

        async function fetchMessages() {
            try {
                const response = await fetch(`/api/messages/${currentEmail}`);
                const messages = await response.json();
                
                if (messages.length > 0) {
                    const area = document.getElementById('messages-area');
                    area.innerHTML = ''; // Clear empty state
                    
                    // Reverse to show newest first
                    messages.reverse().forEach(msg => {
                        area.innerHTML += `
                            <div class="message-card">
                                <div class="msg-sender">From: ${msg.sender}</div>
                                <div class="msg-subject">Subject: ${msg.subject}</div>
                                <div class="msg-body">${msg.text}</div>
                            </div>
                        `;
                    });
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }

        // Poll the server for new emails every 3 seconds!
        setInterval(fetchMessages, 3000);
        fetchMessages(); // Run once on load
    </script>
</body>
</html>
"""

# --- Web Routes ---

def generate_random_email():
    """Generates a random 8-character email string."""
    chars = string.ascii_lowercase + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(8))
    return f"{random_str}@techbittu.co.uk"

@app.get("/")
async def home():
    """Visiting the root creates a new random email and redirects to its inbox."""
    new_email = generate_random_email()
    return HTMLResponse(content=HTML_TEMPLATE.replace("{{ email_address }}", new_email))

@app.get("/inbox/{email_address}")
async def view_inbox(email_address: str):
    """The clean routing URL for specific inboxes!"""
    return HTMLResponse(content=HTML_TEMPLATE.replace("{{ email_address }}", email_address))

# --- API Routes (The Background Mechanics) ---

@app.get("/api/messages/{email_address}")
async def get_messages(email_address: str):
    """The frontend JavaScript calls this to get new emails."""
    return inbox_db.get(email_address, [])

class IncomingEmail(BaseModel):
    to: str
    sender: str
    subject: str
    text: str

@app.post("/api/webhook")
async def receive_email(email: IncomingEmail):
    """Cloudflare Workers will secretly POST all incoming emails right here!"""
    recipient = email.to.lower()
    
    if recipient not in inbox_db:
        inbox_db[recipient] = []
        
    inbox_db[recipient].append({
        "sender": email.sender,
        "subject": email.subject,
        "text": email.text
    })
    
    return {"status": "success", "message": "Email intercepted successfully 💀"}

# --- Uptime Robot Route ---
@app.get("/ping")
async def ping():
    return {"status": "alive 💀"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
  
