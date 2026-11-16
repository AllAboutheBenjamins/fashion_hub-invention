/**
 * FASHION HUB — Core Interactive Engine
 * Integrates Bootstrap 6 components, Alpine.js reactive state,
 * hover size drop-ups, and smooth scroll triggers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header Elevation Observer
  const header = document.getElementById('siteHeader');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. Smooth Scroll Reveal (Trigger)
  const reveals = document.querySelectorAll('.reveal-trigger');
  if ('IntersectionObserver' in window && reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.02,
      rootMargin: '120px 0px 120px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-revealed'));
  }

  // 3. Responsive Skeleton Loader & Top Progress Indicator
  const topLoader = document.createElement('div');
  topLoader.className = 'fashion-top-loader is-active';
  document.body.appendChild(topLoader);

  const skeletonTargets = document.querySelectorAll(
    '.category-card, .showcase-img-wrap, .pdp-thumb-wrap, .testimonial-card, .metric-card, #saved-items .col-12 > div, .auth-modal-card .position-relative.flex-grow-1'
  );
  skeletonTargets.forEach(el => el.classList.add('skeleton-shimmer-target'));
  document.body.classList.add('is-skeleton-loading');

  const finishInitialSkeleton = () => {
    document.body.classList.remove('is-skeleton-loading');
    document.body.classList.add('is-skeleton-ready');
    topLoader.classList.remove('is-active');
    topLoader.classList.add('is-finishing');
    setTimeout(() => topLoader.classList.remove('is-finishing'), 350);
  };

  setTimeout(finishInitialSkeleton, 520);

  // 4. Global Cart & Wishlist State (persisted in localStorage)
  const savedCartCount = Number(localStorage.getItem('fh_cart_count') || 0);
  const savedCartTotal = Number(localStorage.getItem('fh_cart_total') || 0);
  const savedWishlistCount = Number(localStorage.getItem('fh_wishlist_count') || 6);

  const formatBalance = (amount) => {
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const syncBadges = (count, total, wishCount) => {
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = count;
      b.style.display = 'inline-flex';
    });
    document.querySelectorAll('.cart-total-display').forEach(el => {
      el.textContent = formatBalance(total);
    });
    document.querySelectorAll('.wishlist-badge').forEach(b => {
      b.textContent = Math.max(0, wishCount);
    });
  };

  syncBadges(savedCartCount, savedCartTotal, savedWishlistCount);

  window.FashionHub = {
    cartCount: savedCartCount,
    cartTotal: savedCartTotal,
    wishlistCount: savedWishlistCount,

    triggerSkeleton(elements, duration = 360) {
      topLoader.classList.remove('is-finishing');
      topLoader.classList.add('is-active');
      const list = elements instanceof NodeList || Array.isArray(elements) ? elements : [elements];
      list.forEach(el => {
        if (el) {
          el.classList.add('skeleton-shimmer-target', 'is-skeleton-pulse');
        }
      });
      setTimeout(() => {
        list.forEach(el => el && el.classList.remove('is-skeleton-pulse'));
        topLoader.classList.remove('is-active');
        topLoader.classList.add('is-finishing');
        setTimeout(() => topLoader.classList.remove('is-finishing'), 300);
      }, duration);
    },

    showToast(message) {
      let toast = document.getElementById('fashionToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'fashionToast';
        toast.className = 'toast-fashion';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${message}</span>
      `;
      toast.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 3200);
    },

    addToCart(title, price, size = 'M') {
      this.cartCount += 1;
      this.cartTotal += Number(price);
      localStorage.setItem('fh_cart_count', this.cartCount);
      localStorage.setItem('fh_cart_total', this.cartTotal.toFixed(2));
      syncBadges(this.cartCount, this.cartTotal, this.wishlistCount);
      document.querySelectorAll('.header-cart-pill').forEach(pill => {
        pill.classList.remove('cart-pill-bump');
        void pill.offsetWidth;
        pill.classList.add('cart-pill-bump');
      });
      this.showToast(`Added ${title} (${size}) — Balance: ${formatBalance(this.cartTotal)}`);
    },

    resetCart() {
      this.cartCount = 0;
      this.cartTotal = 0;
      localStorage.setItem('fh_cart_count', '0');
      localStorage.setItem('fh_cart_total', '0.00');
      syncBadges(0, 0, this.wishlistCount);
    },

    toggleWishlist(btn, itemTitle) {
      btn.classList.toggle('active');
      const isLoved = btn.classList.contains('active');
      const heartIcon = btn.querySelector('svg');
      if (heartIcon) {
        heartIcon.setAttribute('fill', isLoved ? '#B85D3B' : 'none');
        heartIcon.setAttribute('stroke', isLoved ? '#B85D3B' : 'currentColor');
      }
      this.wishlistCount = Math.max(0, this.wishlistCount + (isLoved ? 1 : -1));
      localStorage.setItem('fh_wishlist_count', this.wishlistCount);
      syncBadges(this.cartCount, this.cartTotal, this.wishlistCount);
      this.showToast(isLoved ? `Saved ${itemTitle} to your wishlist.` : `Removed from wishlist.`);
    }
  };

  // 4. FUTURed SHOWCASE Hover Size Selection & Quick Add
  document.querySelectorAll('.showcase-card').forEach(card => {
    let selectedSize = 'M';
    const title = card.getAttribute('data-title') || 'Product';
    const price = card.getAttribute('data-price') || '200';
    const quickAddBtn = card.querySelector('.btn-quick-add');
    const sizePills = card.querySelectorAll('.size-pill-btn');

    sizePills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        sizePills.forEach(p => p.classList.remove('is-selected'));
        pill.classList.add('is-selected');
        selectedSize = pill.getAttribute('data-size') || pill.textContent.trim();
        if (quickAddBtn) {
          quickAddBtn.innerHTML = `+ QUICK ADD (${selectedSize})`;
        }
      });
    });

    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.FashionHub.addToCart(title, price, selectedSize);
      });
    }

    const wishlistBtn = card.querySelector('.btn-wishlist');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.FashionHub.toggleWishlist(wishlistBtn, title);
      });
    }

    const swatches = card.querySelectorAll('.swatch-circle');
    const imgWrap = card.querySelector('.showcase-img-wrap');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        swatches.forEach(s => s.classList.remove('is-active-swatch'));
        swatch.classList.add('is-active-swatch');
        if (imgWrap) {
          window.FashionHub.triggerSkeleton(imgWrap, 320);
        }
      });
    });
  });

  // Interactive skeleton feedback on search & PDP color/size switches
  document.querySelectorAll('.header-search-box').forEach(input => {
    let searchTimer;
    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const targets = document.querySelectorAll('#featured-showcase .showcase-img-wrap, .pdp-thumb-wrap');
        if (targets.length > 0) {
          window.FashionHub.triggerSkeleton(targets, 320);
        }
      }, 150);
    });
  });

  document.addEventListener('click', (e) => {
    const sizeBtn = e.target.closest('.size-select-btn');
    if (sizeBtn) {
      const pdpThumbs = document.querySelectorAll('.pdp-thumb-wrap');
      if (pdpThumbs.length > 0) {
        window.FashionHub.triggerSkeleton(pdpThumbs, 280);
      }
    }
  });

  // 5. Password Eye Visibility Toggle
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        btn.innerHTML = isPassword
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });

  // 6. PDP Accordions
  document.querySelectorAll('.accordion-pdp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.accordion-pdp-item');
      const content = parent.querySelector('.accordion-pdp-content');
      const icon = btn.querySelector('.accordion-icon');
      const isExpanded = content.style.display !== 'none';

      content.style.display = isExpanded ? 'none' : 'block';
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  });
});
