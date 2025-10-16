const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('#mobile-menu');
const toggleButtons = document.querySelectorAll('.toggle-button');
const forms = document.querySelectorAll('.waitlist-form');
const yearSpan = document.querySelector('#year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

if (navToggle && mobileNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('aria-controls');

    toggleButtons.forEach((btn) => {
      const isActive = btn === button;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    forms.forEach((form) => {
      form.classList.toggle('hidden', form.id !== targetId);
    });
  });
});

function escapeName(name) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(name);
  }
  return name.replace(/([ #;?%&,.+*~':"!^$\[\]()=>|/@])/g, '\\$1');
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  return value !== undefined ? [value] : [];
}

function collectFormData(form) {
  const formData = new FormData(form);
  const payload = {};

  formData.forEach((value, key) => {
    if (value === null || value === '') {
      return;
    }
    if (payload[key]) {
      if (Array.isArray(payload[key])) {
        payload[key].push(value);
      } else {
        payload[key] = [payload[key], value];
      }
    } else {
      payload[key] = value;
    }
  });

  return payload;
}

function getFieldLabel(form, name) {
  const selector = `[name="${escapeName(name)}"]`;
  const field = form.querySelector(selector);
  if (!field) return name;
  if (field.dataset.label) return field.dataset.label;
  const fieldset = field.closest('fieldset');
  if (fieldset && fieldset.dataset.label) return fieldset.dataset.label;
  const label = field.closest('label');
  if (label) {
    const span = label.querySelector('span');
    if (span) return span.textContent.trim();
    return label.textContent.trim();
  }
  return name;
}

function formatTime(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  if (!hours) return value;
  return `${hours}h${minutes || '00'}`;
}

function getValueLabel(form, name, rawValue) {
  const selector = `[name="${escapeName(name)}"]`;
  const field = form.querySelector(selector);
  if (!field) return String(rawValue);

  if (field.tagName === 'SELECT') {
    const option = Array.from(field.options).find((opt) => opt.value === String(rawValue));
    return option ? option.textContent.trim() : String(rawValue);
  }

  const type = field.getAttribute('type');
  if (type === 'radio' || type === 'checkbox') {
    const input = form.querySelector(`[name="${escapeName(name)}"][value="${escapeName(String(rawValue))}"]`);
    const label = input?.closest('label');
    if (label) return label.textContent.trim();
    return String(rawValue);
  }

  if (type === 'time') {
    return formatTime(String(rawValue));
  }

  if (type === 'number') {
    return String(rawValue);
  }

  return String(rawValue);
}

function createSummary(form, data) {
  const summary = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'timestamp') return;
    const values = toArray(value);
    if (values.length === 0) return;
    const label = getFieldLabel(form, key);
    const formatted = values
      .map((item) => getValueLabel(form, key, item))
      .filter((item) => item && item.trim() !== '');
    if (formatted.length === 0) return;
    summary.push({ label, value: formatted.join(', ') });
  });
  return summary;
}

function renderSummary(form, summary) {
  const summaryContainer = form.querySelector('.form-summary');
  if (!summaryContainer) return;
  if (!summary || summary.length === 0) {
    summaryContainer.classList.remove('visible');
    summaryContainer.innerHTML = '';
    return;
  }

  const listItems = summary
    .map((item) => `<dt>${item.label}</dt><dd>${item.value}</dd>`)
    .join('');

  summaryContainer.innerHTML = `
    <h4>Ton récapitulatif</h4>
    <p>Capture ou copie ces informations et envoie-les-nous (WhatsApp, e-mail…)</p>
    <dl>${listItems}</dl>
  `;
  summaryContainer.classList.add('visible');
}

function persistForm(form, storageKey) {
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const rawData = collectFormData(form);
    rawData.timestamp = new Date().toISOString();

    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(rawData);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    const summary = createSummary(form, rawData);
    renderSummary(form, summary);

    const submitButton = form.querySelector('button[type="submit"]');
    const successMessage = form.querySelector('.form-success');
    const initialText = submitButton?.textContent || '';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Merci pour ton retour !';
    }

    if (successMessage) {
      successMessage.textContent = 'Réponses enregistrées localement. Partage ton récap pour être recontacté·e.';
      successMessage.classList.add('visible');
    }

    form.reset();

    setTimeout(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = initialText;
      }
      if (successMessage) {
        successMessage.classList.remove('visible');
        successMessage.textContent = '';
      }
    }, 4000);
  });
}

persistForm(document.querySelector('#driver-form'), 'coci_driver_responses');
persistForm(document.querySelector('#passenger-form'), 'coci_passenger_responses');

window.addEventListener('click', (event) => {
  if (!mobileNav || !navToggle) return;
  const target = event.target;
  const clickedInsideMenu = mobileNav.contains(target) || navToggle.contains(target);
  if (!clickedInsideMenu && mobileNav.classList.contains('open')) {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

const anchorLinks = document.querySelectorAll('a[href^="#"]');
anchorLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
      const section = document.querySelector(targetId);
      if (section) {
        event.preventDefault();
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});
