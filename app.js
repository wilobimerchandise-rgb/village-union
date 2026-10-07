```javascript
/* =========================================================
   UNIONLEDGER — FUNCTIONAL FRONTEND PROTOTYPE
========================================================= */

"use strict";


/* =========================================================
   BASIC CONFIGURATION
========================================================= */

const VILLAGES = [
  "Obodo Union",
  "Umuahia Union",
  "Umueze Union",
  "Umunze Union",
  "Osumenyi Union",
  "Agulu Union",
  "Nnewi Union",
  "Awka Union",
  "Orlu Union",
  "Nsukka Union"
];

const KEYS = {
  members: "ul_members",
  requests: "ul_requests",
  attendance: "ul_attendance",
  transactions: "ul_transactions",
  audit: "ul_audit"
};


/*
 * DEMO ADMIN CREDENTIALS
 *
 * Replace this with Supabase Auth in production.
 */

const ADMIN = {
  id: "ADMIN-001",
  password: "Admin@123",
  name: "Union Administrator"
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;


const now = () =>
  new Date().toISOString();


function read(key, fallback = []) {

  try {
    return JSON.parse(
      localStorage.getItem(key)
    ) ?? fallback;

  } catch {

    return fallback;

  }

}


function write(key, value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}


function esc(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character])
    );

}


function money(value) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);

}


function fmtDate(value) {

  return new Date(value).toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


/* =========================================================
   DEMO DATA
========================================================= */

function seed() {

  if (!localStorage.getItem(KEYS.members)) {

    write(
      KEYS.members,
      [
        {
          id: "UO-0001",
          name: "Chinedu Okafor",
          phone: "08000000001",
          village: "Obodo Union",
          verified: true,
          active: true,
          attendance: [],
          createdAt: now()
        },

        {
          id: "UO-0002",
          name: "Emeka Nwosu",
          phone: "08000000002",
          village: "Obodo Union",
          verified: true,
          active: true,
          attendance: [],
          createdAt: now()
        },

        {
          id: "UM-0001",
          name: "Ngozi Eze",
          phone: "08000000003",
          village: "Umuahia Union",
          verified: true,
          active: true,
          attendance: [],
          createdAt: now()
        }
      ]
    );

  }


  if (!localStorage.getItem(KEYS.requests)) {
    write(KEYS.requests, []);
  }

  if (!localStorage.getItem(KEYS.attendance)) {
    write(KEYS.attendance, []);
  }

  if (!localStorage.getItem(KEYS.transactions)) {
    write(KEYS.transactions, []);
  }

  if (!localStorage.getItem(KEYS.audit)) {
    write(KEYS.audit, []);
  }

}

seed();


/* =========================================================
   MODALS
========================================================= */

const authModal = $("#authModal");
const appModal = $("#appModal");


function openModal(element) {

  element.classList.add("active");

  element.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";

}


function closeModal(element) {

  element.classList.remove("active");

  element.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

}


/* =========================================================
   TOAST
========================================================= */

function toast(
  title,
  message,
  type = "success"
) {

  const element = $("#toast");

  const icon =
    element.querySelector(".toast-icon");

  $("#toastTitle").textContent = title;

  $("#toastMessage").textContent = message;

  icon.textContent =
    type === "error"
      ? "!"
      : "✓";

  icon.style.color =
    type === "error"
      ? "#e98b8b"
      : "#5bd28c";

  element.classList.add("show");

  clearTimeout(window.__toast);

  window.__toast =
    setTimeout(
      () =>
        element.classList.remove("show"),
      3500
    );

}


/* =========================================================
   VILLAGE DROPDOWNS
========================================================= */

function fillVillages() {

  [
    "#loginVillage",
    "#regVillage"
  ].forEach(selector => {

    const select = $(selector);

    select.innerHTML =
      '<option value="">Select your village</option>' +
      VILLAGES
        .map(
          village =>
            `<option>${esc(village)}</option>`
        )
        .join("");

  });

}

fillVillages();


/* =========================================================
   NAVIGATION
========================================================= */

$$("[data-login]").forEach(button => {

  button.addEventListener(
    "click",
    event => {

      if (button.tagName === "A") {
        event.preventDefault();
      }

      showAuth(
        button.dataset.login
      );

    }
  );

});


$$("[data-close-modal]").forEach(button => {

  button.addEventListener(
    "click",
    () => closeModal(authModal)
  );

});


$$("[data-close-app]").forEach(button => {

  button.addEventListener(
    "click",
    () => closeModal(appModal)
  );

});


[authModal, appModal].forEach(modal => {

  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {
        closeModal(modal);
      }

    }
  );

});


document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeModal(authModal);

      closeModal(appModal);

    }

  }
);


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

$("#mobileMenuButton").addEventListener(
  "click",
  () => {

    const menu =
      $("#mobileMenu");

    const open =
      menu.classList.toggle("active");

    $("#mobileMenuButton")
      .setAttribute(
        "aria-expanded",
        String(open)
      );

  }
);


$$(".mobile-menu a").forEach(link => {

  link.addEventListener(
    "click",
    () =>
      $("#mobileMenu")
        .classList
        .remove("active")
  );

});


/* =========================================================
   SCROLLING
========================================================= */

$$("[data-scroll]").forEach(button => {

  button.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          button.dataset.scroll
        )
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

});


window.addEventListener(
  "scroll",
  () => {

    $("#siteHeader")
      .classList
      .toggle(
        "scrolled",
        window.scrollY > 30
      );

  }
);


/* =========================================================
   CHART
========================================================= */

$("#chartFilter").addEventListener(
  "change",
  event => {

    const selected =
      event.target.options[
        event.target.selectedIndex
      ].text;

    toast(
      "Report period changed",
      `Dashboard view changed to ${selected}.`
    );

  }
);


/* =========================================================
   AUTH TABS
========================================================= */

function switchAuth(tab) {

  const login =
    tab === "login";

  $("#loginPanel").hidden =
    !login;

  $("#registerPanel").hidden =
    login;

  $$(".auth-tab").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.authTab === tab
    );

  });

}


$$("[data-auth-tab]").forEach(button => {

  button.addEventListener(
    "click",
    () =>
      switchAuth(
        button.dataset.authTab
      )
  );

});


$("#showRegister").addEventListener(
  "click",
  event => {

    event.preventDefault();

    switchAuth("register");

  }
);


$("#showLogin").addEventListener(
  "click",
  event => {

    event.preventDefault();

    switchAuth("login");

  }
);


/* =========================================================
   OPEN LOGIN
========================================================= */

function showAuth(mode = "member") {

  openModal(authModal);

  switchAuth("login");

  $("#loginTitle").textContent =
    mode === "admin"
      ? "Admin Portal"
      : "Welcome back";

  $("#loginSubtitle").textContent =
    mode === "admin"
      ? "Sign in to manage your village union records."
      : "Sign in to your village union account.";

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

$("#togglePassword").addEventListener(
  "click",
  () => {

    const password =
      $("#loginPassword");

    password.type =
      password.type === "password"
        ? "text"
        : "password";

  }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

$("#forgotPassword").addEventListener(
  "click",
  event => {

    event.preventDefault();

    toast(
      "Password recovery",
      "For production, connect a secure email or phone password-reset flow."
    );

  }
);


/* =========================================================
   FIRST-TIME MEMBER REQUEST
========================================================= */

$("#registerForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const village =
      $("#regVillage").value.trim();

    const name =
      $("#regFullName").value.trim();

    const phone =
      $("#regPhone").value.trim();

    const memberNo =
      $("#regMemberNo").value.trim();

    const note =
      $("#regNote").value.trim();


    if (!village || !name || !phone) {

      toast(
        "Incomplete request",
        "Village, full name and phone are required.",
        "error"
      );

      return;

    }


    const members =
      read(KEYS.members);

    const requests =
      read(KEYS.requests);


    const normalized =
      name
        .toLowerCase()
        .replace(/\s+/g, " ");


    const existing =
      members.find(
        member =>
          member.village === village &&
          member.name
            .toLowerCase()
            .replace(/\s+/g, " ") ===
            normalized
      );


    if (
      existing &&
      existing.active
    ) {

      toast(
        "Member found",
        "Your name matches the union register. An administrator must issue or reset your generated credentials.",
        "error"
      );

      return;

    }


    const pending =
      requests.some(
        request =>
          request.village === village &&
          request.name
            .toLowerCase()
            .replace(/\s+/g, " ") ===
            normalized &&
          request.status === "pending"
      );


    if (pending) {

      toast(
        "Request already submitted",
        "Your verification request is already waiting for admin review.",
        "error"
      );

      return;

    }


    requests.push({

      id:uid("REQ"),

      village,

      name,

      phone,

      memberNo,

      note,

      status:"pending",

      createdAt:now()

    });


    write(
      KEYS.requests,
      requests
    );


    $("#registerForm").reset();

    toast(
      "Request submitted",
      "Admin can now compare your name with the official manual register."
    );

    switchAuth("login");

  }
);


/* =========================================================
   LOGIN
========================================================= */

$("#loginForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const village =
      $("#loginVillage").value;

    const id =
      $("#loginId")
        .value
        .trim()
        .toUpperCase();

    const password =
      $("#loginPassword").value;


    if (
      !village ||
      !id ||
      !password
    ) {

      toast(
        "Missing information",
        "Complete all login fields.",
        "error"
      );

      return;

    }


    /* DEMO ADMIN */

    if (
      id === ADMIN.id &&
      password === ADMIN.password
    ) {

      closeModal(authModal);

      renderAdmin();

      openModal(appModal);

      return;

    }


    /* MEMBER LOGIN */

    const member =
      read(KEYS.members).find(
        item =>
          item.village === village &&
          item.id.toUpperCase() === id &&
          item.password === password &&
          item.verified &&
          item.active
      );


    if (!member) {

      toast(
        "Login failed",
        "Village, login ID or password is incorrect, or your account is not yet verified.",
        "error"
      );

      return;

    }


    closeModal(authModal);

    renderMember(member);

    openModal(appModal);

  }
);


/* =========================================================
   AUDIT TRAIL
========================================================= */

function addAudit(
  action,
  entityId,
  details,
  adminName = ADMIN.name
) {

  const logs =
    read(KEYS.audit);

  logs.unshift({

    id:uid("AUD"),

    adminName,

    action,

    entityId,

    details,

    createdAt:now()

  });

  write(
    KEYS.audit,
    logs
  );

}


/* =========================================================
   LOGOUT
========================================================= */

function attachLogout() {

  $("#appLogout")
    ?.addEventListener(
      "click",
      () => {

        closeModal(appModal);

        toast(
          "Signed out",
          "Your session has ended."
        );

      }
    );

}


/* =========================================================
   MEMBER DASHBOARD
========================================================= */

function renderMember(member) {

  const transactions =
    read(KEYS.transactions)
      .filter(
        item =>
          item.memberId === member.id &&
          item.village === member.village &&
          item.status === "approved"
      );


  const attendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.memberId === member.id &&
          item.village === member.village &&
          item.status === "approved"
      );


  const pendingAttendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.memberId === member.id &&
          item.village === member.village &&
          item.status === "pending"
      );


  const total =
    transactions.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );


  $("#appRoot").innerHTML = `

    ${memberHeader(member)}

    <div class="app-body">

      <aside class="app-side">

        <button
          class="active"
          data-view="memberDash"
        >
          Dashboard
        </button>

        <button data-view="memberAttendance">
          Meeting Attendance
        </button>

        <button data-view="memberContrib">
          My Contributions
        </button>

        <button data-view="memberRegister">
          Village Register
        </button>

      </aside>


      <main
        class="app-content"
        id="memberContent"
      >

        <h2>
          Welcome,
          ${esc(member.name.split(" ")[0])}
        </h2>

        <p class="sub">
          Your verified union records are shown below.
        </p>


        <div class="app-cards">

          <div class="app-card">
            <span>Verified Contributions</span>
            <strong>${money(total)}</strong>
          </div>

          <div class="app-card">
            <span>Approved Meetings</span>
            <strong>${attendance.length}</strong>
          </div>

          <div class="app-card">
            <span>Attendance Requests</span>
            <strong>${pendingAttendance.length}</strong>
          </div>

        </div>


        <div class="app-panel">

          <h3>
            Mark attendance
          </h3>

          <div class="app-notice">

            On an official meeting day, mark yourself present here.
            Your request becomes an official attendance record only
            after the administrator checks the physical register
            and approves it.

          </div>

          <button
            class="btn btn-primary"
            id="markAttendance"
          >
            Mark Present Today
          </button>

        </div>

      </main>

    </div>

  `;


  attachLogout();

  renderMemberViewHandlers(member);

}


/* =========================================================
   MEMBER VIEW NAVIGATION
========================================================= */

function renderMemberViewHandlers(member) {

  $$(".app-side button").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          $$(".app-side button")
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          button.classList.add("active");


          const view =
            button.dataset.view;


          if (
            view ===
            "memberAttendance"
          ) {

            memberAttendance(member);

          } else if (
            view ===
            "memberContrib"
          ) {

            memberContrib(member);

          } else if (
            view ===
            "memberRegister"
          ) {

            memberRegister(member);

          } else {

            renderMember(member);

          }

        }
      );

    }
  );


  $("#markAttendance")
    ?.addEventListener(
      "click",
      () =>
        markAttendance(member)
    );

}


/* =========================================================
   MEMBER ATTENDANCE
========================================================= */

function markAttendance(member) {

  const list =
    read(KEYS.attendance);

  const day =
    new Date()
      .toISOString()
      .slice(0,10);


  const existing =
    list.some(
      item =>
        item.memberId === member.id &&
        item.meetingDate === day &&
        item.status !== "rejected"
    );


  if (existing) {

    toast(
      "Already submitted",
      "You already have an attendance record for today.",
      "error"
    );

    return;

  }


  list.push({

    id:uid("ATT"),

    memberId:member.id,

    village:member.village,

    memberName:member.name,

    meetingDate:day,

    status:"pending",

    requestedAt:now()

  });


  write(
    KEYS.attendance,
    list
  );


  toast(
    "Attendance submitted",
    "Admin must approve it against the manual register."
  );


  renderMember(member);

}


function memberAttendance(member) {

  const rows =
    read(KEYS.attendance)
      .filter(
        item =>
          item.memberId === member.id &&
          item.village === member.village
      )
      .sort(
        (a,b) =>
          b.meetingDate.localeCompare(
            a.meetingDate
          )
      );


  $("#memberContent").innerHTML = `

    <h2>Meeting Attendance</h2>

    <p class="sub">
      Only admin-approved attendance counts
      toward your official register.
    </p>


    <div class="app-panel">

      <h3>My attendance history</h3>

      ${
        rows.length

        ?

        `
        <table class="data-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Approved by</th>
              <th>Approved at</th>
            </tr>
          </thead>

          <tbody>

            ${rows.map(
              row => `

              <tr>

                <td>
                  ${esc(row.meetingDate)}
                </td>

                <td>
                  <span
                    class="badge ${row.status}"
                  >
                    ${esc(row.status)}
                  </span>
                </td>

                <td>
                  ${esc(
                    row.approvedBy || "—"
                  )}
                </td>

                <td>
                  ${
                    row.approvedAt
                      ? esc(
                          fmtDate(
                            row.approvedAt
                          )
                        )
                      : "—"
                  }
                </td>

              </tr>

            `
            ).join("")}

          </tbody>

        </table>
        `

        :

        `
        <div class="empty">
          No attendance records yet.
        </div>
        `
      }

    </div>

  `;

}


/* =========================================================
   MEMBER CONTRIBUTIONS
========================================================= */

function memberContrib(member) {

  const rows =
    read(KEYS.transactions)
      .filter(
        item =>
          item.memberId === member.id &&
          item.village === member.village
      )
      .sort(
        (a,b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
      );


  $("#memberContent").innerHTML = `

    <h2>My Contributions</h2>

    <p class="sub">
      Verified contributions are included
      in official reports.
    </p>


    <div class="app-panel">

      <h3>Contribution history</h3>

      ${
        rows.length

        ?

        `
        <table class="data-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            ${rows.map(
              row => `

              <tr>

                <td>
                  ${esc(
                    fmtDate(
                      row.createdAt
                    )
                  )}
                </td>

                <td>
                  ${esc(row.type)}
                </td>

                <td>
                  ${money(row.amount)}
                </td>

                <td>
                  <span
                    class="badge ${row.status}"
                  >
                    ${esc(row.status)}
                  </span>
                </td>

              </tr>

            `
            ).join("")}

          </tbody>

        </table>
        `

        :

        `
        <div class="empty">
          No contribution records yet.
        </div>
        `
      }

    </div>

  `;

}


/* =========================================================
   MEMBER REGISTER
========================================================= */

function memberRegister(member) {

  const rows =
    read(KEYS.members)
      .filter(
        item =>
          item.village === member.village &&
          item.active
      );


  $("#memberContent").innerHTML = `

    <h2>Village Register</h2>

    <p class="sub">
      The register is read-only for members.
      Personal contact information is intentionally limited.
    </p>


    <div class="app-panel">

      <h3>
        ${esc(member.village)} members
      </h3>


      <table class="data-table">

        <thead>

          <tr>
            <th>Member</th>
            <th>Member ID</th>
            <th>Meetings Approved</th>
            <th>Verified Contributions</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map(memberRow => {

            const attendance =
              read(KEYS.attendance)
                .filter(
                  item =>
                    item.memberId ===
                      memberRow.id &&
                    item.status ===
                      "approved"
                )
                .length;


            const contribution =
              read(KEYS.transactions)
                .filter(
                  item =>
                    item.memberId ===
                      memberRow.id &&
                    item.status ===
                      "approved"
                )
                .reduce(
                  (sum,item) =>
                    sum +
                    Number(item.amount),
                  0
                );


            return `

              <tr>

                <td>
                  ${esc(memberRow.name)}
                </td>

                <td>
                  ${esc(memberRow.id)}
                </td>

                <td>
                  ${attendance}
                </td>

                <td>
                  ${money(contribution)}
                </td>

              </tr>

            `;

          }).join("")}

        </tbody>

      </table>

    </div>

  `;

}


/* =========================================================
   MEMBER HEADER
========================================================= */

function memberHeader(member) {

  return `

    <div class="app-top">

      <a class="brand" href="#">

        <span class="brand-mark">
          <i></i><i></i><i></i>
        </span>

        <span>
          <strong>
            Union<span>Ledger</span>
          </strong>

          <small>
            Member Portal
          </small>
        </span>

      </a>


      <div class="app-user">

        ${esc(member.name)}
        ·
        ${esc(member.village)}

        <button id="appLogout">
          Log out
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   ADMIN HEADER
========================================================= */

function adminHeader() {

  return `

    <div class="app-top">

      <a class="brand" href="#">

        <span class="brand-mark">
          <i></i><i></i><i></i>
        </span>

        <span>
          <strong>
            Union<span>Ledger</span>
          </strong>

          <small>
            Admin Portal
          </small>
        </span>

      </a>


      <div class="app-user">

        Signed in as
        <strong>
          ${esc(ADMIN.name)}
        </strong>

        <button id="appLogout">
          Log out
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function renderAdmin() {

  const members =
    read(KEYS.members);

  const requests =
    read(KEYS.requests);

  const attendance =
    read(KEYS.attendance);

  const transactions =
    read(KEYS.transactions);


  const pendingRequests =
    requests.filter(
      item =>
        item.status === "pending"
    );

  const pendingAttendance =
    attendance.filter(
      item =>
        item.status === "pending"
    );

  const pendingTransactions =
    transactions.filter(
      item =>
        item.status === "pending"
    );


  const verifiedTotal =
    transactions
      .filter(
        item =>
          item.status === "approved"
      )
      .reduce(
        (sum,item) =>
          sum +
          Number(item.amount),
        0
      );


  $("#appRoot").innerHTML = `

    ${adminHeader()}


    <div class="app-body">

      <aside class="app-side">

        <button
          class="active"
          data-admin-view="overview"
        >
          Overview
        </button>

        <button data-admin-view="requests">
          Member Requests
          <b>${pendingRequests.length}</b>
        </button>

        <button data-admin-view="attendance">
          Attendance
          <b>${pendingAttendance.length}</b>
        </button>

        <button data-admin-view="members">
          Members
        </button>

        <button data-admin-view="transactions">
          Payments
          <b>${pendingTransactions.length}</b>
        </button>

        <button data-admin-view="audit">
          Audit Trail
        </button>

        <button data-admin-view="reports">
          Reports
        </button>

      </aside>


      <main
        class="app-content"
        id="adminContent"
      >

        <h2>
          Admin Dashboard
        </h2>

        <p class="sub">
          Village administration and verified financial records.
        </p>


        <div class="app-cards">

          <div class="app-card">
            <span>Active Members</span>
            <strong>
              ${members.filter(
                member =>
                  member.active
              ).length}
            </strong>
          </div>


          <div class="app-card">
            <span>
              Verified Contributions
            </span>

            <strong>
              ${money(verifiedTotal)}
            </strong>
          </div>


          <div class="app-card">
            <span>
              Pending Actions
            </span>

            <strong>
              ${
                pendingRequests.length +
                pendingAttendance.length +
                pendingTransactions.length
              }
            </strong>
          </div>

        </div>


        <div class="app-panel">

          <h3>
            Administrator rule
          </h3>

          <div class="app-notice">

            A member's name must be verified against
            the official union register before login
            credentials are generated.

            Attendance requests must be checked against
            the physical register before approval.

          </div>

          <button
            class="btn btn-primary"
            data-admin-view="requests"
          >
            Review member requests
          </button>

        </div>

      </main>

    </div>

  `;


  attachLogout();


  $$("[data-admin-view]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          adminView(
            button.dataset.adminView
          )
      );

    });

}


/* =========================================================
   ADMIN VIEWS
========================================================= */

function adminView(view) {

  $$(".app-side button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.adminView === view
      );

    });


  if (view === "overview") {

    renderAdmin();

    return;

  }


  const content =
    $("#adminContent");

  const members =
    read(KEYS.members);

  const requests =
    read(KEYS.requests);

  const attendance =
    read(KEYS.attendance);

  const transactions =
    read(KEYS.transactions);


  /* MEMBER REQUESTS */

  if (view === "requests") {

    const rows =
      requests.filter(
        item =>
          item.status === "pending"
      );


    content.innerHTML = `

      <h2>
        Member Verification Requests
      </h2>

      <p class="sub">
        Compare each request against the
        official manual register before approving.
      </p>


      <div class="app-panel">

        ${
          rows.length

          ?

          `
          <table class="data-table">

            <thead>

              <tr>
                <th>Name</th>
                <th>Village</th>
                <th>Phone</th>
                <th>Member No.</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              ${rows.map(
                row => `

                <tr>

                  <td>
                    ${esc(row.name)}
                  </td>

                  <td>
                    ${esc(row.village)}
                  </td>

                  <td>
                    ${esc(row.phone)}
                  </td>

                  <td>
                    ${esc(row.memberNo || "—")}
                  </td>

                  <td>
                    ${esc(fmtDate(row.createdAt))}
                  </td>

                  <td>

                    <button
                      class="table-action"
                      data-verify-request="${row.id}"
                    >
                      Verify & Generate ID
                    </button>

                  </td>

                </tr>

              `
              ).join("")}

            </tbody>

          </table>
          `

          :

          `
          <div class="empty">
            No pending member requests.
          </div>
          `
        }

      </div>

    `;


    $$("[data-verify-request]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            verifyRequest(
              button.dataset.verifyRequest
            )
        );

      });


    return;

  }


  /* ATTENDANCE */

  if (view === "attendance") {

    const rows =
      attendance.filter(
        item =>
          item.status === "pending"
      );


    content.innerHTML = `

      <h2>
        Attendance Approval
      </h2>

      <p class="sub">
        Check the manual register before approving digital attendance.
      </p>


      <div class="app-panel">

        ${
          rows.length

          ?

          `
          <table class="data-table">

            <thead>

              <tr>
                <th>Member</th>
                <th>Village</th>
                <th>Meeting date</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              ${rows.map(
                row => `

                <tr>

                  <td>
                    ${esc(row.memberName)}
                  </td>

                  <td>
                    ${esc(row.village)}
                  </td>

                  <td>
                    ${esc(row.meetingDate)}
                  </td>

                  <td>
                    ${esc(fmtDate(row.requestedAt))}
                  </td>

                  <td>

                    <button
                      class="table-action"
                      data-approve-att="${row.id}"
                    >
                      Approve
                    </button>

                    <button
                      class="table-action"
                      data-reject-att="${row.id}"
                    >
                      Reject
                    </button>

                  </td>

                </tr>

              `
              ).join("")}

            </tbody>

          </table>
          `

          :

          `
          <div class="empty">
            No pending attendance requests.
          </div>
          `
        }

      </div>

    `;


    $$("[data-approve-att]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            approveAttendance(
              button.dataset.approveAtt,
              true
            )
        );

      });


    $$("[data-reject-att]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            approveAttendance(
              button.dataset.rejectAtt,
              false
            )
        );

      });


    return;

  }


  /* MEMBERS */

  if (view === "members") {

    content.innerHTML = `

      <h2>
        Village Register
      </h2>

      <p class="sub">
        Members can see their village register;
        admin can manage verified membership.
      </p>


      <div class="app-panel">

        <table class="data-table">

          <thead>

            <tr>
              <th>Name</th>
              <th>Village</th>
              <th>Member ID</th>
              <th>Attendance</th>
              <th>Contributions</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            ${members.map(member => {

              const approvedAttendance =
                attendance.filter(
                  item =>
                    item.memberId === member.id &&
                    item.status === "approved"
                ).length;


              const contributions =
                transactions
                  .filter(
                    item =>
                      item.memberId === member.id &&
                      item.status === "approved"
                  )
                  .reduce(
                    (sum,item) =>
                      sum +
                      Number(item.amount),
                    0
                  );


              return `

                <tr>

                  <td>
                    ${esc(member.name)}
                  </td>

                  <td>
                    ${esc(member.village)}
                  </td>

                  <td>
                    ${esc(member.id)}
                  </td>

                  <td>
                    ${approvedAttendance}
                  </td>

                  <td>
                    ${money(contributions)}
                  </td>

                  <td>

                    <span
                      class="badge ${
                        member.active
                          ? "approved"
                          : "rejected"
                      }"
                    >
                      ${
                        member.active
                          ? "Active"
                          : "Inactive"
                      }
                    </span>

                  </td>

                </tr>

              `;

            }).join("")}

          </tbody>

        </table>

      </div>

    `;

    return;

  }


  /* PAYMENTS */

  if (view === "transactions") {

    const rows =
      transactions.filter(
        item =>
          item.status === "pending"
      );


    content.innerHTML = `

      <h2>
        Payment Verification
      </h2>

      <p class="sub">
        Review uploaded proof before adding
        the payment to verified financial records.
      </p>


      <div class="app-panel">

        ${
          rows.length

          ?

          `
          <table class="data-table">

            <thead>

              <tr>
                <th>Member</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Proof</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              ${rows.map(
                row => `

                <tr>

                  <td>
                    ${esc(row.memberName)}
                  </td>

                  <td>
                    ${esc(row.type)}
                  </td>

                  <td>
                    ${money(row.amount)}
                  </td>

                  <td>
                    ${esc(
                      row.proofName ||
                      "Uploaded proof"
                    )}
                  </td>

                  <td>

                    <button
                      class="table-action"
                      data-approve-tx="${row.id}"
                    >
                      Approve
                    </button>

                  </td>

                </tr>

              `
              ).join("")}

            </tbody>

          </table>
          `

          :

          `
          <div class="empty">
            No pending payments.
          </div>
          `
        }

      </div>

    `;


    $$("[data-approve-tx]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            approveTransaction(
              button.dataset.approveTx
            )
        );

      });


    return;

  }


  /* AUDIT */

  if (view === "audit") {

    const rows =
      read(KEYS.audit);


    content.innerHTML = `

      <h2>
        Audit Trail
      </h2>

      <p class="sub">
        Every administrative membership and
        attendance decision is named and timestamped.
      </p>


      <div class="app-panel">

        ${
          rows.length

          ?

          `
          <table class="data-table">

            <thead>

              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Details</th>
              </tr>

            </thead>

            <tbody>

              ${rows.map(
                row => `

                <tr>

                  <td>
                    ${esc(fmtDate(row.createdAt))}
                  </td>

                  <td>
                    ${esc(row.adminName)}
                  </td>

                  <td>
                    ${esc(row.action)}
                  </td>

                  <td>
                    ${esc(row.details)}
                  </td>

                </tr>

              `
              ).join("")}

            </tbody>

          </table>
          `

          :

          `
          <div class="empty">
            No audit entries yet.
          </div>
          `
        }

      </div>

    `;

    return;

  }


  /* REPORTS */

  if (view === "reports") {

    const approvedTransactions =
      transactions.filter(
        item =>
          item.status === "approved"
      );

    const approvedAttendance =
      attendance.filter(
        item =>
          item.status === "approved"
      );


    const total =
      approvedTransactions.reduce(
        (sum,item) =>
          sum +
          Number(item.amount),
        0
      );


    content.innerHTML = `

      <h2>
        Annual Reports
      </h2>

      <p class="sub">
        Verified records only.
        Export can be connected to a
        server-side PDF generator in production.
      </p>


      <div class="app-cards">

        <div class="app-card">
          <span>
            Verified Contributions
          </span>

          <strong>
            ${money(total)}
          </strong>
        </div>


        <div class="app-card">
          <span>
            Approved Attendances
          </span>

          <strong>
            ${approvedAttendance.length}
          </strong>
        </div>


        <div class="app-card">
          <span>
            Active Members
          </span>

          <strong>
            ${
              members.filter(
                member =>
                  member.active
              ).length
            }
          </strong>
        </div>

      </div>


      <div class="app-panel">

        <button
          class="btn btn-primary"
          id="adminExportReport"
        >
          Download Annual Report
        </button>

      </div>

    `;


    $("#adminExportReport")
      .addEventListener(
        "click",
        downloadReport
      );

  }

}


/* =========================================================
   VERIFY MEMBER
========================================================= */

function verifyRequest(id) {

  const requests =
    read(KEYS.requests);

  const request =
    requests.find(
      item =>
        item.id === id
    );


  if (!request) {
    return;
  }


  const members =
    read(KEYS.members);


  const prefix =
    request.village
      .split(" ")
      .map(
        word =>
          word[0]
      )
      .join("")
      .slice(0,3)
      .toUpperCase();


  const count =
    members.filter(
      member =>
        member.village ===
        request.village
    ).length + 1;


  const memberId =
    `${prefix}-${String(count).padStart(4,"0")}`;


  const password =
    `UL-${Math.random()
      .toString(36)
      .slice(2,8)
      .toUpperCase()}`;


  const member = {

    id:memberId,

    password,

    name:request.name,

    phone:request.phone,

    village:request.village,

    verified:true,

    active:true,

    attendance:[],

    createdAt:now()

  };


  members.push(member);

  write(
    KEYS.members,
    members
  );


  request.status =
    "approved";

  request.verifiedAt =
    now();

  request.verifiedBy =
    ADMIN.name;

  request.generatedMemberId =
    memberId;

  request.generatedPassword =
    password;


  write(
    KEYS.requests,
    requests
  );


  addAudit(
    "Verified member and generated credentials",
    memberId,
    `${request.name} · ${request.village}`
  );


  adminView("requests");


  toast(
    "Member verified",
    `Generated ID ${memberId}. Password: ${password}`
  );

}


/* =========================================================
   APPROVE ATTENDANCE
========================================================= */

function approveAttendance(
  id,
  approved
) {

  const list =
    read(KEYS.attendance);

  const record =
    list.find(
      item =>
        item.id === id
    );


  if (!record) {
    return;
  }


  record.status =
    approved
      ? "approved"
      : "rejected";

  record.approvedBy =
    ADMIN.name;

  record.approvedAt =
    now();


  write(
    KEYS.attendance,
    list
  );


  addAudit(
    approved
      ? "Approved attendance"
      : "Rejected attendance",
    id,
    `${record.memberName} · ${record.village} · ${record.meetingDate}`
  );


  adminView("attendance");


  toast(
    approved
      ? "Attendance approved"
      : "Attendance rejected",
    approved
      ? "The verified register now includes this attendance."
      : "The attendance request was rejected."
  );

}


/* =========================================================
   APPROVE PAYMENT
========================================================= */

function approveTransaction(id) {

  const list =
    read(KEYS.transactions);

  const record =
    list.find(
      item =>
        item.id === id
    );


  if (!record) {
    return;
  }


  record.status =
    "approved";

  record.verifiedBy =
    ADMIN.name;

  record.verifiedAt =
    now();


  write(
    KEYS.transactions,
    list
  );


  addAudit(
    "Approved payment",
    id,
    `${record.memberName} · ${record.type} · ${money(record.amount)}`
  );


  adminView("transactions");


  toast(
    "Payment approved",
    "The contribution is now included in verified financial records."
  );

}


/* =========================================================
   REPORT DOWNLOAD DEMO
========================================================= */

function downloadReport() {

  const transactions =
    read(KEYS.transactions)
      .filter(
        item =>
          item.status === "approved"
      );


  const attendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.status === "approved"
      );


  const members =
    read(KEYS.members)
      .filter(
        item =>
          item.active
      );


  const total =
    transactions.reduce(
      (sum,item) =>
        sum +
        Number(item.amount),
      0
    );


  const report = `

UNIONLEDGER
ANNUAL UNION REPORT

Generated:
${new Date().toLocaleString("en-NG")}

Active members:
${members.length}

Verified contributions:
${money(total)}

Approved meeting attendances:
${attendance.length}

This report contains verified records only.

`;


  const blob =
    new Blob(
      [report],
      {
        type:
          "text/plain"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    "unionledger-annual-report.txt";


  link.click();


  URL.revokeObjectURL(url);


  toast(
    "Report downloaded",
    "Demo export created. Production should generate a real PDF server-side."
  );

}


/* =========================================================
   LANDING PAGE REPORT
========================================================= */

$("#demoReportBtn")
  .addEventListener(
    "click",
    downloadReport
  );


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "UnionLedger initialized without JavaScript errors."
    );

  }
);
```
