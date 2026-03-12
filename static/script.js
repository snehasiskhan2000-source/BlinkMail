
// Function for Home Page
async function generateAndRedirect() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.innerHTML = 'Generating... <i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch('/api/generate');
        const data = await response.json();
        window.location.href = `/inbox/${data.email}`;
    } catch (error) {
        console.error("Failed to generate", error);
        if(btn) btn.innerHTML = 'Error. Try Again.';
    }
}

// Function for Inbox Page
function copyEmail() {
    const emailInput = document.getElementById('current-email-input');
    if(!emailInput) return;
    
    // Select and Copy
    emailInput.select();
    emailInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(emailInput.value);
    
    // Animate Button
    const btn1 = document.getElementById('copyBtn1');
    if(btn1) {
        const originalText = btn1.innerHTML;
        btn1.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => { btn1.innerHTML = originalText; }, 2000);
    }
}

async function fetchEmails() {
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    
    if(!emailAddress || !emailAddress.includes('@')) return;
    
    const inputField = document.getElementById('current-email-input');
    if(inputField) inputField.value = emailAddress;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const list = document.getElementById('message-list');
        
        if (messages.length === 0) {
            // Keep the empty state design
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-rotate-right fa-spin" style="font-size:3rem; color:#e0e4eb; margin-bottom:20px;"></i>
                    <h3>Your inbox is empty</h3>
                    <p>Waiting for incoming emails...</p>
                </div>`;
            return;
        }

        // Render received emails
        list.innerHTML = '';
        messages.reverse().forEach(msg => {
            list.innerHTML += `
                <div class="message-row">
                    <div class="msg-sender"><i class="fa-regular fa-circle-user" style="color:var(--primary-green); margin-right:5px;"></i> ${msg.sender}</div>
                    <div class="msg-subject">${msg.subject} <span style="color:#8c92a5; margin-left:10px; font-size:0.85rem;">- ${msg.text.substring(0, 40)}...</span></div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Failed to fetch", error);
    }
}

// Start polling if we are on the inbox page
if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(fetchEmails, 3000); 
}
