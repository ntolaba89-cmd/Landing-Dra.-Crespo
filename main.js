/* =========================================================
   LC · Estudio Jurídico Integral — main.js
   JavaScript puro, sin dependencias externas.
   Funciones:
     1. Sombra del navbar al hacer scroll.
     2. Resaltado del link activo según la sección visible.
     3. Animación de aparición de secciones.
     4. Validación y envío del formulario calificador.
     5. Año dinámico del footer.
   ========================================================= */
(function () {
  'use strict';

  /* -------------------------------------------------------
     1. SOMBRA DEL NAVBAR AL HACER SCROLL
     ------------------------------------------------------- */
  var navbar = document.getElementById('navbar');

  function updateNavbarShadow() {
    if (!navbar) { return; }
    if (window.scrollY > 10) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbarShadow, { passive: true });
  updateNavbarShadow();

  /* -------------------------------------------------------
     2. LINK ACTIVO SEGÚN SECCIÓN VISIBLE
     ------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.navbar__link[href^="#"]')
  );

  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    })
    .filter(Boolean);

  function updateActiveLink() {
    if (!sections.length) { return; }

    var offset = (navbar ? navbar.offsetHeight : 0) + 40;
    var currentId = sections[0].id;

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top - offset <= 0) {
        currentId = section.id;
      }
    });

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + currentId;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if (sections.length) {
    window.addEventListener('scroll', updateActiveLink, { passive: true });
    window.addEventListener('resize', updateActiveLink);
    updateActiveLink();
  }

  /* -------------------------------------------------------
     3. ANIMACIÓN DE APARICIÓN
     ------------------------------------------------------- */
  var revealItems = Array.prototype.slice.call(
    document.querySelectorAll('[data-reveal]')
  );
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  /* -------------------------------------------------------
     4. FORMULARIO CALIFICADOR
     ------------------------------------------------------- */
  var form = document.getElementById('consultaForm');
  var statusBox = document.getElementById('consultaStatus');

  function setStatus(message, type) {
    if (!statusBox) { return; }
    statusBox.textContent = message;
    statusBox.className = 'consulta__status consulta__status--' + type;
    statusBox.hidden = false;
  }

  function clearStatus() {
    if (!statusBox) { return; }
    statusBox.hidden = true;
    statusBox.textContent = '';
    statusBox.className = 'consulta__status';
  }

  function showFieldError(field, hasError) {
    var errorBox = document.getElementById('error-' + field.id);
    field.classList.toggle(field.classList.contains('consulta__select')
      ? 'consulta__select--error'
      : (field.tagName === 'TEXTAREA' ? 'consulta__textarea--error' : 'consulta__input--error'), hasError);
    if (errorBox) { errorBox.hidden = !hasError; }
    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
  }

  function validatePhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 6;
  }

  function validateForm() {
    var nombre = document.getElementById('nombre');
    var telefono = document.getElementById('telefono');
    var tipo = document.getElementById('tipo');
    var descripcion = document.getElementById('descripcion');
    var firstInvalid = null;

    var rules = [
      { field: nombre, valid: nombre.value.trim().length >= 3 },
      { field: telefono, valid: validatePhone(telefono.value) },
      { field: tipo, valid: tipo.value !== '' },
      { field: descripcion, valid: descripcion.value.trim().length >= 10 }
    ];

    rules.forEach(function (rule) {
      var ok = rule.valid;
      showFieldError(rule.field, !ok);
      if (!ok && !firstInvalid) { firstInvalid = rule.field; }
    });

    return firstInvalid;
  }

  if (form) {
    // Limpia el error del campo a medida que se corrige
    form.addEventListener('input', function (event) {
      var field = event.target;
      if (field && field.id) { showFieldError(field, false); }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearStatus();

      var firstInvalid = validateForm();
      if (firstInvalid) {
        firstInvalid.focus();
        setStatus('Revisá los campos marcados para poder enviar la consulta.', 'error');
        return;
      }

      // Netlify Forms: se envía como application/x-www-form-urlencoded
      var formData = new FormData(form);
      var isLocalPreview = window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isLocalPreview && form.hasAttribute('data-netlify')) {
        var encoded = new URLSearchParams(formData).toString();

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encoded
        })
          .then(function (response) {
            if (!response.ok) { throw new Error('No se pudo enviar'); }
            form.reset();
            setStatus('Consulta enviada. Se va a responder por teléfono o WhatsApp al número indicado.', 'ok');
          })
          .catch(function () {
            setStatus(
              'No se pudo enviar el formulario desde este navegador. ' +
              'Podés escribir directamente por WhatsApp al 387 525 7748 o a crespo.lc27@gmail.com.',
              'error'
            );
          });
      } else {
        // Entorno de vista previa local: se confirma sin backend
        form.reset();
        setStatus('Consulta registrada en esta vista previa. En el sitio publicado se envía al estudio.', 'ok');
      }
    });
  }

  /* -------------------------------------------------------
     5. AÑO DINÁMICO DEL FOOTER
     ------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
