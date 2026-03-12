function preventReload(e) {
    if (e) e.preventDefault();
}

async function changeEmail(e) {
    preventReload(e);
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating...';
    
    try {
        const response = await fetch('/api/generate');
        const data = await response.json();
        window.location.href = `/inbox/${data.email}`;
    } catch (error) {
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }
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
    const emailInput = document.getElementById('current-email-input');
    if(!emailInput) return;
    
    emailInput.select();
    emailInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(emailInput.value);
    
    const widgetBtn = document.getElementById('widgetCopyBtn');
    if(widgetBtn) {
        const originalHTML = widgetBtn.innerHTML;
        widgetBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => { widgetBtn.innerHTML = originalHTML; }, 2000);
    }

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

function showQR(e) {
    preventReload(e);
    const emailInput = document.getElementById('current-email-input');
    if(!emailInput || !emailInput.value) return;
    
    const qrImg = document.getElementById('qrImage');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mailto:${emailInput.value}`;
    
    const modal = document.getElementById('qrModal');
    modal.classList.add('show');
}

function closeQR() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('show');
}

window.onclick = function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target === modal) {
        closeQR();
    }
}

async function fetchEmails(e) {
    if(e) preventReload(e);
    
    const urlParts = window.location.pathname.split('/');
    const emailAddress = urlParts[urlParts.length - 1];
    
    if(!emailAddress || !emailAddress.includes('@')) return;
    
    const badgeElement = document.getElementById('current-email-display');
    if(badgeElement) badgeElement.innerText = emailAddress;
    
    const inputElement = document.getElementById('current-email-input');
    if(inputElement) inputElement.value = emailAddress;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        
        // 🪄 The Bulletproof UI Fix
        const emptyState = document.getElementById('empty-state');
        const emailsContainer = document.getElementById('emails-container');
        
        if (messages.length === 0) {
            emptyState.style.display = 'block';
            emailsContainer.innerHTML = '';
            return;
        }

        // Hide spinner and draw emails!
        emptyState.style.display = 'none';
        
        let newHTML = '';
        messages.reverse().forEach(msg => {
            newHTML += `
                <div class="message-row">
                    <div class="msg-sender"><i class="fa-solid fa-circle-user" style="color:var(--neon-blue); margin-right:8px;"></i>${msg.sender}</div>
                    <div class="msg-subject"><span style="color:#fff;">${msg.subject}</span> - ${msg.text.substring(0, 50)}...</div>
                </div>
            `;
        });
        
        if (emailsContainer.innerHTML !== newHTML) {
            emailsContainer.innerHTML = newHTML;
        }

    } catch (error) {
        console.error("Failed to fetch", error);
    }
}

if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(() => fetchEmails(), 4000); 
}
