const BIKE_IMAGES = {
  gravel: { src: "assets/gravel.svg", alt: "Gravel bike silhouette" },
  mtb: { src: "assets/mtb.svg", alt: "Mountain bike silhouette" },
  road: { src: "assets/road.svg", alt: "Road bike silhouette" }
};

const BAG_PRODUCTS = {
  saddle: { name: "Saddle Bag MKIII", basePrice: 97.27 },
  frame: { name: "Zip Frame Bag MKIII", basePrice: 55.07 },
  handlebar: { name: "Bar Roll MKIII", basePrice: 74.53 },
  top: { name: "Fuel Bag MKIII", basePrice: 40.58 },
  tool: { name: "Tool Wallet MKIII", basePrice: 19.46 }
};

const defaultSetup = {
  color: "Black",
  size: "L",
  version: "MKIII",
  priceDelta: 0
};

const state = {
  bike: BIKE_IMAGES[localStorage.getItem("acepacBike")] ? localStorage.getItem("acepacBike") : "gravel",
  bikeHue: Number(localStorage.getItem("acepacBikeHue") || 8),
  lang: localStorage.getItem("acepacLang") || "en",
  setup: { ...defaultSetup },
  productConfig: { color: "Black", size: "L", version: "MKIII" },
  cart: readCart()
};

function formatPrice(value) {
  return `EUR ${value.toFixed(2)}`;
}

function bikeColorFromHue(hue) {
  return `hsl(${hue} 58% 34%)`;
}

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem("acepacCart")) || [];
    return stored.map((item) => {
      if (typeof item === "string") {
        return { type: item, ...defaultSetup, priceDelta: 0 };
      }
      return { ...defaultSetup, priceDelta: 0, ...item };
    }).filter((item) => BAG_PRODUCTS[item.type]);
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("acepacCart", JSON.stringify(state.cart));
}

function getCartItem(type) {
  return state.cart.find((item) => item.type === type);
}

function priceFor(item) {
  const product = BAG_PRODUCTS[item.type];
  const sizeDelta = item.size === "M" ? -8 : item.size === "XL" ? 12 : 0;
  const versionDelta = item.version === "MKII" ? -10 : 0;
  return product.basePrice + sizeDelta + versionDelta + Number(item.priceDelta || 0);
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + priceFor(item), 0);
}

function addOrRemoveBag(type, source = "overview") {
  const existingIndex = state.cart.findIndex((item) => item.type === type);
  if (existingIndex >= 0) {
    state.cart.splice(existingIndex, 1);
  } else {
    const config = source === "product" ? state.productConfig : state.setup;
    state.cart.push({ type, ...config });
  }
  saveCart();
  renderCart();
}

function removeBag(type) {
  state.cart = state.cart.filter((item) => item.type !== type);
  saveCart();
  renderCart();
}

function setBike(type) {
  if (!BIKE_IMAGES[type]) return;
  state.bike = type;
  localStorage.setItem("acepacBike", type);
  renderBike();
}

function setBikeHue(hue) {
  state.bikeHue = Number(hue);
  localStorage.setItem("acepacBikeHue", String(state.bikeHue));
  document.documentElement.style.setProperty("--bike-color", bikeColorFromHue(state.bikeHue));
}

function renderBike() {
  const selected = BIKE_IMAGES[state.bike] || BIKE_IMAGES.gravel;
  const stage = document.querySelector("[data-bike-stage]");
  const bikeImage = document.querySelector("[data-bike-image]");
  document.documentElement.style.setProperty("--bike-src", `url("${selected.src}")`);
  document.documentElement.style.setProperty("--bike-color", bikeColorFromHue(state.bikeHue));

  if (bikeImage) {
    stage?.classList.add("is-switching");
    window.setTimeout(() => {
      bikeImage.src = selected.src;
      bikeImage.alt = selected.alt;
      stage?.classList.remove("is-switching");
    }, 120);
  }

  document.querySelectorAll("[data-mini-bike]").forEach((miniBike) => {
    miniBike.src = selected.src;
    miniBike.alt = selected.alt;
  });

  document.querySelectorAll("[data-bike-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.bikeButton === state.bike);
  });
}

function renderCart() {
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(state.cart.length);
  });

  document.querySelectorAll("[data-bag-overlay], [data-mini-overlay]").forEach((overlay) => {
    const type = overlay.dataset.bagOverlay || overlay.dataset.miniOverlay;
    overlay.classList.toggle("active", Boolean(getCartItem(type)));
  });

  document.querySelectorAll("[data-cart-more]").forEach((node) => {
    const extra = Math.max(0, state.cart.length - 3);
    node.hidden = extra === 0;
    node.textContent = extra ? `+ ${extra} more` : "";
  });

  document.querySelectorAll("[data-cart-total]").forEach((node) => {
    node.textContent = formatPrice(cartTotal());
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    const type = button.dataset.addToCart;
    const active = Boolean(getCartItem(type));
    button.classList.toggle("active", active);
    if (button.classList.contains("bag-marker")) {
      const symbol = button.querySelector("span");
      if (symbol) symbol.textContent = active ? "-" : "+";
      button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${type} bag`);
    }
  });

  document.querySelectorAll("[data-cart-items]").forEach((cartItems) => {
    cartItems.innerHTML = state.cart.length
      ? state.cart.map((item) => {
          const product = BAG_PRODUCTS[item.type];
          return `
            <div class="cart-item">
              <div>
                <strong>${product.name}</strong>
                <span>${item.color} / ${item.size} / ${item.version}</span>
              </div>
              <div>
                <strong>${formatPrice(priceFor(item))}</strong>
                <button data-remove-bag="${item.type}" aria-label="Remove ${product.name}">Remove</button>
              </div>
            </div>
          `;
        }).join("")
      : '<p class="cart-empty">No bags selected yet. Add a bag from the bike preview or product page.</p>';
  });

  document.querySelectorAll("[data-remove-bag]").forEach((button) => {
    button.addEventListener("click", () => removeBag(button.dataset.removeBag));
  });
}

function initLanguageToggle() {
  const toggles = document.querySelectorAll("[data-lang-toggle]");
  if (!toggles.length) return;

  const applyLanguage = () => {
    document.documentElement.lang = state.lang === "cs" ? "cs" : "en";
    toggles.forEach((button) => {
      button.classList.toggle("cs", state.lang === "cs");
      button.classList.toggle("en", state.lang !== "cs");
      button.querySelector("[data-lang-flag]").textContent = state.lang === "cs" ? "CZ" : "EN";
      button.setAttribute("aria-label", state.lang === "cs" ? "Prepnout do anglictiny" : "Switch to Czech");
    });
  };

  toggles.forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = state.lang === "cs" ? "en" : "cs";
      localStorage.setItem("acepacLang", state.lang);
      applyLanguage();
    });
  });

  applyLanguage();
}

function initMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function initHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const update = () => header.classList.toggle("scrolled", window.scrollY > 24);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initCartDropdown() {
  const trigger = document.querySelector("[data-cart-toggle]");
  const popover = document.querySelector("[data-cart-popover]");
  const close = document.querySelector("[data-cart-close]");
  if (!trigger || !popover) return;

  const setOpen = (open) => {
    popover.classList.toggle("open", open);
    trigger.classList.toggle("active", open);
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!popover.classList.contains("open"));
  });

  close?.addEventListener("click", () => setOpen(false));
  document.addEventListener("click", (event) => {
    if (!popover.contains(event.target) && !trigger.contains(event.target)) {
      setOpen(false);
    }
  });
}

function initConfigurator() {
  const bikeColorSlider = document.querySelector("[data-bike-color-slider]");
  if (bikeColorSlider) {
    bikeColorSlider.value = String(state.bikeHue);
    bikeColorSlider.addEventListener("input", () => setBikeHue(bikeColorSlider.value));
  }

  document.querySelectorAll("[data-bike-button]").forEach((button) => {
    button.addEventListener("click", () => setBike(button.dataset.bikeButton));
  });

  document.querySelectorAll("[data-setup-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.setupChoice;
      state.setup[key] = button.dataset.value;
      if (key === "version") {
        state.setup.priceDelta = Number(button.dataset.priceDelta || 0);
      }
      document.querySelectorAll(`[data-setup-choice="${key}"]`).forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      if (key === "color" && button.dataset.color) {
        document.documentElement.style.setProperty("--bag-color", button.dataset.color);
      }
    });
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.classList.contains("button") ? "product" : "overview";
      addOrRemoveBag(button.dataset.addToCart, source);
      if (button.classList.contains("button")) {
        const original = button.textContent;
        button.textContent = getCartItem(button.dataset.addToCart) ? "Added to cart" : "Removed";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }
    });
  });
}

function initProductGallery() {
  const mainImage = document.querySelector(".main-product-image");
  document.querySelectorAll(".thumb-row [data-product-image]").forEach((button) => {
    button.addEventListener("click", () => {
      if (mainImage) mainImage.src = button.dataset.productImage;
      document.querySelectorAll(".thumb-row [data-product-image]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function initOptions() {
  const basePrice = 97.27;
  const priceNode = document.querySelector("[data-price]");

  const updatePrice = () => {
    const extra = [...document.querySelectorAll(".option-card.active")]
      .reduce((sum, item) => sum + Number(item.dataset.priceAdd || 0), 0);
    if (priceNode) priceNode.textContent = formatPrice(basePrice + extra);
  };

  document.querySelectorAll(".option-card[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      const group = button.dataset.option;
      document.querySelectorAll(`.option-card[data-option="${group}"]`).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      state.productConfig[group] = button.dataset.configValue || button.textContent.trim();
      if (group === "color") {
        const bagColor = state.productConfig.color === "Grey" ? "#77736c" : "#111111";
        document.documentElement.style.setProperty("--bag-color", bagColor);
      }

      if (button.dataset.productImage) {
        const mainImage = document.querySelector(".main-product-image");
        if (mainImage) mainImage.src = button.dataset.productImage;
      }

      updatePrice();
    });
  });
  updatePrice();
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

initMenu();
initHeader();
initCartDropdown();
initLanguageToggle();
initConfigurator();
initProductGallery();
initOptions();
initReveal();
renderBike();
renderCart();
