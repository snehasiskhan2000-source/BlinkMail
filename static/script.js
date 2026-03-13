let currentMessages = []; // 🪄 Securely holds email data to prevent newline crashes

function preventReload(e) { if (e) e.preventDefault(); }

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
    document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mailto:${emailInput.value}`;
    document.getElementById('qrModal').classList.add('show');
}
function closeQR() { document.getElementById('qrModal').classList.remove('show'); }

// 🪄 FLAWLESS EMAIL READER MODAL LOGIC
function openEmail(index) {
    const msg = currentMessages[index]; // Fetch directly from secure memory!
    
    // Clean tags so HTML doesn't break
    const cleanSender = msg.sender.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanSubject = msg.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    document.getElementById('readerSender').innerText = cleanSender;
    document.getElementById('readerSubject').innerText = cleanSubject || "No Subject";
    document.getElementById('readerBody').innerText = msg.text || "No Content";
    
    document.getElementById('emailModal').classList.add('show');
}
function closeEmail() { document.getElementById('emailModal').classList.remove('show'); }

window.onclick = function(event) {
    const qrModal = document.getElementById('qrModal');
    const emailModal = document.getElementById('emailModal');
    if (event.target === qrModal) closeQR();
    if (event.target === emailModal) closeEmail();
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
        const emptyState = document.getElementById('empty-state');
        const emailsContainer = document.getElementById('emails-container');
        
        if (messages.length === 0) {
            emptyState.style.display = 'block';
            emailsContainer.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        
        // Save to global array for the modal
        currentMessages = messages.reverse(); 
        
        let newHTML = '';
        currentMessages.forEach((msg, index) => {
            // Clean up sender for the preview list
            const cleanSender = msg.sender.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const cleanSubject = msg.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            newHTML += `
                <div class="message-row" onclick="openEmail(${index})">
                    <div class="msg-left">
                        <div class="msg-dot"></div>
                        <div class="msg-content">
                            <div class="msg-sender">${cleanSender}</div>
                            <div class="msg-email">${emailAddress}</div>
                            <div class="msg-subject">${cleanSubject}</div>
                        </div>
                    </div>
                    <div class="msg-arrow"><i class="fa-solid fa-angle-right"></i></div>
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
