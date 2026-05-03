/**
 * Support widget: AI explanations via server proxy + offline keyword bot + ContentPolicy.
 */
(function (global) {
    var SUPPORT_EMAIL = 'support@freelencehub.example';
    /** Same folder depth as ExperienceController from Views/experience/view.html */
    var SUPPORT_CHAT_API = '../../Controllers/SupportChatController.php';

    var conversation = [];

    function $(id) { return document.getElementById(id); }

    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getBotReply(userText) {
        var t = (userText || '').toLowerCase().trim();
        if (/how are (you|u|bro|brother|mate|things)\b|^what'?s up\b|^sup\b|you good|how'?s it going/.test(t)) {
            return "I'm good, thanks — hope you are too. What would you like to know about Freelence Hub or the Experience section?";
        }
        if (/^hi\b|^hello|^hey\b|^good (morning|afternoon|evening)/.test(t)) {
            return "Hey! I'm here for quick help with posts, replies, and community rules. What's your question?";
        }
        if (/hello|^hi\b|hey |good morning|good afternoon/.test(t)) {
            return "Hi! I'm the Freelence Hub assistant. Ask about posting stories, replies, spam rules, or how to reach a human.";
        }
        if (/human|agent|real person|email support|contact team/.test(t)) {
            return 'To reach our team, email ' + SUPPORT_EMAIL + ' — we usually reply within two business days.';
        }
        if (/policy|rules?|allowed|spam|ban|moderat/.test(t)) {
            return 'We block obvious scam phrases, mass links, and harmful text. Posts and replies are checked automatically before they are saved.';
        }
        if (/post|story|share|reply|experience|comment/.test(t)) {
            return "Use “Share Your Story” for a new post, or “Reply” under a card. If your text trips spam filters, you’ll see an error before anything is published.";
        }
        if (/thank|thx|great/.test(t)) {
            return "You're welcome! Need anything else?";
        }
        return "Thanks for writing in. For account or billing help, use " + SUPPORT_EMAIL + ". I can also explain posts, replies, or our spam checks.";
    }

    function appendBubble(role, text) {
        var log = $('supportChatLog');
        if (!log) return;
        var row = document.createElement('div');
        row.className = 'support-chat-row support-chat-row--' + role;
        row.innerHTML = '<div class="support-chat-bubble">' + esc(text) + '</div>';
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
    }

    function showTyping() {
        var log = $('supportChatLog');
        if (!log || $('supportChatTyping')) return;
        var row = document.createElement('div');
        row.className = 'support-chat-row support-chat-row--bot support-chat-typing';
        row.id = 'supportChatTyping';
        row.innerHTML = '<div class="support-chat-bubble"><span class="support-chat-dots"><span>.</span><span>.</span><span>.</span></span></div>';
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;
    }

    function hideTyping() {
        var t = $('supportChatTyping');
        if (t) t.remove();
    }

    function setBusy(busy) {
        var send = $('supportChatSend');
        var inp = $('supportChatInput');
        if (send) send.disabled = !!busy;
        if (inp) inp.disabled = !!busy;
    }

    function openPanel() {
        var p = $('supportChatPanel');
        var fab = $('supportChatFab');
        if (p) p.classList.add('open');
        if (fab) fab.setAttribute('aria-expanded', 'true');
        var inp = $('supportChatInput');
        if (inp) inp.focus();
    }

    function closePanel() {
        var p = $('supportChatPanel');
        var fab = $('supportChatFab');
        if (p) p.classList.remove('open');
        if (fab) fab.setAttribute('aria-expanded', 'false');
    }

    function togglePanel() {
        var p = $('supportChatPanel');
        if (p && p.classList.contains('open')) closePanel();
        else openPanel();
    }

    function sendUserMessage() {
        var inp = $('supportChatInput');
        if (!inp || inp.disabled) return;
        var raw = inp.value.trim();
        if (!raw) return;

        var result = window.ContentPolicy ? ContentPolicy.scan(raw) : { allowed: true, blocked: false, block: [], warnings: [] };
        appendBubble('user', raw);
        inp.value = '';

        if (result.blocked) {
            appendBubble('bot', "That message can't be sent — it may violate our anti-spam or safety rules. Please rephrase or email " + SUPPORT_EMAIL + '.');
            if (result.warnings && result.warnings.length) {
                appendBubble('bot', 'Note: ' + result.warnings.join(' '));
            }
            return;
        }

        if (result.warnings && result.warnings.length) {
            appendBubble('bot', 'Heads-up: ' + result.warnings[0]);
        }

        var priorHistory = conversation.slice();

        showTyping();
        setBusy(true);

        fetch(SUPPORT_CHAT_API, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ message: raw, history: priorHistory }),
        })
            .then(function (r) {
                return r.text().then(function (txt) {
                    var json = {};
                    try {
                        json = JSON.parse(txt);
                    } catch (e) {
                        json = {};
                    }
                    return { status: r.status, body: json };
                });
            })
            .then(function (res) {
                hideTyping();
                setBusy(false);
                var data = res.body || {};

                if (res.status === 400 && data.error === 'policy') {
                    appendBubble('bot', "That couldn’t be sent — " + (data.reason || 'policy check failed.') + '');
                    return;
                }

                if (res.status === 429 && data.reply) {
                    appendBubble('bot', data.reply);
                    return;
                }

                conversation.push({ role: 'user', content: raw });

                if (data.ok && data.reply) {
                    appendBubble('bot', data.reply);
                    conversation.push({ role: 'assistant', content: data.reply });
                } else if (data.ok && data.offline) {
                    var off = getBotReply(raw);
                    var offMsg = off + ' (Add your API key in Controllers/config.local.php — try Groq for a free tier: console.groq.com)';
                    appendBubble('bot', offMsg);
                    conversation.push({ role: 'assistant', content: offMsg });
                } else {
                    var fb = getBotReply(raw);
                    appendBubble('bot', fb + ' Couldn’t use the smart assistant this time.');
                    if (data.detail) {
                        appendBubble('bot', data.detail);
                    }
                    var failMsg = fb + (data.detail ? ' — ' + data.detail : '');
                    conversation.push({ role: 'assistant', content: failMsg });
                }

                while (conversation.length > 20) {
                    conversation.shift();
                }
            })
            .catch(function () {
                hideTyping();
                setBusy(false);
                var fb = getBotReply(raw);
                var errMsg = fb + ' (Network error.)';
                conversation.push({ role: 'user', content: raw });
                appendBubble('bot', errMsg);
                conversation.push({ role: 'assistant', content: errMsg });
                while (conversation.length > 20) {
                    conversation.shift();
                }
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var fab = $('supportChatFab');
        var closeBtn = $('supportChatClose');
        var sendBtn = $('supportChatSend');
        var inp = $('supportChatInput');

        if (fab) fab.addEventListener('click', togglePanel);
        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        if (sendBtn) sendBtn.addEventListener('click', sendUserMessage);
        if (inp) {
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendUserMessage();
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closePanel();
        });
    });

    global.SupportChat = { open: openPanel, close: closePanel };
})(typeof window !== 'undefined' ? window : this);
