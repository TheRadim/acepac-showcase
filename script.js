const BIKE_IMAGES = {
  gravel: { src: "assets/gravel.png", alt: "Gravel bike silhouette" },
  mtb: { src: "assets/mtb.png", alt: "Mountain bike silhouette" },
  road: { src: "assets/road.png", alt: "Road bike silhouette" },
  touring: { src: "assets/gravel.png", alt: "Touring bike silhouette" }
};

const BAG_PRODUCTS = {
  saddle: { name: "Saddle Bag MKIII", price: "EUR 97.27" },
  frame: { name: "Zip Frame Bag M MKIII", price: "EUR 55.07" },
  handlebar: { name: "Bar Roll MKIII", price: "EUR 74.53" },
  top: { name: "Fuel Bag L MKIII", price: "EUR 40.58" },
  tool: { name: "Tool Wallet MKIII", price: "EUR 19.46" }
};

const state = {
  bike: localStorage.getItem("acepacBike") || "gravel",
  cart: readCart()
};

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("acepacCart")) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("acepacCart", JSON.stringify(state.cart));
}

function addBag(type) {
  if (!state.cart.includes(type)) {
    state.cart.push(type);
    saveCart();
  }
  renderCart();
}

function setBike(type) {
  state.bike = type;
  localStorage.setItem("acepacBike", type);
  renderBike();
}

function renderBike() {
  const selected = BIKE_IMAGES[state.bike] || BIKE_IMAGES.gravel;
  const stage = document.querySelector("[data-bike-stage]");
  const bikeImage = document.querySelector("[data-bike-image]");
  const miniBike = document.querySelector("[data-mini-bike]");

  if (bikeImage) {
    stage?.classList.add("is-switching");
    window.setTimeout(() => {
      bikeImage.src = selected.src;
      bikeImage.alt = selected.alt;
      stage?.classList.remove("is-switching");
    }, 120);
  }

  if (miniBike) {
    miniBike.src = selected.src;
    miniBike.alt = selected.alt;
  }

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
    overlay.classList.toggle("active", state.cart.includes(type));
  });

  const cartItems = document.querySelector("[data-cart-items]");
  if (!cartItems) return;

  cartItems.innerHTML = state.cart.length
    ? state.cart.map((type) => {
        const item = BAG_PRODUCTS[type];
        return `<div class="cart-item"><span>${item.name}</span><span>${item.price}</span></div>`;
      }).join("")
    : '<p class="cart-empty">No bags selected yet. Add a bag from the bike preview or product page.</p>';
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

function initConfigurator() {
  document.querySelectorAll("[data-bike-button]").forEach((button) => {
    button.addEventListener("click", () => setBike(button.dataset.bikeButton));
  });

  document.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      document.documentElement.style.setProperty("--bag-color", button.dataset.color);
      document.querySelectorAll("[data-color]").forEach((item) => item.classList.toggle("active", item === button));
    });
  });

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      addBag(button.dataset.addToCart);
      const original = button.textContent;
      if (button.classList.contains("button")) {
        button.textContent = "Added to cart";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1300);
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

  document.querySelectorAll(".option-card[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      const group = button.dataset.option;
      document.querySelectorAll(`.option-card[data-option="${group}"]`).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      if (button.dataset.productImage) {
        const mainImage = document.querySelector(".main-product-image");
        if (mainImage) mainImage.src = button.dataset.productImage;
      }

      const extra = [...document.querySelectorAll(".option-card.active")]
        .reduce((sum, item) => sum + Number(item.dataset.priceAdd || 0), 0);
      if (priceNode) priceNode.textContent = `EUR ${(basePrice + extra).toFixed(2)}`;
    });
  });
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
initConfigurator();
initProductGallery();
initOptions();
initReveal();
renderBike();
renderCart();
