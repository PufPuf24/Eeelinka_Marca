// --- Konfigurace: uprav podle skutečnosti ---
const WEDDING_DATE = new Date('2027-06-03T11:00:00');
const CONTACT_EMAIL = 'eliska.a.marek@example.cz';
const PUFFIK_REPLIES = ['Meow', 'Meow, Meow', 'Purr'];

// URL webové aplikace Google Apps Script, která zapisuje RSVP do Google Sheets.
// Návod na nastavení je v souboru google-apps-script.gs. Dokud je prázdné,
// formulář místo toho otevře předvyplněný e-mail.
const GOOGLE_SHEETS_ENDPOINT = '';

// --- Odpočet do svatby ---
function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs'),
  };
  if (!els.days) return;

  if (diff <= 0) {
    els.days.textContent = '0';
    els.hours.textContent = '0';
    els.mins.textContent = '0';
    els.secs.textContent = '0';
    return;
  }

  const day = Math.floor(diff / 86400000);
  const hour = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);

  els.days.textContent = day;
  els.hours.textContent = String(hour).padStart(2, '0');
  els.mins.textContent = String(min).padStart(2, '0');
  els.secs.textContent = String(sec).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// --- RSVP formulář -> Google Sheets (nebo e-mail, pokud endpoint není nastavený) ---
const rsvpForm = document.getElementById('rsvp-form');
const rsvpSuccess = document.getElementById('rsvp-success');

function sendToGoogleSheets(data) {
  return fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data),
  });
}

function sendByEmail(data) {
  const subject = `RSVP: ${data.name}`;
  const body =
    `Jméno: ${data.name}\n` +
    `Počet osob: ${data.count}\n` +
    `Účast: ${data.attending}\n` +
    `Přespání: ${data.sleep}\n` +
    `Poznámka: ${data.note || '—'}`;

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

if (rsvpForm) {
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: rsvpForm.name.value.trim(),
      count: rsvpForm.count.value,
      attending: rsvpForm.attending.value,
      sleep: rsvpForm.sleep.value,
      note: rsvpForm.note.value.trim(),
    };

    if (!GOOGLE_SHEETS_ENDPOINT) {
      sendByEmail(data);
      return;
    }

    sendToGoogleSheets(data)
      .catch(() => {})
      .finally(() => {
        rsvpForm.hidden = true;
        if (rsvpSuccess) rsvpSuccess.hidden = false;
      });
  });
}

// --- Puffík chat ---
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatWindow = document.getElementById('chat-window');
const chatFab = document.getElementById('chat-fab');

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = `msg msg-${who}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg-typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function puffikReply() {
  return PUFFIK_REPLIES[Math.floor(Math.random() * PUFFIK_REPLIES.length)];
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    showTyping();
    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      hideTyping();
      addMessage(puffikReply(), 'bot');
    }, delay);
  });
}

if (chatFab && chatWindow) {
  chatFab.addEventListener('click', () => {
    chatWindow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chatInput.focus({ preventScroll: true });
  });
}
