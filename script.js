const itemsTable = document.getElementById('items');
const totalSpan = document.getElementById('total');
const amountWordsInput = document.getElementById('amount-words');
const previewModal = document.getElementById('preview-modal');
const previewContent = document.getElementById('preview-content');
let pdfBlob = null;
let pdfBase64 = null;

// Automatically set the current date
window.onload = function() {
    const today = new Date();
    document.getElementById('day').value = today.getDate();
    document.getElementById('month').value = today.getMonth() + 1; // Months are 0-based
    document.getElementById('year').value = today.getFullYear();
};

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
            if (n > 0) words += ' and '; // Add "and" if there are more digits
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
            // Add "and" before the last chunk if there are higher chunks and the last chunk is less than 100
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

    // Convert total to words and update the input
    const totalStr = total.toString();
    const [naira, kobo = '00'] = totalStr.split('.');
    const nairaWords = numberToWords(parseInt(naira));
    const koboWords = kobo === '00' ? 'Zero' : numberToWords(parseInt(kobo));
    amountWordsInput.value = `${nairaWords} Naira ${koboWords} Kobo`;
    document.getElementById('customer-signature-naira').value = nairaWords;
    document.getElementById('customer-signature-kobo').value = koboWords;
}

itemsTable.addEventListener('input', (e) => {
    const row = e.target.closest('tr');
    const quantityInput = row.querySelector('.quantity');
    const rateInput = row.querySelector('.rate');
    const quantity = parseFloat(quantityInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const amountInput = row.querySelector('.amount');
    amountInput.value = quantity * rate;
    calculateTotal();

    // Add a new row if the current row is the last one and either quantity or rate is filled
    if (row === itemsTable.lastElementChild && (quantityInput.value || rateInput.value)) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" class="sno"></td>
            <td><input type="text" class="description"></td>
            <td><input type="text" class="quantity"></td>
            <td><input type="text" class="rate"></td>
            <td><input type="text" class="amount" readonly></td>
        `;
        itemsTable.appendChild(newRow);
    }
});

let customerSignatures = [];
document.getElementById('signature-upload').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    const container = document.getElementById('customer-signature-container');
    const nairaInput = document.getElementById('customer-signature-naira');
    const koboInput = document.getElementById('customer-signature-kobo');
    const deleteButton = document.getElementById('delete-customer-signature');

    // Limit to 2 signatures
    const remainingSlots = 2 - customerSignatures.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.alt = 'Customer Signature';
            img.style.width = '80px';
            img.style.height = '40px';
            img.style.marginTop = '5px';
            img.classList.add('customer-signature');
            container.appendChild(img);
            customerSignatures.push(img);

            // Hide Naira and Kobo inputs if signatures are present
            nairaInput.style.display = 'none';
            koboInput.style.display = 'none';
            deleteButton.style.display = 'block';

            // Clear the input to allow re-uploading
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    });

    if (customerSignatures.length >= 2) {
        e.target.disabled = true; // Disable further uploads
    }
});

function deleteCustomerSignature() {
    const container = document.getElementById('customer-signature-container');
    const nairaInput = document.getElementById('customer-signature-naira');
    const koboInput = document.getElementById('customer-signature-kobo');
    const deleteButton = document.getElementById('delete-customer-signature');
    const uploadInput = document.getElementById('signature-upload');

    // Clear all customer signatures
    container.innerHTML = '';
    customerSignatures = [];
    nairaInput.style.display = 'block';
    koboInput.style.display = 'block';
    deleteButton.style.display = 'none';
    uploadInput.disabled = false; // Re-enable the upload input
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForImages(element) {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = () => {
                console.log(`Image loaded: ${img.src}`);
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${img.src}`);
                resolve(); // Resolve even on error to avoid blocking
            };
        });
    });
    return Promise.all(promises);
}

// Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1]; // Extract base64 part
            console.log('Blob converted to base64 successfully');
            resolve(base64String);
        };
        reader.onerror = (err) => {
            console.error('Error converting blob to base64:', err);
            reject(err);
        };
        reader.readAsDataURL(blob);
    });
}

async function generatePDF() {
    const element = document.getElementById('invoice');
    const deleteButton = document.getElementById('delete-customer-signature');
    let buttonParent = null;
    let buttonDisplayStyle = null;

    // Store the button's parent and display style, then remove it from the DOM
    if (deleteButton) {
        buttonParent = deleteButton.parentElement;
        buttonDisplayStyle = deleteButton.style.display;
        buttonParent.removeChild(deleteButton);
    }

    try {
        // Scroll to the top to ensure the header is in view
        window.scrollTo(0, 0);

        // Wait for images to load
        console.log('Waiting for images to load...');
        await waitForImages(element);

        // Additional delay to ensure all content is rendered
        console.log('Adding delay for rendering...');
        await delay(2000);

        // A4 dimensions in pixels at 72dpi
        const a4WidthPx = 595;
        const a4HeightPx = 842;

        // Clone the element to measure its full dimensions without constraints
        const clone = element.cloneNode(true);
        clone.style.width = `${a4WidthPx}px`; // Force A4 width
        clone.style.maxWidth = 'none'; // Remove max-width constraint
        clone.style.maxHeight = 'none'; // Remove max-height constraint
        clone.style.height = 'auto'; // Allow natural height
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        document.body.appendChild(clone);

        // Wait for the clone to render and get its full dimensions
        await delay(500);
        const contentWidth = a4WidthPx; // Use A4 width directly
        const contentHeight = clone.scrollHeight;
        console.log('Content dimensions:', contentWidth, contentHeight);

        // Remove the clone
        document.body.removeChild(clone);

        // Calculate scale to fit content within A4 width
        const scale = 2; // Fixed scale for consistent rendering (adjust if needed)
        console.log('Scale calculated:', scale);

        const opt = {
            margin: [10, 10, 10, 10], // Add margins to ensure content fits
            filename: 'invoice.pdf',
            image: { type: 'png', quality: 1.0 }, // Use PNG for better quality
            html2canvas: { 
                scale: scale,
                useCORS: true,
                width: contentWidth,
                height: contentHeight, // Use the full content height
                scrollX: 0,
                scrollY: 0,
                logging: true,
                dpi: 300, // Increase DPI for better resolution
                letterRendering: true // Improve text rendering
            },
            jsPDF: { 
                unit: 'px', 
                format: [a4WidthPx, a4HeightPx], // Always use A4 dimensions
                orientation: 'portrait',
                putOnlyUsedFonts: true,
                compress: false // Disable compression for better quality
            },
            pagebreak: { mode: ['css', 'legacy'], after: '.page-break' }
        };

        console.log('Generating PDF with options:', opt);
        const pdf = await html2pdf().from(element).set(opt).toPdf().get('pdf');
        pdfBlob = pdf.output('blob');
        console.log('PDF blob generated:', pdfBlob);
        pdfBase64 = await blobToBase64(pdfBlob); // Convert to base64
        console.log('PDF base64 generated');
        return pdfBlob;
    } catch (err) {
        console.error('Error in generatePDF:', err);
        alert('Failed to generate PDF. Please check the console for details and try again.');
        throw err;
    } finally {
        // Restore the delete button to the DOM after PDF generation
        if (deleteButton && buttonParent) {
            buttonParent.appendChild(deleteButton);
            deleteButton.style.display = buttonDisplayStyle;
            console.log('Delete button restored');
        }
    }
}

async function showPreview() {
    const invoice = document.getElementById('invoice');
    previewContent.innerHTML = invoice.outerHTML;
    previewModal.style.display = 'block';
    console.log('Preview modal displayed');
}

function closePreview() {
    previewModal.style.display = 'none';
    previewContent.innerHTML = '';
    pdfBlob = null;
    pdfBase64 = null;
    console.log('Preview modal closed');
}

async function downloadPDF() {
    try {
        await generatePDF();
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
            console.log('PDF downloaded');
        }
    } catch (err) {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF. Please try again.');
    }
}

async function sendEmail() {
    try {
        // Generate and download the PDF first
        if (!pdfBlob) await generatePDF();
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
            console.log('PDF downloaded for email');

            // Open a mailto link with instructions to attach the downloaded PDF
            const recipient = document.getElementById('customer-email').value || 'customer@example.com';
            const subject = encodeURIComponent('Your Invoice from D\'More Tech');
            const body = encodeURIComponent(`Dear Customer,\n\nI have downloaded the invoice PDF for you (named "invoice.pdf"). Please attach it to this email before sending.\n\nThis invoice is sent from D'More Tech (dmoretech44@gmail.com).\n\nBest regards,\nD'More Tech Team`);
            const emailLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
            const tempLink = document.createElement('a');
            tempLink.href = emailLink;
            tempLink.click();
            console.log('Email opened with instructions:', emailLink);
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
        // Generate and download the PDF first
        if (!pdfBlob) await generatePDF();
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            a.click();
            URL.revokeObjectURL(url);
            console.log('PDF downloaded for WhatsApp');

            // Open a WhatsApp link with instructions to attach the downloaded PDF
            const whatsappNumber = document.getElementById('customer-whatsapp').value || '';
            const message = encodeURIComponent('Here is your invoice from D\'More Tech. I have downloaded the invoice PDF for you (named "invoice.pdf"). Please attach it to this chat and send.\n\nSent from: dmoretech44@gmail.com');
            const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;
            window.open(whatsappLink, '_blank');
            console.log('WhatsApp link opened with instructions:', whatsappLink);
        } else {
            throw new Error('PDF blob not available');
        }
    } catch (err) {
        console.error('Error sending WhatsApp message:', err);
        alert('Failed to send WhatsApp message. Please try again.');
    }
});