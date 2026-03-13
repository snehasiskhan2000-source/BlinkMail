function preventReload(e) { if (e) e.preventDefault(); }

// 🪄 ENGINE: Splits "Bittu Khan <email@gmail.com>" into pure Name and Email
function parseSender(senderString) {
    let name = senderString;
    let email = senderString;
    const match = senderString.match(/(.*)<(.*)>/);
    if(match) {
        name = match[1].replace(/"/g, '').trim() || match[2].trim();
        email = match[2].trim();
    }
    return { name, email };
}

// 🪄 ENGINE: Deletes ugly artifacts like ;charset="UTF-8"
function cleanEmailBody(text) {
    if (!text) return "";
    return text.replace(/;?\s*charset=["']?(UTF-8|iso-8859-1)["']?/gi, '')
               .replace(/Content-Type:.*$/gmi, '')
               .replace(/Content-Transfer-Encoding:.*$/gmi, '')
               .trim();
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
    document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mailto:${emailInput.value}`;
    document.getElementById('qrModal').classList.add('show');
}
function closeQR() { document.getElementById('qrModal').classList.remove('show'); }

window.onclick = function(event) {
    const qrModal = document.getElementById('qrModal');
    if (event.target === qrModal) closeQR();
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
        
        let newHTML = '';
        messages.reverse().forEach((msg, index) => {
            // 🪄 NEW PARSING: Splits Name and Email for the Inbox List
            const parsed = parseSender(msg.sender);
            const safeName = parsed.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeEmail = parsed.email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeSubject = msg.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            newHTML += `
                <div class="message-row" onclick="window.location.href='/read/${emailAddress}/${index}'">
                    <div class="msg-left">
                        <div class="msg-dot"></div>
                        <div class="msg-content">
                            <div class="msg-sender">${safeName}</div>
                            <div class="msg-email">${safeEmail}</div>
                            <div class="msg-subject">${safeSubject}</div>
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

async function loadReadPage() {
    const urlParts = window.location.pathname.split('/');
    const index = parseInt(urlParts.pop());
    const emailAddress = urlParts.pop();

    document.getElementById('backBtn').href = `/inbox/${emailAddress}`;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const reversedMessages = messages.reverse();
        const msg = reversedMessages[index];

        if(msg) {
            // Parse data
            const parsed = parseSender(msg.sender);
            document.getElementById('readSenderName').innerText = parsed.name;
            document.getElementById('readSenderEmail').innerText = parsed.email;
            
            // 🪄 Generate Avatar Initials
            let initials = "NA";
            if (parsed.name) {
                const words = parsed.name.split(' ');
                if (words.length >= 2) {
                    initials = (words[0][0] + words[1][0]).toUpperCase();
                } else {
                    initials = parsed.name.substring(0, 2).toUpperCase();
                }
            }
            document.getElementById('readAvatar').innerText = initials;

            // Generate Timestamp
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const dateString = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            
            document.getElementById('readDate').innerText = dateString;
            document.getElementById('readSubject').innerText = msg.subject || "No Subject";
            
            // 🪄 Inject cleaned body text!
            document.getElementById('readBody').innerText = cleanEmailBody(msg.text) || "No Content";
        } else {
            document.getElementById('readBody').innerText = "Email not found.";
        }
    } catch (error) {
        document.getElementById('readBody').innerText = "Failed to load email.";
    }
}

if (window.location.pathname.startsWith('/inbox/')) {
    fetchEmails();
    setInterval(() => fetchEmails(), 4000); 
} else if (window.location.pathname.startsWith('/read/')) {
    loadReadPage();
}
