const BAG_PRODUCTS = {
  saddle: { name: "Saddle Bag MKIII", price: "EUR 97.27" },
  frame: { name: "Zip Frame Bag M MKIII", price: "EUR 55.07" },
  handlebar: { name: "Bar Roll MKIII", price: "EUR 74.53" },
  top: { name: "Fuel Bag L MKIII", price: "EUR 40.58" },
  tool: { name: "Tool Wallet MKIII", price: "EUR 19.46" }
};

const BIKE_COLORS = [
  { name: "Red clay", value: "#e43020" },
  { name: "Forest", value: "#1d6a4d" },
  { name: "Petrol", value: "#1d6380" },
  { name: "Black", value: "#1c1c1c" }
];

const bikeVariants = {
  gravel: {
    label: "Gravel",
    wheels: [[245, 520, 128], [760, 520, 128]],
    frame: "M245 520 L405 330 L575 520 L690 332 L405 330 L575 520 L355 520 L245 520",
    fork: "M690 332 L760 520 M720 350 L760 520",
    cockpit: "M690 332 L740 290 L800 292 M797 292 C842 290 846 346 804 354",
    saddle: "M365 300 L455 292 M405 330 L385 258",
    detail: "M575 520 L624 540 M315 520 L498 538"
  },
  mtb: {
    label: "MTB",
    wheels: [[245, 520, 138], [760, 520, 138]],
    frame: "M245 520 L398 314 L584 520 L690 340 L398 314 L584 520 L350 520 L245 520",
    fork: "M690 340 L760 520 M721 340 L760 520",
    cockpit: "M690 340 L748 292 L812 295 M805 295 L855 276",
    saddle: "M360 288 L452 286 M398 314 L377 246",
    detail: "M584 520 L636 548 M310 520 L505 544"
  },
  road: {
    label: "Road",
    wheels: [[245, 520, 118], [760, 520, 118]],
    frame: "M245 520 L415 336 L574 520 L674 334 L415 336 L574 520 L356 520 L245 520",
    fork: "M674 334 L760 520 M705 342 L760 520",
    cockpit: "M674 334 L730 286 L790 290 M790 290 C846 286 848 358 802 360",
    saddle: "M376 302 L452 294 M415 336 L395 263",
    detail: "M574 520 L622 538 M315 520 L496 536"
  },
  touring: {
    label: "Touring",
    wheels: [[245, 520, 126], [760, 520, 126]],
    frame: "M245 520 L402 328 L578 520 L688 330 L402 328 L578 520 L350 520 L245 520",
    fork: "M688 330 L760 520 M722 340 L760 520",
    cockpit: "M688 330 L742 292 L805 292 M805 292 L842 318",
    saddle: "M362 300 L454 294 M402 328 L383 258",
    detail: "M210 455 L140 408 M760 520 L835 448 M578 520 L628 548"
  }
};

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("acepacCart")) || [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem("acepacCart", JSON.stringify(cart));
  renderCart();
}

function addBag(type) {
  const cart = getCart();
  if (!cart.includes(type)) {
    cart.push(type);
  }
  setCart(cart);
}

function renderBike(target, variantKey = "gravel", selectedBags = [], ghost = true) {
  if (!target) return;

  const variant = bikeVariants[variantKey] || bikeVariants.gravel;
  const bagClass = ghost ? "ghost-bag" : "cart-bag";
  const ghostBags = ghost
    ? `
      <path class="${bagClass}" d="M360 282 C395 248 480 268 488 332 C456 366 380 356 340 320 Z"/>
      <path class="${bagClass}" d="M420 374 L616 362 L585 482 L388 480 Z"/>
      <path class="${bagClass}" d="M742 304 C808 302 832 352 800 402 L715 388 L708 330 Z"/>
      <rect class="${bagClass}" x="500" y="318" width="130" height="52" rx="16"/>
      <rect class="${bagClass}" x="312" y="474" width="118" height="42" rx="12"/>
    `
    : selectedBags.map(renderBagPath).join("");

  target.innerHTML = `
    <svg viewBox="0 0 1000 700" role="img" aria-label="${variant.label} bike silhouette">
      ${variant.wheels.map(([cx, cy, r]) => `<circle class="bike-tire" cx="${cx}" cy="${cy}" r="${r}"/>`).join("")}
      <path class="bike-line" d="${variant.frame}"/>
      <path class="bike-detail" d="${variant.fork}"/>
      <path class="bike-detail" d="${variant.cockpit}"/>
      <path class="bike-detail" d="${variant.saddle}"/>
      <path class="bike-detail" d="${variant.detail}"/>
      <circle class="bike-detail" cx="575" cy="520" r="34"/>
      <path class="bike-detail" d="M575 520 L632 500 M575 520 L524 546"/>
      ${ghostBags}
    </svg>
  `;
}

function renderBagPath(type) {
  const paths = {
    saddle: '<path class="cart-bag" d="M360 282 C395 248 480 268 488 332 C456 366 380 356 340 320 Z"/>',
    frame: '<path class="cart-bag" d="M420 374 L616 362 L585 482 L388 480 Z"/>',
    handlebar: '<path class="cart-bag" d="M742 304 C808 302 832 352 800 402 L715 388 L708 330 Z"/>',
    top: '<rect class="cart-bag" x="500" y="318" width="130" height="52" rx="16"/>',
    tool: '<rect class="cart-bag" x="312" y="474" width="118" height="42" rx="12"/>'
  };
  return paths[type] || "";
}

function renderCart() {
  const cart = getCart();
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(cart.length);
  });

  const cartItems = document.querySelector("[data-cart-items]");
  if (cartItems) {
    cartItems.innerHTML = cart.length
      ? cart.map((type) => `<div class="cart-item"><span>${BAG_PRODUCTS[type].name}</span><span>${BAG_PRODUCTS[type].price}</span></div>`).join("")
      : '<p class="cart-empty">No bags selected yet. Add a bag from the overview or product page.</p>';
  }

  renderBike(document.querySelector("[data-mini-bike]"), "gravel", cart, false);
}

function initMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
}

function initConfigurator() {
  const bikeStage = document.querySelector("[data-bike-svg]");
  const bikeSelect = document.querySelector("[data-bike-select]");
  const colorRange = document.querySelector("[data-color-range]");
  const colorName = document.querySelector("[data-color-name]");
  if (!bikeStage) return;

  const update = () => {
    const bike = bikeSelect?.value || "gravel";
    const color = BIKE_COLORS[Number(colorRange?.value || 0)];
    document.documentElement.style.setProperty("--bike-color", color.value);
    if (colorName) colorName.textContent = color.name;
    renderBike(bikeStage, bike, [], true);
  };

  bikeSelect?.addEventListener("change", update);
  colorRange?.addEventListener("input", update);
  update();
}

function initProductGallery() {
  const mainImage = document.querySelector(".main-product-image");
  document.querySelectorAll("[data-product-image]").forEach((button) => {
    button.addEventListener("click", () => {
      if (mainImage) mainImage.src = button.dataset.productImage;
    });
  });
}

function initCartActions() {
  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      addBag(button.dataset.addToCart);
      button.textContent = "Added to cart";
      window.setTimeout(() => {
        button.textContent = "Add to cart";
      }, 1400);
    });
  });
}

initMenu();
initConfigurator();
initProductGallery();
initCartActions();
renderCart();
