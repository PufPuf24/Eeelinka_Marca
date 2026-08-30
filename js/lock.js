// Heslo je čistě pro zábavu (chrání jen před náhodnými návštěvníky,
// není to skutečné zabezpečení - kdokoliv si ho může najít ve zdrojovém kódu).
const SITE_PASSWORD = 'Puffik2027';

function normalizePassword(value) {
  return value.trim().toLowerCase();
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('lock-overlay');
  const form = document.getElementById('lock-form');
  const input = document.getElementById('lock-input');
  const guard = document.getElementById('guard-cat');
  const bubble = document.getElementById('lock-bubble');
  if (!overlay || !form || !input || !guard) return;

  let unlocking = false;

  function setGuardState(state) {
    guard.classList.remove('is-watching', 'is-hiding', 'is-happy', 'is-hissing');
    guard.classList.add(state);
  }

  function showBubble(text, kind) {
    bubble.textContent = text;
    bubble.className = 'lock-bubble visible ' + kind;
  }

  function hideBubble() {
    bubble.className = 'lock-bubble';
  }

  let unlocked = false;
  try { unlocked = localStorage.getItem('wedding_unlocked') === 'true'; } catch (e) {}

  if (unlocked) {
    overlay.remove();
    document.body.classList.remove('is-locked');
    return;
  }

  document.body.classList.add('is-locked');

  input.addEventListener('focus', () => {
    if (unlocking) return;
    setGuardState('is-hiding');
    hideBubble();
  });

  input.addEventListener('blur', () => {
    if (unlocking) return;
    setGuardState('is-watching');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (unlocking) return;

    const correct = normalizePassword(input.value) === normalizePassword(SITE_PASSWORD);
    const lang = document.documentElement.lang === 'en' ? 'en' : 'cs';

    if (correct) {
      unlocking = true;
      setGuardState('is-happy');
      showBubble(lang === 'en' ? 'Purr' : 'Purr', 'happy');
      try { localStorage.setItem('wedding_unlocked', 'true'); } catch (e2) {}

      setTimeout(() => {
        overlay.classList.add('fade-out');
        document.body.classList.remove('is-locked');
        setTimeout(() => overlay.remove(), 600);
      }, 1300);
    } else {
      setGuardState('is-hissing');
      showBubble('Hiss!', 'hiss');
      form.classList.add('shake');
      input.value = '';

      setTimeout(() => {
        form.classList.remove('shake');
        setGuardState('is-watching');
        hideBubble();
        input.focus();
      }, 1000);
    }
  });
});
