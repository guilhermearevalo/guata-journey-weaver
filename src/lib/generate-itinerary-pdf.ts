import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Dossier } from './dossier';
import { getAccommodationImages, hasAnyFlight } from './dossier';
import type { Activity, ItineraryDay } from './itinerary';
import { getActivityImages, timeSlotOrder } from './itinerary';

export interface ItineraryPdfData {
  title: string;
  clientName?: string | null;
  destination?: string | null;
  travelDates?: { start?: string; end?: string } | null;
  travelersCount?: number | null;
  brandName: string;
  logoUrl?: string | null;
  coverImage?: string | null;
  itinerary: ItineraryDay[];
  dossier: Dossier;
}

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Best-effort search URL for an activity when no maps_url is provided. */
function fallbackMapsSearchUrl(activity: Activity, destination?: string | null): string {
  const query = [activity.name, destination].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Build a Google Maps directions URL chaining all activities in itinerary order. */
function buildFullRouteUrl(itinerary: ItineraryDay[], destination?: string | null): string | null {
  const stops: string[] = [];
  for (const day of itinerary) {
    const sorted = [...day.activities].sort(
      (a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot),
    );
    for (const act of sorted) {
      const q = [act.name, destination].filter(Boolean).join(', ');
      stops.push(q);
    }
  }
  if (stops.length < 2) return null;
  const origin = encodeURIComponent(stops[0]);
  const dest = encodeURIComponent(stops[stops.length - 1]);
  const waypoints = stops.slice(1, -1).map((s) => encodeURIComponent(s)).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  return url;
}

function buildPdfHtml(data: ItineraryPdfData, fullRouteUrl: string | null): string {
  const tripLabel = data.clientName ? `Viagem de ${escapeHtml(data.clientName.split(' ')[0])}` : escapeHtml(data.title);
  const cover = data.coverImage || getAccommodationImages(data.dossier)[0] || '';

  const summaryRows = [
    data.travelDates?.start && `<tr><td><strong>Período</strong></td><td>${formatDate(data.travelDates.start)} — ${formatDate(data.travelDates.end)}</td></tr>`,
    data.travelersCount != null && `<tr><td><strong>Viajantes</strong></td><td>${data.travelersCount}</td></tr>`,
    data.destination && `<tr><td><strong>Destino</strong></td><td>${escapeHtml(data.destination)}</td></tr>`,
  ].filter(Boolean).join('');

  const flights = hasAnyFlight(data.dossier) ? `
    <section class="section">
      <h2>Voos</h2>
      ${data.dossier.flight_outbound ? `<div class="block"><h3>Voo de ida</h3><p>${escapeHtml(data.dossier.flight_outbound)}</p></div>` : ''}
      ${data.dossier.flight_internal ? `<div class="block"><h3>Voo interno</h3><p>${escapeHtml(data.dossier.flight_internal)}</p></div>` : ''}
      ${data.dossier.flight_inbound ? `<div class="block"><h3>Voo de volta</h3><p>${escapeHtml(data.dossier.flight_inbound)}</p></div>` : ''}
    </section>` : '';

  const accImages = getAccommodationImages(data.dossier).slice(0, 2);
  const accommodation = (data.dossier.accommodation || accImages.length) ? `
    <section class="section">
      <h2>Hospedagem</h2>
      ${accImages.map(src => `<img src="${src}" class="photo" crossorigin="anonymous" />`).join('')}
      ${data.dossier.accommodation ? `<p>${escapeHtml(data.dossier.accommodation)}</p>` : ''}
    </section>` : '';

  const daysHtml = data.itinerary.map(day => {
    const sorted = [...day.activities].sort(
      (a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot),
    );
    const dayTitle = data.dossier.day_titles?.[String(day.day)];
    const activitiesHtml = sorted.map(act => {
      const imgs = getActivityImages(act).slice(0, 2);
      const mapsUrl = act.maps_url?.trim() || fallbackMapsSearchUrl(act, data.destination);
      return `
        <div class="activity">
          <h4>${escapeHtml(act.name)} <span class="tag">${escapeHtml(act.time_slot)}</span></h4>
          ${imgs.map(src => `<img src="${src}" class="photo-sm" crossorigin="anonymous" />`).join('')}
          ${act.description ? `<p>${escapeHtml(act.description)}</p>` : ''}
          <a class="maps-link" data-pdf-link="${escapeHtml(mapsUrl)}" href="${escapeHtml(mapsUrl)}">
            <span class="map-pin">📍</span> Abrir no Google Maps
          </a>
        </div>`;
    }).join('');
    return `
      <section class="day">
        <h3>Dia ${day.day}${dayTitle ? ` — ${escapeHtml(dayTitle)}` : ''}</h3>
        ${activitiesHtml}
      </section>`;
  }).join('');

  const fullRouteSection = fullRouteUrl ? `
    <section class="section full-route">
      <h2>Rota completa</h2>
      <p class="route-hint">Abra todas as atividades como um trajeto contínuo no Google Maps.</p>
      <a class="route-button" data-pdf-link="${escapeHtml(fullRouteUrl)}" href="${escapeHtml(fullRouteUrl)}">
        🗺️ Ver rota completa no Google Maps
      </a>
    </section>` : '';

  return `
    <div id="itinerary-pdf-root" style="width:794px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;background:#fff;">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cover { position: relative; height: 420px; overflow: hidden; margin-bottom: 32px; }
        .cover img { width: 100%; height: 100%; object-fit: cover; }
        .cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,46,40,0.92) 0%, rgba(26,46,40,0.3) 100%); }
        .cover-text { position: absolute; bottom: 36px; left: 40px; right: 40px; color: #fff; }
        .cover-badge { display: inline-block; background: #c9a227; color: #1a1a1a; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px; }
        .cover h1 { font-size: 42px; font-weight: 700; line-height: 1.1; }
        .cover .brand { font-size: 13px; opacity: 0.9; margin-top: 8px; }
        .body { padding: 0 40px 48px; }
        h2 { font-size: 22px; color: #1a2e28; border-bottom: 2px solid #c9a227; padding-bottom: 8px; margin: 28px 0 16px; }
        h3 { font-size: 17px; color: #1a2e28; margin: 20px 0 10px; }
        h4 { font-size: 15px; margin-bottom: 6px; }
        .intro h2 { border: none; font-size: 28px; margin-top: 0; }
        .intro p { color: #555; font-size: 14px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        td { padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top; }
        td:first-child { width: 120px; color: #666; }
        .section { page-break-inside: avoid; margin-bottom: 8px; }
        .block { margin-bottom: 14px; }
        .block p, .activity p, .section p { white-space: pre-line; line-height: 1.65; font-size: 13px; color: #444; margin-top: 6px; }
        .photo { width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; margin: 10px 0; }
        .photo-sm { width: 48%; max-height: 120px; object-fit: cover; border-radius: 6px; margin: 8px 2% 8px 0; display: inline-block; }
        .day { page-break-inside: avoid; margin-bottom: 20px; }
        .activity { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
        .tag { font-size: 11px; font-weight: normal; color: #888; text-transform: capitalize; }
        .footer { text-align: center; padding: 24px 40px; font-size: 11px; color: #888; border-top: 1px solid #eee; }
        .logo { max-height: 36px; max-width: 120px; margin-bottom: 8px; }
        .maps-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 6px 12px; background: #eaf3ee; color: #1a6b48; font-size: 12px; font-weight: 600; border-radius: 14px; text-decoration: none; border: 1px solid #1a6b48; }
        .maps-link .map-pin { font-size: 13px; }
        .route-button { display: inline-block; margin-top: 6px; padding: 14px 28px; background: #1a6b48; color: #fff; font-size: 15px; font-weight: 700; border-radius: 28px; text-decoration: none; }
        .route-hint { color: #555; font-size: 13px; margin-bottom: 12px; }
        .full-route { margin-top: 24px; padding: 20px; background: #f7fbf8; border-radius: 12px; border: 1px solid #d6e8de; }
      </style>
      <div class="cover">
        ${cover ? `<img src="${cover}" crossorigin="anonymous" />` : ''}
        <div class="cover-overlay"></div>
        <div class="cover-text">
          <span class="cover-badge">Roteiro exclusivo</span>
          <h1>${escapeHtml(data.destination || data.title)}</h1>
          <p class="brand">${escapeHtml(data.brandName)}</p>
        </div>
      </div>
      <div class="body">
        <div class="intro">
          <h2>${tripLabel}</h2>
          <p>Seu roteiro personalizado</p>
        </div>
        ${summaryRows ? `<table>${summaryRows}</table>` : ''}
        ${flights}
        ${accommodation}
        ${data.itinerary.length ? `<section class="section"><h2>Experiências</h2>${daysHtml}</section>` : ''}
        ${fullRouteSection}
      </div>
      <div class="footer">
        ${data.logoUrl ? `<img src="${data.logoUrl}" class="logo" crossorigin="anonymous" />` : ''}
        <p>Roteiro preparado por <strong>${escapeHtml(data.brandName)}</strong></p>
      </div>
    </div>`;
}

interface LinkAnnotation {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function collectLinkAnnotations(root: HTMLElement): LinkAnnotation[] {
  const rootRect = root.getBoundingClientRect();
  const nodes = root.querySelectorAll<HTMLElement>('[data-pdf-link]');
  const annotations: LinkAnnotation[] = [];
  nodes.forEach((el) => {
    const url = el.getAttribute('data-pdf-link');
    if (!url) return;
    const rect = el.getBoundingClientRect();
    annotations.push({
      url,
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      w: rect.width,
      h: rect.height,
    });
  });
  return annotations;
}

export async function generateItineraryPdf(data: ItineraryPdfData): Promise<void> {
  const fullRouteUrl = buildFullRouteUrl(data.itinerary, data.destination);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = buildPdfHtml(data, fullRouteUrl);
  document.body.appendChild(container);

  const root = container.querySelector('#itinerary-pdf-root') as HTMLElement;
  if (!root) {
    document.body.removeChild(container);
    throw new Error('Falha ao montar o PDF');
  }

  await new Promise((r) => setTimeout(r, 800));

  try {
    const annotations = collectLinkAnnotations(root);
    const rootCssWidth = root.getBoundingClientRect().width;

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pxToMm = imgWidth / rootCssWidth;

    let heightLeft = imgHeight;
    let position = 0;

    const addLinksForPage = (pageOffsetMm: number) => {
      annotations.forEach((a) => {
        const xMm = a.x * pxToMm;
        const yMm = a.y * pxToMm + pageOffsetMm;
        const wMm = a.w * pxToMm;
        const hMm = a.h * pxToMm;
        if (yMm + hMm < 0 || yMm > pageHeight) return;
        const yStart = Math.max(0, yMm);
        const yEnd = Math.min(pageHeight, yMm + hMm);
        const clippedH = yEnd - yStart;
        if (clippedH <= 0) return;
        pdf.link(xMm, yStart, wMm, clippedH, { url: a.url });
      });
    };

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    addLinksForPage(position);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      addLinksForPage(position);
      heightLeft -= pageHeight;
    }

    const slug = (data.destination || data.title || 'roteiro')
      .replace(/[^a-zA-Z0-9\u00C0-\u024F]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    pdf.save(`roteiro-${slug}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
