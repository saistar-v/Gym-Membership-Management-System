// --- DATA STORE & STATE MANAGEMENT ---
const STORAGE_KEYS = {
  MEMBERS: 'pulsefit_members_v1',
  ATTENDANCE: 'pulsefit_attendance_v1',
  INVOICES: 'pulsefit_invoices_v1'
};

// Seed initial default data if empty
function initializeDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
    const defaultMembers = [
      {
        id: 'MEM-1001',
        name: 'Alex Johnson',
        email: 'alex@fitexample.com',
        phone: '+91 98765-43210',
        plan: 'Platinum',
        startDate: '2026-01-01',
        expiryDate: '2027-01-01',
        status: 'Active'
      },
      {
        id: 'MEM-1002',
        name: 'Sarah Connor',
        email: 'sarah@fitexample.com',
        phone: '+91 98765-87654',
        plan: 'Bronze',
        startDate: '2026-09-12',
        expiryDate: '2026-10-12', // Expiring in 4 days
        status: 'Active'
      },
      {
        id: 'MEM-1003',
        name: 'Michael Scott',
        email: 'michael@fitexample.com',
        phone: '+91 98765-12345',
        plan: 'Silver',
        startDate: '2026-06-01',
        expiryDate: '2026-09-01', // Expired
        status: 'Expired'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(defaultMembers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    const defaultLogs = [
      {
        id: 'ATT-101',
        memberId: 'MEM-1001',
        name: 'Alex Johnson',
        plan: 'Platinum',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        status: 'Granted'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(defaultLogs));
  }

  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    const defaultInvoices = [
      {
        invoiceId: 'INV-9001',
        memberId: 'MEM-1001',
        memberName: 'Alex Johnson',
        plan: 'Platinum (12 Months)',
        amount: 12000,
        paymentMethod: 'Card',
        date: '2026-01-01'
      },
      {
        invoiceId: 'INV-9002',
        memberId: 'MEM-1002',
        memberName: 'Sarah Connor',
        plan: 'Bronze (1 Month)',
        amount: 1500,
        paymentMethod: 'Cash',
        date: '2026-09-12'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(defaultInvoices));
  } else {
    // Migrate legacy data in localStorage to Indian Rupees and standardized payment methods (Cash, Card, UPI)
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
      let updated = false;
      stored.forEach(inv => {
        if (inv.amount === 300) { inv.amount = 12000; updated = true; }
        if (inv.amount === 35) { inv.amount = 1500; updated = true; }
        if (inv.paymentMethod === 'Credit Card' || inv.paymentMethod === 'POS Terminal' || inv.paymentMethod === 'Auto Card Charged') {
          inv.paymentMethod = 'Card';
          updated = true;
        } else if (inv.paymentMethod === 'Cash / POS') {
          inv.paymentMethod = 'Cash';
          updated = true;
        } else if (inv.paymentMethod === 'Bank Transfer' || inv.paymentMethod === 'rohit bkl') {
          inv.paymentMethod = 'UPI';
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Data Getters & Setters
function getMembers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
}
function saveMembers(data) {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data));
}
function getAttendance() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
}
function saveAttendance(data) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
}
function getInvoices() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES)) || [];
}
function saveInvoices(data) {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data));
}

// --- AUTOMATION ENGINE ---
// Re-computes membership status dynamically (Active, Expiring Soon, Expired)
function runAutomatedStatusAudit() {
  const members = getMembers();
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  let updated = false;

  members.forEach(member => {
    const expDate = new Date(member.expiryDate);
    const prevStatus = member.status;

    if (expDate < today) {
      member.status = 'Expired';
    } else if (expDate <= sevenDaysFromNow) {
      member.status = 'Expiring Soon';
    } else {
      member.status = 'Active';
    }

    if (prevStatus !== member.status) {
      updated = true;
    }
  });

  if (updated) {
    saveMembers(members);
  }
}

// Calculate End Expiration Date
function calculateExpiry(startDateStr, monthsToAdd) {
  const date = new Date(startDateStr);
  date.setMonth(date.getMonth() + parseInt(monthsToAdd, 10));
  return date.toISOString().split('T')[0];
}

// Generate IDs
function generateMemberId() {
  return 'MEM-' + Math.floor(1000 + Math.random() * 9000);
}
function generateInvoiceId() {
  return 'INV-' + Math.floor(10000 + Math.random() * 90000);
}

// Toast Notifier
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// --- UI NAVIGATION & CLOCK ---
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.view-panel');
  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');

  const titles = {
    dashboard: { title: 'Gym Operations Dashboard', sub: 'Real-time gym status, check-ins, and automated alerts' },
    registration: { title: 'Register New Member', sub: 'Instant member enrollment and auto-billing setup' },
    attendance: { title: 'Attendance Turnstile', sub: 'Automated access verification based on payment status' },
    renewals: { title: 'Member Roster & Renewals', sub: 'Monitor expiring plans and process one-click renewals' },
    billing: { title: 'Billing & Invoices', sub: 'Automated financial logging and receipt generation' }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`view-${target}`).classList.add('active');

      viewTitle.innerText = titles[target].title;
      viewSubtitle.innerText = titles[target].sub;

      renderDashboard();
      renderMembersTable();
      renderBillingTable();
      renderAttendanceHistory();
    });
  });

  // Quick Check-In direct jump
  document.getElementById('quick-checkin-btn').addEventListener('click', () => {
    document.querySelector('.nav-item[data-tab="attendance"]').click();
  });
}

function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const update = () => {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString();
  };
  setInterval(update, 1000);
  update();
}

// --- RENDER FUNCTIONS ---
function renderDashboard() {
  runAutomatedStatusAudit();

  const members = getMembers();
  const attendance = getAttendance();
  const invoices = getInvoices();

  // Metrics
  document.getElementById('stat-total-members').innerText = members.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckins = attendance.filter(a => a.date === todayStr && a.status === 'Granted').length;
  document.getElementById('stat-today-checkins').innerText = todayCheckins;

  const expiringCount = members.filter(m => m.status === 'Expiring Soon' || m.status === 'Expired').length;
  document.getElementById('stat-expiring').innerText = expiringCount;

  const totalRev = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  document.getElementById('stat-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;

  // Recent Turnstile entries
  const dashBody = document.getElementById('dash-attendance-body');
  dashBody.innerHTML = '';
  attendance.slice(-5).reverse().forEach(row => {
    const badgeClass = row.status === 'Granted' ? 'tag-active' : 'tag-danger';
    dashBody.innerHTML += `
      <tr>
        <td><strong>${row.name}</strong> <small style="color:var(--text-muted)">(${row.memberId})</small></td>
        <td>${row.plan}</td>
        <td>${row.timestamp}</td>
        <td><span class="tag ${badgeClass}">${row.status}</span></td>
      </tr>
    `;
  });

  // Urgent Renewals List
  const urgentList = document.getElementById('urgent-renewals-list');
  urgentList.innerHTML = '';
  const urgentMembers = members.filter(m => m.status === 'Expiring Soon' || m.status === 'Expired');

  if (urgentMembers.length === 0) {
    urgentList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No memberships require immediate action.</p>';
  } else {
    urgentMembers.slice(0, 4).forEach(m => {
      const isExp = m.status === 'Expired';
      urgentList.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
          <div>
            <strong>${m.name}</strong>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Expires: ${m.expiryDate} (${m.plan})</p>
          </div>
          <button class="btn btn-sm ${isExp ? 'btn-primary' : 'btn-outline'}" onclick="openRenewalModal('${m.id}')">
            ${isExp ? 'Renew Now' : 'Send Reminder'}
          </button>
        </div>
      `;
    });
  }
}

function renderMembersTable(query = '') {
  runAutomatedStatusAudit();
  const members = getMembers();
  const tbody = document.getElementById('members-table-body');
  tbody.innerHTML = '';

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.id.toLowerCase().includes(query.toLowerCase()) ||
    m.phone.includes(query)
  );

  filtered.forEach(m => {
    let tagClass = 'tag-active';
    if (m.status === 'Expiring Soon') tagClass = 'tag-warning';
    if (m.status === 'Expired') tagClass = 'tag-danger';

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.id}</strong></td>
        <td>${m.name}</td>
        <td>${m.phone}</td>
        <td>${m.plan}</td>
        <td>${m.expiryDate}</td>
        <td><span class="tag ${tagClass}">${m.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openRenewalModal('${m.id}')">
            <i class="fa-solid fa-arrows-rotate"></i> Renew
          </button>
        </td>
      </tr>
    `;
  });
}

function renderAttendanceHistory() {
  const history = getAttendance();
  const tbody = document.getElementById('turnstile-history-body');
  tbody.innerHTML = '';

  history.slice(-8).reverse().forEach(h => {
    const tagClass = h.status === 'Granted' ? 'tag-active' : 'tag-danger';
    tbody.innerHTML += `
      <tr>
        <td>${h.timestamp}</td>
        <td>${h.memberId}</td>
        <td>${h.name}</td>
        <td><span class="tag ${tagClass}">${h.status}</span></td>
      </tr>
    `;
  });
}

function renderBillingTable() {
  const invoices = getInvoices();
  const tbody = document.getElementById('billing-table-body');
  tbody.innerHTML = '';

  invoices.slice().reverse().forEach(inv => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${inv.invoiceId}</strong></td>
        <td>${inv.memberName} <small>(${inv.memberId})</small></td>
        <td>${inv.plan}</td>
        <td>₹${Number(inv.amount).toLocaleString('en-IN')}</td>
        <td>${inv.paymentMethod}</td>
        <td>${inv.date}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewInvoice('${inv.invoiceId}')">
            <i class="fa-solid fa-file-invoice"></i> View
          </button>
        </td>
      </tr>
    `;
  });
}

// --- FORM ACTIONS ---

// Registration Form Submit
document.getElementById('member-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const planSelect = document.getElementById('reg-plan');
  const selectedOption = planSelect.options[planSelect.selectedIndex];
  
  const planName = selectedOption.value;
  const price = selectedOption.dataset.price;
  const durationMonths = selectedOption.dataset.duration;
  const paymentMethod = document.getElementById('reg-payment-method').value;

  let startDate = document.getElementById('reg-start-date').value;
  if (!startDate) {
    startDate = new Date().toISOString().split('T')[0];
  }

  const expiryDate = calculateExpiry(startDate, durationMonths);
  const memberId = generateMemberId();

  const newMember = {
    id: memberId,
    name,
    email,
    phone,
    plan: planName,
    startDate,
    expiryDate,
    status: 'Active'
  };

  const invoice = {
    invoiceId: generateInvoiceId(),
    memberId: memberId,
    memberName: name,
    plan: `${planName} (${durationMonths} Mo)`,
    amount: price,
    paymentMethod,
    date: startDate
  };

  // Persist
  const members = getMembers();
  members.push(newMember);
  saveMembers(members);

  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);

  showToast(`✅ Member ${name} registered successfully! Invoice generated.`);
  this.reset();
  document.getElementById('reg-start-date').value = new Date().toISOString().split('T')[0];

  // Switch to renewals to show member
  document.querySelector('.nav-item[data-tab="renewals"]').click();
});

// Turnstile Scanner Check-In Action
document.getElementById('turnstile-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const inputEl = document.getElementById('scan-member-id');
  const scanVal = inputEl.value.trim().toUpperCase();
  const feedbackEl = document.getElementById('scanner-feedback');

  runAutomatedStatusAudit();
  const members = getMembers();
  const member = members.find(m => m.id.toUpperCase() === scanVal || m.phone.includes(scanVal));

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nowDate = new Date().toISOString().split('T')[0];

  if (!member) {
    feedbackEl.className = 'scanner-feedback error';
    feedbackEl.innerHTML = `⚠️ Access Denied: No record found for ID/Phone "${scanVal}".`;
    return;
  }

  // Check validity
  if (member.status === 'Expired') {
    feedbackEl.className = 'scanner-feedback error';
    feedbackEl.innerHTML = `⛔ <strong>ACCESS DENIED: Membership Expired!</strong><br>${member.name} (${member.plan}) expired on ${member.expiryDate}. <br><a href="#" onclick="openRenewalModal('${member.id}')" style="color:var(--text-main); text-decoration: underline; font-weight:700;">Renew Now</a>`;

    logAttendance(member.id, member.name, member.plan, nowTime, nowDate, 'Denied (Expired)');
  } else {
    feedbackEl.className = 'scanner-feedback success';
    feedbackEl.innerHTML = `✅ <strong>ACCESS GRANTED: Turnstile Unlocked!</strong><br>Welcome, ${member.name}! Plan: ${member.plan} (Valid until ${member.expiryDate}).`;

    logAttendance(member.id, member.name, member.plan, nowTime, nowDate, 'Granted');
  }

  inputEl.value = '';
  inputEl.focus();
  renderAttendanceHistory();
});

function logAttendance(memberId, name, plan, time, date, status) {
  const attendance = getAttendance();
  attendance.push({
    id: 'ATT-' + Date.now(),
    memberId,
    name,
    plan,
    timestamp: time,
    date: date,
    status
  });
  saveAttendance(attendance);
}

// Search Filter
document.getElementById('member-search').addEventListener('input', function(e) {
  renderMembersTable(e.target.value);
});

// --- RENEWALS & INVOICES MODALS ---
window.openRenewalModal = function(memberId) {
  const members = getMembers();
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('renew-member-id').value = member.id;
  document.getElementById('renew-member-name').innerText = `${member.name} (${member.id})`;
  document.getElementById('renewal-modal').classList.add('active');
};

document.getElementById('close-renewal-modal').addEventListener('click', () => {
  document.getElementById('renewal-modal').classList.remove('active');
});
document.getElementById('cancel-renewal-btn').addEventListener('click', () => {
  document.getElementById('renewal-modal').classList.remove('active');
});

// Process Renewal
document.getElementById('renewal-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('renew-member-id').value;
  const select = document.getElementById('renew-plan-select');
  const option = select.options[select.selectedIndex];
  const plan = option.value;
  const price = option.dataset.price;
  const duration = option.dataset.duration;
  const paymentMethod = document.getElementById('renew-payment-method').value;

  const members = getMembers();
  const memberIndex = members.findIndex(m => m.id === id);

  if (memberIndex !== -1) {
    const member = members[memberIndex];
    // If expired, renew from today; if still active, append from current expiry
    const baseDate = new Date(member.expiryDate) < new Date() ? new Date().toISOString().split('T')[0] : member.expiryDate;
    
    member.expiryDate = calculateExpiry(baseDate, duration);
    member.plan = plan;
    member.status = 'Active';
    saveMembers(members);

    // Create Invoice
    const invoice = {
      invoiceId: generateInvoiceId(),
      memberId: member.id,
      memberName: member.name,
      plan: `Renewal: ${plan} (${duration} Mo)`,
      amount: price,
      paymentMethod,
      date: new Date().toISOString().split('T')[0]
    };

    const invoices = getInvoices();
    invoices.push(invoice);
    saveInvoices(invoices);

    showToast(`🎉 Membership renewed for ${member.name} until ${member.expiryDate}!`);
    document.getElementById('renewal-modal').classList.remove('active');
    renderMembersTable();
    renderDashboard();
  }
});

// View Printable Invoice Modal
window.viewInvoice = function(invId) {
  const invoices = getInvoices();
  const inv = invoices.find(i => i.invoiceId === invId);
  if (!inv) return;

  const box = document.getElementById('invoice-details-box');
  box.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <h2 style="color:var(--accent-primary);"><i class="fa-solid fa-dumbbell"></i> PulseFit Gym</h2>
      <p style="color:var(--text-muted); font-size: 0.85rem;">Automated Payment Receipt & Tax Invoice</p>
    </div>
    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between;">
      <div>
        <p><strong>Billed To:</strong> ${inv.memberName}</p>
        <p style="font-size: 0.85rem; color:var(--text-muted);">Member ID: ${inv.memberId}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>Invoice #:</strong> ${inv.invoiceId}</p>
        <p style="font-size: 0.85rem; color:var(--text-muted);">Date: ${inv.date}</p>
      </div>
    </div>
    <table style="width: 100%; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem;">
      <thead>
        <tr style="border-bottom: 1px solid var(--border-color);">
          <th style="padding: 6px 0;">Description</th>
          <th style="padding: 6px 0; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px 0;">${inv.plan} Subscription</td>
          <td style="padding: 10px 0; text-align: right;">₹${Number(inv.amount).toLocaleString('en-IN')}</td>
        </tr>
        <tr style="border-top: 1px solid var(--border-color); font-weight: bold;">
          <td style="padding: 10px 0;">Total Paid (${inv.paymentMethod})</td>
          <td style="padding: 10px 0; text-align: right; color: var(--accent-primary); font-size: 1.2rem;">₹${Number(inv.amount).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 0.75rem; text-align: center; color: var(--text-muted);">Auto-generated by PulseFit Billing Engine. Thank you for training with us!</p>
  `;

  document.getElementById('invoice-modal').classList.add('active');
};

document.getElementById('close-invoice-modal').addEventListener('click', () => {
  document.getElementById('invoice-modal').classList.remove('active');
});
document.getElementById('close-inv-btn').addEventListener('click', () => {
  document.getElementById('invoice-modal').classList.remove('active');
});

// --- INITIAL BOOTSTRAP ---
window.addEventListener('DOMContentLoaded', () => {
  initializeDatabase();
  initNavigation();
  initLiveClock();
  
  // Set default start date to today
  const regDateInput = document.getElementById('reg-start-date');
  if (regDateInput) {
    regDateInput.value = new Date().toISOString().split('T')[0];
  }

  renderDashboard();
});