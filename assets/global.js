/* ============================================================
   Global JS — Studio Athleisure Theme
   Custom elements + IntersectionObservers, sin dependencias.
   ============================================================ */

/* ------------------------------------------------------------
   Scroll reveal con IntersectionObserver
   ------------------------------------------------------------ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
);

function observeScrollTriggers(root = document) {
  root.querySelectorAll('.scroll-trigger:not(.is-visible)').forEach((el) => {
    revealObserver.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => observeScrollTriggers());
document.addEventListener('shopify:section:load', (e) => observeScrollTriggers(e.target));

/* ------------------------------------------------------------
   Header: ocultar al hacer scroll hacia abajo, mostrar al subir
   ------------------------------------------------------------ */
class StickyHeader extends HTMLElement {
  connectedCallback() {
    this.lastScroll = 0;
    this.onScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll() {
    const current = window.scrollY;
    if (current > this.lastScroll && current > 200) {
      this.classList.add('header-hidden');
    } else {
      this.classList.remove('header-hidden');
    }
    this.lastScroll = current;
  }
}
customElements.define('sticky-header', StickyHeader);

/* ------------------------------------------------------------
   Drawers genéricos (menú móvil, carrito, búsqueda)
   ------------------------------------------------------------ */
class DrawerToggle extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', () => {
      const target = document.getElementById(this.getAttribute('data-target'));
      if (target) target.classList.toggle('is-open');
      document.body.style.overflow = target && target.classList.contains('is-open') ? 'hidden' : '';
    });
  }
}
customElements.define('drawer-toggle', DrawerToggle);

document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-drawer-close]');
  if (closer) {
    const drawer = closer.closest('.is-open');
    if (drawer) drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.is-open').forEach((el) => el.classList.remove('is-open'));
    document.body.style.overflow = '';
  }
});

/* ------------------------------------------------------------
   Carrusel con flechas
   ------------------------------------------------------------ */
class CarouselSlider extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.carousel');
    this.prev = this.querySelector('[data-carousel-prev]');
    this.next = this.querySelector('[data-carousel-next]');
    if (!this.track) return;
    if (this.prev) this.prev.addEventListener('click', () => this.scrollBySlide(-1));
    if (this.next) this.next.addEventListener('click', () => this.scrollBySlide(1));
  }

  scrollBySlide(direction) {
    const slide = this.track.querySelector(':scope > *');
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(this.track).columnGap || '0');
    this.track.scrollBy({ left: direction * (slide.offsetWidth + gap), behavior: 'smooth' });
  }
}
customElements.define('carousel-slider', CarouselSlider);

/* ------------------------------------------------------------
   Cart drawer + operaciones de carrito (Section Rendering API)
   ------------------------------------------------------------ */
class CartDrawer extends HTMLElement {
  open() {
    this.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  async renderFromSections(sections) {
    if (sections && sections['cart-drawer']) {
      const html = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      const fresh = html.querySelector('#CartDrawer .cart-drawer__panel');
      const current = this.querySelector('.cart-drawer__panel');
      if (fresh && current) current.innerHTML = fresh.innerHTML;
    }
    if (sections && sections['cart-icon-bubble']) {
      const bubble = document.getElementById('cart-icon-bubble');
      if (bubble) bubble.innerHTML = sections['cart-icon-bubble'];
    }
  }
}
customElements.define('cart-drawer', CartDrawer);

async function cartRequest(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

/* Cambiar cantidad / eliminar línea dentro del drawer o página */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cart-change]');
  if (!btn) return;
  e.preventDefault();
  const line = btn.getAttribute('data-line');
  const quantity = parseInt(btn.getAttribute('data-quantity'), 10);
  btn.disabled = true;
  try {
    const data = await cartRequest(window.routes.cart_change_url, {
      line,
      quantity,
      sections: ['cart-drawer', 'cart-icon-bubble', 'main-cart']
    });
    const drawer = document.querySelector('cart-drawer');
    if (drawer) drawer.renderFromSections(data.sections);
    const mainCart = document.getElementById('MainCart');
    if (mainCart && data.sections && data.sections['main-cart']) {
      const html = new DOMParser().parseFromString(data.sections['main-cart'], 'text/html');
      const fresh = html.getElementById('MainCart');
      if (fresh) mainCart.innerHTML = fresh.innerHTML;
    }
  } catch (err) {
    console.error(window.cartStrings.error, err);
  } finally {
    btn.disabled = false;
  }
});

/* ------------------------------------------------------------
   Formulario de producto (AJAX add to cart)
   ------------------------------------------------------------ */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.submitButton = this.form.querySelector('[type="submit"]');
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  async onSubmit(e) {
    e.preventDefault();
    if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

    this.submitButton.setAttribute('aria-disabled', 'true');
    const spinner = this.submitButton.querySelector('.loading-overlay__spinner');
    if (spinner) spinner.classList.remove('hidden');

    const formData = new FormData(this.form);
    formData.append('sections', 'cart-drawer,cart-icon-bubble');
    formData.append('sections_url', window.location.pathname);

    try {
      const response = await fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });
      const data = await response.json();
      if (data.status) {
        this.showError(data.description || window.cartStrings.error);
        return;
      }
      const drawer = document.querySelector('cart-drawer');
      if (drawer) {
        await drawer.renderFromSections(data.sections);
        drawer.open();
      }
    } catch (err) {
      this.showError(window.cartStrings.error);
    } finally {
      this.submitButton.removeAttribute('aria-disabled');
      if (spinner) spinner.classList.add('hidden');
    }
  }

  showError(message) {
    let errorEl = this.querySelector('.product-form__error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'product-form__error';
      errorEl.setAttribute('role', 'alert');
      this.form.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }
}
customElements.define('product-form', ProductForm);

/* ------------------------------------------------------------
   Selector de variantes: actualiza precio, URL y disponibilidad
   ------------------------------------------------------------ */
class VariantSelects extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', this.onVariantChange.bind(this));
  }

  onVariantChange() {
    const options = Array.from(this.querySelectorAll('fieldset')).map((fieldset) => {
      const checked = fieldset.querySelector('input:checked');
      // Refleja el valor elegido junto a la etiqueta (p. ej. "Color: Soft Pink")
      const selectedLabel = fieldset.querySelector('[data-selected-for]');
      if (selectedLabel && checked) selectedLabel.textContent = checked.value;
      return checked ? checked.value : null;
    });

    const variantsJson = this.querySelector('[type="application/json"]');
    if (!variantsJson) return;
    const variants = JSON.parse(variantsJson.textContent);
    const variant = variants.find((v) => v.options.every((opt, i) => opt === options[i]));

    const productInfo = this.closest('.product__info') || document;
    const idInput = productInfo.querySelector('input[name="id"]');
    const button = productInfo.querySelector('product-form [type="submit"]');
    const buttonText = button ? button.querySelector('span') : null;
    const priceEl = productInfo.querySelector('.product__price');

    if (!variant) {
      if (button) button.setAttribute('disabled', 'disabled');
      if (buttonText) buttonText.textContent = window.variantStrings.unavailable;
      return;
    }

    if (idInput) idInput.value = variant.id;
    window.history.replaceState({}, '', `${window.location.pathname}?variant=${variant.id}`);

    if (priceEl && variant.price_formatted) {
      priceEl.querySelector('[data-price]').textContent = variant.price_formatted;
      const compareEl = priceEl.querySelector('[data-compare-price]');
      if (compareEl) {
        if (variant.compare_at_price > variant.price && variant.compare_at_price_formatted) {
          compareEl.textContent = variant.compare_at_price_formatted;
          compareEl.classList.remove('hidden');
        } else {
          compareEl.classList.add('hidden');
        }
      }
    }

    if (button && buttonText) {
      if (variant.available) {
        button.removeAttribute('disabled');
        buttonText.textContent = window.variantStrings.addToCart;
      } else {
        button.setAttribute('disabled', 'disabled');
        buttonText.textContent = window.variantStrings.soldOut;
      }
    }
  }
}
customElements.define('variant-selects', VariantSelects);

/* ------------------------------------------------------------
   Productos relacionados (Product Recommendations API,
   cargados solo cuando la sección entra al viewport)
   ------------------------------------------------------------ */
class RelatedProducts extends HTMLElement {
  connectedCallback() {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.unobserve(this);
        this.loadRecommendations();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    observer.observe(this);
  }

  async loadRecommendations() {
    const url = this.dataset.url;
    if (!url) return;
    try {
      const response = await fetch(url);
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, 'text/html');
      const fresh = html.querySelector('related-products');
      if (fresh && fresh.innerHTML.trim().length) {
        this.innerHTML = fresh.innerHTML;
        observeScrollTriggers(this);
      }
    } catch (err) {
      console.error('Related products error:', err);
    }
  }
}
customElements.define('related-products', RelatedProducts);

/* ------------------------------------------------------------
   Inputs de cantidad
   ------------------------------------------------------------ */
class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const previous = parseInt(this.input.value, 10) || 1;
        if (button.name === 'plus') this.input.value = previous + 1;
        if (button.name === 'minus') this.input.value = Math.max(1, previous - 1);
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
}
customElements.define('quantity-input', QuantityInput);
