// Function for Home Page: Generate Email and Redirect
async function generateAndRedirect() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.innerText = "Generating... 💀";
    
    try {
        const response = await fetch('/api/generate');
        const data = await response.json();
        // Redirect to the dynamic inbox URL!
        window.location.href = `/inbox/${data.email}`;
    } catch (error) {
        console.error("Failed to generate email", error);
        if(btn) btn.innerText = "Error. Try Again.";
    }
}

// Function for Inbox Page: Handle Clipboard
function copyEmail() {
    const email = document.getElementById('current-email').innerText;
    navigator.clipboard.writeText(email);
    
    const btn = document.getElementById('copyBtn');
    btn.innerText = "Copied! ✓";
    setTimeout(() => { btn.innerText = "Copy"; }, 2000);
}

// Function for Inbox Page: Fetch Emails
async function fetchEmails() {
    // Extract the email from the URL (e.g., /inbox/test@techbittu.co.uk)
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    
    if(!emailAddress || !emailAddress.includes('@')) return;
    
    document.getElementById('current-email').innerText = emailAddress;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const list = document.getElementById('message-list');
        
        if (messages.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: #888; padding: 40px;">Waiting for incoming emails... ⏳</div>`;
            return;
        }

        list.innerHTML = '';
        messages.reverse().forEach(msg => {
            list.innerHTML += `
                <div class="message-card">
                    <div class="sender">${msg.sender}</div>
                    <div class="subject">${msg.subject}</div>
                    <div class="body-preview">${msg.text}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Failed to fetch messages", error);
    }
}

// Check which page we are on and start logic
if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(fetchEmails, 3000); // Auto-refresh every 3 seconds
}
