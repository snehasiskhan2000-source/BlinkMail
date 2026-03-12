// This function STOPS the page from reloading when you click a button
function preventReload(e) {
    if (e) e.preventDefault();
}

function goToHome(e) {
    preventReload(e);
    window.location.href = '/';
}

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

function copyEmail(e) {
    preventReload(e);
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    if(!emailAddress) return;
    
    navigator.clipboard.writeText(emailAddress);
    
    const btn = document.getElementById('copyBtn');
    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--neon-blue);"></i> Copied!';
        setTimeout(() => { 
            btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; 
        }, 2000);
    }
}

async function fetchEmails(e) {
    preventReload(e);
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    
    if(!emailAddress || !emailAddress.includes('@')) return;
    
    const displayElement = document.getElementById('current-email-display');
    if(displayElement) displayElement.innerText = emailAddress;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const list = document.getElementById('message-list');
        
        if (messages.length === 0) {
            // THE EXACT INFINITE SPINNER
            list.innerHTML = `
                <div class="empty-state">
                    <div class="spin-container">
                        <i class="fa-solid fa-envelope"></i>
                        <div class="spin-ring"></div>
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

// Ensure it starts polling seamlessly in the background
if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(() => fetchEmails(), 4000); 
}
