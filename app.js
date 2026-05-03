/* ============================================================
   DocForge - Professional Document Generator
   ============================================================ */

// ── State ──
let currentDocType = 'invoice';
let currentView = 'simple';
let zoomFactor = 1;
let logoDataURL = '';
let lineItems = [];
let lineItemIdCounter = 0;

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('doc-date').value = today;

  const due = new Date();
  due.setDate(due.getDate() + 30);
  document.getElementById('doc-due-date').value = due.toISOString().split('T')[0];

  addLineItem();
  addLineItem();
  updatePreview();
});

// ── View Switching ──
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.toggle-btn[data-view="${view}"]`).classList.add('active');

  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');

  if (view === 'advanced') {
    loadCurrentToEditor();
    updateAdvancedPreview();
  }
}

// ── Document Type ──
function selectDocType(type) {
  currentDocType = type;
  document.querySelectorAll('.doc-type-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.doc-type-card[data-type="${type}"]`).classList.add('active');

  const utilityFields = document.getElementById('utility-fields');
  const lineItemsSection = document.getElementById('line-items-section');
  const numberLabel = document.getElementById('doc-number-label');

  if (type === 'utility') {
    utilityFields.style.display = 'block';
    lineItemsSection.style.display = 'none';
    numberLabel.textContent = 'Bill #';
  } else {
    utilityFields.style.display = 'none';
    lineItemsSection.style.display = 'block';
    const labels = {
      invoice: 'Invoice #', receipt: 'Receipt #', quote: 'Quote #',
      statement: 'Statement #', delivery: 'Delivery Note #'
    };
    numberLabel.textContent = labels[type] || 'Document #';
  }
  updatePreview();
}

// ── Logo Upload ──
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    logoDataURL = e.target.result;
    const preview = document.getElementById('logo-preview');
    const placeholder = document.getElementById('logo-placeholder');
    preview.src = logoDataURL;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    updatePreview();
  };
  reader.readAsDataURL(file);
}

// ── Line Items ──
function addLineItem() {
  const id = lineItemIdCounter++;
  lineItems.push({ id, description: '', qty: 1, price: 0 });
  renderLineItems();
}

function removeLineItem(id) {
  lineItems = lineItems.filter(item => item.id !== id);
  renderLineItems();
  updatePreview();
}

function renderLineItems() {
  const container = document.getElementById('line-items-container');
  container.innerHTML = `
    <div class="line-item-header">
      <span>Description</span><span>Qty</span><span>Unit Price</span><span>Total</span><span></span>
    </div>
  `;
  lineItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'line-item';
    row.innerHTML = `
      <input type="text" placeholder="Item description" value="${escapeAttr(item.description)}"
        oninput="updateLineItem(${item.id}, 'description', this.value)" />
      <input type="number" min="0" step="1" value="${item.qty}"
        oninput="updateLineItem(${item.id}, 'qty', this.value)" />
      <input type="number" min="0" step="0.01" value="${item.price}"
        oninput="updateLineItem(${item.id}, 'price', this.value)" />
      <input type="text" value="${(item.qty * item.price).toFixed(2)}" readonly
        style="background:#1e293b; color:#94a3b8;" />
      <button class="btn-danger" onclick="removeLineItem(${item.id})" title="Remove">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    container.appendChild(row);
  });
}

function updateLineItem(id, field, value) {
  const item = lineItems.find(i => i.id === id);
  if (!item) return;
  if (field === 'description') item.description = value;
  else item[field] = parseFloat(value) || 0;
  renderLineItems();
  updatePreview();
}

// ── Helpers ──
function val(id) { return document.getElementById(id)?.value || ''; }
function escapeAttr(s) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function escapeHTML(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Build Document HTML ──
function buildDocumentHTML() {
  const currency = val('doc-currency');
  const primaryColor = val('primary-color');
  const accentColor = val('accent-color');
  const fontFamily = val('font-family');
  const fontSize = val('font-size');

  const companyName = escapeHTML(val('company-name'));
  const companyAddr = escapeHTML(val('company-address'));
  const companyCity = escapeHTML(val('company-city'));
  const companyState = escapeHTML(val('company-state'));
  const companyZip = escapeHTML(val('company-zip'));
  const companyCountry = escapeHTML(val('company-country'));
  const companyEmail = escapeHTML(val('company-email'));
  const companyPhone = escapeHTML(val('company-phone'));
  const companyTax = escapeHTML(val('company-tax'));

  const clientName = escapeHTML(val('client-name'));
  const clientAddr = escapeHTML(val('client-address'));
  const clientCity = escapeHTML(val('client-city'));
  const clientCountry = escapeHTML(val('client-country'));
  const clientEmail = escapeHTML(val('client-email'));
  const clientAccount = escapeHTML(val('client-account'));

  const docNumber = escapeHTML(val('doc-number'));
  const docDate = formatDate(val('doc-date'));
  const docDueDate = formatDate(val('doc-due-date'));
  const taxRate = parseFloat(val('tax-rate')) || 0;
  const discountRate = parseFloat(val('discount-rate')) || 0;
  const notes = escapeHTML(val('doc-notes'));
  const terms = escapeHTML(val('doc-terms'));
  const bankName = escapeHTML(val('bank-name'));
  const bankAccount = escapeHTML(val('bank-account'));
  const bankRouting = escapeHTML(val('bank-routing'));
  const paymentMethods = escapeHTML(val('payment-methods'));

  const typeLabels = {
    invoice: 'INVOICE', utility: 'UTILITY BILL', receipt: 'RECEIPT',
    quote: 'QUOTATION', statement: 'STATEMENT', delivery: 'DELIVERY NOTE'
  };
  const docTitle = typeLabels[currentDocType] || 'DOCUMENT';

  const companyCityLine = [companyCity, companyState, companyZip].filter(Boolean).join(', ');
  const clientCityLine = [clientCity, clientCountry].filter(Boolean).join(', ');

  let logoHTML = '';
  if (logoDataURL) {
    logoHTML = `<img src="${logoDataURL}" style="max-height:70px; max-width:180px; object-fit:contain;" />`;
  }

  let bodyContent = '';

  if (currentDocType === 'utility') {
    bodyContent = buildUtilityBody(currency, taxRate, discountRate);
  } else {
    bodyContent = buildLineItemsBody(currency, taxRate, discountRate);
  }

  let paymentHTML = '';
  if (bankName || bankAccount || paymentMethods) {
    paymentHTML = `
      <div style="margin-top:24px; padding:14px 18px; background:#f0f4ff; border-radius:6px; border-left:4px solid ${primaryColor};">
        <div style="font-weight:600; font-size:0.85em; color:${primaryColor}; margin-bottom:8px;">PAYMENT INFORMATION</div>
        ${bankName ? `<div style="font-size:0.82em; color:#374151;"><strong>Bank:</strong> ${bankName}</div>` : ''}
        ${bankAccount ? `<div style="font-size:0.82em; color:#374151;"><strong>Account:</strong> ${bankAccount}</div>` : ''}
        ${bankRouting ? `<div style="font-size:0.82em; color:#374151;"><strong>Routing:</strong> ${bankRouting}</div>` : ''}
        ${paymentMethods ? `<div style="font-size:0.82em; color:#374151; margin-top:4px;"><strong>Accepted:</strong> ${paymentMethods}</div>` : ''}
      </div>
    `;
  }

  let notesHTML = '';
  if (notes) {
    notesHTML = `<div style="margin-top:20px; padding:12px 16px; background:#fafafa; border-radius:6px; border:1px solid #e5e7eb;">
      <div style="font-weight:600; font-size:0.8em; color:#6b7280; margin-bottom:4px;">NOTES</div>
      <div style="font-size:0.85em; color:#374151; white-space:pre-wrap;">${notes}</div>
    </div>`;
  }
  let termsHTML = '';
  if (terms) {
    termsHTML = `<div style="margin-top:12px; padding:12px 16px; background:#fafafa; border-radius:6px; border:1px solid #e5e7eb;">
      <div style="font-weight:600; font-size:0.8em; color:#6b7280; margin-bottom:4px;">TERMS & CONDITIONS</div>
      <div style="font-size:0.82em; color:#6b7280; white-space:pre-wrap;">${terms}</div>
    </div>`;
  }

  return `
<div style="font-family:${fontFamily}; font-size:${fontSize}; color:#1f2937; padding:40px; line-height:1.5;">
  <!-- Header -->
  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid ${primaryColor};">
    <div>
      ${logoHTML}
      <div style="font-size:1.3em; font-weight:700; color:${primaryColor}; margin-top:${logoDataURL ? '10px' : '0'};">${companyName || 'Your Company'}</div>
      ${companyAddr ? `<div style="font-size:0.85em; color:#6b7280; margin-top:4px;">${companyAddr}</div>` : ''}
      ${companyCityLine ? `<div style="font-size:0.85em; color:#6b7280;">${companyCityLine}</div>` : ''}
      ${companyCountry ? `<div style="font-size:0.85em; color:#6b7280;">${companyCountry}</div>` : ''}
      ${companyEmail ? `<div style="font-size:0.82em; color:#6b7280; margin-top:6px;"><span style="color:${primaryColor};">&#9993;</span> ${companyEmail}</div>` : ''}
      ${companyPhone ? `<div style="font-size:0.82em; color:#6b7280;"><span style="color:${primaryColor};">&#9742;</span> ${companyPhone}</div>` : ''}
      ${companyTax ? `<div style="font-size:0.82em; color:#6b7280;">Tax ID: ${companyTax}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:2em; font-weight:800; color:${primaryColor}; letter-spacing:2px;">${docTitle}</div>
      ${docNumber ? `<div style="font-size:0.95em; color:#374151; margin-top:6px;"><strong>${docNumber}</strong></div>` : ''}
      ${docDate ? `<div style="font-size:0.85em; color:#6b7280; margin-top:4px;">Date: ${docDate}</div>` : ''}
      ${docDueDate ? `<div style="font-size:0.85em; color:#6b7280;">${currentDocType === 'utility' ? 'Due' : 'Due'}: ${docDueDate}</div>` : ''}
    </div>
  </div>

  <!-- Bill To -->
  <div style="display:flex; gap:40px; margin-bottom:28px;">
    <div style="flex:1; padding:16px 20px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
      <div style="font-weight:600; font-size:0.8em; color:${primaryColor}; text-transform:uppercase; margin-bottom:8px;">Bill To</div>
      <div style="font-weight:600; font-size:1em;">${clientName || 'Client Name'}</div>
      ${clientAddr ? `<div style="font-size:0.85em; color:#6b7280; margin-top:2px;">${clientAddr}</div>` : ''}
      ${clientCityLine ? `<div style="font-size:0.85em; color:#6b7280;">${clientCityLine}</div>` : ''}
      ${clientEmail ? `<div style="font-size:0.82em; color:#6b7280; margin-top:4px;">${clientEmail}</div>` : ''}
      ${clientAccount ? `<div style="font-size:0.82em; color:#6b7280;">Ref: ${clientAccount}</div>` : ''}
    </div>
  </div>

  <!-- Body -->
  ${bodyContent}

  <!-- Payment Info -->
  ${paymentHTML}

  <!-- Notes & Terms -->
  ${notesHTML}
  ${termsHTML}

  <!-- Footer -->
  <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; text-align:center; font-size:0.78em; color:#9ca3af;">
    Thank you for your business &mdash; ${companyName || 'Your Company'}
  </div>
</div>
  `;
}

// ── Build Line Items Table ──
function buildLineItemsBody(currency, taxRate, discountRate) {
  const primaryColor = val('primary-color');
  let subtotal = 0;
  let rows = '';

  lineItems.forEach((item, i) => {
    const total = item.qty * item.price;
    subtotal += total;
    rows += `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 12px; font-size:0.88em;">${i + 1}</td>
        <td style="padding:10px 12px; font-size:0.88em;">${escapeHTML(item.description) || '—'}</td>
        <td style="padding:10px 12px; text-align:center; font-size:0.88em;">${item.qty}</td>
        <td style="padding:10px 12px; text-align:right; font-size:0.88em;">${currency}${item.price.toFixed(2)}</td>
        <td style="padding:10px 12px; text-align:right; font-weight:600; font-size:0.88em;">${currency}${total.toFixed(2)}</td>
      </tr>
    `;
  });

  const discountAmt = subtotal * (discountRate / 100);
  const taxableAmt = subtotal - discountAmt;
  const taxAmt = taxableAmt * (taxRate / 100);
  const grandTotal = taxableAmt + taxAmt;

  return `
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      <thead>
        <tr style="background:${primaryColor}; color:#fff;">
          <th style="padding:10px 12px; text-align:left; font-size:0.8em; font-weight:600; width:40px;">#</th>
          <th style="padding:10px 12px; text-align:left; font-size:0.8em; font-weight:600;">Description</th>
          <th style="padding:10px 12px; text-align:center; font-size:0.8em; font-weight:600; width:60px;">Qty</th>
          <th style="padding:10px 12px; text-align:right; font-size:0.8em; font-weight:600; width:100px;">Price</th>
          <th style="padding:10px 12px; text-align:right; font-size:0.8em; font-weight:600; width:100px;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex; justify-content:flex-end;">
      <div style="width:260px;">
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#6b7280;">
          <span>Subtotal</span><span>${currency}${subtotal.toFixed(2)}</span>
        </div>
        ${discountRate > 0 ? `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#ef4444;">
          <span>Discount (${discountRate}%)</span><span>-${currency}${discountAmt.toFixed(2)}</span>
        </div>` : ''}
        ${taxRate > 0 ? `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#6b7280;">
          <span>Tax (${taxRate}%)</span><span>${currency}${taxAmt.toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; padding:10px 0; font-size:1.1em; font-weight:700; border-top:2px solid ${primaryColor}; color:${primaryColor}; margin-top:4px;">
          <span>Total</span><span>${currency}${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Build Utility Bill Body ──
function buildUtilityBody(currency, taxRate, discountRate) {
  const primaryColor = val('primary-color');
  const utilityType = val('utility-type');
  const meterNumber = escapeHTML(val('meter-number'));
  const prevReading = parseFloat(val('prev-reading')) || 0;
  const currReading = parseFloat(val('curr-reading')) || 0;
  const ratePerUnit = parseFloat(val('rate-per-unit')) || 0;
  const unit = escapeHTML(val('utility-unit')) || 'units';

  const consumption = currReading - prevReading;
  const subtotal = consumption * ratePerUnit;
  const discountAmt = subtotal * (discountRate / 100);
  const taxableAmt = subtotal - discountAmt;
  const taxAmt = taxableAmt * (taxRate / 100);
  const grandTotal = taxableAmt + taxAmt;

  return `
    <div style="padding:16px 20px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:20px;">
      <div style="font-weight:600; font-size:0.85em; color:${primaryColor}; margin-bottom:10px;">${utilityType.toUpperCase()} SERVICE DETAILS</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        ${meterNumber ? `<div style="font-size:0.85em;"><strong>Meter #:</strong> ${meterNumber}</div>` : ''}
        <div style="font-size:0.85em;"><strong>Service:</strong> ${utilityType}</div>
        <div style="font-size:0.85em;"><strong>Previous Reading:</strong> ${prevReading.toLocaleString()} ${unit}</div>
        <div style="font-size:0.85em;"><strong>Current Reading:</strong> ${currReading.toLocaleString()} ${unit}</div>
        <div style="font-size:0.85em;"><strong>Consumption:</strong> ${consumption.toLocaleString()} ${unit}</div>
        <div style="font-size:0.85em;"><strong>Rate:</strong> ${currency}${ratePerUnit.toFixed(4)} / ${unit}</div>
      </div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      <thead>
        <tr style="background:${primaryColor}; color:#fff;">
          <th style="padding:10px 12px; text-align:left; font-size:0.8em; font-weight:600;">Description</th>
          <th style="padding:10px 12px; text-align:center; font-size:0.8em; font-weight:600;">Usage</th>
          <th style="padding:10px 12px; text-align:right; font-size:0.8em; font-weight:600;">Rate</th>
          <th style="padding:10px 12px; text-align:right; font-size:0.8em; font-weight:600;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 12px; font-size:0.88em;">${utilityType} Charges</td>
          <td style="padding:10px 12px; text-align:center; font-size:0.88em;">${consumption.toLocaleString()} ${unit}</td>
          <td style="padding:10px 12px; text-align:right; font-size:0.88em;">${currency}${ratePerUnit.toFixed(4)}</td>
          <td style="padding:10px 12px; text-align:right; font-weight:600; font-size:0.88em;">${currency}${subtotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex; justify-content:flex-end;">
      <div style="width:260px;">
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#6b7280;">
          <span>Subtotal</span><span>${currency}${subtotal.toFixed(2)}</span>
        </div>
        ${discountRate > 0 ? `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#ef4444;">
          <span>Discount (${discountRate}%)</span><span>-${currency}${discountAmt.toFixed(2)}</span>
        </div>` : ''}
        ${taxRate > 0 ? `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88em; color:#6b7280;">
          <span>Tax (${taxRate}%)</span><span>${currency}${taxAmt.toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; padding:10px 0; font-size:1.1em; font-weight:700; border-top:2px solid ${primaryColor}; color:${primaryColor}; margin-top:4px;">
          <span>Total Due</span><span>${currency}${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Update Preview ──
function updatePreview() {
  const html = buildDocumentHTML();
  document.getElementById('document-preview').innerHTML = html;
}

// ── Zoom ──
function zoomPreview(delta) {
  zoomFactor = Math.max(0.5, Math.min(1.5, zoomFactor + delta));
  document.getElementById('preview-page').style.transform = `scale(${zoomFactor})`;
  document.getElementById('zoom-level').textContent = Math.round(zoomFactor * 100) + '%';
}

// ── Reset ──
function resetForm() {
  document.querySelectorAll('.form-panel input[type="text"], .form-panel input[type="email"], .form-panel input[type="number"], .form-panel textarea').forEach(el => {
    if (el.type === 'number' && (el.id === 'tax-rate' || el.id === 'discount-rate')) {
      el.value = 0;
    } else {
      el.value = '';
    }
  });
  logoDataURL = '';
  document.getElementById('logo-preview').style.display = 'none';
  document.getElementById('logo-placeholder').style.display = 'flex';
  lineItems = [];
  lineItemIdCounter = 0;
  addLineItem();
  addLineItem();

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('doc-date').value = today;
  const due = new Date();
  due.setDate(due.getDate() + 30);
  document.getElementById('doc-due-date').value = due.toISOString().split('T')[0];

  updatePreview();
  showToast('Form reset successfully');
}

// ── Advanced View Editor ──
function switchEditorTab(tab) {
  document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.editor-tab[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.code-editor').forEach(e => e.classList.remove('active'));
  document.getElementById(`${tab}-editor`).classList.add('active');
}

function loadCurrentToEditor() {
  const html = buildDocumentHTML();
  document.getElementById('html-editor').value = html;
  document.getElementById('css-editor').value = getDefaultCSS();
  updateAdvancedPreview();
  showToast('Loaded current document into editor');
}

function resetEditorToTemplate() {
  document.getElementById('html-editor').value = getTemplateHTML();
  document.getElementById('css-editor').value = getDefaultCSS();
  updateAdvancedPreview();
  showToast('Editor reset to template');
}

function updateAdvancedPreview() {
  const html = document.getElementById('html-editor').value;
  const css = document.getElementById('css-editor').value;
  const preview = document.getElementById('advanced-document-preview');
  preview.innerHTML = `<style>${css}</style>${html}`;
}

function applyAdvancedChanges() {
  updateAdvancedPreview();
  showToast('Changes applied to preview');
}

function getDefaultCSS() {
  return `/* Custom styles for the document */
/* Edit these to change the document appearance */

.doc-table {
  width: 100%;
  border-collapse: collapse;
}
.doc-table th {
  background: #2563eb;
  color: #fff;
  padding: 10px 12px;
  text-align: left;
  font-size: 0.8em;
}
.doc-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.88em;
}
.doc-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 20px;
  margin-bottom: 24px;
}
.doc-total {
  font-size: 1.2em;
  font-weight: 700;
  color: #2563eb;
}`;
}

function getTemplateHTML() {
  return `<div style="font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937;">
  <!-- HEADER -->
  <div class="doc-header">
    <div>
      <h1 style="color: #2563eb; margin: 0;">Your Company</h1>
      <p style="color: #6b7280; margin: 4px 0;">123 Business St</p>
      <p style="color: #6b7280; margin: 0;">New York, NY 10001</p>
    </div>
    <div style="text-align: right;">
      <h2 style="color: #2563eb; letter-spacing: 2px; margin: 0;">INVOICE</h2>
      <p style="margin: 4px 0;">INV-0001</p>
      <p style="color: #6b7280; margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <!-- BILL TO -->
  <div style="background: #f8fafc; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
    <strong style="color: #2563eb; font-size: 0.8em;">BILL TO</strong>
    <p style="margin: 8px 0 0; font-weight: 600;">Client Name</p>
    <p style="margin: 2px 0; color: #6b7280;">456 Client Ave, Los Angeles</p>
  </div>

  <!-- TABLE -->
  <table class="doc-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Web Development Services</td>
        <td style="text-align:center;">10</td>
        <td style="text-align:right;">$100.00</td>
        <td style="text-align:right; font-weight:600;">$1,000.00</td>
      </tr>
      <tr>
        <td>2</td>
        <td>UI/UX Design</td>
        <td style="text-align:center;">5</td>
        <td style="text-align:right;">$80.00</td>
        <td style="text-align:right; font-weight:600;">$400.00</td>
      </tr>
    </tbody>
  </table>

  <!-- TOTALS -->
  <div style="display:flex; justify-content:flex-end; margin-top:16px;">
    <div style="width:240px;">
      <div style="display:flex; justify-content:space-between; padding:6px 0; color:#6b7280;">
        <span>Subtotal</span><span>$1,400.00</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; color:#6b7280;">
        <span>Tax (10%)</span><span>$140.00</span>
      </div>
      <div class="doc-total" style="display:flex; justify-content:space-between; padding:10px 0; border-top:2px solid #2563eb; margin-top:4px;">
        <span>Total</span><span>$1,540.00</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:32px; text-align:center; color:#9ca3af; font-size:0.8em; border-top:1px solid #e5e7eb; padding-top:16px;">
    Thank you for your business!
  </div>
</div>`;
}

// ── PDF Generation ──
function generatePDF() {
  showToast('Generating PDF...');

  let element;
  if (currentView === 'advanced') {
    element = document.getElementById('advanced-document-preview');
  } else {
    element = document.getElementById('document-preview');
  }

  const opt = {
    margin: 0,
    filename: `${currentDocType}-${val('doc-number') || 'document'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    showToast('PDF downloaded successfully!');
  }).catch(err => {
    showToast('PDF generation failed: ' + err.message, true);
  });
}

// ── Toast ──
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}
