// Supabase Initialization
const SUPABASE_URL = 'https://cmxbcoipovtqxbiddgoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteGJjb2lwb3Z0cXhiaWRkZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NDQxOTQsImV4cCI6MjEwNzAyMDE5NH0.eLxw8wu6moHSPXDTkXXHfEe3lOR8NrowtYJXh3ZWw8Y';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DATA STORE & STATE MANAGEMENT ---
let membersCache = [];
let attendanceCache = [];
let invoicesCache = [];
let appInitialized = false;

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
  return membersCache;
}
function saveMembers(data) {
  membersCache = data;
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data));
}
function getAttendance() {
  return attendanceCache;
}
function saveAttendance(data) {
  attendanceCache = data;
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
}
function getInvoices() {
  return invoicesCache;
}
function saveInvoices(data) {
  invoicesCache = data;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data));
}

function toMemberRecord(member) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    plan: member.plan,
    start_date: member.startDate || member.start_date,
    expiry_date: member.expiryDate || member.expiry_date,
    status: member.status
  };
}

function fromMemberRecord(member) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    plan: member.plan,
    startDate: member.start_date || member.startDate,
    expiryDate: member.expiry_date || member.expiryDate,
    status: member.status
  };
}

function toAttendanceRecord(row) {
  return {
    id: row.id,
    member_id: row.memberId || row.member_id,
    name: row.name,
    plan: row.plan,
    timestamp: row.timestamp,
    date: row.date,
    status: row.status
  };
}

function fromAttendanceRecord(row) {
  return {
    id: row.id,
    memberId: row.member_id || row.memberId,
    name: row.name,
    plan: row.plan,
    timestamp: row.timestamp,
    date: row.date,
    status: row.status
  };
}

function toInvoiceRecord(invoice) {
  return {
    invoice_id: invoice.invoiceId || invoice.invoice_id,
    member_id: invoice.memberId || invoice.member_id,
    member_name: invoice.memberName || invoice.member_name,
    plan: invoice.plan,
    amount: Number(invoice.amount),
    payment_method: invoice.paymentMethod || invoice.payment_method,
    date: invoice.date
  };
}

function fromInvoiceRecord(invoice) {
  return {
    invoiceId: invoice.invoice_id || invoice.invoiceId,
    memberId: invoice.member_id || invoice.memberId,
    memberName: invoice.member_name || invoice.memberName,
    plan: invoice.plan,
    amount: Number(invoice.amount),
    paymentMethod: invoice.payment_method || invoice.paymentMethod,
    date: invoice.date
  };
}

async function loadSupabaseData() {
  const [membersResult, attendanceResult, invoicesResult] = await Promise.all([
    _supabase.from('members').select('*'),
    _supabase.from('attendance').select('*'),
    _supabase.from('invoices').select('*')
  ]);

  const results = [membersResult, attendanceResult, invoicesResult];
  const failed = results.find(result => result.error);
  if (failed) throw failed.error;

  let remoteMembers = membersResult.data.map(fromMemberRecord);
  let remoteAttendance = attendanceResult.data.map(fromAttendanceRecord);
  let remoteInvoices = invoicesResult.data.map(fromInvoiceRecord);

  if (remoteMembers.length === 0) {
    const localMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    const { data, error } = await _supabase.from('members').insert(localMembers.map(toMemberRecord)).select('*');
    if (error) throw error;
    remoteMembers = data.map(fromMemberRecord);
  }

  if (remoteAttendance.length === 0) {
    const localAttendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const { data, error } = await _supabase.from('attendance').insert(localAttendance.map(toAttendanceRecord)).select('*');
    if (error) throw error;
    remoteAttendance = data.map(fromAttendanceRecord);
  }

  if (remoteInvoices.length === 0) {
    const localInvoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
    const { data, error } = await _supabase.from('invoices').insert(localInvoices.map(toInvoiceRecord)).select('*');
    if (error) throw error;
    remoteInvoices = data.map(fromInvoiceRecord);
  }

  saveMembers(remoteMembers);
  saveAttendance(remoteAttendance);
  saveInvoices(remoteInvoices);
}

// --- AUTOMATION ENGINE ---
// Re-computes membership status dynamically (Active, Expiring Soon, Expired)
async function runAutomatedStatusAudit() {
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
    for (const member of members) {
      const { error } = await _supabase
        .from('members')
        .update({ status: member.status })
        .eq('id', member.id);
      if (error) throw error;
    }
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
    btn.addEventListener('click', async () => {
      const target = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`view-${target}`).classList.add('active');

      viewTitle.innerText = titles[target].title;
      viewSubtitle.innerText = titles[target].sub;

      try {
        await renderDashboard();
        await renderMembersTable();
        renderBillingTable();
        renderAttendanceHistory();
      } catch (error) {
        console.error('Could not refresh the app from Supabase:', error);
        showToast(`❌ Could not refresh data: ${error.message}`);
      }
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
async function renderDashboard() {
  await runAutomatedStatusAudit();

  const members = await getMembers();
  const attendance = await getAttendance();
  const invoices = await getInvoices();

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

async function renderMembersTable(query = '') {
  await runAutomatedStatusAudit();
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
document.getElementById('member-form').addEventListener('submit', async function(e) {
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

  try {
    const { data: savedMembers, error: memberError } = await _supabase
      .from('members')
      .insert([toMemberRecord(newMember)])
      .select('*');
    if (memberError) throw memberError;

    const { data: savedInvoices, error: invoiceError } = await _supabase
      .from('invoices')
      .insert([toInvoiceRecord(invoice)])
      .select('*');
    if (invoiceError) {
      console.error('Member registration succeeded, but invoice creation failed:', invoiceError);
      membersCache.push(fromMemberRecord(savedMembers[0]));
      saveMembers(membersCache);
      showToast('⚠️ Member was registered, but invoice creation failed.');
      return;
    }

    membersCache.push(fromMemberRecord(savedMembers[0]));
    invoicesCache.push(fromInvoiceRecord(savedInvoices[0]));
    saveMembers(membersCache);
    saveInvoices(invoicesCache);
  } catch (error) {
    console.error('Member registration failed:', error);
    showToast(`❌ Could not register member: ${error.message}`);
    return;
  }

  showToast(`✅ Member ${name} registered successfully! Invoice generated.`);
  this.reset();
  document.getElementById('reg-start-date').value = new Date().toISOString().split('T')[0];

  // Switch to renewals to show member
  document.querySelector('.nav-item[data-tab="renewals"]').click();
});

// Turnstile Scanner Check-In Action
document.getElementById('turnstile-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const inputEl = document.getElementById('scan-member-id');
  const scanVal = inputEl.value.trim().toUpperCase();
  const feedbackEl = document.getElementById('scanner-feedback');

  let member;
  try {
    await runAutomatedStatusAudit();
    const members = getMembers();
    member = members.find(m => m.id.toUpperCase() === scanVal || m.phone.includes(scanVal));
  } catch (error) {
    console.error('Could not check membership status:', error);
    feedbackEl.className = 'scanner-feedback error';
    feedbackEl.textContent = 'Could not check membership. Verify the Supabase connection and try again.';
    return;
  }

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

    try {
      await logAttendance(member.id, member.name, member.plan, nowTime, nowDate, 'Denied (Expired)');
    } catch (error) {
      console.error('Could not record denied attendance:', error);
      showToast(`❌ Could not save attendance: ${error.message}`);
      return;
    }
  } else {
    feedbackEl.className = 'scanner-feedback success';
    feedbackEl.innerHTML = `✅ <strong>ACCESS GRANTED: Turnstile Unlocked!</strong><br>Welcome, ${member.name}! Plan: ${member.plan} (Valid until ${member.expiryDate}).`;

    try {
      await logAttendance(member.id, member.name, member.plan, nowTime, nowDate, 'Granted');
    } catch (error) {
      console.error('Could not record attendance:', error);
      showToast(`❌ Could not save attendance: ${error.message}`);
      return;
    }
  }

  inputEl.value = '';
  inputEl.focus();
  renderAttendanceHistory();
});

async function logAttendance(memberId, name, plan, time, date, status) {
  const entry = {
    id: 'ATT-' + Date.now(),
    memberId,
    name,
    plan,
    timestamp: time,
    date: date,
    status
  };
  const { data, error } = await _supabase
    .from('attendance')
    .insert([toAttendanceRecord(entry)])
    .select('*');
  if (error) {
    console.error('Attendance could not be saved to Supabase:', error);
    throw error;
  }
  attendanceCache.push(fromAttendanceRecord(data[0]));
  saveAttendance(attendanceCache);
}

// Search Filter
document.getElementById('member-search').addEventListener('input', async function(e) {
  try {
    await renderMembersTable(e.target.value);
  } catch (error) {
    console.error('Could not refresh member list:', error);
    showToast(`❌ Could not load members: ${error.message}`);
  }
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
document.getElementById('renewal-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('renew-member-id').value;
  const select = document.getElementById('renew-plan-select');
  const option = select.options[select.selectedIndex];
  const plan = option.value;
  const price = Number(option.dataset.price);
  const duration = option.dataset.duration;
  const paymentMethod = document.getElementById('renew-payment-method').value;

  const members = getMembers();
  const member = members.find(m => m.id === id);

  if (!member) {
    showToast('❌ Member not found. Please refresh and try again.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const baseDate = new Date(member.expiryDate) < new Date() ? today : member.expiryDate;
  const newExpiryDate = calculateExpiry(baseDate, duration);
  const invoice = {
    invoice_id: generateInvoiceId(),
    member_id: member.id,
    member_name: member.name,
    plan: `Renewal: ${plan} (${duration} Mo)`,
    amount: price,
    payment_method: paymentMethod,
    date: today
  };

  try {
    const { data: updatedMembers, error: updateError } = await _supabase
      .from('members')
      .update({ plan, expiry_date: newExpiryDate, status: 'Active' })
      .eq('id', id)
      .select('id');

    if (updateError) throw updateError;
    if (!updatedMembers || updatedMembers.length === 0) {
      showToast('❌ Member was not found in Supabase.');
      return;
    }

    const { error: invoiceError } = await _supabase
      .from('invoices')
      .insert([invoice]);

    if (invoiceError) {
      console.error('Membership renewal succeeded, but invoice creation failed:', invoiceError);
      showToast('⚠️ Membership renewed, but invoice creation failed. Please contact support.');
      member.plan = plan;
      member.expiryDate = newExpiryDate;
      member.status = 'Active';
      saveMembers(members);
      await renderMembersTable();
      await renderDashboard();
      return;
    }

    member.plan = plan;
    member.expiryDate = newExpiryDate;
    member.status = 'Active';
    saveMembers(members);

    const invoices = getInvoices();
    invoices.push({
      invoiceId: invoice.invoice_id,
      memberId: invoice.member_id,
      memberName: invoice.member_name,
      plan: invoice.plan,
      amount: invoice.amount,
      paymentMethod: invoice.payment_method,
      date: invoice.date
    });
    saveInvoices(invoices);

    showToast(`🎉 Membership renewed for ${member.name} until ${newExpiryDate}!`);
    document.getElementById('renewal-modal').classList.remove('active');
    await renderMembersTable();
    renderBillingTable();
    await renderDashboard();
  } catch (error) {
    console.error('Renewal request failed:', error);
    showToast('❌ Could not process renewal. Check your Supabase connection and try again.');
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
async function startAuthenticatedApp() {
  const gate = document.getElementById('auth-gate');
  const app = document.querySelector('.app-layout');
  const { data, error: sessionError } = await _supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session) throw new Error('Please sign in to access PulseFit.');

  gate.hidden = true;
  app.hidden = false;
  if (!appInitialized) {
    initializeDatabase();
    initNavigation();
    initLiveClock();
    appInitialized = true;
  }
  
  // Set default start date to today
  const regDateInput = document.getElementById('reg-start-date');
  if (regDateInput) {
    regDateInput.value = new Date().toISOString().split('T')[0];
  }

  try {
    await loadSupabaseData();
    await renderDashboard();
    await renderMembersTable();
    renderBillingTable();
    renderAttendanceHistory();
    console.log('Connected to Supabase and loaded PulseFit data.');
  } catch (error) {
    console.error('Could not initialize PulseFit data from Supabase:', error);
    showToast(`❌ Supabase setup failed: ${error.message}`);
  }
}

document.getElementById('auth-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const button = document.getElementById('auth-submit');
  const errorText = document.getElementById('auth-error');
  button.disabled = true;
  errorText.textContent = '';

  try {
    const { error } = await _supabase.auth.signInWithPassword({
      email: document.getElementById('auth-email').value.trim(),
      password: document.getElementById('auth-password').value
    });
    if (error) throw error;
    await startAuthenticatedApp();
  } catch (error) {
    console.error('PulseFit sign-in failed:', error);
    errorText.textContent = error.message || 'Sign-in failed. Check your credentials and try again.';
  } finally {
    button.disabled = false;
  }
});

document.getElementById('sign-out-btn').addEventListener('click', async () => {
  const { error } = await _supabase.auth.signOut();
  if (error) {
    console.error('PulseFit sign-out failed:', error);
    showToast(`❌ Could not sign out: ${error.message}`);
    return;
  }
  membersCache = [];
  attendanceCache = [];
  invoicesCache = [];
  document.querySelector('.app-layout').hidden = true;
  document.getElementById('auth-gate').hidden = false;
});

window.addEventListener('DOMContentLoaded', async () => {
  const { data, error } = await _supabase.auth.getSession();
  if (error) {
    console.error('Could not check PulseFit sign-in state:', error);
    document.getElementById('auth-error').textContent = error.message;
    return;
  }
  if (data.session) {
    try {
      await startAuthenticatedApp();
    } catch (startError) {
      console.error('Could not start PulseFit:', startError);
      document.getElementById('auth-error').textContent = startError.message;
    }
  }
});