const BIKE_IMAGES = {
  gravel: { src: "assets/gravel.svg", alt: "Gravel bike silhouette" },
  mtb: { src: "assets/mtb.svg", alt: "Mountain bike silhouette" },
  road: { src: "assets/road.svg", alt: "Road bike silhouette" }
};

const BAG_PRODUCTS = {
  saddle: { name: "Saddle Bag MKIII", basePrice: 97.27 },
  frameM: { name: "Zip Frame Bag M MKIII", basePrice: 55.07 },
  frameXL: { name: "Zip Frame Bag XL MKIII", basePrice: 67.07 },
  top: { name: "Fuel Bag MKIII", basePrice: 40.58 }
};

const BIKE_COLOR_LAYER = {
  gravel: "bikecolor",
  mtb: "framecolor",
  road: "framecolor"
};

const BIKE_ALLOWED_BAGS = {
  gravel: ["saddle", "top", "frameM", "frameXL"],
  mtb: ["saddle", "top"],
  road: ["saddle", "top", "frameM", "frameXL"]
};

const BAG_LAYER_IDS = {
  saddle: ["Saddlebag", "Saddlebag-copy"],
  top: ["toptube", "toptube-copy"],
  frameM: ["framebagM", "framebagM-copy"],
  frameXL: ["framebagXL", "framebagXL-copy"]
};

const MARKER_POSITIONS = {
  gravel: {
    saddle: [31, 16],
    top: [58, 21],
    frameM: [56, 34],
    frameXL: [51, 39]
  },
  mtb: {
    saddle: [36, 23],
    top: [58, 22]
  },
  road: {
    saddle: [33, 18],
    top: [59, 22],
    frameM: [55, 34],
    frameXL: [51, 39]
  }
};

const defaultSetup = {
  color: "Black",
  size: "L",
  version: "MKIII",
  priceDelta: 0
};

const state = {
  bike: BIKE_IMAGES[localStorage.getItem("acepacBike")] ? localStorage.getItem("acepacBike") : "gravel",
  bikeTone: Math.max(76, Number(localStorage.getItem("acepacBikeHue") || 88)),
  lang: localStorage.getItem("acepacLang") || "en",
  setup: { ...defaultSetup },
  productConfig: { color: "Black", size: "L", version: "MKIII" },
  cart: readCart()
};

const svgCache = new Map();

function formatPrice(value) {
  return `EUR ${value.toFixed(2)}`;
}

function bikeColorFromTone(tone) {
  return `hsl(0 0% ${tone}%)`;
}

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem("acepacCart")) || [];
    return stored.map((item) => {
      if (typeof item === "string") {
        return { type: normalizeBagType(item), ...defaultSetup, priceDelta: 0 };
      }
      return { ...defaultSetup, priceDelta: 0, ...item, type: normalizeBagType(item.type) };
    }).filter((item) => BAG_PRODUCTS[item.type]);
  } catch {
    return [];
  }
}

function normalizeBagType(type) {
  if (type === "frame") return "frameM";
  return type;
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
  if (!isBagAllowed(type)) return;
  const existingIndex = state.cart.findIndex((item) => item.type === type);
  if (existingIndex >= 0) {
    state.cart.splice(existingIndex, 1);
  } else {
    if (type === "frameM" || type === "frameXL") {
      state.cart = state.cart.filter((item) => item.type !== "frameM" && item.type !== "frameXL");
    }
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
  state.cart = state.cart.filter((item) => isBagAllowed(item.type));
  saveCart();
  renderBike();
  renderCart();
}

function isBagAllowed(type) {
  return (BIKE_ALLOWED_BAGS[state.bike] || []).includes(type);
}

function setBikeTone(tone) {
  state.bikeTone = Number(tone);
  localStorage.setItem("acepacBikeHue", String(state.bikeTone));
  document.documentElement.style.setProperty("--bike-color", bikeColorFromTone(state.bikeTone));
  renderSvgObjects();
}

function renderBike() {
  const selected = BIKE_IMAGES[state.bike] || BIKE_IMAGES.gravel;
  const stage = document.querySelector("[data-bike-stage]");
  document.documentElement.style.setProperty("--bike-src", `url("${selected.src}")`);
  document.documentElement.style.setProperty("--bike-color", bikeColorFromTone(state.bikeTone));

  stage?.classList.add("is-switching");
  document.querySelectorAll("[data-bike-inline]").forEach((bikeNode) => {
    const nodeBike = bikeNode.dataset.staticBike || state.bike;
    const nodeImage = BIKE_IMAGES[nodeBike] || selected;
    loadInlineBike(bikeNode, nodeImage.src);
  });
  window.setTimeout(() => stage?.classList.remove("is-switching"), 160);

  document.querySelectorAll("[data-bike-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.bikeButton === state.bike);
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    const type = button.dataset.addToCart;
    const allowed = isBagAllowed(type);
    button.hidden = !allowed;
    button.disabled = !allowed;
    if (allowed && MARKER_POSITIONS[state.bike]?.[type]) {
      const [left, top] = MARKER_POSITIONS[state.bike][type];
      button.style.setProperty("--marker-left", `${left}%`);
      button.style.setProperty("--marker-top", `${top}%`);
    }
  });
}

function renderCart() {
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(state.cart.length);
  });

  renderSvgObjects();

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
        button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${BAG_PRODUCTS[type]?.name || type}`);
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
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeBag(button.dataset.removeBag);
    });
  });
}

function layerFilterFor(item) {
  return item?.color === "Grey"
    ? "grayscale(1) brightness(1.45) contrast(.72)"
    : "none";
}

function getSvgLayer(root, id) {
  return root.querySelector(`[id="${id}"]`);
}

async function loadInlineBike(bikeNode, src) {
  if (bikeNode.dataset.loadedSrc !== src) {
    bikeNode.classList.remove("is-ready");
    if (!svgCache.has(src)) {
      const response = await fetch(src);
      svgCache.set(src, await response.text());
    }
    bikeNode.innerHTML = svgCache.get(src);
    bikeNode.dataset.loadedSrc = src;
  }
  applySvgState(bikeNode);
  bikeNode.classList.add("is-ready");
}

function applySvgState(bikeNode) {
  const bikeType = bikeNode.dataset.staticBike || state.bike;

  const bikeLayer = getSvgLayer(bikeNode, "bike");
  if (bikeLayer) {
    bikeLayer.style.opacity = "1";
    bikeLayer.style.filter = "grayscale(1) brightness(.28)";
  }

  ["bikecolor", "framecolor"].forEach((id) => {
    const layer = getSvgLayer(bikeNode, id);
    if (!layer) return;
    layer.style.display = id === BIKE_COLOR_LAYER[bikeType] ? "inline" : "none";
    layer.setAttribute("fill", bikeColorFromTone(state.bikeTone));
    layer.style.opacity = "1";
  });

  Object.entries(BAG_LAYER_IDS).forEach(([type, ids]) => {
    const item = getCartItem(type);
    ids.forEach((id) => {
      const layer = getSvgLayer(bikeNode, id);
      if (!layer) return;
      layer.style.display = item ? "inline" : "none";
      layer.style.opacity = item ? ".72" : "0";
      layer.style.filter = layerFilterFor(item);
      layer.style.pointerEvents = "none";
    });
  });
}

function renderSvgObjects() {
  document.querySelectorAll("[data-bike-inline]").forEach((bikeNode) => applySvgState(bikeNode));
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
    bikeColorSlider.value = String(state.bikeTone);
    bikeColorSlider.addEventListener("input", () => setBikeTone(bikeColorSlider.value));
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
