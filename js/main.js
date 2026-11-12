document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const brand = {
    name: "Nordkern Fitness",
    contactEmail: "info@nordkern-fitness.de"
  };

  const selectors = {
    headerSlot: "[data-header]",
    footerSlot: "[data-footer]",
    contactFormSlot: "[data-contact-form]",
    faqSlot: "[data-faq]",

    homeSectionStudioSlot: "[data-home-section-studio]",
    homeSectionTagespassSlot: "[data-home-section-tagespass]",
    homeSectionAppSlot: "[data-home-section-app]",
    homeSectionUrlaubspassSlot: "[data-home-section-urlaubspass]",

    tarifBasicSlot: "[data-tarif-basic]",
    tarifPlusSlot: "[data-tarif-plus]",
    tarifProSlot: "[data-tarif-pro]",
    tarifTagespassSlot: "[data-tarif-tagespass]",
    tarifUrlaubspassSlot: "[data-tarif-urlaubspass]",
    tarifSectionGetraenkeautomatSlot: "[data-tarif-section-getraenkeautomat]",

    navLink: ".nav-link",
    siteHeaderInner: ".site-header-inner",
    burger: "#burger",
    siteNav: ".site-nav",

    modal: ".modal",
    modalTrigger: "[data-modal-target]",
    modalClose: ".modal-close",

    contactForm: "[data-nordkern-contact-form]",

    pricingTabs: ".pricing-tabs",
    pricingTabButton: ".pricing-tab-button",
    pricingPanel: "[data-plan-panel]",
    pricingInfoModal: "#pricing-info-modal",
    pricingInfoBox: ".pricing-info-box",
    pricingInfoTitle: "#pricing-info-title",
    pricingInfoText: "#pricing-info-text",
    pricingInfoClose: ".pricing-info-close",
    pricingInfoButton: "[data-info-title][data-info-text]",

    faqSearch: "#faq-search",
    faqCategoryButton: ".faq-category-button",
    faqItem: ".faq-item",
    faqGroup: "[data-faq-group]",
    faqResultLine: "#faq-result-line",
    faqEmpty: "#faq-empty",

    legalTabButton: ".legal-tab-button",
    legalPanel: ".legal-panel"
  };

  const keys = {
    escape: "Escape"
  };

  const shouldReduceMotion = () => prefersReducedMotion.matches;

  const componentFiles = [
    {
      selector: selectors.headerSlot,
      file: "components/header.html"
    },
    {
      selector: selectors.footerSlot,
      file: "components/footer.html"
    },
    {
      selector: selectors.contactFormSlot,
      file: "components/contact-form.html"
    },
    {
      selector: selectors.faqSlot,
      file: "components/faq.html"
    },
    {
      selector: selectors.homeSectionStudioSlot,
      file: "components/home-section-studio.html"
    },
    {
      selector: selectors.homeSectionTagespassSlot,
      file: "components/home-section-tagespass.html"
    },
    {
      selector: selectors.homeSectionAppSlot,
      file: "components/home-section-app.html"
    },
    {
      selector: selectors.homeSectionUrlaubspassSlot,
      file: "components/home-section-urlaubspass.html"
    },
    {
      selector: selectors.tarifSectionGetraenkeautomatSlot,
      file: "components/tarif-section-getraenkeautomat.html"
    }
  ];

  const loadComponent = async (selector, file) => {
    const target = document.querySelector(selector);
    if (!target || target.dataset.previewInlined === "true") return;

    try {
      const response = await fetch(file);

      if (!response.ok) {
        throw new Error(`Komponente konnte nicht geladen werden: ${file}`);
      }

      target.innerHTML = await response.text();
    } catch (error) {
      console.error(error);

      target.innerHTML = `
        <section style="padding: 2rem; background: #f5f5f7;">
          <p style="margin: 0; color: #6e6e73; font-family: system-ui, sans-serif;">
            Komponente konnte nicht geladen werden: ${file}
          </p>
        </section>
      `;
    }
  };

  await Promise.all(
    componentFiles.map((component) => loadComponent(component.selector, component.file))
  );

  const headerInner = document.querySelector(selectors.siteHeaderInner);
  const burger = document.querySelector(selectors.burger);
  const nav = document.querySelector(selectors.siteNav);

  const getCurrentPage = () => {
    const page = window.location.pathname.split("/").pop();
    return page || "index.html";
  };

  const normalizePageHref = (href) => {
    if (!href) return "";

    try {
      const url = new URL(href, window.location.href);
      const page = url.pathname.split("/").pop();

      return page || "index.html";
    } catch (error) {
      return href.split("#")[0].split("?")[0] || "index.html";
    }
  };

  const setActiveNavLink = () => {
    const currentPage = getCurrentPage();
    const links = document.querySelectorAll(selectors.navLink);

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const linkPage = normalizePageHref(href);
      const isActive = linkPage === currentPage;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const runPageEnterAnimation = () => {
    if (shouldReduceMotion()) {
      body.classList.remove("page-enter", "page-leaving");
      body.classList.add("page-ready");
      return;
    }

    body.classList.add("page-enter");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        body.classList.add("page-ready");
        body.classList.remove("page-enter");
      });
    });
  };

  const setMenuState = (isOpen) => {
    if (!burger || !nav) return;

    burger.classList.toggle("is-active", isOpen);
    nav.classList.toggle("open", isOpen);
    body.classList.toggle("nav-open", isOpen);

    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");

    if (isOpen) {
      const activeLink = nav.querySelector(".nav-link.active");
      const firstLink = nav.querySelector("a");

      window.setTimeout(() => {
        (activeLink || firstLink)?.focus({ preventScroll: true });
      }, shouldReduceMotion() ? 0 : 120);
    }
  };

  const closeMobileMenu = () => {
    setMenuState(false);
  };

  const setupMobileMenu = () => {
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open");
      setMenuState(!isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeMobileMenu();
      }
    });
  };

  const setupHeaderScrollState = () => {
    if (!headerInner) return;

    let headerIsScrolled = false;
    let ticking = false;

    const updateHeaderScrollState = () => {
      const scrollY = window.scrollY;

      if (!headerIsScrolled && scrollY > 24) {
        headerIsScrolled = true;
        headerInner.classList.add("scrolled");
      } else if (headerIsScrolled && scrollY < 6) {
        headerIsScrolled = false;
        headerInner.classList.remove("scrolled");
      }

      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateHeaderScrollState);
    };

    updateHeaderScrollState();
    window.addEventListener("scroll", requestUpdate, { passive: true });
  };

  const isInternalPageLink = (link) => {
    if (!link) return false;

    const href = link.getAttribute("href");

    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (href.startsWith("sms:")) return false;
    if (href.startsWith("javascript:")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;

    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin;
    } catch (error) {
      return true;
    }
  };

  // Resolve URL fragments by ID, never as a CSS selector. Encoded characters and
  // malformed fragments must not crash the page or alter a different selector.
  const safeHashTarget = (hash) => {
    if (typeof hash !== "string" || !hash.startsWith("#") || hash.length > 2048) return null;
    try {
      const id = decodeURIComponent(hash.slice(1));
      if (!id || id.length > 512 || /[\\u0000-\\u001f\\u007f]/.test(id)) return null;
      return document.getElementById(id);
    } catch {
      return null;
    }
  };

  const getSamePageHashTarget = (href) => {
    if (!href || !href.includes("#")) return null;

    try {
      const targetUrl = new URL(href, window.location.href);
      const isSamePage =
        targetUrl.origin === window.location.origin &&
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash.length > 1;

      if (!isSamePage) return null;

      return safeHashTarget(targetUrl.hash);
    } catch (error) {
      return null;
    }
  };

  const scrollToHashTarget = (target, hash) => {
    if (!target) return;

    target.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
      block: "start"
    });

    if (hash) {
      history.pushState(null, "", hash);
    }
  };

  const setupPageTransitions = () => {
    document.querySelectorAll("a").forEach((link) => {
      if (!isInternalPageLink(link)) return;

      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href) return;
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const samePageHashTarget = getSamePageHashTarget(href);

        if (samePageHashTarget) {
          event.preventDefault();
          closeMobileMenu();

          const targetUrl = new URL(href, window.location.href);
          scrollToHashTarget(samePageHashTarget, targetUrl.hash);

          return;
        }

        event.preventDefault();
        closeMobileMenu();

        if (shouldReduceMotion()) {
          window.location.href = href;
          return;
        }

        body.classList.add("page-leaving");

        window.setTimeout(() => {
          window.location.href = href;
        }, 140);
      });
    });

    window.addEventListener("pageshow", () => {
      body.classList.remove("page-leaving");

      if (shouldReduceMotion()) {
        body.classList.add("page-ready");
      }
    });
  };

  const setupPricingTabs = () => {
    const tabs = document.querySelector(selectors.pricingTabs);
    const tabButtons = Array.from(document.querySelectorAll(selectors.pricingTabButton));
    const panels = Array.from(document.querySelectorAll(selectors.pricingPanel));

    if (!tabs || tabButtons.length === 0 || panels.length === 0) return;

    const moveIndicator = (button) => {
      if (!button) return;

      tabs.style.setProperty("--active-left", `${button.offsetLeft}px`);
      tabs.style.setProperty("--active-width", `${button.offsetWidth}px`);
    };

    const activatePlan = (plan, updateHash = false) => {
      const activeButton =
        tabButtons.find((button) => button.dataset.plan === plan) ||
        tabButtons[0];

      tabButtons.forEach((button) => {
        const isActive = button === activeButton;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.planPanel === activeButton.dataset.plan;

        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      moveIndicator(activeButton);

      if (updateHash) {
        window.history.pushState(null, "", `#${activeButton.dataset.plan}`);
      }
    };

    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        activatePlan(button.dataset.plan, true);
      });

      button.addEventListener("keydown", (event) => {
        const key = event.key;

        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;

        event.preventDefault();

        let nextIndex = index;

        if (key === "ArrowLeft") {
          nextIndex = index === 0 ? tabButtons.length - 1 : index - 1;
        }

        if (key === "ArrowRight") {
          nextIndex = index === tabButtons.length - 1 ? 0 : index + 1;
        }

        if (key === "Home") {
          nextIndex = 0;
        }

        if (key === "End") {
          nextIndex = tabButtons.length - 1;
        }

        const nextButton = tabButtons[nextIndex];
        if (!nextButton) return;

        nextButton.focus();
        activatePlan(nextButton.dataset.plan, true);
      });
    });

    window.addEventListener("resize", () => {
      const activeButton = tabButtons.find((button) => button.classList.contains("is-active"));
      moveIndicator(activeButton);
    });

    window.addEventListener("hashchange", () => {
      const hashPlan = window.location.hash.replace("#", "");
      const planExists = tabButtons.some((button) => button.dataset.plan === hashPlan);

      if (planExists) {
        activatePlan(hashPlan, false);
      }
    });

    const hashPlan = window.location.hash.replace("#", "");
    const firstPlan = tabButtons[0]?.dataset.plan || "basic";
    const initialPlan = tabButtons.some((button) => button.dataset.plan === hashPlan)
      ? hashPlan
      : firstPlan;

    activatePlan(initialPlan, false);
  };

  const setupPricingInfoModal = () => {
    const modal = document.querySelector(selectors.pricingInfoModal);
    const modalBox = modal?.querySelector(selectors.pricingInfoBox);
    const modalTitle = document.querySelector(selectors.pricingInfoTitle);
    const modalText = document.querySelector(selectors.pricingInfoText);
    const closeButton = modal?.querySelector(selectors.pricingInfoClose);
    const infoButtons = Array.from(document.querySelectorAll(selectors.pricingInfoButton));

    if (!modal || !modalBox || !modalTitle || !modalText || !closeButton || infoButtons.length === 0) return;

    let lastPricingButton = null;

    const openPricingModal = (button) => {
      lastPricingButton = button;

      modalTitle.textContent = button.dataset.infoTitle || "Information";
      modalText.textContent = button.dataset.infoText || "";

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      body.classList.add("modal-open");

      window.setTimeout(() => {
        closeButton.focus({ preventScroll: true });
      }, shouldReduceMotion() ? 0 : 80);
    };

    const closePricingModal = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      body.classList.remove("modal-open");

      if (lastPricingButton && typeof lastPricingButton.focus === "function") {
        lastPricingButton.focus({ preventScroll: true });
      }

      lastPricingButton = null;
    };

    infoButtons.forEach((button) => {
      button.addEventListener("click", () => openPricingModal(button));
    });

    closeButton.addEventListener("click", closePricingModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closePricingModal();
      }
    });
  };

  const setupContactForm = () => {
    const contactForm = document.querySelector(selectors.contactForm);
    if (!contactForm) return;

    const errorBox = document.getElementById("contact-error-box");
    const messageField = document.getElementById("contact-message");
    const messageCount = document.getElementById("message-count");

    const fields = {
      firstName: document.getElementById("contact-firstname"),
      lastName: document.getElementById("contact-lastname"),
      email: document.getElementById("contact-email"),
      postal: document.getElementById("contact-postal"),
      street: document.getElementById("contact-street"),
      topic: document.getElementById("contact-topic"),
      memberId: document.getElementById("contact-memberid"),
      message: document.getElementById("contact-message")
    };

    const setFieldState = (field, isInvalid) => {
      if (!field) return;

      if (isInvalid) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    };

    const resetFieldStates = () => {
      Object.values(fields).forEach((field) => setFieldState(field, false));
    };

    const showErrors = (errors) => {
      if (!errorBox) return;

      if (!errors.length) {
        errorBox.classList.remove("show");
        errorBox.textContent = "";
        return;
      }

      const errorText = errors.map((error) => `• ${error.message}`).join("\n");

      errorBox.textContent = `Bitte prüfe deine Angaben:\n${errorText}`;
      errorBox.classList.add("show");

      errorBox.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
        block: "center"
      });
    };

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    const isValidPostalCode = (value) => /^[0-9]{5}$/.test(value);
    const isValidStreet = (value) => /^[A-Za-zÄÖÜäöüß0-9 .,'’\-\/]{2,90}$/.test(value);
    const isValidMemberId = (value) => /^[A-Za-z]{2}-[0-9]{5}$/.test(value);

    const validateForm = () => {
      const errors = [];

      resetFieldStates();

      const firstName = fields.firstName?.value.trim() || "";
      const lastName = fields.lastName?.value.trim() || "";
      const email = fields.email?.value.trim() || "";
      const postal = fields.postal?.value.trim() || "";
      const street = fields.street?.value.trim() || "";
      const topic = fields.topic?.value.trim() || "";
      const memberId = fields.memberId?.value.trim() || "";
      const messageText = fields.message?.value.trim() || "";

      if (firstName.length < 2) {
        errors.push({ field: fields.firstName, message: "Vorname fehlt oder ist zu kurz." });
      }

      if (lastName.length < 2) {
        errors.push({ field: fields.lastName, message: "Nachname fehlt oder ist zu kurz." });
      }

      if (!email || !isValidEmail(email)) {
        errors.push({ field: fields.email, message: "E-Mail fehlt oder ist nicht gültig." });
      }

      if (!topic) {
        errors.push({ field: fields.topic, message: "Bitte wähle ein Thema aus." });
      }

      if (!messageText) {
        errors.push({ field: fields.message, message: "Nachricht fehlt." });
      }

      if (postal && !isValidPostalCode(postal)) {
        errors.push({ field: fields.postal, message: "Postleitzahl muss aus genau 5 Zahlen bestehen." });
      }

      if (street && !isValidStreet(street)) {
        errors.push({ field: fields.street, message: "Straße und Hausnummer enthalten Zeichen, die nicht passen." });
      }

      if (memberId && !isValidMemberId(memberId)) {
        errors.push({ field: fields.memberId, message: "Member-ID muss so aussehen: NK-12345." });
      }

      errors.forEach((error) => setFieldState(error.field, true));

      return errors;
    };

    const autoResizeTextarea = () => {
      if (!messageField) return;

      messageField.style.height = "auto";
      messageField.style.height = `${messageField.scrollHeight}px`;
    };

    const updateCounter = () => {
      if (!messageField || !messageCount) return;

      const maxLength = Number(messageField.dataset.maxlength || messageField.maxLength || 2400);

      if (messageField.value.length > maxLength) {
        messageField.value = messageField.value.slice(0, maxLength);
      }

      messageCount.textContent = String(messageField.value.length);

      const countWrap = messageCount.closest("small");
      if (countWrap) {
        countWrap.classList.toggle("is-limit", messageField.value.length >= maxLength);
      }
    };

    const liveValidate = () => {
      if (!errorBox || !errorBox.classList.contains("show")) return;

      const errors = validateForm();
      showErrors(errors);
    };

    Object.values(fields).forEach((field) => {
      if (!field) return;

      field.addEventListener("input", liveValidate);
      field.addEventListener("change", liveValidate);
    });

    if (messageField) {
      autoResizeTextarea();
      updateCounter();

      messageField.addEventListener("input", () => {
        autoResizeTextarea();
        updateCounter();
      });
    }

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const errors = validateForm();

      if (errors.length) {
        showErrors(errors);

        const firstInvalidField = errors[0].field;
        if (firstInvalidField) {
          firstInvalidField.focus({ preventScroll: true });
        }

        return;
      }

      showErrors([]);

      const formData = new FormData(contactForm);

      const firstName = String(formData.get("contact-firstname") || "").trim();
      const lastName = String(formData.get("contact-lastname") || "").trim();
      const email = String(formData.get("contact-email") || "").trim();
      const postal = String(formData.get("contact-postal") || "").trim() || "Nicht angegeben";
      const street = String(formData.get("contact-street") || "").trim() || "Nicht angegeben";
      const topic = String(formData.get("contact-topic") || "").trim();
      const memberId = String(formData.get("contact-memberid") || "").trim() || "Nicht angegeben";
      const message = String(formData.get("contact-message") || "").trim();

      const sentAt = new Date().toLocaleString("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const subject = encodeURIComponent(
        `${brand.name} Kontaktformular – ${topic} – ${firstName} ${lastName}`
      );

      const bodyText = [
        "NORDKERN FITNESS KONTAKTANFRAGE",
        "==================================================",
        "",
        "ÜBERSICHT",
        "--------------------------------------------------",
        `Eingang über: ${brand.name} Website`,
        `Zeitpunkt: ${sentAt}`,
        `Thema: ${topic}`,
        "Status: Neu",
        "",
        "KONTAKTDATEN",
        "--------------------------------------------------",
        `Name: ${firstName} ${lastName}`,
        `E-Mail für Rückantwort: ${email}`,
        `Postleitzahl: ${postal}`,
        `Straße und Hausnummer: ${street}`,
        `Member-ID: ${memberId}`,
        "",
        "NACHRICHT",
        "--------------------------------------------------",
        message,
        "",
        "==================================================",
        "INTERNER HINWEIS",
        "Bitte bei der Antwort die oben angegebene E-Mail-Adresse nutzen.",
        `Diese Anfrage wurde über das ${brand.name} Kontaktformular vorbereitet.`
      ].join("\n");

      window.location.href =
        `mailto:${brand.contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  };

  const setupFaqSearch = () => {
    const searchInput = document.querySelector(selectors.faqSearch);
    const categoryButtons = Array.from(document.querySelectorAll(selectors.faqCategoryButton));
    const faqItems = Array.from(document.querySelectorAll(selectors.faqItem));
    const faqGroups = Array.from(document.querySelectorAll(selectors.faqGroup));
    const resultLine = document.querySelector(selectors.faqResultLine);
    const emptyState = document.querySelector(selectors.faqEmpty);

    if (!searchInput || categoryButtons.length === 0 || faqItems.length === 0 || !resultLine || !emptyState) return;

    let activeCategory = "all";

    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalize = (value) => value.toLowerCase().trim();

    const getItemCategories = (item) => {
      const rawCategory = item.dataset.category || "";
      return rawCategory
        .split(/\s+/)
        .map((category) => category.trim())
        .filter(Boolean);
    };

    const resetAnswerHtml = (answer) => {
      if (!answer) return;

      if (!answer.dataset.originalHtml) {
        answer.dataset.originalHtml = answer.innerHTML;
      }

      answer.innerHTML = answer.dataset.originalHtml;
    };

    const highlightQuestionText = (question, query) => {
      if (!question) return;

      const original = question.dataset.originalText || question.textContent;
      question.dataset.originalText = original;

      if (!query) {
        question.textContent = original;
        return;
      }

      const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
      question.innerHTML = original.replace(regex, "<mark>$1</mark>");
    };

    const updateFaq = () => {
      const query = normalize(searchInput.value);
      let visibleCount = 0;

      faqItems.forEach((item) => {
        const itemCategories = getItemCategories(item);
        const question = item.querySelector(".faq-question-text");
        const answer = item.querySelector(".faq-answer");

        if (!question || !answer) return;

        if (!answer.dataset.originalHtml) {
          answer.dataset.originalHtml = answer.innerHTML;
        }

        if (!question.dataset.originalText) {
          question.dataset.originalText = question.textContent;
        }

        const questionText = question.dataset.originalText || question.textContent;
        const answerSearchText = answer.textContent || "";
        const keywordSearchText = item.dataset.keywords || "";
        const combined = normalize(`${questionText} ${answerSearchText} ${keywordSearchText}`);

        const categoryMatches =
          activeCategory === "all" ||
          itemCategories.includes(activeCategory);

        const searchMatches = !query || combined.includes(query);
        const isVisible = categoryMatches && searchMatches;

        item.hidden = !isVisible;

        highlightQuestionText(question, query);
        resetAnswerHtml(answer);

        if (isVisible) {
          visibleCount += 1;

          if (query) {
            item.open = true;
          }
        } else {
          item.open = false;
        }
      });

      faqGroups.forEach((group) => {
        const visibleItems = Array.from(group.querySelectorAll(selectors.faqItem)).filter((item) => !item.hidden);
        group.hidden = visibleItems.length === 0;
      });

      emptyState.classList.toggle("show", visibleCount === 0);

      if (visibleCount === 0) {
        resultLine.textContent = "Keine passende Frage gefunden.";
      } else if (visibleCount === 1) {
        resultLine.textContent = "1 passende Frage gefunden.";
      } else if (query || activeCategory !== "all") {
        resultLine.textContent = `${visibleCount} passende Fragen gefunden.`;
      } else {
        resultLine.textContent = `${visibleCount} Fragen verfügbar.`;
      }
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.faqCategory || "all";

        categoryButtons.forEach((categoryButton) => {
          const isActive = categoryButton === button;
          categoryButton.classList.toggle("is-active", isActive);
          categoryButton.setAttribute("aria-pressed", String(isActive));
        });

        updateFaq();
      });
    });

    searchInput.addEventListener("input", updateFaq);

    updateFaq();
  };

  const setupLegalTabs = () => {
    const tabButtons = Array.from(document.querySelectorAll(selectors.legalTabButton));
    const panels = Array.from(document.querySelectorAll(selectors.legalPanel));

    if (tabButtons.length === 0 || panels.length === 0) return;

    const allowedTabs = tabButtons
      .map((button) => button.dataset.tab)
      .filter(Boolean);

    const activateTab = (tabName, updateHash = false) => {
      const selectedTab = allowedTabs.includes(tabName) ? tabName : allowedTabs[0];

      tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === selectedTab;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.id === `panel-${selectedTab}`;

        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      if (updateHash) {
        window.history.pushState(null, "", `#${selectedTab}`);
      }
    };

    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        activateTab(button.dataset.tab, true);
      });

      button.addEventListener("keydown", (event) => {
        const key = event.key;

        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;

        event.preventDefault();

        let nextIndex = index;

        if (key === "ArrowLeft") {
          nextIndex = index === 0 ? tabButtons.length - 1 : index - 1;
        }

        if (key === "ArrowRight") {
          nextIndex = index === tabButtons.length - 1 ? 0 : index + 1;
        }

        if (key === "Home") {
          nextIndex = 0;
        }

        if (key === "End") {
          nextIndex = tabButtons.length - 1;
        }

        const nextButton = tabButtons[nextIndex];
        if (!nextButton) return;

        nextButton.focus();
        activateTab(nextButton.dataset.tab, true);
      });
    });

    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      activateTab(hash || allowedTabs[0], false);
    };

    readHash();

    window.addEventListener("hashchange", readHash);
  };

  const setupInitialHashScroll = () => {
    if (!window.location.hash) return;

    const hash = window.location.hash;
    const target = safeHashTarget(hash);

    if (!target) return;

    const hashId = decodeURIComponent(hash.slice(1));
    const isPricingPlanHash = Array.from(document.querySelectorAll(selectors.pricingTabButton))
      .some(button => button.dataset.plan === hashId);

    if (isPricingPlanHash) return;

    window.setTimeout(() => {
      scrollToHashTarget(target, hash);
    }, shouldReduceMotion() ? 0 : 140);
  };

  const setupGlobalKeyboardShortcuts = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key === keys.escape) {
        closeMobileMenu();

        document.querySelectorAll(".show[aria-hidden='false']").forEach((modal) => {
          modal.classList.remove("show");
          modal.setAttribute("aria-hidden", "true");
        });

        body.classList.remove("modal-open");
      }
    });
  };

  setActiveNavLink();
  runPageEnterAnimation();
  setupMobileMenu();
  setupHeaderScrollState();
  setupPageTransitions();
  // Pricing panels are rendered from the public Supabase catalogue, never stale HTML.
  // Run tab handlers only after the validated products have been rendered.
  if (document.querySelector("[data-catalog-panels]")) {
    if (window.NordkernCatalog) {
      void window.NordkernCatalog.mount().then((loaded) => {
        if (loaded) setupPricingTabs();
      });
    }
  } else {
    setupPricingTabs();
  }
  setupPricingInfoModal();
  setupContactForm();
  setupFaqSearch();
  setupLegalTabs();
  setupGlobalKeyboardShortcuts();
  setupInitialHashScroll();
});
