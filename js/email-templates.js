/**
 * Email Template Functions
 * Generates personalized welcome and seminar email templates
 */

/**
 * Generate personalized welcome email body
 * @param {string} name - User's name
 * @returns {string} Email body text
 */
export function generateWelcomeEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const thankYou = name 
    ? "Thank you for registering! We're excited to have you join us."
    : "Thank you for registering! We're excited to have all of you join us.";
  
  return `${greeting}

==============================
🎉  WELCOME TO CODE NEXUS!  🎉
==============================

We're THRILLED to have you join our vibrant community of developers, learners, and tech enthusiasts!

✨  WHAT AWAITS YOU:
🚀  Workshops & tech sessions
🤝  Networking opportunities
💡  Learning resources
🎯  Career guidance
�  Hackathons & opportunities

------------------------------

🔗  STAY CONNECTED:

📱  WhatsApp Channel:
  https://whatsapp.com/channel/0029Vb6s2Jg4dTnTPNbgRE37

💬  WhatsApp Community:
  https://chat.whatsapp.com/JUaHh3U8nKwGa8b8lDJUko

🔗  LinkedIn:
  https://www.linkedin.com/in/code-nexus-323b32396/

📸  Instagram:
  https://www.instagram.com/code_nexus_official/

------------------------------

🎯  NEXT STEPS:
1️⃣  Join our WhatsApp channels
2️⃣  Follow us on social media
3️⃣  Engage with the community

Looking forward to seeing you THRIVE! 🌟

Warm regards,
Code Nexus Team 💙
`.trim();
}

/**
 * Generate personalized seminar email body
 * @param {string} name - Registrant's name
 * @returns {string} Email body text
 */
export function generateSeminarEmail(name) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const thankYou = name 
    ? "Thank you for registering! We're excited to have you join us."
    : "Thank you for registering! We're excited to have all of you join us.";
  
  return `${greeting}

🎉 Congratulations! You’ve successfully registered for our exclusive GSoC Session with Prathamesh Sahasrabhojane (GSoC 2020 Alumni, now at Rippling).

Get ready to uncover insights about cracking Google Summer of Code, mastering open source, and building your path to top tech opportunities 🚀

------------------------------

🗓 EVENT DETAILS

📅 Date: 31st October 2025
🕝 Time: 2:30 PM (IST)
📍 Venue: Online (Zoom)

------------------------------

🔗 JOIN THE SESSION

Zoom Link: https://us06web.zoom.us/j/82708913587?pwd=ExyFaoUCYtSOtC9lCphIawZFEhDUQz.1
Meeting ID: 827 0891 3587
Passcode: 000000

👉 We recommend joining 5 minutes early to ensure a smooth start.

------------------------------

🧭 WHAT YOU’LL LEARN

→ Prathamesh’s GSoC journey & lessons learned
→ Strategies for open source contributions
→ Positioning yourself for tech opportunities

------------------------------

Organized by Code Nexus — bringing you conversations that matter. 💙

See you at the session!

Warm regards,
Team Code Nexus

------------------------------

🌐 STAY CONNECTED

📱 WhatsApp Channel: https://whatsapp.com/channel/0029Vb6s2Jg4dTnTPNbgRE37
💬 Community Chat: https://chat.whatsapp.com/JUaHh3U8nKwGa8b8lDJUko
🔗 LinkedIn: https://www.linkedin.com/in/code-nexus-323b32396/
📸 Instagram: https://www.instagram.com/code_nexus_official/
`.trim();
}

/**
 * Create Gmail compose URL with BCC support
 * @param {string[]} emails - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {boolean} useBCC - Use BCC instead of TO (default: true)
 * @returns {string} Gmail compose URL
 */
export function createGmailComposeLink(emails, subject, body, useBCC = true) {
  if (!emails || emails.length === 0) {
    console.error('[Email] No emails provided');
    return '#';
  }

  // Filter out invalid emails
  const validEmails = emails.filter(email => email && email !== 'N/A' && email.includes('@'));
  
  if (validEmails.length === 0) {
    console.error('[Email] No valid emails found');
    return '#';
  }

  // Encode subject and body
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  // Join emails with commas
  const emailList = validEmails.join(',');
  
  // Gmail compose URL format: https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...
  // For BCC: &bcc=... instead of &to=...
  const baseUrl = useBCC 
    ? `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emailList)}&su=${encodedSubject}&body=${encodedBody}`
    : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailList)}&su=${encodedSubject}&body=${encodedBody}`;
  
  // Check URL length limit (approximately 2000 characters for safety)
  // If URL is too long, truncate to first 100 emails for safety
  if (baseUrl.length > 2000 && validEmails.length > 100) {
    console.warn(`[Email] URL too long (${baseUrl.length} chars). Truncating to first 100 emails.`);
    const truncatedEmails = validEmails.slice(0, 100);
    const truncatedList = truncatedEmails.join(',');
    return useBCC
      ? `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(truncatedList)}&su=${encodedSubject}&body=${encodedBody}`
      : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(truncatedList)}&su=${encodedSubject}&body=${encodedBody}`;
  }
  
  return baseUrl;
}

/**
 * Split emails into batches of specified size
 * @param {string[]} emails - Array of email addresses
 * @param {number} batchSize - Size of each batch (default: 100)
 * @returns {string[][]} Array of email batches
 */
export function splitEmailsIntoBatches(emails, batchSize = 100) {
  const batches = [];
  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Open Gmail composer with confirmation for large lists
 * @param {string[]} emails - Array of email addresses (for BCC mode)
 * @param {Array} userData - Array of user objects with email and name (for personalized mode)
 * @param {string} subject - Email subject
 * @param {Function} templateFn - Function to generate email body: (name) => string
 * @param {boolean} personalized - If true, send individual personalized emails; if false, use BCC
 */
export async function openEmailComposer(emails, subject, body, useBCC = true, userData = null, templateFn = null, personalized = false, isWelcomeEmail = null) {
  // If userData and templateFn are provided, ask user to choose personalized or BCC
  if (userData && templateFn) {
    const validUsers = userData.filter(u => u.email && u.email !== 'N/A' && u.email.includes('@'));
    const count = validUsers.length;
    
    if (count === 0) {
      alert('No valid email addresses found.');
      return;
    }
    
    // Show choice modal: personalized or BCC
    await showEmailTypeSelector(validUsers, subject, templateFn);
    return;
  }
  
  // BCC mode with userData for status tracking
  const validEmails = emails.filter(email => email && email !== 'N/A' && email.includes('@'));
  const count = validEmails.length;
  
  if (count === 0) {
    alert('No valid email addresses found.');
    return;
  }
  
  // Determine email type if not provided
  if (isWelcomeEmail === null) {
    isWelcomeEmail = subject.includes('Welcome');
  }
  
  // If more than 100 emails, use batch system
  if (count > 100) {
    await showBatchEmailModal(validEmails, subject, body, useBCC, userData, isWelcomeEmail);
    return;
  }
  
  // For 100 or fewer, open directly and mark as sent if userData provided
  const gmailLink = createGmailComposeLink(validEmails, subject, body, useBCC);
  window.open(gmailLink, '_blank');
  
  // Mark all users as sent if userData is provided (BCC with tracking)
  if (userData && Array.isArray(userData)) {
    try {
      const { bulkUpdateWelcomeEmailStatus, bulkUpdateSeminarEmailStatus } = await import('./email-status-manager.js');
      const validUsers = userData.filter(u => u.email && validEmails.includes(u.email));
      const userIds = validUsers.map(u => u.id || u.userId || u.docId).filter(Boolean);
      
      if (userIds.length > 0) {
        if (isWelcomeEmail) {
          await bulkUpdateWelcomeEmailStatus(userIds, true);
        } else {
          await bulkUpdateSeminarEmailStatus(userIds, true);
        }
        console.log(`[BCC Email] Marked ${userIds.length} users as sent`);
        // Refresh after a delay
        setTimeout(() => location.reload(), 2000);
      }
    } catch (error) {
      console.error('[BCC Email] Error marking as sent:', error);
    }
  }
}

/**
 * Send personalized emails sequentially (for small batches)
 * @param {Array} users - Array of user objects with email and name
 * @param {string} subject - Email subject
 * @param {Function} templateFn - Function to generate email body: (name) => string
 */
function sendPersonalizedEmails(users, subject, templateFn) {
  if (users.length === 0) return;
  
  // Open first email
  let currentIndex = 0;
  
  function openNextEmail() {
    if (currentIndex >= users.length) {
      alert(`✅ All ${users.length} personalized emails have been opened!`);
      return;
    }
    
    const user = users[currentIndex];
    const body = templateFn(user.name || '');
    const gmailLink = createIndividualEmailLink(user.email, subject, body);
    
    // Open in new tab
    window.open(gmailLink, '_blank');
    
    currentIndex++;
    
    // If more emails, ask if user wants to continue
    if (currentIndex < users.length) {
      const continueSending = confirm(
        `Opened email ${currentIndex} of ${users.length}.\n\n` +
        `Send this email in Gmail, then:\n` +
        `- Click OK to open the next personalized email\n` +
        `- Click Cancel to stop`
      );
      
      if (continueSending) {
        // Small delay to avoid overwhelming the browser
        setTimeout(openNextEmail, 500);
      }
    } else {
      alert(`✅ All ${users.length} personalized emails opened!`);
    }
  }
  
  openNextEmail();
}

/**
 * Show email type selector (Personalized vs BCC)
 * @param {Array} users - Array of user objects with email and name
 * @param {string} subject - Email subject
 * @param {Function} templateFn - Function to generate email body: (name) => string
 */
export function showEmailTypeSelector(users, subject, templateFn) {
  const totalUsers = users.length;
  
  // Create email type selector modal
  const overlay = document.createElement('div');
  overlay.className = 'batch-email-overlay';
  overlay.innerHTML = `
    <div class="batch-email-modal" style="max-width: 500px;">
      <div class="batch-email-header">
        <h2>📧 Choose Email Type</h2>
        <button class="batch-email-close" title="Close">×</button>
      </div>
      <div class="batch-email-content">
        <div class="batch-email-info">
          <p class="batch-email-total">
            <strong>Total Recipients:</strong> ${totalUsers} emails
          </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px; margin: 24px 0;">
          <button class="btn-send-batch" id="btn-personalized" style="width: 100%; padding: 20px; text-align: left; display: flex; flex-direction: column; align-items: flex-start;">
            <strong style="font-size: 18px; margin-bottom: 8px;">✨ Personalized Emails</strong>
            <span style="font-size: 14px; opacity: 0.9;">Each recipient gets a personalized email with their name</span>
          </button>
          
          <button class="btn-send-batch" id="btn-bcc" style="width: 100%; padding: 20px; text-align: left; display: flex; flex-direction: column; align-items: flex-start; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
            <strong style="font-size: 18px; margin-bottom: 8px;">📧 BCC (Same Email to All)</strong>
            <span style="font-size: 14px; opacity: 0.9;">Send the same email to everyone using BCC</span>
          </button>
        </div>
        
        <button class="btn-cancel-batch" id="btn-cancel-type" style="width: 100%;">
          Cancel
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const closeBtn = overlay.querySelector('.batch-email-close');
  const cancelBtn = overlay.querySelector('#btn-cancel-type');
  const personalizedBtn = overlay.querySelector('#btn-personalized');
  const bccBtn = overlay.querySelector('#btn-bcc');
  
  personalizedBtn.addEventListener('click', async () => {
    overlay.remove();
    await showEmailRangeSelector(users, subject, templateFn);
  });
  
  bccBtn.addEventListener('click', async () => {
    overlay.remove();
    // Extract emails and use BCC logic, but keep user objects for status tracking
    const emails = users.map(u => u.email);
    const body = templateFn(''); // Generate template without name for BCC
    // Determine email type
    const isWelcomeEmail = subject.includes('Welcome');
    // Pass user objects along for status tracking
    await openEmailComposer(emails, subject, body, true, users, null, false, isWelcomeEmail);
  });
  
  closeBtn.addEventListener('click', () => overlay.remove());
  cancelBtn.addEventListener('click', () => overlay.remove());
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/**
 * Show range selector dialog for email sending
 * @param {Array} users - Array of user objects with email and name
 * @param {string} subject - Email subject
 * @param {Function} templateFn - Function to generate email body: (name) => string
 */
export async function showEmailRangeSelector(users, subject, templateFn) {
  const totalUsers = users.length;
  
  // Create range selector modal
  const overlay = document.createElement('div');
  overlay.className = 'batch-email-overlay';
  overlay.innerHTML = `
    <div class="batch-email-modal" style="max-width: 500px;">
      <div class="batch-email-header">
        <h2>📧 Select Email Range</h2>
        <button class="batch-email-close" title="Close">×</button>
      </div>
      <div class="batch-email-content">
        <div class="batch-email-info">
          <p class="batch-email-total">
            <strong>Total Recipients:</strong> ${totalUsers} emails
          </p>
          <p style="color: var(--text-light); margin-top: 8px;">
            Select the range of recipients you want to email
          </p>
        </div>
        
        <div class="email-range-selector" style="margin: 24px 0;">
          <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 150px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text);">
                From Number:
              </label>
              <input 
                type="number" 
                id="range-start" 
                min="1" 
                max="${totalUsers}" 
                value="1"
                style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px;"
              >
            </div>
            <div style="flex: 1; min-width: 150px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text);">
                To Number:
              </label>
              <input 
                type="number" 
                id="range-end" 
                min="1" 
                max="${totalUsers}" 
                value="${totalUsers}"
                style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px;"
              >
            </div>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid var(--primary);">
            <p style="margin: 0; font-size: 14px; color: var(--text);">
              <strong>Selected Range:</strong> 
              <span id="range-preview">Emails 1 to ${totalUsers}</span>
              <span id="range-count">(${totalUsers} recipients)</span>
            </p>
          </div>
        </div>
        
        <div class="batch-email-actions">
          <button class="btn-send-batch" id="btn-start-sending">
            📧 Start Sending Emails
          </button>
          <button class="btn-cancel-batch" id="btn-cancel-range">
            Cancel
          </button>
        </div>
        
        <div class="batch-email-instructions" style="margin-top: 24px;">
          <p><strong>Note:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Each email will be personalized with recipient's name</li>
            <li>Numbers are based on the current order in the list</li>
            <li>You can select any range from 1 to ${totalUsers}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const closeBtn = overlay.querySelector('.batch-email-close');
  const cancelBtn = overlay.querySelector('#btn-cancel-range');
  const startBtn = overlay.querySelector('#btn-start-sending');
  const rangeStart = overlay.querySelector('#range-start');
  const rangeEnd = overlay.querySelector('#range-end');
  const rangePreview = overlay.querySelector('#range-preview');
  const rangeCount = overlay.querySelector('#range-count');
  
  function updatePreview() {
    const start = parseInt(rangeStart.value) || 1;
    const end = parseInt(rangeEnd.value) || 1;
    const count = end - start + 1;
    
    if (start <= end && start >= 1 && end <= totalUsers) {
      rangePreview.textContent = `Emails ${start} to ${end}`;
      rangeCount.textContent = `(${count} recipients)`;
      rangeCount.style.color = 'var(--text)';
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
    } else {
      rangePreview.textContent = 'Invalid range';
      rangeCount.textContent = '';
      startBtn.disabled = true;
      startBtn.style.opacity = '0.6';
    }
  }
  
  rangeStart.addEventListener('input', () => {
    const start = parseInt(rangeStart.value) || 1;
    if (start < 1) rangeStart.value = 1;
    if (start > totalUsers) rangeStart.value = totalUsers;
    // Auto-adjust end if it's less than start
    const end = parseInt(rangeEnd.value) || start;
    if (end < start) rangeEnd.value = start;
    updatePreview();
  });
  
  rangeEnd.addEventListener('input', () => {
    const end = parseInt(rangeEnd.value) || 1;
    const start = parseInt(rangeStart.value) || 1;
    if (end < start) rangeEnd.value = start;
    if (end > totalUsers) rangeEnd.value = totalUsers;
    updatePreview();
  });
  
  startBtn.addEventListener('click', async () => {
    const start = parseInt(rangeStart.value) || 1;
    const end = parseInt(rangeEnd.value) || 1;
    
    if (start < 1 || end > totalUsers || start > end) {
      alert('Invalid range. Please check your numbers.');
      return;
    }
    
    // Filter users based on range (convert to 1-based to 0-based index)
    const selectedUsers = users.slice(start - 1, end);
    
    overlay.remove();
    await showPersonalizedBatchEmailModal(selectedUsers, subject, templateFn);
  });
  
  closeBtn.addEventListener('click', () => overlay.remove());
  cancelBtn.addEventListener('click', () => overlay.remove());
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  // Initialize preview
  updatePreview();
}

/**
 * Show personalized batch email modal
 * @param {Array} users - Array of user objects with email and name
 * @param {string} subject - Email subject
 * @param {Function} templateFn - Function to generate email body: (name) => string
 */
export async function showPersonalizedBatchEmailModal(users, subject, templateFn) {
  // Import status manager functions
  const { updateWelcomeEmailStatus, updateSeminarEmailStatus } = await import('./email-status-manager.js');
  
  // Determine email type from subject or template function
  const isWelcomeEmail = subject.includes('Welcome') || 
                          templateFn.toString().includes('generateWelcomeEmail') ||
                          templateFn.name === 'generateWelcomeEmail';
  
  const batches = [];
  for (let i = 0; i < users.length; i += 100) {
    batches.push(users.slice(i, i + 100));
  }
  let currentBatchIndex = 0;
  let currentUserIndex = 0;
  const sentUserIds = []; // Track which users have been marked as sent
  let currentUser = null; // Track current user being processed
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'batch-email-overlay';
  overlay.innerHTML = `
    <div class="batch-email-modal">
      <div class="batch-email-header">
        <h2>📧 Personalized Batch Email Sender</h2>
        <button class="batch-email-close" title="Close">×</button>
      </div>
      <div class="batch-email-content">
        <div class="batch-email-info">
          <p class="batch-email-total">
            <strong>Total Recipients:</strong> ${users.length} emails (personalized)
          </p>
          <p class="batch-email-summary">
            <strong>Total Batches:</strong> ${batches.length} batches (100 emails per batch)
          </p>
          <p style="color: #10b981; font-weight: 600; margin-top: 8px;">
            ✨ Each email will be personalized with recipient's name
          </p>
        </div>
        
        <div class="batch-email-progress">
          <div class="batch-email-progress-bar">
            <div class="batch-email-progress-fill" style="width: 0%"></div>
          </div>
          <div class="batch-email-progress-text">
            Batch <span class="batch-current">1</span> of <span class="batch-total">${batches.length}</span>
            - Email <span class="email-current">1</span> of <span class="email-total">${batches[0].length}</span>
            <span class="batch-status"> - Ready to send</span>
          </div>
        </div>
        
        <div class="batch-email-details">
          <p class="batch-email-current-info">
            <strong>Current:</strong> 
            <span class="current-recipient">${users[0].name || users[0].email}</span>
            <span class="batch-emails-count">(${batches[0].length} emails in this batch)</span>
          </p>
        </div>
        
        <div class="batch-email-actions">
          <button class="btn-send-batch" id="btn-send-current-email">
            📧 Send to ${users[0].name || users[0].email}
          </button>
          <button class="btn-send-batch" id="btn-send-next-batch" style="display: none;">
            📧 Send Next Email
          </button>
          <button class="btn-cancel-batch" id="btn-cancel-batch">
            Cancel
          </button>
        </div>
        
        <div class="batch-email-instructions">
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Click "Send to [Name]" to open Gmail with personalized email</li>
            <li>Send the email from Gmail</li>
            <li>Come back and click "Send Next Email" to continue</li>
            <li>Repeat until all personalized emails in the batch are sent</li>
          </ol>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const closeBtn = overlay.querySelector('.batch-email-close');
  const cancelBtn = overlay.querySelector('#btn-cancel-batch');
  const sendBtn = overlay.querySelector('#btn-send-current-email');
  const nextBtn = overlay.querySelector('#btn-send-next-batch');
  const progressFill = overlay.querySelector('.batch-email-progress-fill');
  const batchCurrent = overlay.querySelector('.batch-current');
  const emailCurrent = overlay.querySelector('.email-current');
  const emailTotal = overlay.querySelector('.email-total');
  const batchStatus = overlay.querySelector('.batch-status');
  const currentRecipient = overlay.querySelector('.current-recipient');
  const emailsCount = overlay.querySelector('.batch-emails-count');
  
  function updateUI() {
    const currentBatch = batches[currentBatchIndex];
    const user = currentBatch[currentUserIndex];
    
    // Calculate overall progress
    const totalSent = (currentBatchIndex * 100) + currentUserIndex;
    const totalProgress = (totalSent / users.length) * 100;
    
    batchCurrent.textContent = currentBatchIndex + 1;
    emailCurrent.textContent = currentUserIndex + 1;
    emailTotal.textContent = currentBatch.length;
    progressFill.style.width = `${totalProgress}%`;
    currentRecipient.textContent = user.name || user.email;
    emailsCount.textContent = `(${currentBatch.length} emails in this batch)`;
    sendBtn.textContent = `📧 Send to ${user.name || user.email}`;
    
    if (currentBatchIndex === batches.length - 1 && currentUserIndex === currentBatch.length - 1) {
      batchStatus.textContent = ' - Final email';
      nextBtn.style.display = 'none';
    } else {
      const remaining = (batches.length - currentBatchIndex - 1) * 100 + (currentBatch.length - currentUserIndex - 1);
      batchStatus.textContent = ` - ${remaining} email(s) remaining`;
      nextBtn.style.display = 'inline-block';
    }
  }
  
  async function markCurrentAsSent() {
    if (!currentUser) return;
    
    // Get the ID (could be id or userId)
    const userId = currentUser.id || currentUser.userId || currentUser.docId;
    if (!userId) {
      console.warn('[Batch Email] User missing ID, cannot mark as sent:', currentUser);
      return;
    }
    
    // Check if already marked
    if (sentUserIds.includes(userId)) return;
    
    try {
      sentUserIds.push(userId);
      
      // Mark as sent in Firestore
      if (isWelcomeEmail) {
        await updateWelcomeEmailStatus(userId, true);
      } else {
        await updateSeminarEmailStatus(userId, true);
      }
      
      console.log(`[Batch Email] Marked as sent: ${currentUser.name || currentUser.email} (ID: ${userId})`);
    } catch (error) {
      console.error('[Batch Email] Error marking as sent:', error);
      // Remove from sent list if error
      const index = sentUserIds.indexOf(userId);
      if (index > -1) sentUserIds.splice(index, 1);
    }
  }
  
  function sendCurrentEmail() {
    const currentBatch = batches[currentBatchIndex];
    currentUser = currentBatch[currentUserIndex];
    const body = templateFn(currentUser.name || '');
    const gmailLink = createIndividualEmailLink(currentUser.email, subject, body);
    window.open(gmailLink, '_blank');
    
    batchStatus.textContent = ' - Email opened. Send it, then click "Send Next Email"';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';
    nextBtn.style.display = 'inline-block';
  }
  
  async function sendNextEmail() {
    // Mark current user as sent when moving to next (user clicked "Send Next Email" = they sent the previous one)
    if (currentUser && currentUser.id) {
      await markCurrentAsSent();
    }
    
    const currentBatch = batches[currentBatchIndex];
    currentUserIndex++;
    
    // Move to next batch if needed
    if (currentUserIndex >= currentBatch.length) {
      currentBatchIndex++;
      currentUserIndex = 0;
      
      if (currentBatchIndex >= batches.length) {
        // All emails completed - currentUser was already marked above, no need to mark again
        // Show completion with count of actually sent
        overlay.innerHTML = `
          <div class="batch-email-modal">
            <div class="batch-email-header">
              <h2>✅ Email Sending Completed!</h2>
              <button class="batch-email-close" title="Close">×</button>
            </div>
            <div class="batch-email-content">
              <div class="batch-email-success">
                <p style="font-size: 48px; margin-bottom: 16px;">🎉</p>
                <p><strong>Successfully sent ${sentUserIds.length} out of ${users.length} emails!</strong></p>
                <p style="color: var(--text-light); margin-top: 8px;">
                  ${sentUserIds.length} email(s) marked as sent in the system.
                </p>
                ${sentUserIds.length < users.length 
                  ? `<p style="color: var(--warning); margin-top: 12px; font-weight: 600;">
                      ⚠️ Note: ${users.length - sentUserIds.length} email(s) were not marked as sent because they weren't processed.
                    </p>`
                  : ''
                }
              </div>
              <div class="batch-email-actions">
                <button class="btn-cancel-batch" onclick="location.reload()">
                  Refresh & Close
                </button>
              </div>
            </div>
          </div>
        `;
        return;
      }
    }
    
    updateUI();
    
    // Automatically send the next email
    currentUser = batches[currentBatchIndex][currentUserIndex];
    const body = templateFn(currentUser.name || '');
    const gmailLink = createIndividualEmailLink(currentUser.email, subject, body);
    window.open(gmailLink, '_blank');
    
    batchStatus.textContent = ' - Email opened. Send it, then click "Send Next Email"';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';
  }
  
  sendBtn.addEventListener('click', sendCurrentEmail);
  nextBtn.addEventListener('click', sendNextEmail);
  
  // Handle close/cancel - mark current user if they were in the process
  const handleClose = async () => {
    if (currentUser && currentUser.id) {
      await markCurrentAsSent();
    }
    
    if (sentUserIds.length > 0) {
      // Refresh page to show updated status
      setTimeout(() => {
        location.reload();
      }, 500);
    } else {
      overlay.remove();
    }
  };
  
  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);
  
  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay) {
      await handleClose();
    }
  });
  
  updateUI();
}

/**
 * Show batch email modal for sending emails in batches
 * @param {string[]} emails - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {boolean} useBCC - Use BCC instead of TO
 * @param {Array} userData - Optional array of user objects for status tracking
 * @param {boolean} isWelcomeEmail - Whether this is a welcome email or seminar email
 */
export async function showBatchEmailModal(emails, subject, body, useBCC = true, userData = null, isWelcomeEmail = null) {
  // Import status manager if userData is provided
  let bulkUpdateWelcomeEmailStatus, bulkUpdateSeminarEmailStatus;
  if (userData) {
    const statusModule = await import('./email-status-manager.js');
    bulkUpdateWelcomeEmailStatus = statusModule.bulkUpdateWelcomeEmailStatus;
    bulkUpdateSeminarEmailStatus = statusModule.bulkUpdateSeminarEmailStatus;
  }
  
  // Determine email type if not provided
  if (isWelcomeEmail === null) {
    isWelcomeEmail = subject.includes('Welcome');
  }
  
  // Create email to user ID mapping if userData provided
  const emailToUserId = new Map();
  if (userData && Array.isArray(userData)) {
    userData.forEach(u => {
      const email = u.email;
      const id = u.id || u.userId || u.docId;
      if (email && id) {
        emailToUserId.set(email, id);
      }
    });
  }
  
  const batches = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100));
  }
  let currentBatchIndex = 0;
  const sentUserIds = []; // Track which users have been marked as sent
  
  // Helper function to mark a batch as sent
  async function markBatchAsSent(batchEmails, batchNum = null) {
    if (!userData || emailToUserId.size === 0) return;
    
    const batchUserIds = [];
    batchEmails.forEach(email => {
      const userId = emailToUserId.get(email);
      if (userId && !sentUserIds.includes(userId)) {
        batchUserIds.push(userId);
        sentUserIds.push(userId);
      }
    });
    
    if (batchUserIds.length > 0) {
      try {
        if (isWelcomeEmail) {
          await bulkUpdateWelcomeEmailStatus(batchUserIds, true);
        } else {
          await bulkUpdateSeminarEmailStatus(batchUserIds, true);
        }
        const batchNumStr = batchNum !== null ? batchNum : (currentBatchIndex + 1);
        console.log(`[Batch BCC] Marked batch ${batchNumStr} as sent: ${batchUserIds.length} users`);
      } catch (error) {
        console.error('[Batch BCC] Error marking batch as sent:', error);
      }
    }
  }
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'batch-email-overlay';
  overlay.innerHTML = `
    <div class="batch-email-modal">
      <div class="batch-email-header">
        <h2>📧 Batch Email Sender</h2>
        <button class="batch-email-close" title="Close">×</button>
      </div>
      <div class="batch-email-content">
        <div class="batch-email-info">
          <p class="batch-email-total">
            <strong>Total Recipients:</strong> ${emails.length} emails
          </p>
          <p class="batch-email-summary">
            <strong>Total Batches:</strong> ${batches.length} batches (100 emails per batch)
          </p>
        </div>
        
        <div class="batch-email-progress">
          <div class="batch-email-progress-bar">
            <div class="batch-email-progress-fill" style="width: 0%"></div>
          </div>
          <div class="batch-email-progress-text">
            Batch <span class="batch-current">1</span> of <span class="batch-total">${batches.length}</span>
            <span class="batch-status"> - Ready to send</span>
          </div>
        </div>
        
        <div class="batch-email-details">
          <p class="batch-email-current-info">
            <strong>Current Batch:</strong> 
            <span class="batch-emails-range">Emails 1-${Math.min(100, emails.length)}</span>
            <span class="batch-emails-count">(${batches[0].length} recipients)</span>
          </p>
        </div>
        
        <div class="batch-email-actions">
          <button class="btn-send-batch" id="btn-send-current-batch">
            📧 Send Batch 1 (${batches[0].length} emails)
          </button>
          <button class="btn-send-batch" id="btn-send-next-batch" style="display: none;">
            📧 Send Next Batch
          </button>
          <button class="btn-cancel-batch" id="btn-cancel-batch">
            Cancel
          </button>
        </div>
        
        <div class="batch-email-instructions">
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Click "Send Batch X" to open Gmail with the current batch</li>
            <li>Send the email from Gmail</li>
            <li>Come back here and click "Send Next Batch" to proceed to the next batch</li>
            <li>Repeat until all batches are sent</li>
          </ol>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const modal = overlay.querySelector('.batch-email-modal');
  const closeBtn = overlay.querySelector('.batch-email-close');
  const cancelBtn = overlay.querySelector('#btn-cancel-batch');
  const sendBtn = overlay.querySelector('#btn-send-current-batch');
  const nextBatchBtn = overlay.querySelector('#btn-send-next-batch');
  const progressFill = overlay.querySelector('.batch-email-progress-fill');
  const progressText = overlay.querySelector('.batch-email-progress-text');
  const currentInfo = overlay.querySelector('.batch-email-current-info');
  const batchCurrent = overlay.querySelector('.batch-current');
  const batchStatus = overlay.querySelector('.batch-status');
  const emailsRange = overlay.querySelector('.batch-emails-range');
  const emailsCount = overlay.querySelector('.batch-emails-count');
  
  // Update UI for current batch
  function updateBatchUI() {
    const batch = batches[currentBatchIndex];
    const start = (currentBatchIndex * 100) + 1;
    const end = Math.min(start + batch.length - 1, emails.length);
    const progress = (currentBatchIndex / batches.length) * 100; // Progress shows completed batches
    
    batchCurrent.textContent = currentBatchIndex + 1;
    progressFill.style.width = `${progress}%`;
    emailsRange.textContent = `Emails ${start}-${end}`;
    emailsCount.textContent = `(${batch.length} recipients)`;
    sendBtn.textContent = `📧 Send Batch ${currentBatchIndex + 1} (${batch.length} emails)`;
    
    if (currentBatchIndex === batches.length - 1) {
      batchStatus.textContent = ' - Final batch';
      nextBatchBtn.style.display = 'none';
      sendBtn.textContent = `📧 Send Final Batch (${batch.length} emails)`;
    } else {
      batchStatus.textContent = ` - ${batches.length - currentBatchIndex - 1} batch(es) remaining`;
      nextBatchBtn.textContent = `📧 Send Next Batch (Batch ${currentBatchIndex + 2})`;
      nextBatchBtn.style.display = 'inline-block';
    }
  }
  
  // Send current batch
  function sendCurrentBatch() {
    const batch = batches[currentBatchIndex];
    const gmailLink = createGmailComposeLink(batch, subject, body, useBCC);
    window.open(gmailLink, '_blank');
    
    // Update status
    batchStatus.textContent = ' - Email opened in Gmail. Send it, then click "Send Next Batch"';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';
    if (currentBatchIndex < batches.length - 1) {
      nextBatchBtn.style.display = 'inline-block';
    }
  }
  
  // Send next batch (marks previous as sent)
  async function sendNextBatch() {
    // Mark current batch as sent when moving to next (user clicked next = they sent the previous batch)
    if (currentBatchIndex >= 0 && batches[currentBatchIndex]) {
      await markBatchAsSent(batches[currentBatchIndex], currentBatchIndex + 1);
    }
    
    currentBatchIndex++;
    
    if (currentBatchIndex >= batches.length) {
      // All batches completed - show completion
      overlay.innerHTML = `
        <div class="batch-email-modal">
          <div class="batch-email-header">
            <h2>✅ All Batches Completed!</h2>
            <button class="batch-email-close" title="Close">×</button>
          </div>
          <div class="batch-email-content">
            <div class="batch-email-success">
              <p style="font-size: 48px; margin-bottom: 16px;">🎉</p>
              <p><strong>Successfully sent ${batches.length} batch(es)!</strong></p>
              <p style="color: var(--text-light); margin-top: 8px;">
                ${sentUserIds.length} email(s) marked as sent in the system.
              </p>
              ${sentUserIds.length < emails.length 
                ? `<p style="color: var(--warning); margin-top: 12px; font-weight: 600;">
                    ⚠️ Note: ${emails.length - sentUserIds.length} email(s) were not marked as sent.
                  </p>`
                : ''
              }
            </div>
            <div class="batch-email-actions">
              <button class="btn-cancel-batch" onclick="location.reload()">
                Refresh & Close
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    updateBatchUI();
    sendCurrentBatch();
  }
  
  // Also allow marking first batch when closing if only one batch
  function handleFirstBatchClose() {
    // If only one batch and it was opened, mark it
    if (batches.length === 1 && currentBatchIndex === 0 && userData) {
      markBatchAsSent(batches[0], 1);
    }
  }
  
  // Handle close/cancel - mark current batch if it was sent
  const handleClose = async () => {
    // Mark current batch if userData is provided (user opened Gmail, might have sent it)
    if (userData && batches[currentBatchIndex]) {
      await markBatchAsSent(batches[currentBatchIndex], currentBatchIndex + 1);
    }
    
    if (sentUserIds.length > 0) {
      // Refresh page to show updated status
      setTimeout(() => {
        location.reload();
      }, 500);
    } else {
      overlay.remove();
    }
  };
  
  // Event listeners
  sendBtn.addEventListener('click', sendCurrentBatch);
  nextBatchBtn.addEventListener('click', sendNextBatch);
  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);
  
  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay) {
      await handleClose();
    }
  });
  
  // Initialize UI
  updateBatchUI();
}

/**
 * Create individual Gmail compose link for one recipient
 * @param {string} email - Single email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {string} Gmail compose URL
 */
export function createIndividualEmailLink(email, subject, body) {
  if (!email || email === 'N/A' || !email.includes('@')) {
    console.error('[Email] Invalid email:', email);
    return '#';
  }
  
  try {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Build Gmail compose URL
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodedSubject}&body=${encodedBody}`;
    
    return url;
  } catch (error) {
    console.error('[Email] Error creating email link:', error);
    // Return a basic mailto link as last resort
    return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }
}
