async function generateAndRedirect() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.innerHTML = 'Generating... <i class="fa-solid fa-circle-notch fa-spin"></i>';
    
    try {
        const response = await fetch('/api/generate');
        const data = await response.json();
        window.location.href = `/inbox/${data.email}`;
    } catch (error) {
        if(btn) btn.innerHTML = 'Error. Try Again.';
    }
}

function copyEmail() {
    const emailInput = document.getElementById('current-email-input');
    if(!emailInput) return;
    
    emailInput.select();
    emailInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(emailInput.value);
    
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
            // EXACT Custom Empty State Animation
            list.innerHTML = `
                <div class="empty-state">
                    <div class="anim-wrapper">
                        <i class="fa-solid fa-envelope anim-envelope"></i>
                        <div class="anim-ring"></div>
                    </div>
                    <h3>Your inbox is empty</h3>
                    <p>Waiting for incoming emails...</p>
                </div>`;
            return;
        }

        list.innerHTML = '';
        messages.reverse().forEach(msg => {
            list.innerHTML += `
                <div class="message-row">
                    <div class="msg-sender">${msg.sender}</div>
                    <div class="msg-subject"><span style="color:#fff;">${msg.subject}</span> - ${msg.text.substring(0, 50)}...</div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Failed to fetch", error);
    }
}

if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(fetchEmails, 3000); 
}
