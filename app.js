"use strict";

/*
  UNIONLEDGER
  Sandbox-safe vanilla JavaScript

  IMPORTANT:
  Tanimawo Code Lab may run this page inside a sandboxed iframe.
  Therefore this application NEVER assumes localStorage is available.
*/


/* =========================================================
   CONFIGURATION
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

const TYPES = [
  "Annual Dues",
  "Burial Levy",
  "Life Insurance Levy",
  "Party Donation",
  "Support Levy"
];

const KEYS = {
  members: "ul_members",
  requests: "ul_requests",
  attendance: "ul_attendance",
  transactions: "ul_transactions",
  audit: "ul_audit",
  session: "ul_session"
};


/* =========================================================
   DEMO ADMIN
========================================================= */

const ADMIN = {
  id: "ADMIN-001",
  password: "Admin@123",
  name: "Union Administrator",
  role: "admin"
};


/* =========================================================
   SANDBOX-SAFE STORAGE
========================================================= */

const memoryStore = Object.create(null);

const storage = (() => {

  try {

    const s = window.localStorage;

    const probe = "__unionledger_probe__";

    s.setItem(probe, "1");
    s.removeItem(probe);

    return s;

  } catch (_) {

    /*
      Tanimawo's sandbox may throw:

      SecurityError:
      Failed to read the 'localStorage' property from Window.

      We therefore use memory storage instead.
    */

    return {

      getItem(key) {

        return Object.prototype.hasOwnProperty.call(
          memoryStore,
          key
        )
          ? memoryStore[key]
          : null;

      },

      setItem(key, value) {

        memoryStore[key] = String(value);

      },

      removeItem(key) {

        delete memoryStore[key];

      }

    };

  }

})();


/* =========================================================
   HELPERS
========================================================= */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  Array.from(document.querySelectorAll(selector));

const now = () =>
  new Date().toISOString();

const uid = prefix =>
  `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

const money = value =>
  `₦${Number(value || 0).toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;

const dateOnly = value =>
  new Date(value).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

const dateTime = value =>
  new Date(value).toLocaleString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

const norm = value =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const esc = value =>
  String(value ?? "")
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


function read(key, fallback = []) {

  try {

    const value = storage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  } catch (_) {

    return fallback;

  }

}


function write(key, value) {

  try {

    storage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (_) {

    /* Sandbox-safe: silently use memory fallback. */

  }

}


function remove(key) {

  try {

    storage.removeItem(key);

  } catch (_) {}

}


function toast(
  title,
  message,
  type = "success"
) {

  const toastElement = $("#toast");

  if (!toastElement) return;

  $("#toastTitle").textContent = title;
  $("#toastMessage").textContent = message;

  toastElement.classList.toggle(
    "error",
    type === "error"
  );

  toastElement.classList.add("show");

  clearTimeout(window.__unionToastTimer);

  window.__unionToastTimer =
    setTimeout(
      () => toastElement.classList.remove("show"),
      3600
    );

}


function currentSession() {

  return read(
    KEYS.session,
    null
  );

}


function setSession(session) {

  if (session) {

    write(
      KEYS.session,
      session
    );

  } else {

    remove(KEYS.session);

  }

}


/* =========================================================
   AUDIT
========================================================= */

function audit(
  action,
  detail,
  metadata = {}
) {

  const rows =
    read(KEYS.audit);

  const session =
    currentSession();

  rows.unshift({

    id: uid("AUD"),

    action,

    detail,

    adminId:
      session?.id ||
      ADMIN.id,

    adminName:
      session?.name ||
      ADMIN.name,

    at: now(),

    ...metadata

  });

  write(
    KEYS.audit,
    rows
  );

}


/* =========================================================
   INITIAL DEMO DATA
========================================================= */

function seed() {

  if (
    read(KEYS.members).length === 0
  ) {

    write(
      KEYS.members,
      [

        {
          id: "UO-0001",
          name: "Chinedu Okafor",
          phone: "08030000001",
          village: "Obodo Union",
          password: "Member@123",
          active: true,
          verified: true,
          createdAt: now()
        },

        {
          id: "UO-0002",
          name: "Emeka Nwosu",
          phone: "08030000002",
          village: "Obodo Union",
          password: "Member@456",
          active: true,
          verified: true,
          createdAt: now()
        },

        {
          id: "UM-0001",
          name: "Ngozi Eze",
          phone: "08030000003",
          village: "Umuahia Union",
          password: "Member@789",
          active: true,
          verified: true,
          createdAt: now()
        }

      ]
    );

  }


  [
    KEYS.requests,
    KEYS.attendance,
    KEYS.transactions,
    KEYS.audit
  ].forEach(key => {

    if (
      storage.getItem(key) === null
    ) {

      write(key, []);

    }

  });

}


/* =========================================================
   VILLAGE DROPDOWNS
========================================================= */

function fillVillages() {

  [
    "#loginVillage",
    "#regVillage"
  ].forEach(selector => {

    const element =
      $(selector);

    if (!element) return;

    element.innerHTML =
      `<option value="">
        Select village union
      </option>` +

      VILLAGES
        .map(
          village =>
            `<option value="${esc(village)}">
              ${esc(village)}
            </option>`
        )
        .join("");

  });

}


/* =========================================================
   AUTH MODAL
========================================================= */

function openAuth(
  mode = "member"
) {

  const modal =
    $("#authModal");

  if (!modal) return;

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  setAuthTab("login");

  if (mode === "admin") {

    $("#loginTitle").textContent =
      "Administrator access";

    $("#loginSubtitle").textContent =
      "Sign in to manage your village union.";

    $("#loginId").value =
      ADMIN.id;

  } else {

    $("#loginTitle").textContent =
      "Welcome back";

    $("#loginSubtitle").textContent =
      "Sign in to your village union account.";

  }

}


function closeAuth() {

  const modal =
    $("#authModal");

  if (!modal) return;

  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

}


function setAuthTab(tab) {

  const login =
    tab === "login";

  $("#loginPanel").hidden =
    !login;

  $("#registerPanel").hidden =
    login;

  $$("[data-auth-tab]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.authTab === tab
      );

    });

}


function openApp() {

  const modal =
    $("#appModal");

  if (!modal) return;

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeApp() {

  const modal =
    $("#appModal");

  if (!modal) return;

  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   LOGIN
========================================================= */

function login(event) {

  event.preventDefault();

  const village =
    $("#loginVillage").value;

  const id =
    $("#loginId").value.trim();

  const password =
    $("#loginPassword").value;


  /* ADMIN */

  if (
    id === ADMIN.id &&
    password === ADMIN.password
  ) {

    setSession({

      id: ADMIN.id,

      name: ADMIN.name,

      role: "admin",

      village:
        village || "ALL"

    });

    closeAuth();

    renderAdmin();

    openApp();

    toast(
      "Welcome",
      "Administrator portal opened."
    );

    return;

  }


  /* MEMBER */

  const members =
    read(KEYS.members);

  const member =
    members.find(
      item =>
        item.id.toLowerCase() ===
          id.toLowerCase() &&

        item.password ===
          password &&

        item.active === true &&

        item.verified === true &&

        (!village ||
          item.village === village)
    );


  if (!member) {

    toast(
      "Sign in failed",
      "Check your village, ID and password.",
      "error"
    );

    return;

  }


  setSession({

    id: member.id,

    name: member.name,

    role: "member",

    village: member.village

  });


  closeAuth();

  renderMember();

  openApp();

  toast(
    "Welcome back",
    `${member.name}, your ${member.village} portal is ready.`
  );

}


/* =========================================================
   MEMBER REGISTRATION REQUEST
========================================================= */

function registerMember(event) {

  event.preventDefault();

  const village =
    $("#regVillage").value;

  const name =
    $("#regFullName").value.trim();

  const phone =
    $("#regPhone").value.trim();

  const memberNo =
    $("#regMemberNo").value.trim();

  const note =
    $("#regNote").value.trim();


  if (
    !village ||
    !name ||
    !phone
  ) {

    toast(
      "Incomplete request",
      "Please complete the required fields.",
      "error"
    );

    return;

  }


  const members =
    read(KEYS.members);

  const existing =
    members.find(
      member =>
        member.village === village &&
        norm(member.name) === norm(name)
    );


  if (existing) {

    const requests =
      read(KEYS.requests);

    requests.unshift({

      id: uid("REQ"),

      village,

      name,

      phone,

      memberNo,

      note,

      status: "matched",

      matchedMemberId:
        existing.id,

      createdAt: now()

    });

    write(
      KEYS.requests,
      requests
    );

    toast(
      "Member found",
      "Your name matches the register. Admin will verify and issue credentials."
    );

    return;

  }


  const requests =
    read(KEYS.requests);

  requests.unshift({

    id: uid("REQ"),

    village,

    name,

    phone,

    memberNo,

    note,

    status: "pending",

    createdAt: now()

  });

  write(
    KEYS.requests,
    requests
  );

  event.target.reset();

  toast(
    "Request submitted",
    "Admin will review your membership request."
  );

}


/* =========================================================
   MEMBER ID / PASSWORD GENERATION
========================================================= */

function generatedId(village) {

  const letters =
    village
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 2)
      .toUpperCase();

  const members =
    read(KEYS.members);

  let number =
    members.filter(
      member =>
        member.village === village
    ).length + 1;

  let id =
    `${letters}-${String(number).padStart(4, "0")}`;

  while (
    members.some(
      member =>
        member.id === id
    )
  ) {

    number++;

    id =
      `${letters}-${String(number).padStart(4, "0")}`;

  }

  return id;

}


function generatePassword() {

  return (
    "UL-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()
  );

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

  if (!request) return;


  const members =
    read(KEYS.members);

  let member =
    members.find(
      item =>
        item.village ===
          request.village &&

        norm(item.name) ===
          norm(request.name)
    );


  if (member) {

    member.phone =
      request.phone ||
      member.phone;

    member.active = true;

    member.verified = true;

    if (!member.password) {

      member.password =
        generatePassword();

    }

  } else {

    member = {

      id:
        generatedId(
          request.village
        ),

      name:
        request.name,

      phone:
        request.phone,

      village:
        request.village,

      password:
        generatePassword(),

      active: true,

      verified: true,

      createdAt: now()

    };

    members.push(member);

  }


  write(
    KEYS.members,
    members
  );


  request.status =
    "approved";

  request.approvedAt =
    now();

  request.approvedBy =
    ADMIN.name;


  write(
    KEYS.requests,
    requests
  );


  audit(
    "Member verification",
    "Verified membership and issued credentials",
    {
      memberId: member.id,
      village: member.village
    }
  );


  renderAdmin();


  toast(
    "Member verified",
    `${member.id} / ${member.password}`
  );

}


/* =========================================================
   REJECT REQUEST
========================================================= */

function rejectRequest(id) {

  const requests =
    read(KEYS.requests);

  const request =
    requests.find(
      item =>
        item.id === id
    );

  if (!request) return;


  request.status =
    "rejected";

  request.rejectedAt =
    now();

  request.rejectedBy =
    ADMIN.name;


  write(
    KEYS.requests,
    requests
  );


  audit(
    "Member request rejected",
    `Rejected request for ${request.name}`,
    {
      requestId: id
    }
  );


  renderAdmin();


  toast(
    "Request rejected",
    "The verification request was rejected."
  );

}


/* =========================================================
   PAYMENT SUBMISSION
========================================================= */

function submitPayment(event) {

  event.preventDefault();

  const session =
    currentSession();

  if (
    !session ||
    session.role !== "member"
  ) return;


  const type =
    $("#contributionType").value;

  const amount =
    Number(
      $("#contributionAmount").value
    );

  const paymentDate =
    $("#paymentDate").value;

  const proof =
    $("#paymentProof").files[0];


  if (
    !type ||
    !amount ||
    amount <= 0 ||
    !paymentDate ||
    !proof
  ) {

    toast(
      "Incomplete payment",
      "Select a type, amount, date and proof file.",
      "error"
    );

    return;

  }


  const transactions =
    read(KEYS.transactions);


  transactions.unshift({

    id: uid("TX"),

    memberId:
      session.id,

    memberName:
      session.name,

    village:
      session.village,

    type,

    amount,

    paymentDate,

    proofName:
      proof.name,

    proofSize:
      proof.size,

    status:
      "pending",

    submittedAt:
      now()

  });


  write(
    KEYS.transactions,
    transactions
  );


  audit(
    "Payment submitted",
    `${type} submitted for verification`,
    {
      memberId:
        session.id
    }
  );


  renderMember();


  toast(
    "Payment submitted",
    "Admin must verify your proof before the record is counted."
  );

}


/* =========================================================
   PAYMENT APPROVAL
========================================================= */

function approveTx(
  id,
  approved = true
) {

  const transactions =
    read(KEYS.transactions);

  const item =
    transactions.find(
      transaction =>
        transaction.id === id
    );

  if (!item) return;


  item.status =
    approved
      ? "verified"
      : "rejected";

  item.reviewedAt =
    now();

  item.reviewedBy =
    ADMIN.name;


  write(
    KEYS.transactions,
    transactions
  );


  audit(
    approved
      ? "Payment verified"
      : "Payment rejected",

    `${item.type} ${
      approved
        ? "verified"
        : "rejected"
    } for ${item.memberName}`,

    {
      transactionId:
        id,

      memberId:
        item.memberId
    }
  );


  renderAdmin();


  toast(
    approved
      ? "Payment verified"
      : "Payment rejected",

    `${item.type} for ${item.memberName}.`
  );

}


/* =========================================================
   ATTENDANCE
========================================================= */

function markPresent() {

  const session =
    currentSession();

  if (!session) return;


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const attendance =
    read(KEYS.attendance);


  if (
    attendance.some(
      item =>
        item.memberId ===
          session.id &&
        item.date === today
    )
  ) {

    toast(
      "Already submitted",
      "Attendance for today is already recorded.",
      "error"
    );

    return;

  }


  attendance.unshift({

    id:
      uid("ATT"),

    memberId:
      session.id,

    memberName:
      session.name,

    village:
      session.village,

    date:
      today,

    status:
      "pending",

    submittedAt:
      now()

  });


  write(
    KEYS.attendance,
    attendance
  );


  toast(
    "Attendance submitted",
    "Admin will compare it with the physical register."
  );


  renderMember();

}


/* =========================================================
   ATTENDANCE REVIEW
========================================================= */

function reviewAttendance(
  id,
  approved = true
) {

  const attendance =
    read(KEYS.attendance);

  const item =
    attendance.find(
      attendanceItem =>
        attendanceItem.id === id
    );

  if (!item) return;


  item.status =
    approved
      ? "approved"
      : "rejected";

  item.approvedAt =
    now();

  item.approvedBy =
    ADMIN.name;


  write(
    KEYS.attendance,
    attendance
  );


  audit(
    approved
      ? "Attendance approved"
      : "Attendance rejected",

    `${item.memberName} attendance ${
      approved
        ? "approved"
        : "rejected"
    }`,

    {
      attendanceId:
        id,

      memberId:
        item.memberId
    }
  );


  renderAdmin();


  toast(
    approved
      ? "Attendance approved"
      : "Attendance rejected",

    `${item.memberName} — ${dateOnly(item.date)}.`
  );

}


/* =========================================================
   REPORT HELPERS
========================================================= */

function verifiedTransactions(
  village
) {

  return read(
    KEYS.transactions
  ).filter(
    transaction =>
      transaction.status ===
        "verified" &&

      (
        !village ||
        transaction.village ===
          village
      )
  );

}


function totalFor(village) {

  return verifiedTransactions(
    village
  ).reduce(
    (total, transaction) =>
      total +
      Number(
        transaction.amount || 0
      ),
    0
  );

}


/* =========================================================
   PRINT / SAVE AS PDF
========================================================= */

function reportPdf(
  village = null,
  memberId = null
) {

  const scope =
    village ||
    "All Villages";


  let transactions =
    verifiedTransactions(
      village
    );


  if (memberId) {

    transactions =
      transactions.filter(
        transaction =>
          transaction.memberId ===
          memberId
      );

  }


  const attendance =
    read(KEYS.attendance)
      .filter(
        item =>
          (
            !village ||
            item.village === village
          ) &&

          (
            !memberId ||
            item.memberId === memberId
          ) &&

          item.status ===
            "approved"
      );


  const total =
    transactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.amount || 0
        ),
      0
    );


  const windowReference =
    window.open(
      "",
      "_blank",
      "width=900,height=700"
    );


  if (!windowReference) {

    toast(
      "Popup blocked",
      "Allow popups to generate the printable PDF report.",
      "error"
    );

    return;

  }


  windowReference.document.write(`

    <!doctype html>

    <html>

    <head>

      <title>
        UnionLedger Financial Report
      </title>

      <style>

        body{
          font-family:Arial,sans-serif;
          padding:40px;
          color:#071711;
        }

        h1{
          color:#8b6f2d;
        }

        table{
          border-collapse:collapse;
          width:100%;
          margin-top:25px;
        }

        th,
        td{
          border:1px solid #ddd;
          padding:10px;
          text-align:left;
        }

        button{
          margin-top:25px;
          padding:12px 18px;
        }

        @media print{
          button{
            display:none;
          }
        }

      </style>

    </head>


    <body>

      <h1>UNIONLEDGER</h1>

      <h2>
        Community Financial Report
      </h2>

      <p>
        ${esc(scope)}
      </p>

      <p>
        Generated:
        ${esc(dateTime(now()))}
      </p>


      <table>

        <tr>
          <th>
            Contribution Type
          </th>

          <th>
            Verified Amount
          </th>
        </tr>


        ${TYPES.map(type => `

          <tr>

            <td>
              ${esc(type)}
            </td>

            <td>
              ${money(
                transactions
                  .filter(
                    item =>
                      item.type === type
                  )
                  .reduce(
                    (sum,item) =>
                      sum +
                      Number(
                        item.amount || 0
                      ),
                    0
                  )
              )}
            </td>

          </tr>

        `).join("")}


        <tr>

          <th>
            Total
          </th>

          <th>
            ${money(total)}
          </th>

        </tr>

      </table>


      <p>
        Approved attendance records:
        ${attendance.length}
      </p>


      <button
        onclick="window.print()"
      >
        Print / Save as PDF
      </button>


    </body>

    </html>

  `);


  windowReference.document.close();

  windowReference.focus();


  setTimeout(
    () => windowReference.print(),
    350
  );

}


/* =========================================================
   MEMBER DASHBOARD
========================================================= */

function renderMember() {

  const session =
    currentSession();

  const transactions =
    read(KEYS.transactions)
      .filter(
        item =>
          item.memberId ===
          session.id
      );

  const attendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.memberId ===
          session.id
      );

  const verified =
    transactions.filter(
      item =>
        item.status ===
        "verified"
    );


  $("#appRoot").innerHTML = `

    <div class="app-shell">


      <div class="app-top">

        <div>

          <span class="eyebrow">
            Member Portal
          </span>

          <h2>
            ${esc(session.name)}
          </h2>

          <p>
            ${esc(session.village)}
            ·
            ${esc(session.id)}
          </p>

        </div>


        <button
          class="btn btn-ghost"
          data-action="logout"
        >
          Sign out
        </button>

      </div>


      <div class="app-tabs">

        <button
          class="app-tab active"
          data-app-tab="overview"
        >
          Overview
        </button>

        <button
          class="app-tab"
          data-app-tab="payments"
        >
          Submit Payment
        </button>

        <button
          class="app-tab"
          data-app-tab="attendance"
        >
          Attendance
        </button>

        <button
          class="app-tab"
          data-app-tab="records"
        >
          My Records
        </button>

      </div>


      <div id="memberView"></div>


    </div>

  `;


  renderMemberView(
    "overview"
  );

}


/* =========================================================
   MEMBER VIEW
========================================================= */

function renderMemberView(tab) {

  const session =
    currentSession();

  const transactions =
    read(KEYS.transactions)
      .filter(
        item =>
          item.memberId ===
          session.id
      );

  const attendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.memberId ===
          session.id
      );


  const verified =
    transactions.filter(
      item =>
        item.status ===
        "verified"
    );


  const verifiedTotal =
    verified.reduce(
      (sum,item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );


  const root =
    $("#memberView");

  if (!root) return;


  if (
    tab ===
    "overview"
  ) {

    root.innerHTML = `

      <div class="stat-grid">

        <div class="app-stat">

          <span>
            Verified contributions
          </span>

          <strong>
            ${money(verifiedTotal)}
          </strong>

        </div>


        <div class="app-stat">

          <span>
            Approved attendance
          </span>

          <strong>
            ${
              attendance.filter(
                item =>
                  item.status ===
                  "approved"
              ).length
            }
          </strong>

        </div>


        <div class="app-stat">

          <span>
            Pending payments
          </span>

          <strong>
            ${
              transactions.filter(
                item =>
                  item.status ===
                  "pending"
              ).length
            }
          </strong>

        </div>

      </div>


      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Quick actions
            </h3>

            <p>
              Keep your union records current.
            </p>

          </div>

        </div>


        <div class="action-grid">

          <button
            class="action-btn"
            data-app-tab="payments"
          >
            ＋ Submit payment proof
          </button>

          <button
            class="action-btn"
            data-action="mark-attendance"
          >
            ✓ Mark present today
          </button>

          <button
            class="action-btn"
            data-app-tab="attendance"
          >
            ◷ View attendance
          </button>

          <button
            class="action-btn"
            data-action="member-report"
          >
            ▣ Download statement
          </button>

        </div>

      </div>

    `;

  }


  if (
    tab ===
    "payments"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Submit payment proof
            </h3>

            <p>
              Your payment becomes an official contribution
              only after admin verification.
            </p>

          </div>

        </div>


        <form
          id="paymentForm"
          class="app-form"
        >

          <label>

            Contribution type

            <select
              id="contributionType"
              required
            >

              <option value="">
                Select type
              </option>

              ${TYPES.map(
                type =>
                  `<option>
                    ${esc(type)}
                  </option>`
              ).join("")}

            </select>

          </label>


          <label>

            Amount (₦)

            <input
              id="contributionAmount"
              type="number"
              min="1"
              step="0.01"
              required
            >

          </label>


          <label>

            Payment date

            <input
              id="paymentDate"
              type="date"
              required
            >

          </label>


          <label>

            Proof of payment

            <input
              id="paymentProof"
              type="file"
              accept="image/*,.pdf"
              required
            >

          </label>


          <button
            class="btn btn-primary"
            type="submit"
          >
            Submit for verification
          </button>

        </form>

      </div>

    `;

  }


  if (
    tab ===
    "attendance"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Meeting attendance
            </h3>

            <p>
              Admin approval is required after checking
              the physical register.
            </p>

          </div>


          <button
            class="btn btn-primary"
            data-action="mark-attendance"
          >
            Mark Present Today
          </button>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Reviewed by</th>
                <th>Time</th>
              </tr>

            </thead>


            <tbody>

              ${
                attendance.length

                  ? attendance
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${dateOnly(item.date)}
                            </td>

                            <td>
                              <span class="badge ${item.status}">
                                ${esc(item.status)}
                              </span>
                            </td>

                            <td>
                              ${esc(item.approvedBy || "—")}
                            </td>

                            <td>
                              ${
                                item.approvedAt
                                  ? dateTime(item.approvedAt)
                                  : "—"
                              }
                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="4">
                          No attendance submitted yet.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  if (
    tab ===
    "records"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              My contribution records
            </h3>

            <p>
              Only verified payments are included
              in official financial reports.
            </p>

          </div>


          <button
            class="btn btn-outline"
            data-action="member-report"
          >
            Download statement
          </button>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Proof</th>
              </tr>

            </thead>


            <tbody>

              ${
                transactions.length

                  ? transactions
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${dateOnly(item.paymentDate)}
                            </td>

                            <td>
                              ${esc(item.type)}
                            </td>

                            <td>
                              ${money(item.amount)}
                            </td>

                            <td>
                              <span class="badge ${item.status}">
                                ${esc(item.status)}
                              </span>
                            </td>

                            <td>
                              ${esc(item.proofName || "—")}
                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="5">
                          No payment records yet.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }

}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function renderAdmin() {

  const requests =
    read(KEYS.requests)
      .filter(
        item =>
          item.status === "pending" ||
          item.status === "matched"
      );

  const pendingPayments =
    read(KEYS.transactions)
      .filter(
        item =>
          item.status === "pending"
      );

  const pendingAttendance =
    read(KEYS.attendance)
      .filter(
        item =>
          item.status === "pending"
      );

  const members =
    read(KEYS.members);


  $("#appRoot").innerHTML = `

    <div class="app-shell">


      <div class="app-top">

        <div>

          <span class="eyebrow">
            Administrator Portal
          </span>

          <h2>
            ${esc(ADMIN.name)}
          </h2>

          <p>
            Multi-village oversight ·
            10 tenant spaces
          </p>

        </div>


        <button
          class="btn btn-ghost"
          data-action="logout"
        >
          Sign out
        </button>

      </div>


      <div class="admin-summary">

        <div class="app-stat">

          <span>
            Total verified collections
          </span>

          <strong>
            ${money(totalFor())}
          </strong>

        </div>


        <div class="app-stat">

          <span>
            Members
          </span>

          <strong>
            ${members.length}
          </strong>

        </div>


        <div class="app-stat">

          <span>
            Pending payments
          </span>

          <strong>
            ${pendingPayments.length}
          </strong>

        </div>


        <div class="app-stat">

          <span>
            Pending attendance
          </span>

          <strong>
            ${pendingAttendance.length}
          </strong>

        </div>

      </div>


      <div class="app-tabs">

        <button
          class="app-tab active"
          data-admin-tab="requests"
        >
          Member Requests (${requests.length})
        </button>

        <button
          class="app-tab"
          data-admin-tab="payments"
        >
          Payments (${pendingPayments.length})
        </button>

        <button
          class="app-tab"
          data-admin-tab="attendance"
        >
          Attendance (${pendingAttendance.length})
        </button>

        <button
          class="app-tab"
          data-admin-tab="register"
        >
          Register
        </button>

        <button
          class="app-tab"
          data-admin-tab="audit"
        >
          Audit
        </button>

        <button
          class="app-tab"
          data-admin-tab="reports"
        >
          Reports
        </button>

      </div>


      <div id="adminView"></div>

    </div>

  `;


  renderAdminView(
    "requests"
  );

}


/* =========================================================
   ADMIN VIEWS
========================================================= */

function renderAdminView(tab) {

  const root =
    $("#adminView");

  if (!root) return;


  const requests =
    read(KEYS.requests);

  const transactions =
    read(KEYS.transactions);

  const attendance =
    read(KEYS.attendance);

  const members =
    read(KEYS.members);

  const auditRows =
    read(KEYS.audit);


  /* MEMBER REQUESTS */

  if (
    tab ===
    "requests"
  ) {

    const pending =
      requests.filter(
        item =>
          item.status === "pending" ||
          item.status === "matched"
      );


    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Member verification requests
            </h3>

            <p>
              Match each request against
              the physical union register.
            </p>

          </div>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Name</th>
                <th>Village</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>


            <tbody>

              ${
                pending.length

                  ? pending
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${esc(item.name)}
                            </td>

                            <td>
                              ${esc(item.village)}
                            </td>

                            <td>
                              ${esc(item.phone)}
                            </td>

                            <td>
                              <span class="badge pending">
                                ${esc(item.status)}
                              </span>
                            </td>

                            <td>

                              <button
                                class="mini-btn"
                                data-action="verify-request"
                                data-id="${item.id}"
                              >
                                Verify & Generate ID
                              </button>

                              <button
                                class="mini-btn danger"
                                data-action="reject-request"
                                data-id="${item.id}"
                              >
                                Reject
                              </button>

                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="5">
                          No pending member requests.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  /* PAYMENTS */

  if (
    tab ===
    "payments"
  ) {

    const pending =
      transactions.filter(
        item =>
          item.status ===
          "pending"
      );


    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Payment verification
            </h3>

            <p>
              Review proof before counting
              money in official records.
            </p>

          </div>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Member</th>
                <th>Village</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Proof</th>
                <th>Action</th>
              </tr>

            </thead>


            <tbody>

              ${
                pending.length

                  ? pending
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${esc(item.memberName)}
                            </td>

                            <td>
                              ${esc(item.village)}
                            </td>

                            <td>
                              ${esc(item.type)}
                            </td>

                            <td>
                              ${money(item.amount)}
                            </td>

                            <td>
                              ${esc(item.proofName)}
                            </td>

                            <td>

                              <button
                                class="mini-btn"
                                data-action="approve-tx"
                                data-id="${item.id}"
                              >
                                Approve
                              </button>

                              <button
                                class="mini-btn danger"
                                data-action="reject-tx"
                                data-id="${item.id}"
                              >
                                Reject
                              </button>

                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="6">
                          No pending payments.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  /* ATTENDANCE */

  if (
    tab ===
    "attendance"
  ) {

    const pending =
      attendance.filter(
        item =>
          item.status ===
          "pending"
      );


    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Meeting attendance approval
            </h3>

            <p>
              Compare with the manual register
              before approval.
            </p>

          </div>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Member</th>
                <th>Village</th>
                <th>Date</th>
                <th>Action</th>
              </tr>

            </thead>


            <tbody>

              ${
                pending.length

                  ? pending
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${esc(item.memberName)}
                            </td>

                            <td>
                              ${esc(item.village)}
                            </td>

                            <td>
                              ${dateOnly(item.date)}
                            </td>

                            <td>

                              <button
                                class="mini-btn"
                                data-action="approve-att"
                                data-id="${item.id}"
                              >
                                Approve
                              </button>

                              <button
                                class="mini-btn danger"
                                data-action="reject-att"
                                data-id="${item.id}"
                              >
                                Reject
                              </button>

                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="4">
                          No pending attendance.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  /* REGISTER */

  if (
    tab ===
    "register"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Village member register
            </h3>

            <p>
              Attendance and verified contribution
              totals by member.
            </p>

          </div>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Member</th>
                <th>Village</th>
                <th>ID</th>
                <th>Attendance</th>
                <th>Verified contributions</th>
              </tr>

            </thead>


            <tbody>

              ${members
                .map(
                  member => `

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
                        ${
                          attendance.filter(
                            item =>
                              item.memberId ===
                                member.id &&
                              item.status ===
                                "approved"
                          ).length
                        }
                      </td>

                      <td>
                        ${money(
                          transactions
                            .filter(
                              item =>
                                item.memberId ===
                                  member.id &&
                                item.status ===
                                  "verified"
                            )
                            .reduce(
                              (sum,item) =>
                                sum +
                                Number(
                                  item.amount ||
                                  0
                                ),
                              0
                            )
                        )}
                      </td>

                    </tr>

                  `
                )
                .join("")}

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  /* AUDIT */

  if (
    tab ===
    "audit"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Administrative audit trail
            </h3>

            <p>
              Every administrative action is
              named and timestamped.
            </p>

          </div>

        </div>


        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>

            </thead>


            <tbody>

              ${
                auditRows.length

                  ? auditRows
                      .slice(0,100)
                      .map(
                        item => `

                          <tr>

                            <td>
                              ${dateTime(item.at)}
                            </td>

                            <td>
                              ${esc(item.adminName)}
                            </td>

                            <td>
                              ${esc(item.action)}
                            </td>

                            <td>
                              ${esc(item.detail)}
                            </td>

                          </tr>

                        `
                      )
                      .join("")

                  : `

                      <tr>

                        <td colspan="4">
                          No audit events yet.
                        </td>

                      </tr>

                    `
              }

            </tbody>

          </table>

        </div>

      </div>

    `;

  }


  /* REPORTS */

  if (
    tab ===
    "reports"
  ) {

    root.innerHTML = `

      <div class="app-card">

        <div class="card-head">

          <div>

            <h3>
              Financial reports
            </h3>

            <p>
              Generate a print-ready report and
              choose “Save as PDF”.
            </p>

          </div>

        </div>


        <div class="report-actions">

          <button
            class="btn btn-primary"
            data-action="all-report"
          >
            Annual / all-village report
          </button>


          ${VILLAGES.map(
            village => `

              <button
                class="action-btn"
                data-report-village="${esc(village)}"
              >
                ${esc(village)}
              </button>

            `
          ).join("")}

        </div>

      </div>

    `;

  }

}


/* =========================================================
   CENTRAL EVENT DELEGATION
   ========================================================= */

function delegateClick(event) {

  const loginButton =
    event.target.closest(
      "[data-login]"
    );

  if (loginButton) {

    event.preventDefault();

    openAuth(
      loginButton.dataset.login
    );

    return;

  }


  const scrollButton =
    event.target.closest(
      "[data-scroll]"
    );

  if (scrollButton) {

    event.preventDefault();

    const section =
      $(
        `#${scrollButton.dataset.scroll}`
      );

    if (section) {

      section.scrollIntoView({
        behavior:"smooth"
      });

    }

    return;

  }


  const closeAuthButton =
    event.target.closest(
      "[data-close-modal]"
    );

  if (closeAuthButton) {

    closeAuth();

    return;

  }


  const closeAppButton =
    event.target.closest(
      "[data-close-app]"
    );

  if (closeAppButton) {

    closeApp();

    return;

  }


  const authTab =
    event.target.closest(
      "[data-auth-tab]"
    );

  if (authTab) {

    setAuthTab(
      authTab.dataset.authTab
    );

    return;

  }


  const memberTab =
    event.target.closest(
      "[data-app-tab]"
    );

  if (
    memberTab &&
    currentSession()?.role ===
      "member"
  ) {

    $$("[data-app-tab]")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.appTab ===
            memberTab.dataset.appTab
        );

      });


    renderMemberView(
      memberTab.dataset.appTab
    );

    return;

  }


  const adminTab =
    event.target.closest(
      "[data-admin-tab]"
    );

  if (
    adminTab &&
    currentSession()?.role ===
      "admin"
  ) {

    $$("[data-admin-tab]")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.adminTab ===
            adminTab.dataset.adminTab
        );

      });


    renderAdminView(
      adminTab.dataset.adminTab
    );

    return;

  }


  const actionButton =
    event.target.closest(
      "[data-action]"
    );

  if (actionButton) {

    const action =
      actionButton.dataset.action;

    const id =
      actionButton.dataset.id;


    if (
      action ===
      "logout"
    ) {

      setSession(null);

      closeApp();

      toast(
        "Signed out",
        "Your session has ended."
      );

    }


    else if (
      action ===
      "mark-attendance"
    ) {

      markPresent();

    }


    else if (
      action ===
      "verify-request"
    ) {

      verifyRequest(id);

    }


    else if (
      action ===
      "reject-request"
    ) {

      rejectRequest(id);

    }


    else if (
      action ===
      "approve-tx"
    ) {

      approveTx(
        id,
        true
      );

    }


    else if (
      action ===
      "reject-tx"
    ) {

      approveTx(
        id,
        false
      );

    }


    else if (
      action ===
      "approve-att"
    ) {

      reviewAttendance(
        id,
        true
      );

    }


    else if (
      action ===
      "reject-att"
    ) {

      reviewAttendance(
        id,
        false
      );

    }


    else if (
      action ===
      "member-report"
    ) {

      const session =
        currentSession();

      reportPdf(
        session.village,
        session.id
      );

    }


    else if (
      action ===
      "all-report"
    ) {

      reportPdf();

    }


    return;

  }


  const villageReport =
    event.target.closest(
      "[data-report-village]"
    );

  if (villageReport) {

    reportPdf(
      villageReport.dataset.reportVillage
    );

  }

}


/* =========================================================
   INITIALIZATION
========================================================= */

function init() {

  seed();

  fillVillages();


  /*
    ONE click listener for the whole application.

    This is especially important inside sandboxed builders.
  */

  document.addEventListener(
    "click",
    delegateClick
  );


  /*
    Static forms.
  */

  $("#loginForm")
    ?.addEventListener(
      "submit",
      login
    );


  $("#registerForm")
    ?.addEventListener(
      "submit",
      registerMember
    );


  /*
    Dynamic payment form.

    It does not exist when the page first loads,
    therefore submit is delegated from document.
  */

  document.addEventListener(
    "submit",
    event => {

      if (
        event.target &&
        event.target.id ===
          "paymentForm"
      ) {

        submitPayment(event);

      }

    }
  );


  /* PASSWORD TOGGLE */

  $("#togglePassword")
    ?.addEventListener(
      "click",
      () => {

        const password =
          $("#loginPassword");

        if (!password) return;

        password.type =
          password.type ===
            "password"
            ? "text"
            : "password";

      }
    );


  /* REGISTER / LOGIN LINKS */

  $("#showRegister")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        setAuthTab(
          "register"
        );

      }
    );


  $("#showLogin")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        setAuthTab(
          "login"
        );

      }
    );


  /* FORGOT PASSWORD */

  $("#forgotPassword")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        toast(
          "Password reset",
          "For this demo, contact your union administrator to issue a new credential."
        );

      }
    );


  /* MOBILE MENU */

  $("#mobileMenuButton")
    ?.addEventListener(
      "click",
      () => {

        const menu =
          $("#mobileMenu");

        const button =
          $("#mobileMenuButton");

        if (!menu || !button)
          return;

        const open =
          menu.classList.toggle(
            "open"
          );

        button.setAttribute(
          "aria-expanded",
          String(open)
        );

      }
    );


  /* LANDING PAGE PDF BUTTON */

  $("#demoReportBtn")
    ?.addEventListener(
      "click",
      () => {

        reportPdf(
          "Obodo Union"
        );

      }
    );


  /* CHART FILTER */

  $("#chartFilter")
    ?.addEventListener(
      "change",
      event => {

        const option =
          event.target
            .options[
              event.target
                .selectedIndex
            ];

        toast(
          "Chart updated",
          `Showing ${option.text}.`
        );

      }
    );


  /* HEADER SCROLL EFFECT */

  window.addEventListener(
    "scroll",
    () => {

      $("#siteHeader")
        ?.classList.toggle(
          "scrolled",
          window.scrollY > 20
        );

    }
  );


  /* CLOSE MODALS BY CLICKING BACKDROP */

  $("#authModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "authModal"
        ) {

          closeAuth();

        }

      }
    );


  $("#appModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "appModal"
        ) {

          closeApp();

        }

      }
    );

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

}
