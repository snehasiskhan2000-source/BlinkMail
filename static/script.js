let emailFetchInterval; 

function preventReload(e) { if (e) e.preventDefault(); }

function parseSender(senderString) {
    let name = senderString;
    let email = senderString;
    const match = senderString.match(/(.*)<(.*)>/);
    if(match) {
        name = match[1].replace(/"/g, '').trim();
        email = match[2].trim();
        if (!name) name = email.split('@')[0]; 
    } else if (senderString.includes('@')) {
        email = senderString.trim();
        name = email.split('@')[0];
    }
    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
    return { name, email };
}

function cleanEmailBody(text) {
    if (!text) return "";
    return text.replace(/;?\s*charset=["']?(UTF-8|iso-8859-1)["']?/gi, '')
               .replace(/Content-Type:.*$/gmi, '')
               .replace(/Content-Transfer-Encoding:.*$/gmi, '')
               .trim();
}

// 🪄 SECURE TIMER LOGIC
function startSelfDestructTimer(emailAddress) {
    const expiryKey = `blinkmail_expiry_${emailAddress}`;
    let expiryTime = localStorage.getItem(expiryKey);
    
    if (!expiryTime) {
        expiryTime = Date.now() + 10 * 60 * 1000;
        localStorage.setItem(expiryKey, expiryTime);
    }

    const timerDisplay = document.getElementById('emailTimer');
    
    const countdown = setInterval(() => {
        const now = Date.now();
        const distance = expiryTime - now;

        if (distance <= 0) {
            clearInterval(countdown);
            clearInterval(emailFetchInterval); 
            if (timerDisplay) timerDisplay.innerText = "00:00";
            
            const modal = document.getElementById('expiredModal');
            if (modal) modal.classList.add('show');
            
            localStorage.removeItem(expiryKey);
            localStorage.removeItem('blinkmail_current'); // Wipe access
        } else {
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            if (timerDisplay) {
                timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}

// 🪄 GHOST MODE ROUTING LOGIC
async function changeEmail(e) {
    preventReload(e);
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating...';
    try {
        const response = await fetch('/api/generate');
        const data = await response.json();
        // Securely store the new email and instantly reset the timer
        localStorage.setItem('blinkmail_current', data.email);
        localStorage.setItem(`blinkmail_expiry_${data.email}`, Date.now() + 10 * 60 * 1000);
        window.location.href = `/mailbox`; // Cloaked URL
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
        // Securely store the new email
        localStorage.setItem('blinkmail_current', data.email);
        localStorage.setItem(`blinkmail_expiry_${data.email}`, Date.now() + 10 * 60 * 1000);
        window.location.href = `/mailbox`; // Cloaked URL
    } catch (error) {
        if(btn) btn.innerHTML = 'Error. Try Again.';
    }
}

// 🪄 MANUAL REFRESH BUTTON LOGIC
async function forceRefresh(e) {
    preventReload(e);
    const icon = e.currentTarget.querySelector('i');
    if(icon) icon.classList.add('fa-spin'); // Add spinning animation
    await fetchEmails(); // Force immediate check
    if(icon) setTimeout(() => icon.classList.remove('fa-spin'), 1000); // Stop spinning
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

async function fetchEmails() {
    // 🪄 Read securely from local storage
    const emailAddress = localStorage.getItem('blinkmail_current');
    if(!emailAddress) {
        window.location.href = '/'; // Kick out intruders
        return;
    }
    
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
            if(emptyState) emptyState.style.display = 'block';
            if(emailsContainer) emailsContainer.innerHTML = '';
            return;
        }

        if(emptyState) emptyState.style.display = 'none';
        
        let newHTML = '';
        messages.reverse().forEach((msg, index) => {
            const parsed = parseSender(msg.sender);
            const safeName = parsed.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeEmail = parsed.email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeSubject = msg.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            // 🪄 Cloaked redirect using URL parameters
            newHTML += `
                <div class="message-row" onclick="window.location.href='/message?id=${index}'">
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
        
        if (emailsContainer && emailsContainer.innerHTML !== newHTML) {
            emailsContainer.innerHTML = newHTML;
        }
    } catch (error) {
        console.error("Failed to fetch", error);
    }
}

async function loadReadPage() {
    // 🪄 Secure access checking
    const emailAddress = localStorage.getItem('blinkmail_current');
    if(!emailAddress) {
        window.location.href = '/'; 
        return;
    }

    // Extract message ID from Cloaked URL
    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('id');

    document.getElementById('backBtn').href = `/mailbox`;

    try {
        const response = await fetch(`/api/messages/${emailAddress}`);
        const messages = await response.json();
        const reversedMessages = messages.reverse();
        const msg = reversedMessages[index];

        if(msg) {
            const parsed = parseSender(msg.sender);
            document.getElementById('readSenderName').innerText = parsed.name;
            document.getElementById('readSenderEmail').innerText = parsed.email;
            
            let initials = "NA";
            if (parsed.name) {
                const words = parsed.name.split(/[\s\._-]+/); 
                if (words.length >= 2 && words[1].length > 0) {
                    initials = (words[0][0] + words[1][0]).toUpperCase();
                } else {
                    initials = parsed.name.substring(0, 2).toUpperCase();
                }
            }
            document.getElementById('readAvatar').innerText = initials;

            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const dateString = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            
            document.getElementById('readDate').innerText = dateString;
            document.getElementById('readSubject').innerText = msg.subject || "No Subject";
            document.getElementById('readBody').innerText = cleanEmailBody(msg.text) || "No Content";
        } else {
            document.getElementById('readBody').innerText = "Email not found.";
        }
    } catch (error) {
        document.getElementById('readBody').innerText = "Failed to load email.";
    }
}

// 🪄 SECURE INIT LOGIC
if (window.location.pathname.startsWith('/mailbox')) {
    const emailAddress = localStorage.getItem('blinkmail_current');
    if (!emailAddress) {
        window.location.href = '/'; // Kick intruders out instantly
    } else {
        startSelfDestructTimer(emailAddress);
        fetchEmails();
        emailFetchInterval = setInterval(() => fetchEmails(), 4000); 
    }
} else if (window.location.pathname.startsWith('/message')) {
    loadReadPage();
}
