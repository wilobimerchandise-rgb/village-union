/* =========================================================
   UNIONLEDGER — FRONTEND INTERACTIONS
========================================================= */

"use strict";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   HEADER SCROLL EFFECT
========================================================= */

const siteHeader = $("#siteHeader");

window.addEventListener("scroll", () => {

  if (window.scrollY > 30) {
    siteHeader.classList.add("scrolled");
  } else {
    siteHeader.classList.remove("scrolled");
  }

});


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuButton = $("#mobileMenuButton");
const mobileMenu = $("#mobileMenu");

mobileMenuButton.addEventListener("click", () => {

  const isOpen = mobileMenu.classList.toggle("active");

  mobileMenuButton.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

});


$$(".mobile-menu a").forEach((link) => {

  link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
    mobileMenuButton.setAttribute("aria-expanded", "false");
  });

});


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function scrollToSection(id) {

  const section = document.getElementById(id);

  if (!section) {
    return;
  }

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =========================================================
   LOGIN MODAL
========================================================= */

const loginModal = $("#loginModal");

function openLoginModal(type = "member") {

  const title = $("#loginTitle");
  const subtitle = $("#loginSubtitle");

  if (type === "admin") {

    title.textContent = "Admin Portal";

    subtitle.textContent =
      "Sign in to manage your village union records.";

  } else {

    title.textContent = "Welcome back";

    subtitle.textContent =
      "Sign in to your village union account.";

  }

  loginModal.classList.add("active");

  document.body.style.overflow = "hidden";

  setTimeout(() => {

    const input = $("#loginEmail");

    if (input) {
      input.focus();
    }

  }, 150);

}


function closeLoginModal() {

  loginModal.classList.remove("active");

  document.body.style.overflow = "";

}


loginModal.addEventListener("click", (event) => {

  if (event.target === loginModal) {
    closeLoginModal();
  }

});


document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {
    closeLoginModal();
  }

});


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePassword() {

  const password = $("#loginPassword");

  if (password.type === "password") {
    password.type = "text";
  } else {
    password.type = "password";
  }

}


/* =========================================================
   LOGIN
========================================================= */

function handleLogin(event) {

  event.preventDefault();

  const village = $("#village").value.trim();
  const memberId = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value.trim();

  if (!village || !memberId || !password) {

    showToast(
      "Missing information",
      "Please complete all login fields.",
      "error"
    );

    return;
  }


  /*
   * FRONTEND DEMO ONLY
   *
   * Real implementation should:
   *
   * 1. Authenticate with Supabase Auth/Firebase.
   * 2. Retrieve the authenticated user's role.
   * 3. Retrieve the user's village_id.
   * 4. Enforce tenant isolation on the backend/database.
   * 5. Redirect to member/admin dashboard.
   */

  showToast(
    "Demo login",
    `Login submitted for ${village}. Connect authentication to continue.`
  );

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

function showForgotPassword(event) {

  event.preventDefault();

  showToast(
    "Password recovery",
    "A secure password-reset flow will be connected to your backend."
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(title, message, type = "success") {

  const toast = $("#toast");

  const toastTitle = $("#toastTitle");
  const toastMessage = $("#toastMessage");

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  const icon = toast.querySelector(".toast-icon");

  if (type === "error") {

    icon.textContent = "!";

    icon.style.background =
      "rgba(233,110,110,.1)";

    icon.style.color =
      "#e98b8b";

  } else {

    icon.textContent = "✓";

    icon.style.background =
      "rgba(91,210,140,.1)";

    icon.style.color =
      "#5bd28c";

  }

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove("show");

  }, 3500);

}


/* =========================================================
   CHART FILTER
========================================================= */

function changeChartPeriod(period) {

  const labels = document.querySelectorAll(".chart-labels span");

  if (period === "12") {

    const months = [
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr"
    ];

    labels.forEach((label, index) => {
      label.textContent =
        months[index] || "Oct";
    });

  } else if (period === "year") {

    const months = [
      "Jan",
      "Mar",
      "May",
      "Jul",
      "Sep",
      "Oct"
    ];

    labels.forEach((label, index) => {
      label.textContent = months[index];
    });

  } else {

    const months = [
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct"
    ];

    labels.forEach((label, index) => {
      label.textContent = months[index];
    });

  }

  showToast(
    "Report period changed",
    "Dashboard data will update from the connected financial database."
  );

}


/* =========================================================
   DEMO PDF DOWNLOAD
========================================================= */

function downloadDemoReport() {

  /*
   * This creates a simple text report as a frontend demo.
   *
   * In production:
   * generate the PDF server-side or through a trusted
   * PDF-generation service using verified database records.
   */

  const report = `
UNIONLEDGER
OBODO UNION

FINANCIAL STATEMENT
October 2026

Total Verified Collections
₦2,840,500

Annual Dues
₦1,420,000

Burial Levy
₦740,000

Life Insurance Levy
₦420,000

Support Levy
₦260,000

Generated by UnionLedger
Verified records only
`;

  const blob = new Blob(
    [report],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "unionledger-financial-report-october-2026.txt";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  showToast(
    "Report prepared",
    "Demo report downloaded. Production PDF generation should use verified database data."
  );

}


/* =========================================================
   INTERSECTION OBSERVER
   Adds subtle reveal animation without external libraries.
========================================================= */

const revealElements = $$(".feature-card, .step, .security-card, .report-document");

const revealObserver = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry) => {

      if (!entry.isIntersecting) {
        return;
      }

      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";

      revealObserver.unobserve(entry.target);

    });

  },
  {
    threshold: 0.12
  }
);


revealElements.forEach((element) => {

  element.style.opacity = "0";
  element.style.transform = "translateY(18px)";
  element.style.transition =
    "opacity .6s ease, transform .6s ease";

  revealObserver.observe(element);

});


/* =========================================================
   FORM INPUT FEEDBACK
========================================================= */

$$("input, select").forEach((field) => {

  field.addEventListener("input", () => {

    field.style.borderColor =
      "rgba(199,164,90,.45)";

  });

});


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  console.log(
    "UnionLedger frontend initialized successfully."
  );

});
