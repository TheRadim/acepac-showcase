const BIKE_IMAGES = {
  gravel: { src: "assets/gravel.svg", alt: "Gravel bike silhouette" },
  mtb: { src: "assets/mtb.svg", alt: "Mountain bike silhouette" },
  road: { src: "assets/road.svg", alt: "Road bike silhouette" }
};

const BAG_PRODUCTS = {
  saddle: { name: "Saddle Bag MKIII", basePrice: 97.27 },
  frameM: { name: "Zip Frame Bag M MKIII", basePrice: 55.07 },
  frameL: { name: "Zip Frame Bag L MKIII", basePrice: 67.07 },
  top: { name: "Fuel Bag MKIII", basePrice: 40.58 }
};

const BAG_CONFIG = {
  frame: {
    title: "Frame bag",
    description: "Central frame storage uses the main triangle and keeps weight low.",
    detail: "Frame bag detail",
    sizeGroup: "frame"
  },
  saddle: {
    title: "Saddle bag",
    description: "Large rear volume for sleep systems, clothing, and soft kit without a rack.",
    detail: "Saddle bag detail",
    sizeGroup: "saddle"
  },
  top: {
    title: "Fuel bag",
    description: "Small top tube storage for food, phone, and the things you want immediately at hand.",
    detail: "Fuel bag detail",
    sizeGroup: "none"
  }
};

const BIKE_COLOR_LAYER = {
  gravel: "bikecolor",
  mtb: "framecolor",
  road: "framecolor"
};

const BIKE_ALLOWED_BAGS = {
  gravel: ["saddle", "top", "frameM", "frameL"],
  mtb: ["saddle", "top"],
  road: ["saddle", "top", "frameM", "frameL"]
};

const BAG_LAYER_IDS = {
  saddle: ["Saddlebag", "Saddlebag-copy"],
  top: ["toptube", "toptube-copy"],
  frameM: ["framebagM", "framebagM-copy"],
  frameL: ["framebagXL", "framebagXL-copy"]
};

const MARKER_POSITIONS = {
  gravel: {
    saddle: [31, 16],
    top: [58, 21],
    frame: [53, 36]
  },
  mtb: {
    saddle: [36, 23],
    top: [58, 22]
  },
  road: {
    saddle: [33, 18],
    top: [59, 22],
    frame: [53, 36]
  }
};

const defaultSetup = {
  color: "Black",
  size: "16L",
  frameSize: "M",
  version: "MKIII",
  priceDelta: 0
};

const state = {
  bike: BIKE_IMAGES[localStorage.getItem("acepacBike")] ? localStorage.getItem("acepacBike") : "gravel",
  bikeHue: Math.max(0, Math.min(100, Number(localStorage.getItem("acepacBikeHue") || 10))),
  bikeColor: localStorage.getItem("acepacBikeColor") || "#dddddd",
  selectedBag: null,
  preview: [],
  lang: localStorage.getItem("acepacLang") || "en",
  setup: { ...defaultSetup },
  productConfig: { color: "Black", size: "L", version: "MKIII" },
  cart: readCart()
};

const svgCache = new Map();

function formatPrice(value) {
  return `EUR ${value.toFixed(2)}`;
}

function interpolateHex(start, end, ratio) {
  const from = start.match(/\w\w/g).map((part) => parseInt(part, 16));
  const to = end.match(/\w\w/g).map((part) => parseInt(part, 16));
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * ratio));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function bikeColorFromHue(value) {
  const point = Math.max(0, Math.min(100, Number(value)));
  if (point <= 16) return interpolateHex("f2f2f2", "777777", point / 16);
  if (point >= 88) return interpolateHex("7d44d7", "151515", (point - 88) / 12);
  const hue = ((point - 16) / 72) * 300;
  return `hsl(${hue} 64% 50%)`;
}

function setBikeColor(color, hue = null) {
  state.bikeColor = color;
  if (hue !== null) {
    state.bikeHue = Number(hue);
    localStorage.setItem("acepacBikeHue", String(state.bikeHue));
  }
  localStorage.setItem("acepacBikeColor", state.bikeColor);
  document.documentElement.style.setProperty("--bike-color", state.bikeColor);
  document.querySelectorAll("[data-bike-color-slider]").forEach((slider) => {
    if (hue !== null) slider.value = String(state.bikeHue);
  });
  renderSvgObjects();
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
  if (type === "frameXL") return "frameL";
  return type;
}

function currentFrameType() {
  return state.setup.frameSize === "L" ? "frameL" : "frameM";
}

function currentSelectedType() {
  if (!state.selectedBag) return null;
  if (state.selectedBag === "frame") return currentFrameType();
  return state.selectedBag;
}

function saveCart() {
  localStorage.setItem("acepacCart", JSON.stringify(state.cart));
}

function getCartItem(type) {
  if (type === "frame") {
    return state.cart.find((item) => item.type === "frameM" || item.type === "frameL");
  }
  return state.cart.find((item) => item.type === type);
}

function getPreviewItem(type) {
  if (type === "frame") {
    return state.preview.find((item) => item.type === "frameM" || item.type === "frameL");
  }
  return state.preview.find((item) => item.type === type);
}

function previewTypeForItem(item) {
  if (!item) return null;
  return item.type === "frameM" || item.type === "frameL" ? "frame" : item.type;
}

function applySetupFromItem(item) {
  if (!item) return;
  state.setup.color = item.color || defaultSetup.color;
  state.setup.version = item.version || defaultSetup.version;
  state.setup.priceDelta = Number(item.priceDelta || 0);
  if (item.type === "frameM" || item.type === "frameL") {
    state.setup.frameSize = item.type === "frameL" ? "L" : "M";
  } else {
    state.setup.size = item.size || defaultSetup.size;
  }
}

function selectPreviewBag(type) {
  if (!BAG_CONFIG[type] || !isBagAllowed(type)) return;
  const item = getPreviewItem(type);
  if (!item) return;
  state.selectedBag = type;
  applySetupFromItem(item);
  renderBike();
  renderCart();
  renderConfiguratorPanel();
}

function currentConfigItem() {
  const resolvedType = currentSelectedType();
  if (!resolvedType) return null;
  return {
    type: resolvedType,
    ...state.setup,
    size: resolvedType === "frameM" || resolvedType === "frameL" ? state.setup.frameSize : state.setup.size
  };
}

function priceFor(item) {
  const product = BAG_PRODUCTS[item.type];
  const sizeDelta = item.type === "frameM" || item.type === "frameL"
    ? 0
    : item.size === "8L" ? -8 : 0;
  const versionDelta = item.version === "MKII" ? -10 : 0;
  return product.basePrice + sizeDelta + versionDelta + Number(item.priceDelta || 0);
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + priceFor(item), 0);
}

function addOrRemoveBag(type, source = "overview") {
  if (!isBagAllowed(type)) return;
  const resolvedType = type === "frame" ? currentFrameType() : type;
  const existingIndex = type === "frame"
    ? state.cart.findIndex((item) => item.type === "frameM" || item.type === "frameL")
    : state.cart.findIndex((item) => item.type === resolvedType);
  if (existingIndex >= 0) {
    state.cart.splice(existingIndex, 1);
  } else {
    if (resolvedType === "frameM" || resolvedType === "frameL") {
      state.cart = state.cart.filter((item) => item.type !== "frameM" && item.type !== "frameL");
    }
    const config = source === "product" ? state.productConfig : state.setup;
    state.cart.push({ type: resolvedType, ...config, size: resolvedType === "frameL" ? "L" : config.size });
  }
  saveCart();
  renderCart();
}

function addConfiguredBag() {
  if (!isBagAllowed(state.selectedBag)) return;
  const nextConfig = currentConfigItem();
  if (!nextConfig) return;
  const resolvedType = nextConfig.type;
  if (resolvedType === "frameM" || resolvedType === "frameL") {
    state.cart = state.cart.filter((item) => item.type !== "frameM" && item.type !== "frameL");
  } else {
    state.cart = state.cart.filter((item) => item.type !== resolvedType);
  }
  state.cart.push(nextConfig);
  saveCart();
  renderCart();
  renderConfiguratorPanel();
}

function removePreviewBag(type) {
  if (!type) return;
  if (type === "frame") {
    state.preview = state.preview.filter((item) => item.type !== "frameM" && item.type !== "frameL");
  } else {
    state.preview = state.preview.filter((item) => item.type !== type);
  }
  const nextItem = state.preview[0] || null;
  state.selectedBag = previewTypeForItem(nextItem);
  applySetupFromItem(nextItem);
  renderBike();
  renderCart();
  renderConfiguratorPanel();
}

function removeBag(type) {
  state.cart = state.cart.filter((item) => item.type !== type);
  saveCart();
  renderCart();
  renderConfiguratorPanel();
}

function syncSelectedCartItem() {
  if (!state.selectedBag) return;
  const updatedItem = currentConfigItem();
  if (!updatedItem) return;

  if (getPreviewItem(state.selectedBag)) {
    if (state.selectedBag === "frame") {
      state.preview = state.preview.filter((item) => item.type !== "frameM" && item.type !== "frameL");
    } else {
      state.preview = state.preview.filter((item) => item.type !== state.selectedBag);
    }
    state.preview.push(updatedItem);
  }

  if (getCartItem(state.selectedBag)) {
    if (state.selectedBag === "frame") {
      state.cart = state.cart.filter((item) => item.type !== "frameM" && item.type !== "frameL");
    } else {
      state.cart = state.cart.filter((item) => item.type !== state.selectedBag);
    }
    state.cart.push(updatedItem);
    saveCart();
    renderCart();
  }
  renderSvgObjects();
}

function setBike(type) {
  if (!BIKE_IMAGES[type]) return;
  state.bike = type;
  localStorage.setItem("acepacBike", type);
  state.cart = state.cart.filter((item) => isBagAllowed(item.type));
  state.preview = state.preview.filter((item) => isBagAllowed(item.type));
  if (!isBagAllowed(state.selectedBag)) {
    state.selectedBag = state.preview[0] ? previewTypeForItem(state.preview[0]) : null;
  }
  saveCart();
  renderBike();
  renderCart();
  renderConfiguratorPanel();
}

function isBagAllowed(type) {
  if (!type) return false;
  if (type === "frame") {
    return (BIKE_ALLOWED_BAGS[state.bike] || []).includes(currentFrameType());
  }
  if (type === "frameM" || type === "frameL") {
    return (BIKE_ALLOWED_BAGS[state.bike] || []).includes(type);
  }
  return (BIKE_ALLOWED_BAGS[state.bike] || []).includes(type);
}

function setBikeHue(hue) {
  setBikeColor(bikeColorFromHue(hue), hue);
}

function setSelectedBag(type) {
  if (!BAG_CONFIG[type] || !isBagAllowed(type)) return;
  state.selectedBag = type;
  applySetupFromItem(getPreviewItem(type));
  renderBike();
  renderCart();
  renderConfiguratorPanel();
}

function addPreviewBag(type) {
  if (!BAG_CONFIG[type] || !isBagAllowed(type)) return;
  state.selectedBag = type;
  const nextItem = currentConfigItem();
  if (!nextItem) return;
  if (type === "frame") {
    state.preview = state.preview.filter((item) => item.type !== "frameM" && item.type !== "frameL");
  } else {
    state.preview = state.preview.filter((item) => item.type !== type);
  }
  state.preview.push(nextItem);
  renderBike();
  renderCart();
  renderConfiguratorPanel();
}

function previewSummary(item) {
  const displayType = previewTypeForItem(item);
  const size = item.type === "frameM" ? "M" : item.type === "frameL" ? "L" : item.size;
  return {
    type: displayType,
    title: BAG_CONFIG[displayType]?.title || BAG_PRODUCTS[item.type]?.name || "Bag",
    meta: [item.color, size, item.version].filter(Boolean).join(" / "),
    inCart: Boolean(getCartItem(displayType))
  };
}

function renderPreviewList() {
  document.querySelectorAll("[data-preview-list]").forEach((list) => {
    if (!state.preview.length) {
      list.innerHTML = `
        <div class="setup-list-empty">
          <strong>No bags on the bike yet</strong>
          <span>Use the plus markers to add bags to the setup.</span>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="setup-list-head">
        <span>On this bike</span>
        <small>${state.preview.length} ${state.preview.length === 1 ? "bag" : "bags"}</small>
      </div>
      <div class="setup-list-items">
        ${state.preview.map((item) => {
          const summary = previewSummary(item);
          const active = summary.type === state.selectedBag;
          return `
            <button class="setup-list-item${active ? " active" : ""}" data-preview-select="${summary.type}">
              <span>
                <strong>${summary.title}</strong>
                <small>${summary.meta}</small>
              </span>
              ${summary.inCart ? "<em>In basket</em>" : ""}
            </button>
          `;
        }).join("")}
      </div>
    `;
  });
}

function renderBike() {
  const selected = BIKE_IMAGES[state.bike] || BIKE_IMAGES.gravel;
  document.documentElement.style.setProperty("--bike-src", `url("${selected.src}")`);
  document.documentElement.style.setProperty("--bike-color", state.bikeColor);

  document.querySelectorAll("[data-bike-inline]").forEach((bikeNode) => {
    const nodeBike = bikeNode.dataset.staticBike || state.bike;
    const nodeImage = BIKE_IMAGES[nodeBike] || selected;
    loadInlineBike(bikeNode, nodeImage.src);
  });

  document.querySelectorAll("[data-bike-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.bikeButton === state.bike);
  });

  document.querySelectorAll("[data-select-bag]").forEach((button) => {
    const type = button.dataset.selectBag;
    const allowed = isBagAllowed(type);
    button.hidden = !allowed;
    button.disabled = !allowed;
    button.classList.toggle("selected", type === state.selectedBag);
    if (allowed && MARKER_POSITIONS[state.bike]?.[type]) {
      const [left, top] = MARKER_POSITIONS[state.bike][type];
      button.style.setProperty("--marker-left", `${left}%`);
      button.style.setProperty("--marker-top", `${top}%`);
    }
  });
  renderPreviewList();
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
  });

  document.querySelectorAll("[data-select-bag]").forEach((button) => {
    const type = button.dataset.selectBag;
    const active = Boolean(getPreviewItem(type));
    button.classList.toggle("active", active);
    const symbol = button.querySelector("span");
    if (symbol) symbol.textContent = active ? "-" : "+";
    const product = type === "frame" ? BAG_PRODUCTS[currentFrameType()] : BAG_PRODUCTS[type];
    button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${product?.name || type}`);
  });

  document.querySelectorAll("[data-cart-items]").forEach((cartItems) => {
    cartItems.innerHTML = state.cart.length
      ? state.cart.map((item) => {
          const product = BAG_PRODUCTS[item.type];
          return `
            <div class="cart-item">
              <div>
                <strong>${product.name}</strong>
                <span>${item.color} / ${item.type === "frameM" ? "M" : item.type === "frameL" ? "L" : item.size} / ${item.version}</span>
              </div>
              <div>
                <strong>${formatPrice(priceFor(item))}</strong>
                <button data-remove-bag="${item.type}" aria-label="Remove ${product.name}">Remove</button>
              </div>
            </div>
          `;
        }).join("")
      : '<p class="cart-empty">No bags selected yet. Start by clicking a position on the bike.</p>';
  });

  document.querySelectorAll("[data-remove-bag]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeBag(button.dataset.removeBag);
    });
  });
  renderPreviewList();
}

function layerFilterFor(item) {
  return item?.color === "Grey"
    ? "grayscale(1) brightness(1.45) contrast(.72)"
    : "none";
}

function layerOpacityFor(item) {
  return item?.color === "Grey" ? ".7" : ".9";
}

function previewItemFor(type, bikeNode) {
  const isConfiguratorBike = Boolean(bikeNode.closest("[data-bike-stage]"));
  if (isConfiguratorBike) return getPreviewItem(type);
  return getCartItem(type);
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
  const previewBags = bikeNode.dataset.previewBags
    ? bikeNode.dataset.previewBags.split(",").map((item) => item.trim()).filter(Boolean)
    : null;

  const bikeLayer = getSvgLayer(bikeNode, "bike");
  if (bikeLayer) {
    bikeLayer.style.opacity = "1";
    bikeLayer.style.filter = "grayscale(1)";
  }

  ["bikecolor", "framecolor"].forEach((id) => {
    const layer = getSvgLayer(bikeNode, id);
    if (!layer) return;
    layer.style.display = id === BIKE_COLOR_LAYER[bikeType] ? "inline" : "none";
    layer.setAttribute("fill", state.bikeColor);
    layer.style.opacity = "1";
  });

  Object.entries(BAG_LAYER_IDS).forEach(([type, ids]) => {
    const item = previewBags
      ? previewBags.includes(type) ? { color: "Black" } : null
      : previewItemFor(type, bikeNode);
    ids.forEach((id) => {
      const layer = getSvgLayer(bikeNode, id);
      if (!layer) return;
      layer.style.display = item ? "inline" : "none";
      layer.style.opacity = item ? layerOpacityFor(item) : "0";
      layer.style.filter = layerFilterFor(item);
      layer.style.pointerEvents = "none";
    });
  });
}

function renderConfiguratorPanel() {
  const config = BAG_CONFIG[state.selectedBag];
  const title = document.querySelector("[data-selected-bag-title]");
  const description = document.querySelector("[data-selected-bag-description]");
  const link = document.querySelector("[data-selected-product-link]");
  const button = document.querySelector("[data-config-add-to-cart]");
  const frameSizeGroup = document.querySelector("[data-frame-size-group]");
  const saddleSizeGroup = document.querySelector("[data-saddle-size-group]");
  const optionGroups = document.querySelectorAll(".setup-panel .setup-group, .setup-panel .setup-actions");
  if (!config) {
    if (title) title.textContent = "Choose a bag position";
    if (description) description.textContent = "Click a plus marker on the bike to add a bag to the visual setup, then configure the selected bag here.";
    optionGroups.forEach((group) => {
      group.hidden = true;
    });
    renderSvgObjects();
    return;
  }
  const resolvedType = currentSelectedType();
  const product = BAG_PRODUCTS[resolvedType];
  const inCart = Boolean(getCartItem(state.selectedBag));

  optionGroups.forEach((group) => {
    group.hidden = false;
  });
  if (title) title.textContent = config.title;
  if (description) description.textContent = config.description;
  if (link) link.textContent = "Detail";
  if (button) {
    const label = button.querySelector("span");
    if (label) label.textContent = inCart ? "Update" : "Add";
    button.disabled = !product;
  }

  if (frameSizeGroup) frameSizeGroup.hidden = config.sizeGroup !== "frame";
  if (saddleSizeGroup) saddleSizeGroup.hidden = config.sizeGroup !== "saddle";

  document.querySelectorAll("[data-setup-choice]").forEach((item) => {
    const key = item.dataset.setupChoice;
    item.classList.toggle("active", state.setup[key] === item.dataset.value);
  });

  renderSvgObjects();
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
      if (button.dataset.langText !== undefined) {
        button.textContent = state.lang === "cs" ? "english" : "česky";
      }
      button.setAttribute("aria-label", state.lang === "cs" ? "Switch to English" : "Switch to Czech");
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

  document.querySelectorAll("[data-select-bag]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.selectBag;
      if (getPreviewItem(type)) {
        removePreviewBag(type);
        return;
      }
      addPreviewBag(type);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target.parentElement;
    const previewButton = target?.closest("[data-preview-select]");
    if (!previewButton) return;
    selectPreviewBag(previewButton.dataset.previewSelect);
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
      syncSelectedCartItem();
      renderConfiguratorPanel();
    });
  });

  document.querySelectorAll("[data-config-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      addConfiguredBag();
      const label = button.querySelector("span");
      if (label) label.textContent = "Added";
      window.setTimeout(() => renderConfiguratorPanel(), 900);
    });
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.classList.contains("button") ? "product" : "overview";
      addOrRemoveBag(button.dataset.addToCart, source);
      if (button.classList.contains("button")) {
        const original = button.textContent;
        button.textContent = getCartItem(button.dataset.addToCart) ? "Added to basket" : "Removed";
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
setBikeHue(state.bikeHue);
renderBike();
renderCart();
renderConfiguratorPanel();
