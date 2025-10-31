/**
 * Email Status Manager
 * Handles tracking and updating email sent status in Firestore
 */

import { db } from './firebase-app.js';
import { doc, updateDoc, writeBatch, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

/**
 * Update welcome email status for a user
 */
export async function updateWelcomeEmailStatus(userId, status = true) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      welcomeEmailSent: status,
      welcomeEmailSentAt: status ? new Date().toISOString() : null
    });
    console.log(`[Email Status] Updated welcome email status for user ${userId}: ${status}`);
    return true;
  } catch (error) {
    console.error(`[Email Status] Error updating welcome email status:`, error);
    throw error;
  }
}

/**
 * Update seminar email status for a registration
 */
export async function updateSeminarEmailStatus(registrationId, status = true) {
  try {
    const regRef = doc(db, 'event_registrations', registrationId);
    await updateDoc(regRef, {
      seminarEmailSent: status,
      seminarEmailSentAt: status ? new Date().toISOString() : null
    });
    console.log(`[Email Status] Updated seminar email status for registration ${registrationId}: ${status}`);
    return true;
  } catch (error) {
    console.error(`[Email Status] Error updating seminar email status:`, error);
    throw error;
  }
}

/**
 * Bulk update welcome email status for multiple users
 */
export async function bulkUpdateWelcomeEmailStatus(userIds, status = true) {
  try {
    const batch = writeBatch(db);
    const timestamp = status ? new Date().toISOString() : null;
    
    userIds.forEach(userId => {
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        welcomeEmailSent: status,
        welcomeEmailSentAt: timestamp
      });
    });
    
    await batch.commit();
    console.log(`[Email Status] Bulk updated welcome email status for ${userIds.length} users: ${status}`);
    return true;
  } catch (error) {
    console.error(`[Email Status] Error bulk updating welcome email status:`, error);
    throw error;
  }
}

/**
 * Bulk update seminar email status for multiple registrations
 */
export async function bulkUpdateSeminarEmailStatus(registrationIds, status = true) {
  try {
    const batch = writeBatch(db);
    const timestamp = status ? new Date().toISOString() : null;
    
    registrationIds.forEach(regId => {
      const regRef = doc(db, 'event_registrations', regId);
      batch.update(regRef, {
        seminarEmailSent: status,
        seminarEmailSentAt: timestamp
      });
    });
    
    await batch.commit();
    console.log(`[Email Status] Bulk updated seminar email status for ${registrationIds.length} registrations: ${status}`);
    return true;
  } catch (error) {
    console.error(`[Email Status] Error bulk updating seminar email status:`, error);
    throw error;
  }
}

/**
 * Show confirmation modal for toggling email status
 */
export function showStatusToggleWarning(currentStatus, type, singleName = null, count = 1) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'batch-email-overlay';
    overlay.innerHTML = `
      <div class="batch-email-modal" style="max-width: 500px;">
        <div class="batch-email-header">
          <h2>⚠️ ${count === 1 ? 'Change Email Status' : 'Bulk Change Email Status'}</h2>
          <button class="batch-email-close" title="Close">×</button>
        </div>
        <div class="batch-email-content">
          <div class="batch-email-info">
            <p style="font-size: 16px; margin-bottom: 16px;">
              ${count === 1 
                ? `Are you sure you want to ${currentStatus ? 'mark as NOT sent' : 'mark as sent'} the ${type === 'welcome' ? 'welcome' : 'seminar'} email for <strong>${singleName || 'this entry'}</strong>?`
                : `Are you sure you want to ${currentStatus ? 'mark as NOT sent' : 'mark as sent'} the ${type === 'welcome' ? 'welcome' : 'seminar'} email for <strong>${count} ${type === 'welcome' ? 'users' : 'registrations'}</strong>?`
              }
            </p>
            ${currentStatus 
              ? `<p style="color: var(--warning); font-weight: 600; margin-top: 12px;">
                  ⚠️ This will mark the email as <strong>NOT sent</strong>. Use this if the email was never sent or needs to be resent.
                </p>`
              : `<p style="color: var(--success); font-weight: 600; margin-top: 12px;">
                  ✓ This will mark the email as <strong>sent</strong>. Use this if the email has been sent successfully.
                </p>`
            }
          </div>
          
          <div class="batch-email-actions" style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn-send-batch" id="btn-confirm-status" style="flex: 1;">
              Yes, ${currentStatus ? 'Mark as NOT Sent' : 'Mark as Sent'}
            </button>
            <button class="btn-cancel-batch" id="btn-cancel-status" style="flex: 1;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const closeBtn = overlay.querySelector('.batch-email-close');
    const confirmBtn = overlay.querySelector('#btn-confirm-status');
    const cancelBtn = overlay.querySelector('#btn-cancel-status');
    
    const cleanup = () => {
      overlay.remove();
    };
    
    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    closeBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
  });
}

