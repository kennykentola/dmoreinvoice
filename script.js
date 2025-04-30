const itemsTable = document.getElementById('items');
const totalSpan = document.getElementById('total');
const amountWordsInput = document.getElementById('amount-words');
const previewModal = document.getElementById('preview-modal');
const previewContent = document.getElementById('preview-content');
let pdfBlob = null;

// Check if user is logged in
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = '/index.html';
    }
}

// Load theme from localStorage or default to light
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Update the theme icon based on the current theme
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
}

// Toggle between light and dark themes
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/index.html';
}

// Automatically set the current date and load theme
window.onload = function() {
    checkLogin();
    const today = new Date();
    document.getElementById('day').value = today.getDate();
    document.getElementById('month').value = today.getMonth() + 1;
    document.getElementById('year').value = today.getFullYear();
    loadTheme();
};

// Function to add new rows (2 at a time)
function addRows() {
    const tbody = document.getElementById('items');
    for (let i = 0; i < 2; i++) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" class="sno"></td>
            <td><input type="text" class="description"></td>
            <td><input type="text" class="quantity"></td>
            <td><input type="text" class="rate"></td>
            <td><input type="text" class="amount" readonly></td>
        `;
        tbody.appendChild(newRow);
        newRow.querySelectorAll('.quantity, .rate').forEach(input => {
            input.addEventListener('input', handleRowInput);
        });
    }
}

// Function to handle row input and auto-add rows
function handleRowInput(e) {
    const row = e.target.closest('tr');
    const quantityInput = row.querySelector('.quantity');
    const rateInput = row.querySelector('.rate');
    const quantity = parseFloat(quantityInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const amountInput = row.querySelector('.amount');
    amountInput.value = quantity * rate;
    calculateTotal();

    const rows = document.querySelectorAll('#items tr');
    const rowIndex = Array.from(rows).indexOf(row);
    if (rowIndex === rows.length - 2 && (quantity || rate)) {
        addRows();
    }
}

// Attach initial event listeners to existing rows
document.querySelectorAll('#items .quantity, #items .rate').forEach(input => {
    input.addEventListener('input', handleRowInput);
});

// Function to convert number to words with proper "and" placement
function numberToWords(num) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero';

    function convertChunk(n) {
        let words = '';
        const hundreds = Math.floor(n / 100);
        n %= 100;

        if (hundreds > 0) {
            words += units[hundreds] + ' Hundred';
            if (n > 0) words += ' and ';
        }

        if (n >= 20) {
            words += tens[Math.floor(n / 10)];
            n %= 10;
            if (n > 0) words += ' ' + units[n];
        } else if (n >= 10) {
            words += teens[n - 10];
        } else if (n > 0) {
            words += units[n];
        }

        return words.trim();
    }

    let words = '';
    let chunkCount = 0;

    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = convertChunk(chunk);
            if (chunkCount > 0) {
                chunkWords += ' ' + thousands[chunkCount];
            }
            if (words && chunk < 100) {
                words = chunkWords + ' and ' + words;
            } else {
                words = chunkWords + (words ? ' ' + words : '');
            }
        }
        num = Math.floor(num / 1000);
        chunkCount++;
    }

    return words.trim();
}

function calculateTotal() {
    let total = 0;
    document.querySelectorAll('.amount').forEach(input => {
        const amount = parseFloat(input.value) || 0;
        total += amount;
    });
    totalSpan.textContent = total;

    const totalStr = total.toString();
    const [naira, kobo = '00'] = totalStr.split('.');
    const nairaWords = numberToWords(parseInt(naira));
    const koboWords = kobo === '00' ? 'Zero' : numberToWords(parseInt(kobo));
    amountWordsInput.value = `${nairaWords} Naira ${koboWords} Kobo`;
    document.getElementById('customer-signature-naira').value = nairaWords;
    document.getElementById('customer-signature-kobo').value = koboWords;
}

let customerSignatures = [];
document.getElementById('signature-upload').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    const container = document.getElementById('customer-signature-container');
    const nairaInput = document.getElementById('customer-signature-naira');
    const koboInput = document.getElementById('customer-signature-kobo');
    const deleteButton = document.getElementById('delete-customer-signature');

    const remainingSlots = 2 - customerSignatures.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.alt = 'Customer Signature';
            img.classList.add('customer-signature');
            container.appendChild(img);
            customerSignatures.push(img);

            nairaInput.style.display = 'none';
            koboInput.style.display = 'none';
            deleteButton.style.display = 'block';

            e.target.value = '';
        };
        reader.readAsDataURL(file);
    });

    if (customerSignatures.length >= 2) {
        e.target.disabled = true;
    }
});

function deleteCustomerSignature() {
    const container = document.getElementById('customer-signature-container');
    const nairaInput = document.getElementById('customer-signature-naira');
    const koboInput = document.getElementById('customer-signature-kobo');
    const deleteButton = document.getElementById('delete-customer-signature');
    const uploadInput = document.getElementById('signature-upload');

    container.innerHTML = '';
    customerSignatures = [];
    nairaInput.style.display = 'block';
    koboInput.style.display = 'block';
    deleteButton.style.display = 'none';
    uploadInput.disabled = false;

    const customerSignatureType = document.querySelector('input[name="customer-signature-type"]:checked')?.value || 'image';
    if (customerSignatureType === 'text') {
        document.getElementById('customer-signature-name').style.display = 'block';
        nairaInput.style.display = 'none';
        koboInput.style.display = 'none';
    }
}

function toggleCustomerSignatureType(type) {
    const container = document.getElementById('customer-signature-container');
    const nameInput = document.getElementById('customer-signature-name');
    const nairaInput = document.getElementById('customer-signature-naira');
    const koboInput = document.getElementById('customer-signature-kobo');
    const deleteButton = document.getElementById('delete-customer-signature');
    const uploadInput = document.getElementById('signature-upload');

    if (type === 'text') {
        container.style.display = 'none';
        nameInput.style.display = 'block';
        nairaInput.style.display = 'none';
        koboInput.style.display = 'none';
        deleteButton.style.display = 'none';
        uploadInput.disabled = true;
        customerSignatures = [];
    } else {
        container.style.display = 'flex';
        nameInput.style.display = 'none';
        if (customerSignatures.length === 0) {
            nairaInput.style.display = 'block';
            koboInput.style.display = 'block';
        }
        uploadInput.disabled = false;
    }
}

function toggleManagerSignatureType(type) {
    const container = document.getElementById('manager-signature-container');
    const nameInput = document.getElementById('manager-signature-name');
    const signatureImg = document.getElementById('manager-signature');

    if (type === 'text') {
        signatureImg.style.display = 'none';
        nameInput.style.display = 'block';
    } else {
        signatureImg.style.display = 'block';
        nameInput.style.display = 'none';
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForImages(element) {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        return new Promise(resolve => {
            if (img.complete && img.naturalHeight !== 0) {
                console.log(`Image already loaded: ${img.src}`);
                resolve();
            } else {
                img.onload = () => {
                    console.log(`Image loaded: ${img.src}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${img.src}`);
                    resolve();
                };
                if (img.src) {
                    img.src = img.src;
                }
            }
        });
    });
    return Promise.all(promises);
}

// Function to fetch and inline CSS
async function inlineCSS(element) {
    const stylesheets = Array.from(document.styleSheets);
    let cssText = '';

    for (const sheet of stylesheets) {
        try {
            if (sheet.href && sheet.href.includes('styles.css')) {
                const response = await fetch(sheet.href);
                const text = await response.text();
                cssText += text + '\n';
            }
        } catch (err) {
            console.warn(`Could not access stylesheet ${sheet.href}:`, err);
            continue;
        }
    }

    const styleElement = document.createElement('style');
    styleElement.textContent = cssText;
    element.appendChild(styleElement);

    const linkElement = element.querySelector('link[href="/styles.css"]');
    if (linkElement) {
        linkElement.remove();
    }
}

async function storePDFInIndexedDB(blob) {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('pdfDatabase', 1);
        dbRequest.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore('pdfs', { keyPath: 'id' });
        };
        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['pdfs'], 'readwrite');
            const store = transaction.objectStore('pdfs');
            const pdfId = `pdf_${Date.now()}`;
            store.add({ id: pdfId, blob: blob });
            transaction.oncomplete = function() {
                resolve(pdfId);
            };
            transaction.onerror = function() {
                reject('Error storing PDF in IndexedDB');
            };
        };
        dbRequest.onerror = function() {
            reject('Error opening IndexedDB');
        };
    });
}

async function generatePDF() {
    const element = document.getElementById('invoice');
    const deleteButton = document.getElementById('delete-customer-signature');
    let buttonParent = null;
    let buttonDisplayStyle = null;
    const originalTheme = document.body.getAttribute('data-theme');

    document.body.setAttribute('data-theme', 'light');

    const clone = element.cloneNode(true);

    await inlineCSS(clone);

    // Force watermark to be visible and adjust z-index for PDF generation
    const watermark = clone.querySelector('.watermark');
    if (watermark) {
        watermark.style.display = 'block';
        watermark.style.zIndex = '0'; // Between container background and content
    }

    // Make container background transparent for PDF to ensure watermark visibility
    const container = clone.querySelector('.container') || clone;
    if (container) {
        container.style.background = 'transparent';
    }

    clone.querySelectorAll('.signature-options').forEach(options => {
        options.style.display = 'none';
    });

    const customerSignatureRadio = document.querySelector('input[name="customer-signature-type"]:checked');
    const customerSignatureType = customerSignatureRadio ? customerSignatureRadio.value : 'image';
    const customerCloneContainer = clone.querySelector('#customer-signature-container');
    const customerCloneNameInput = clone.querySelector('#customer-signature-name');
    const customerCloneNairaInput = clone.querySelector('#customer-signature-naira');
    const customerCloneKoboInput = clone.querySelector('#customer-signature-kobo');
    const customerCloneDeleteButton = clone.querySelector('#delete-customer-signature');

    if (customerSignatureType === 'text') {
        customerCloneContainer.style.display = 'none';
        customerCloneNameInput.style.display = 'block';
        customerCloneNairaInput.style.display = 'none';
        customerCloneKoboInput.style.display = 'none';
    } else {
        customerCloneContainer.style.display = 'flex';
        customerCloneNameInput.style.display = 'none';
        if (customerCloneContainer.children.length === 0) {
            customerCloneNairaInput.style.display = 'block';
            customerCloneKoboInput.style.display = 'block';
        } else {
            customerCloneNairaInput.style.display = 'none';
            customerCloneKoboInput.style.display = 'none';
        }
    }
    if (customerCloneDeleteButton) {
        customerCloneDeleteButton.style.display = 'none';
    }

    const managerSignatureRadio = document.querySelector('input[name="manager-signature-type"]:checked');
    const managerSignatureType = managerSignatureRadio ? managerSignatureRadio.value : 'image';
    const managerCloneContainer = clone.querySelector('#manager-signature-container');
    const managerCloneNameInput = clone.querySelector('#manager-signature-name');
    const managerCloneSignatureImg = clone.querySelector('#manager-signature');

    if (managerSignatureType === 'text') {
        managerCloneSignatureImg.style.display = 'none';
        managerCloneNameInput.style.display = 'block';
    } else {
        managerCloneSignatureImg.style.display = 'block';
        managerCloneNameInput.style.display = 'none';
    }

    const cloneInputs = clone.querySelectorAll('input');
    cloneInputs.forEach(input => {
        if (input.style.display === 'none') {
            input.parentNode.removeChild(input);
            return;
        }
        const span = document.createElement('span');
        span.textContent = input.value || '';
        span.style.display = 'inline-block';
        span.style.minWidth = input.offsetWidth + 'px';
        span.style.minHeight = input.offsetHeight + 'px';
        span.style.textAlign = input.style.textAlign || 'center';
        span.style.padding = input.style.padding || '2px';
        span.style.fontSize = input.style.fontSize || 'inherit';
        span.style.color = getComputedStyle(input).color;
        span.style.background = getComputedStyle(input).background;
        span.style.border = getComputedStyle(input).border;
        input.parentNode.replaceChild(span, input);
    });

    const cloneTextareas = clone.querySelectorAll('textarea');
    cloneTextareas.forEach(textarea => {
        if (textarea.style.display === 'none') {
            textarea.parentNode.removeChild(textarea);
            return;
        }
        const div = document.createElement('div');
        div.textContent = textarea.value || '';
        div.style.whiteSpace = 'pre-wrap';
        div.style.minWidth = textarea.offsetWidth + 'px';
        div.style.minHeight = textarea.offsetHeight + 'px';
        div.style.padding = textarea.style.padding || '2px';
        div.style.fontSize = textarea.style.fontSize || 'inherit';
        div.style.color = getComputedStyle(textarea).color;
        div.style.background = getComputedStyle(textarea).background;
        div.style.border = getComputedStyle(textarea).border;
        textarea.parentNode.replaceChild(div, textarea);
    });

    if (deleteButton) {
        buttonParent = deleteButton.parentElement;
        buttonDisplayStyle = deleteButton.style.display;
        buttonParent.removeChild(deleteButton);
    }

    try {
        window.scrollTo(0, 0);
        await waitForImages(clone);
        await delay(1000);

        const a4WidthPx = 595;
        const a4HeightPx = 842;

        clone.style.width = `${a4WidthPx}px`;
        clone.style.maxWidth = 'none';
        clone.style.height = 'auto';
        clone.style.position = 'absolute';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.visibility = 'hidden';
        clone.style.transform = 'none';
        clone.style.overflow = 'visible';
        document.body.appendChild(clone);

        await delay(500);

        const contentWidth = a4WidthPx;
        const contentHeight = clone.scrollHeight;

        const scale = 2;

        const opt = {
            margin: 0,
            filename: 'invoice.pdf',
            image: { type: 'png', quality: 1.0 },
            html2canvas: { 
                scale: scale,
                useCORS: true,
                width: contentWidth,
                height: contentHeight,
                scrollX: 0,
                scrollY: 0,
                logging: true,
                dpi: 300,
                letterRendering: true,
                backgroundColor: '#f4f4f4', // Match body background for PDF
                onclone: (clonedDoc) => {
                    console.log('html2canvas cloned document:', clonedDoc);
                    clonedDoc.querySelectorAll('*').forEach(el => {
                        el.style.visibility = 'visible';
                        el.style.display = el.style.display === 'none' ? 'none' : el.style.display;
                    });
                    // Ensure watermark is visible in the cloned document
                    const clonedWatermark = clonedDoc.querySelector('.watermark');
                    if (clonedWatermark) {
                        clonedWatermark.style.display = 'block';
                        clonedWatermark.style.zIndex = '0'; // Between container and content
                    }
                    // Ensure container background is transparent
                    const clonedContainer = clonedDoc.querySelector('.container');
                    if (clonedContainer) {
                        clonedContainer.style.background = 'transparent';
                    }
                }
            },
            jsPDF: { 
                unit: 'px', 
                format: [a4WidthPx, contentHeight],
                orientation: 'portrait',
                putOnlyUsedFonts: true,
                compress: false
            },
            pagebreak: { mode: ['css', 'legacy'], after: '.page-break' }
        };

        console.log('Starting PDF generation...');
        const pdf = await html2pdf().from(clone).set(opt).toPdf().get('pdf');
        pdfBlob = pdf.output('blob');

        const pdfId = await storePDFInIndexedDB(pdfBlob);
        console.log('PDF generated and stored in IndexedDB with ID:', pdfId);
        return { pdfBlob, pdfId };
    } catch (err) {
        console.error('Error in generatePDF:', err);
        throw err;
    } finally {
        document.body.setAttribute('data-theme', originalTheme);
        if (deleteButton && buttonParent) {
            buttonParent.appendChild(deleteButton);
            deleteButton.style.display = buttonDisplayStyle;
        }
        if (clone.parentNode) {
            document.body.removeChild(clone);
        }
    }
}

async function showPreview() {
    const invoice = document.getElementById('invoice');
    previewContent.innerHTML = invoice.outerHTML;
    previewModal.style.display = 'block';
}

function closePreview() {
    previewModal.style.display = 'none';
    previewContent.innerHTML = '';
    pdfBlob = null;
}

async function downloadPDF() {
    try {
        const { pdfBlob: blob } = await generatePDF();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF. Please check the console for details and try again.');
        throw err;
    }
}

async function sendEmail() {
    try {
        if (!pdfBlob) {
            const { pdfBlob: blob } = await generatePDF();
            pdfBlob = blob;
        }
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);

            const recipient = document.getElementById('customer-email').value || 'customer@example.com';
            const subject = encodeURIComponent('Your Invoice from D\'More Tech');
            const body = encodeURIComponent(`Dear Customer,\n\nPlease find your invoice attached.\n\nBest regards,\nD'More Tech Team\n(dmoretech44@gmail.com)`);
            const emailLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
            const tempLink = document.createElement('a');
            tempLink.href = emailLink;
            tempLink.click();
        } else {
            throw new Error('PDF blob not available');
        }
    } catch (err) {
        console.error('Error sending email:', err);
        alert('Failed to send email. Please try again.');
    }
}

document.getElementById('email-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await sendEmail();
});

document.getElementById('email-link-modal').addEventListener('click', async (e) => {
    e.preventDefault();
    await sendEmail();
});

document.getElementById('whatsapp-link').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        let pdfId;
        if (!pdfBlob) {
            const result = await generatePDF();
            pdfBlob = result.pdfBlob;
            pdfId = result.pdfId;
        } else {
            pdfId = await storePDFInIndexedDB(pdfBlob);
        }

        // Download the PDF for the sender
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
        }

        // Create a URL to view the PDF
        const viewPdfUrl = `https://dmoretech1.vercel.app/view-pdf.html?id=${pdfId}`;
        
        // Get the WhatsApp number
        const whatsappNumber = document.getElementById('customer-whatsapp').value || '';
        
        // Create a simplified WhatsApp message for the receiver
        const message = encodeURIComponent(`Here is your invoice from D'More Tech: ${viewPdfUrl}\n\nSent from: dmoretech44@gmail.com`);
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;
        
        // Open WhatsApp with the share link
        window.open(whatsappLink, '_blank');

        // Show the sender a message about the fallback
        setTimeout(() => {
            alert(`The PDF has been downloaded to your device as 'invoice.pdf'. If the receiver cannot access the link (e.g., on a different device), please manually attach the downloaded PDF in WhatsApp.`);
        }, 500);
    } catch (err) {
        console.error('Error sending WhatsApp message:', err);
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
        }
        alert('Failed to store PDF for sharing. The PDF has been downloaded. Please share it manually via WhatsApp.');
    }
});