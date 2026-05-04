/* =============================================
   NOTIFICATION.JS — Application submit feedback
   (Browser toast + optional desktop notification.
   Actual emails are sent by PHP MissionController.)
   ============================================= */

(function() {
    'use strict';

    var DESKTOP_NOTIF_BODY = 'We emailed you a confirmation when possible. The client may reply within ~48h.';

    function tryDesktopNotification(title) {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body: DESKTOP_NOTIF_BODY });
            return;
        }
        if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(perm) {
                if (perm === 'granted') {
                    new Notification(title, { body: DESKTOP_NOTIF_BODY });
                }
            });
        }
    }

    /**
     * Call after successful application redirect (?msg=cand_created).
     */
    function notifyApplicationSubmitted() {
        var title = 'Application sent!';
        var toastMsg = title + ' You should receive an email confirmation shortly.';
        if (typeof showToast === 'function') {
            showToast(toastMsg, false);
        }
        tryDesktopNotification(title);

        /* Re-open modal on success strip so UX matches modal flow without losing page context */
        var overlay = document.getElementById('modalOverlay');
        var formView = document.getElementById('formView');
        var successView = document.getElementById('successView');
        if (overlay && formView && successView) {
            formView.style.display = 'none';
            successView.style.display = 'block';
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function notifyApplicationError(errDetail) {
        var msg = 'Failed to submit application. Please try again.';
        if (typeof showToast === 'function') {
            showToast(msg, true);
        }
        var p = typeof errDetail === 'string' ? errDetail.trim() : '';
        if (p && typeof console !== 'undefined') {
            console.warn('Application error:', decodeURIComponent(p));
        }
    }

    function consumeUrlNotifications() {
        var p = new URLSearchParams(window.location.search);
        var msg = p.get('msg');
        if (!msg) return;

        if (msg === 'cand_created') {
            notifyApplicationSubmitted();
            history.replaceState(null, '', window.location.pathname + window.location.hash);
            return;
        }

        if (msg === 'cand_error') {
            notifyApplicationError(p.get('err') || '');
            history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
    }

    window.ApplicationNotifications = {
        notifySubmitted: notifyApplicationSubmitted,
        notifyError: notifyApplicationError,
        initFromUrl: consumeUrlNotifications
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', consumeUrlNotifications);
    } else {
        consumeUrlNotifications();
    }
})();
