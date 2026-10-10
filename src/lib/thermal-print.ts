

// ============================================================================
// ESC/POS Thermal Printer — Universal Print Utility
// Xprinter XP-58 (58mm) uchun optimallashtirilgan
// ============================================================================

const ESC = 0x1b;
const GS = 0x1d;

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

const INIT = cmd(ESC, 0x40);
const LINE_FEED = cmd(0x0a);
const CUT = cmd(GS, 0x56, 0x00);
const BOLD_ON = cmd(ESC, 0x45, 0x01);
const BOLD_OFF = cmd(ESC, 0x45, 0x00);
const ALIGN_CENTER = cmd(ESC, 0x61, 0x01);
const ALIGN_LEFT = cmd(ESC, 0x61, 0x00);
const DOUBLE_HEIGHT = cmd(ESC, 0x21, 0x10);
const NORMAL_SIZE = cmd(ESC, 0x21, 0x00);

export interface ThermalReceiptSettings {
  name: string;
  currency: string;
  currencyDecimals: number;
  taxName: string;
  receiptFooter: string;
}

export interface ThermalReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ThermalReceiptData {
  saleId?: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  amountTendered?: number;
  changeDue?: number;
}

// 58mm printer uchun kenglik taxminan 32 belgi
function twoColumns(left: string, right: string, width = 32): Uint8Array {
  const gap = width - left.length - right.length;
  const line = left + " ".repeat(Math.max(1, gap)) + right + "\n";
  return text(line.slice(0, width + 1));
}

function divider(width = 32): Uint8Array {
  return text("-".repeat(width) + "\n");
}

export function buildReceiptBytes(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): Uint8Array {
  const chunks: Uint8Array[] = [];
  const c = settings.currency;
  const d = settings.currencyDecimals;

  function fmt(n: number) {
    return `${c}${n.toFixed(d)}`;
  }

  chunks.push(INIT);
  chunks.push(ALIGN_CENTER, DOUBLE_HEIGHT, BOLD_ON);
  chunks.push(text(settings.name + "\n"));
  chunks.push(NORMAL_SIZE, BOLD_OFF, ALIGN_LEFT);

  const now = new Date();
  chunks.push(text(`${now.toLocaleDateString()}  ${now.toLocaleTimeString()}\n`));
  if (data.saleId) {
    chunks.push(text(`#${data.saleId.slice(-8).toUpperCase()}\n`));
  }
  chunks.push(divider());

  for (const item of data.items) {
    chunks.push(text(`${item.name.slice(0, 32)}\n`));
    chunks.push(twoColumns(`  ${item.quantity} x ${fmt(item.price)}`, fmt(item.total)));
  }
  chunks.push(divider());

  chunks.push(twoColumns("Subtotal", fmt(data.subtotal)));
  if (data.discountAmount > 0) {
    chunks.push(twoColumns("Chegirma", `-${fmt(data.discountAmount)}`));
  }
  if (data.taxAmount > 0) {
    chunks.push(twoColumns(settings.taxName, fmt(data.taxAmount)));
  }
  chunks.push(divider());
  chunks.push(BOLD_ON);
  chunks.push(twoColumns("JAMI", fmt(data.total)));
  chunks.push(BOLD_OFF);
  chunks.push(divider());

  chunks.push(twoColumns("To'lov", data.paymentMethod));
  if (data.amountTendered && data.amountTendered > 0) {
    chunks.push(twoColumns("To'langan", fmt(data.amountTendered)));
  }
  if (data.changeDue && data.changeDue > 0) {
    chunks.push(twoColumns("Qaytim", fmt(data.changeDue)));
  }

  if (settings.receiptFooter) {
    chunks.push(LINE_FEED);
    chunks.push(ALIGN_CENTER);
    chunks.push(text(settings.receiptFooter + "\n"));
    chunks.push(ALIGN_LEFT);
  }

  chunks.push(LINE_FEED, LINE_FEED, LINE_FEED);
  chunks.push(CUT);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// 58mm printer uchun HTML chek
// ============================================================================
function buildReceiptHtml(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): string {
  const c = settings.currency;
  const d = settings.currencyDecimals;
  const fmt = (n: number) => `${c}${n.toFixed(d)}`;
  const now = new Date();

  const itemsHtml = data.items
    .map(
      (item) => `
      <div class="item">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="row">
          <span>${item.quantity} x ${fmt(item.price)}</span>
          <span>${fmt(item.total)}</span>
        </div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chek</title>
  <style>
    /* ⚠️ 58mm termal printer uchun */
    @page {
      size: 58mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: 48mm;
      padding: 2mm 1mm;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 14px; font-weight: bold; }
    .divider {
      border-top: 1px dashed #000;
      margin: 3px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 4px;
    }
    .item {
      margin-top: 4px;
    }
    .item-name {
      font-weight: 700;
      margin-bottom: 1px;
      word-break: break-word;
    }
    .total {
      font-size: 13px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 6px;
      font-size: 10px;
      padding-top: 4px;
      border-top: 1px dashed #000;
    }
  </style>
</head>
<body>
  <div class="center big">${escapeHtml(settings.name)}</div>
  <div class="center">${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
  ${data.saleId ? `<div class="center">#${data.saleId.slice(-8).toUpperCase()}</div>` : ""}
  <div class="divider"></div>

  ${itemsHtml}

  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>${fmt(data.subtotal)}</span></div>
  ${data.discountAmount > 0 ? `<div class="row"><span>Chegirma</span><span>-${fmt(data.discountAmount)}</span></div>` : ""}
  ${data.taxAmount > 0 ? `<div class="row"><span>${escapeHtml(settings.taxName)}</span><span>${fmt(data.taxAmount)}</span></div>` : ""}
  <div class="divider"></div>
  <div class="row total"><span>JAMI</span><span>${fmt(data.total)}</span></div>
  <div class="divider"></div>
  <div class="row"><span>To'lov</span><span>${escapeHtml(data.paymentMethod)}</span></div>
  ${data.amountTendered && data.amountTendered > 0 ? `<div class="row"><span>To'langan</span><span>${fmt(data.amountTendered)}</span></div>` : ""}
  ${data.changeDue && data.changeDue > 0 ? `<div class="row"><span>Qaytim</span><span>${fmt(data.changeDue)}</span></div>` : ""}

  ${settings.receiptFooter ? `<div class="footer">${escapeHtml(settings.receiptFooter)}</div>` : ""}
</body>
</html>`;
}

// ============================================================================
// IFRAME orqali print — popup bloklanmaydi, HAR DOIM ishlaydi
// ============================================================================
function printViaIframe(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve({ ok: false, error: "Brauzer muhitida emas" });
      return;
    }

    try {
      // Eski iframe ni o'chirish
      const oldIframe = document.getElementById("receipt-print-iframe");
      if (oldIframe) oldIframe.remove();

      // Yangi iframe yaratish
      const iframe = document.createElement("iframe");
      iframe.id = "receipt-print-iframe";
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        resolve({ ok: false, error: "Iframe yaratib bo'lmadi" });
        return;
      }

      // HTML yozish
      iframeDoc.open();
      iframeDoc.write(buildReceiptHtml(data, settings));
      iframeDoc.close();

      // Iframe yuklangandan keyin print
      const doPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // 1 daqiqadan keyin tozalash
          setTimeout(() => {
            try {
              iframe.remove();
            } catch {
              // ignore
            }
          }, 60000);

          resolve({ ok: true });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Noma'lum xato";
          resolve({ ok: false, error: `Print xato: ${message}` });
        }
      };

      if (iframeDoc.readyState === "complete") {
        setTimeout(doPrint, 150);
      } else {
        iframe.onload = () => setTimeout(doPrint, 150);
        setTimeout(doPrint, 500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noma'lum xato";
      resolve({ ok: false, error: `Iframe xato: ${message}` });
    }
  });
}

// ============================================================================
// Web Serial (ESC/POS)
// ============================================================================
async function printViaSerial(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): Promise<{ ok: boolean; error?: string }> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    return { ok: false, error: "Web Serial API mavjud emas" };
  }

  try {
    const serial = (navigator as any).serial;
    const port = await serial.requestPort();

    await port.open({ baudRate: 9600 });

    const writer = port.writable?.getWriter();
    if (!writer) {
      await port.close();
      return { ok: false, error: "Portga yozib bo'lmaydi" };
    }

    const bytes = buildReceiptBytes(data, settings);
    await writer.write(bytes);
    writer.releaseLock();

    await port.close();

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Noma'lum xato";
    return { ok: false, error: `Serial xato: ${message}` };
  }
}

// ============================================================================
// WebUSB (ESC/POS)
// ============================================================================
async function printViaUSB(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): Promise<{ ok: boolean; error?: string }> {
  if (typeof navigator === "undefined" || !("usb" in navigator)) {
    return { ok: false, error: "WebUSB API mavjud emas" };
  }

  try {
    const usb = (navigator as any).usb;
    const device = await usb.requestDevice({
      filters: [{ classCode: 7 }],
    });

    await device.open();

    const iface = device.configuration?.interfaces[0];
    if (!iface) {
      await device.close();
      return { ok: false, error: "USB printer interfeysi topilmadi" };
    }

    await device.claimInterface(iface.interfaceNumber);

    const outEndpoint = iface.alternate.endpoints.find(
      (ep: any) => ep.direction === "out"
    );
    if (!outEndpoint) {
      await device.close();
      return { ok: false, error: "USB printer OUT endpoint topilmadi" };
    }

    const bytes = buildReceiptBytes(data, settings);
    await device.transferOut(outEndpoint.endpointNumber, bytes.buffer);

    await device.close();

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Noma'lum xato";
    return { ok: false, error: `USB xato: ${message}` };
  }
}

// ============================================================================
// ASOSIY: printReceipt — iframe orqali ishlaydi
// ============================================================================
export async function printReceipt({
  data,
  settings,
}: {
  data: ThermalReceiptData;
  settings: ThermalReceiptSettings;
  preferWindowPrint?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  return printViaIframe(data, settings);
}

// ============================================================================
// QO'SHIMCHA funksiyalar
// ============================================================================
export async function printReceiptSerial({
  data,
  settings,
}: {
  data: ThermalReceiptData;
  settings: ThermalReceiptSettings;
}): Promise<{ ok: boolean; error?: string }> {
  return printViaSerial(data, settings);
}

export async function printReceiptUSB({
  data,
  settings,
}: {
  data: ThermalReceiptData;
  settings: ThermalReceiptSettings;
}): Promise<{ ok: boolean; error?: string }> {
  return printViaUSB(data, settings);
}