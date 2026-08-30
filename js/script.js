// --- Konfigurace: uprav podle skutečnosti ---
const WEDDING_DATE = new Date('2027-06-03T11:00:00');
const CONTACT_EMAIL = 'eliska.a.marek@example.cz';
const PUFFIK_REPLIES = ['Meow', 'Meow, Meow', 'Purr'];

// URL webové aplikace Google Apps Script, která zapisuje RSVP do Google Sheets.
// Návod na nastavení je v souboru google-apps-script.gs. Dokud je prázdné,
// formulář místo toho otevře předvyplněný e-mail.
const GOOGLE_SHEETS_ENDPOINT = '';

// Fotky v hero sekci: pojmenuj je images/couple-1.jpg, images/couple-2.jpg, ...
// (postupně bez mezer v číslování). Web sám zjistí, kolik jich je a bude
// mezi nimi po HERO_PHOTO_INTERVAL_MS otáčet jako kolotoč zprava doleva -
// jedna fotka vždy vpředu uprostřed, dvě další zmenšené po stranách.
const HERO_PHOTO_MAX_CHECK = 12;
const HERO_PHOTO_INTERVAL_MS = 8000;

// --- Fotky novomanželů: automatické načtení a kolotoč ---
function initHeroPhotos() {
  const stage = document.getElementById('hero-photo');
  if (!stage) return;
  const placeholder = stage.querySelector('.hero-photo-placeholder');

  const probes = [];
  for (let i = 1; i <= HERO_PHOTO_MAX_CHECK; i++) {
    const src = `images/couple-${i}.jpg`;
    probes.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }

  Promise.all(probes).then((results) => {
    const urls = results.filter(Boolean);
    const n = urls.length;
    if (n === 0) return;
    if (placeholder) placeholder.remove();

    function makeCard(src, role) {
      const card = document.createElement('div');
      card.className = 'hero-photo-card role-' + role;
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      card.appendChild(img);
      stage.appendChild(card);
      return { el: card, img };
    }

    // 1 fotka: jen statická, žádné otáčení.
    if (n === 1) {
      makeCard(urls[0], 'center');
      return;
    }

    // 2 fotky: jednoduché prolínání na stejném místě uprostřed.
    if (n === 2) {
      const a = makeCard(urls[0], 'center');
      const b = makeCard(urls[1], 'center');
      b.el.style.transition = 'opacity 1.4s ease';
      b.el.style.opacity = '0';
      let showingA = true;
      setInterval(() => {
        showingA = !showingA;
        b.el.style.opacity = showingA ? '0' : '1';
      }, HERO_PHOTO_INTERVAL_MS);
      return;
    }

    // 3+ fotky: skutečný kolotoč. Karta, co odchází vlevo, se neviditelně
    // "ponoří" (uprostřed animace se jí tiše vymění fotka za další v pořadí)
    // a znovu se "vynoří" napravo - nikdy neprojíždí viditelně přes střed.
    let elLeft = makeCard(urls[n - 1], 'left');
    let elCenter = makeCard(urls[0], 'center');
    let elRight = makeCard(urls[1], 'right');
    let nextIndex = 2 % n;

    setInterval(() => {
      const recycling = elLeft;
      const newLeft = elCenter;
      const newCenter = elRight;

      newLeft.el.className = 'hero-photo-card role-left';
      newCenter.el.className = 'hero-photo-card role-center';

      recycling.el.className = 'hero-photo-card recycling';
      recycling.el.addEventListener('animationend', function onDone() {
        recycling.el.removeEventListener('animationend', onDone);
        recycling.el.classList.remove('recycling');
        recycling.el.style.transition = 'none';
        recycling.el.className = 'hero-photo-card role-right';
        void recycling.el.offsetWidth;
        recycling.el.style.transition = '';
      }, { once: true });

      // fotku vyměníme přesně ve chvíli, kdy je karta v animaci neviditelná
      setTimeout(() => {
        recycling.img.src = urls[nextIndex];
        nextIndex = (nextIndex + 1) % n;
      }, 650);

      elLeft = newLeft;
      elCenter = newCenter;
      elRight = recycling;
    }, HERO_PHOTO_INTERVAL_MS);
  });
}
initHeroPhotos();

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
