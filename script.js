const form = document.getElementById('stock-form');
const tableBody = document.querySelector('#stock-table tbody');
const productSelect = document.getElementById('product-select');
const productOther = document.getElementById('product-other');
const toast = document.getElementById('toast');

// Replace with your SheetDB API URL
const SCRIPT_URL = 'https://sheetdb.io/api/v1/vqe73unkshywj';

// Show/hide "Other" product input
productSelect.addEventListener('change', () => {
  if (productSelect.value === 'Other') {
    productOther.style.display = 'block';
    productOther.required = true;
  } else {
    productOther.style.display = 'none';
    productOther.required = false;
    productOther.value = '';
  }
});

// Generate a unique ID (timestamp string)
function generateUniqueId() {
  return Date.now().toString();
}

// Load existing entries on page load
async function loadEntries() {
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error('Failed to fetch entries');
    const data = await response.json();

    // Clear current table
    tableBody.innerHTML = '';

    data.forEach(entry => {
      // Use 'id' field if present, fallback to _id or timestamp
      const rowId = entry.id || entry._id || generateUniqueId();
      addRow(entry.date, entry.branch, entry.product, entry.quantity, rowId);
    });
  } catch (error) {
    console.error(error);
  }
}

// Add a row to the table
function addRow(date, branch, product, quantity, rowId) {
  const row = tableBody.insertRow();

  row.innerHTML = `
    <td data-label="Date">${date}</td>
    <td data-label="Branch">${branch}</td>
    <td data-label="Product">${product}</td>
    <td data-label="Quantity">${quantity}</td>
    <td data-label="Action"><button class="btn-delete" aria-label="Delete entry">🗑️ Delete</button></td>
  `;

  row.dataset.rowId = rowId;

  row.querySelector('.btn-delete').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      // Delete by filtering with id column
      const deleteUrl = `${SCRIPT_URL}?id=${encodeURIComponent(rowId)}`;
      const res = await fetch(deleteUrl, { method: 'DELETE' });

      if (res.ok) {
        row.remove();
        showToast('🗑️ Entry deleted.');
      } else {
        alert('Failed to delete entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting entry.');
    }
  });
}

// Show toast notification
function showToast(message) {
  toast.innerText = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Handle form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let date = form.date.value;
  let branch = form.branch.value.trim();
  let quantity = form.quantity.value;
  let product = productSelect.value === 'Other' ? productOther.value.trim() : productSelect.value;

  if (!date || !branch || !product || !quantity || quantity <= 0) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  const uniqueId = generateUniqueId();

  const postData = {
    data: [{
      id: uniqueId,
      date,
      branch,
      product,
      quantity
    }]
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    const result = await response.json();

    if (response.ok) {
      addRow(date, branch, product, quantity, uniqueId);

      form.reset();
      productOther.style.display = 'none';
      productOther.required = false;
      showToast('✔ Entry added successfully!');
    } else {
      alert('Failed to save data: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    console.error(error);
    alert('Error saving data.');
  }
});

// Download table as PDF
function downloadPDF() {
  const element = document.getElementById('table-container');
  html2pdf().from(element).set({
    margin: 0.5,
    filename: 'Health_Stock_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  }).save();
}

// Initial load
loadEntries();
