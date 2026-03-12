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
    
    // Copy from the new widget input box
    const emailInput = document.getElementById('current-email-input');
    if(!emailInput) return;
    
    emailInput.select();
    emailInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(emailInput.value);
    
    // Animate the Green Widget Button
    const widgetBtn = document.getElementById('widgetCopyBtn');
    if(widgetBtn) {
        const originalHTML = widgetBtn.innerHTML;
        widgetBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => { widgetBtn.innerHTML = originalHTML; }, 2000);
    }

    // Animate the Dim Grid Button
    const gridBtn = document.getElementById('copyBtn');
    if(gridBtn) {
        gridBtn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--neon-blue);"></i> Copied!';
        gridBtn.style.borderColor = "var(--neon-blue)";
        gridBtn.style.boxShadow = "0 0 20px var(--neon-glow)";
        setTimeout(() => { 
            gridBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; 
            gridBtn.style.borderColor = "var(--border-dim)";
            gridBtn.style.boxShadow = "none";
        }, 2000);
    }
}

async function fetchEmails(e) {
    preventReload(e);
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    
    if(!emailAddress || !emailAddress.includes('@')) return;
    
    // Update both displays
    const badgeElement = document.getElementById('current-email-display');
    if(badgeElement) badgeElement.innerText = emailAddress;
    
    const inputElement = document.getElementById('current-email-input');
    if(inputElement) inputElement.value = emailAddress;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const list = document.getElementById('message-list');
        
        if (messages.length === 0) {
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
                    <div class="msg-sender"><i class="fa-solid fa-circle-user" style="color:var(--neon-blue); margin-right:8px;"></i>${msg.sender}</div>
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
    setInterval(() => fetchEmails(), 4000); 
}
