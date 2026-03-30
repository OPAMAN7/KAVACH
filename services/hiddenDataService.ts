/**
 * KAVACH — Hidden Data Service
 * FOCA-style metadata & hidden information extractor
 * Runs 100% in-browser using FileReader, DataView, and regex-based parsers.
 */

export interface ExtractedMetadata {
  // --- Core identity fields ---
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;

  // --- Document metadata ---
  title?: string;
  author?: string;
  lastModifiedBy?: string;
  creator?: string;          // software that created the doc
  producer?: string;         // PDF producer
  subject?: string;
  description?: string;
  keywords?: string[];
  language?: string;
  category?: string;
  contentStatus?: string;

  // --- Timestamps ---
  createdAt?: string;
  modifiedAt?: string;
  lastPrinted?: string;

  // --- Software fingerprint ---
  softwareGenerator?: string;
  applicationVersion?: string;
  osHint?: string;

  // --- GPS / location ---
  gpsLat?: number;
  gpsLng?: number;
  gpsAlt?: number;
  gpsTimestamp?: string;
  cameraModel?: string;
  cameraMake?: string;
  imageWidth?: number;
  imageHeight?: number;
  flashUsed?: string;
  exposureTime?: string;
  fNumber?: string;
  isoSpeed?: string;
  focalLength?: string;
  colorSpace?: string;

  // --- Network / path hints ---
  embeddedPaths?: string[];
  embeddedEmails?: string[];
  embeddedUrls?: string[];
  embeddedIPs?: string[];
  internalServers?: string[];

  // --- History / revision ---
  revisionNumber?: string;
  totalEditingTime?: string;
  pageCount?: number;
  wordCount?: number;
  charCount?: number;
  paragraphCount?: number;
  lineCount?: number;
  slideCount?: number;

  // --- Extra chunks ---
  rawChunks?: { label: string; value: string }[];
  riskFlags?: RiskFlag[];
}

export interface RiskFlag {
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  description: string;
  value: string;
}

export interface HiddenDataReport {
  id: string;
  source: 'upload' | 'url';
  sourceLabel: string;
  extractedAt: string;
  meta: ExtractedMetadata;
  rawTextPreview?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function bytesToHex(bytes: Uint8Array, n = 32) {
  return Array.from(bytes.slice(0, n))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function extractEmails(text: string): string[] {
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(re) || [])];
}

function extractURLs(text: string): string[] {
  const re = /https?:\/\/[^\s"'<>)\]]+/g;
  return [...new Set(text.match(re) || [])];
}

function extractIPs(text: string): string[] {
  const re = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const all: string[] = text.match(re) || [];
  return [...new Set(all.filter((ip) => !ip.startsWith('0.')))];
}

function extractPaths(text: string): string[] {
  const re = /(?:[A-Za-z]:\\|\/(?:home|Users|var|etc|usr|tmp|opt|srv|root|mnt|private))[^\s"'<>)+\]]+/g;
  return [...new Set(text.match(re) || [])];
}

function detectInternalServers(paths: string[]): string[] {
  const servers: string[] = [];
  paths.forEach((p) => {
    const m = p.match(/^(?:[A-Za-z]:\\\\|\\\\)([^\\/:*?"<>|\r\n]+)/);
    if (m) servers.push(m[1]);
  });
  return [...new Set(servers)];
}

function buildRiskFlags(meta: ExtractedMetadata): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (meta.author) {
    flags.push({ severity: 'high', field: 'Author', description: 'Real name exposed in document metadata', value: meta.author });
  }
  if (meta.lastModifiedBy && meta.lastModifiedBy !== meta.author) {
    flags.push({ severity: 'high', field: 'Last Modified By', description: 'Secondary person identity leak', value: meta.lastModifiedBy });
  }
  if (meta.gpsLat !== undefined && meta.gpsLng !== undefined) {
    flags.push({ severity: 'critical', field: 'GPS Coordinates', description: 'Precise device location embedded in EXIF data', value: `${meta.gpsLat.toFixed(6)}, ${meta.gpsLng.toFixed(6)}` });
  }
  if ((meta.embeddedPaths || []).length > 0) {
    (meta.embeddedPaths || []).slice(0, 3).forEach((p) =>
      flags.push({ severity: 'high', field: 'File System Path', description: 'Internal file path reveals OS structure / username', value: p })
    );
  }
  if ((meta.internalServers || []).length > 0) {
    flags.push({ severity: 'critical', field: 'Internal Server', description: 'Server hostname embedded — reveals internal network topology', value: (meta.internalServers || []).join(', ') });
  }
  if ((meta.embeddedEmails || []).length > 0) {
    (meta.embeddedEmails || []).slice(0, 3).forEach((e) =>
      flags.push({ severity: 'medium', field: 'Embedded Email', description: 'Email address found inside document content', value: e })
    );
  }
  if ((meta.embeddedIPs || []).length > 0) {
    (meta.embeddedIPs || []).slice(0, 2).forEach((ip) =>
      flags.push({ severity: 'medium', field: 'Embedded IP', description: 'Internal/external IP address found in content', value: ip })
    );
  }
  if (meta.softwareGenerator) {
    flags.push({ severity: 'low', field: 'Software Fingerprint', description: 'Authoring software version can aid targeted attacks', value: meta.softwareGenerator });
  }
  if (meta.cameraModel) {
    flags.push({ severity: 'medium', field: 'Camera Model', description: 'Device hardware fingerprint from EXIF', value: `${meta.cameraMake || ''} ${meta.cameraModel}`.trim() });
  }

  return flags;
}

// ─── DOCX / ODT / XLSX / PPTX (ZIP-based XML) ────────────────────────────────

async function extractFromZipXml(buffer: ArrayBuffer, fileName: string): Promise<ExtractedMetadata> {
  // Dynamically import JSZip from CDN if not available
  const text = await readZipEntries(buffer);
  const meta: ExtractedMetadata = { fileName, fileType: detectFileType(fileName), fileSize: buffer.byteLength, mimeType: '' };

  const coreMatch = text['docProps/core.xml'] || text['docProps/core.xml'.toLowerCase()] || '';
  const appMatch = text['docProps/app.xml'] || text['docProps/app.xml'.toLowerCase()] || '';
  const allText = Object.values(text).join('\n');

  // Core properties
  meta.title = xmlTag(coreMatch, 'dc:title') || xmlTag(coreMatch, 'cp:title');
  meta.author = xmlTag(coreMatch, 'dc:creator') || xmlTag(coreMatch, 'cp:lastModifiedBy');
  meta.lastModifiedBy = xmlTag(coreMatch, 'cp:lastModifiedBy');
  meta.subject = xmlTag(coreMatch, 'dc:subject');
  meta.description = xmlTag(coreMatch, 'dc:description') || xmlTag(coreMatch, 'cp:description');
  meta.keywords = splitKeywords(xmlTag(coreMatch, 'cp:keywords') || xmlTag(coreMatch, 'meta:keyword') || '');
  meta.language = xmlTag(coreMatch, 'dc:language');
  meta.category = xmlTag(coreMatch, 'cp:category');
  meta.contentStatus = xmlTag(coreMatch, 'cp:contentStatus');
  meta.createdAt = xmlTag(coreMatch, 'dcterms:created');
  meta.modifiedAt = xmlTag(coreMatch, 'dcterms:modified');
  meta.lastPrinted = xmlTag(coreMatch, 'cp:lastPrinted');
  meta.revisionNumber = xmlTag(coreMatch, 'cp:revision');

  // App properties
  meta.softwareGenerator = xmlTag(appMatch, 'Application');
  meta.applicationVersion = xmlTag(appMatch, 'AppVersion');
  const company = xmlTag(appMatch, 'Company');
  if (company) meta.creator = company;
  meta.totalEditingTime = xmlTag(appMatch, 'TotalTime');
  meta.pageCount = toNum(xmlTag(appMatch, 'Pages') || xmlTag(appMatch, 'Slides'));
  meta.wordCount = toNum(xmlTag(appMatch, 'Words'));
  meta.charCount = toNum(xmlTag(appMatch, 'Characters'));
  meta.paragraphCount = toNum(xmlTag(appMatch, 'Paragraphs'));
  meta.lineCount = toNum(xmlTag(appMatch, 'Lines'));
  meta.slideCount = toNum(xmlTag(appMatch, 'Slides'));

  // Mining all XML for secrets
  meta.embeddedEmails = extractEmails(allText);
  meta.embeddedUrls = extractURLs(allText);
  meta.embeddedIPs = extractIPs(allText);
  meta.embeddedPaths = extractPaths(allText);
  meta.internalServers = detectInternalServers(meta.embeddedPaths);

  // Author from path hint e.g. C:\Users\john\
  if (!meta.author && (meta.embeddedPaths || []).length > 0) {
    const pathAuthor = extractAuthorFromPath(meta.embeddedPaths![0]);
    if (pathAuthor) meta.author = pathAuthor + ' (inferred from path)';
  }

  meta.riskFlags = buildRiskFlags(meta);
  return meta;
}

function xmlTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() || undefined : undefined;
}

function splitKeywords(raw: string): string[] | undefined {
  if (!raw) return undefined;
  return raw.split(/[;,\s]+/).filter(Boolean);
}

function toNum(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

// Simple ZIP reader using DataView – reads local file headers
async function readZipEntries(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const data = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const entries: Record<string, string> = {};
  let offset = 0;

  while (offset < bytes.length - 4) {
    const sig = data.getUint32(offset, true);
    if (sig !== 0x04034b50) { offset++; continue; }
    if (offset + 30 > bytes.length) break;

    const compression = data.getUint16(offset + 8, true);
    const compressedSize = data.getUint32(offset + 18, true);
    const fnLen = data.getUint16(offset + 26, true);
    const extraLen = data.getUint16(offset + 28, true);

    if (offset + 30 + fnLen + extraLen > bytes.length) break;

    const fnBytes = bytes.slice(offset + 30, offset + 30 + fnLen);
    const entryName = new TextDecoder().decode(fnBytes);
    const dataOffset = offset + 30 + fnLen + extraLen;

    if (
      compression === 0 &&
      compressedSize > 0 &&
      dataOffset + compressedSize <= bytes.length &&
      (entryName.endsWith('.xml') || entryName.endsWith('.rels'))
    ) {
      try {
        const content = new TextDecoder('utf-8').decode(
          bytes.slice(dataOffset, dataOffset + compressedSize)
        );
        entries[entryName] = content;
      } catch (_) {}
    }

    offset = dataOffset + compressedSize;
  }

  // Try DecompressionStream for deflated entries
  if (typeof DecompressionStream !== 'undefined') {
    offset = 0;
    while (offset < bytes.length - 4) {
      const sig = data.getUint32(offset, true);
      if (sig !== 0x04034b50) { offset++; continue; }
      if (offset + 30 > bytes.length) break;

      const compression = data.getUint16(offset + 8, true);
      const compressedSize = data.getUint32(offset + 18, true);
      const fnLen = data.getUint16(offset + 26, true);
      const extraLen = data.getUint16(offset + 28, true);

      if (offset + 30 + fnLen + extraLen > bytes.length) break;
      const fnBytes2 = bytes.slice(offset + 30, offset + 30 + fnLen);
      const entryName2 = new TextDecoder().decode(fnBytes2);
      const dataOffset2 = offset + 30 + fnLen + extraLen;

      if (
        compression === 8 &&
        compressedSize > 0 &&
        dataOffset2 + compressedSize <= bytes.length &&
        (entryName2.endsWith('.xml') || entryName2.endsWith('.rels')) &&
        !entries[entryName2]
      ) {
        try {
          const compressed = bytes.slice(dataOffset2, dataOffset2 + compressedSize);
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compressed);
          writer.close();
          const out = await new Response(ds.readable).arrayBuffer();
          entries[entryName2] = new TextDecoder('utf-8').decode(out);
        } catch (_) {}
      }
      offset = dataOffset2 + compressedSize;
    }
  }

  return entries;
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function extractFromPDF(buffer: ArrayBuffer, fileName: string): Promise<ExtractedMetadata> {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('latin1').decode(bytes);

  const meta: ExtractedMetadata = { fileName, fileType: 'PDF', fileSize: buffer.byteLength, mimeType: 'application/pdf' };

  // PDF info dictionary
  meta.title = pdfField(text, 'Title');
  meta.author = pdfField(text, 'Author');
  meta.subject = pdfField(text, 'Subject');
  meta.creator = pdfField(text, 'Creator');   // authoring app
  meta.producer = pdfField(text, 'Producer'); // PDF library
  meta.softwareGenerator = meta.creator || meta.producer;
  meta.keywords = splitKeywords(pdfField(text, 'Keywords') || '');
  meta.createdAt = pdfField(text, 'CreationDate');
  meta.modifiedAt = pdfField(text, 'ModDate');

  // OS hint from producer string
  if (meta.producer) {
    if (/windows/i.test(meta.producer)) meta.osHint = 'Windows';
    else if (/mac|darwin|osx/i.test(meta.producer)) meta.osHint = 'macOS';
    else if (/linux/i.test(meta.producer)) meta.osHint = 'Linux';
  }

  // XMP metadata block
  const xmpMatch = text.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/i);
  if (xmpMatch) {
    const xmp = xmpMatch[0];
    meta.author = meta.author || xmlTag(xmp, 'dc:creator') || xmpSeq(xmp, 'dc:creator');
    meta.title = meta.title || xmlTag(xmp, 'dc:title') || xmpSeq(xmp, 'dc:title');
    meta.description = xmlTag(xmp, 'dc:description') || xmpSeq(xmp, 'dc:description');
    meta.language = xmlTag(xmp, 'dc:language') || xmpSeq(xmp, 'dc:language');
    meta.softwareGenerator = meta.softwareGenerator || xmlTag(xmp, 'xmp:CreatorTool');
    meta.createdAt = meta.createdAt || xmlTag(xmp, 'xmp:CreateDate');
    meta.modifiedAt = meta.modifiedAt || xmlTag(xmp, 'xmp:ModifyDate');
    meta.pageCount = toNum(xmlTag(xmp, 'pdf:PageCount') || xmlTag(xmp, 'xmpTPg:NPages'));
  }

  meta.embeddedEmails = extractEmails(text);
  meta.embeddedUrls = extractURLs(text);
  meta.embeddedIPs = extractIPs(text);
  meta.embeddedPaths = extractPaths(text);
  meta.internalServers = detectInternalServers(meta.embeddedPaths);

  if (!meta.author && (meta.embeddedPaths || []).length > 0) {
    const pa = extractAuthorFromPath(meta.embeddedPaths![0]);
    if (pa) meta.author = pa + ' (inferred)';
  }

  meta.riskFlags = buildRiskFlags(meta);
  return meta;
}

function pdfField(text: string, field: string): string | undefined {
  const re = new RegExp(`\\/${field}\\s*\\(([^)]*)\\)`, 'i');
  const m = text.match(re);
  if (m) return decodeOctal(m[1]).trim() || undefined;
  // Try UTF-16 BOM version
  const re2 = new RegExp(`\\/${field}\\s*<([0-9a-fA-F]+)>`, 'i');
  const m2 = text.match(re2);
  if (m2) {
    try {
      const hex = m2[1];
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      return new TextDecoder('utf-16be').decode(bytes).replace(/\u0000/g, '').trim() || undefined;
    } catch { return undefined; }
  }
  return undefined;
}

function decodeOctal(s: string): string {
  return s.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function xmpSeq(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}>[\\s\\S]*?<rdf:li[^>]*>([^<]+)<\\/rdf:li>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : undefined;
}

// ─── JPEG / TIFF EXIF ────────────────────────────────────────────────────────

async function extractFromImage(buffer: ArrayBuffer, fileName: string): Promise<ExtractedMetadata> {
  const bytes = new Uint8Array(buffer);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isJpeg = ext === 'jpg' || ext === 'jpeg';
  const isTiff = ext === 'tif' || ext === 'tiff';
  const isPng = ext === 'png';

  const meta: ExtractedMetadata = {
    fileName,
    fileType: ext.toUpperCase(),
    fileSize: buffer.byteLength,
    mimeType: isJpeg ? 'image/jpeg' : isTiff ? 'image/tiff' : isPng ? 'image/png' : 'image/*',
  };

  if (isJpeg) {
    parseExif(buffer, meta);
  } else if (isTiff) {
    parseTiffExif(buffer, meta, 0);
  } else if (isPng) {
    parsePngChunks(bytes, meta);
  }

  meta.riskFlags = buildRiskFlags(meta);
  return meta;
}

function parsePngChunks(bytes: Uint8Array, meta: ExtractedMetadata) {
  let offset = 8; // skip PNG signature
  const dv = new DataView(bytes.buffer);
  while (offset < bytes.length - 12) {
    const chunkLen = dv.getUint32(offset, false);
    const type = String.fromCharCode(bytes[offset+4], bytes[offset+5], bytes[offset+6], bytes[offset+7]);
    if (type === 'tEXt' || type === 'iTXt') {
      const textData = new TextDecoder('latin1').decode(bytes.slice(offset + 8, offset + 8 + chunkLen));
      const parts = textData.split('\0');
      if (parts.length >= 2) {
        const key = parts[0].toLowerCase();
        const val = parts[1] || parts[parts.length - 1];
        if (key === 'author') meta.author = val;
        else if (key === 'comment' || key === 'description') meta.description = val;
        else if (key === 'software') meta.softwareGenerator = val;
        else if (key === 'creation time' || key === 'date:create') meta.createdAt = val;
        else if (key === 'title') meta.title = val;
        else if (!meta.rawChunks) meta.rawChunks = [{ label: parts[0], value: val }];
        else meta.rawChunks.push({ label: parts[0], value: val });
      }
    }
    offset += 12 + chunkLen;
    if (type === 'IEND') break;
  }
}

function parseExif(buffer: ArrayBuffer, meta: ExtractedMetadata) {
  const bytes = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  let offset = 2; // skip SOI marker

  while (offset < bytes.length - 2) {
    if (bytes[offset] !== 0xFF) break;
    const marker = bytes[offset + 1];
    if (marker === 0xE1) {
      // APP1 — EXIF
      const len = dv.getUint16(offset + 2, false);
      const slice = buffer.slice(offset + 4, offset + 2 + len);
      const header = new TextDecoder('latin1').decode(new Uint8Array(slice).slice(0, 6));
      if (header.startsWith('Exif')) {
        parseTiffExif(slice, meta, 6);
      }
      offset += 2 + len;
    } else if (marker >= 0xD0 && marker <= 0xD9) {
      offset += 2;
    } else {
      const len = dv.getUint16(offset + 2, false);
      offset += 2 + len;
    }
  }
}

function parseTiffExif(buffer: ArrayBuffer, meta: ExtractedMetadata, headerOffset: number) {
  try {
    const dv = new DataView(buffer);
    const byteOrder = dv.getUint16(headerOffset, false);
    const le = byteOrder === 0x4949; // II = little endian

    const ifdOffset = dv.getUint32(headerOffset + 4, le) + headerOffset;
    readIfd(dv, ifdOffset, headerOffset, le, meta, false);
  } catch (_) {}
}

function readIfd(dv: DataView, offset: number, base: number, le: boolean, meta: ExtractedMetadata, isGps: boolean) {
  if (offset + 2 > dv.byteLength) return;
  const count = dv.getUint16(offset, le);
  for (let i = 0; i < count; i++) {
    const o = offset + 2 + i * 12;
    if (o + 12 > dv.byteLength) break;
    const tag = dv.getUint16(o, le);
    const type = dv.getUint16(o + 2, le);
    const cnt = dv.getUint32(o + 4, le);
    const raw = dv.getUint32(o + 8, le);

    const str = () => {
      const len = cnt;
      const off = len > 4 ? raw + base : o + 8;
      if (off + len > dv.byteLength) return '';
      return new TextDecoder('latin1').decode(new Uint8Array(dv.buffer, off, len)).replace(/\u0000/g, '').trim();
    };

    const rational = (off2: number) => {
      if (off2 + 8 > dv.byteLength) return 0;
      const num = dv.getUint32(off2, le);
      const den = dv.getUint32(off2 + 4, le);
      return den ? num / den : 0;
    };

    const sRational = (off2: number) => {
      if (off2 + 8 > dv.byteLength) return 0;
      const num = dv.getInt32(off2, le);
      const den = dv.getInt32(off2 + 4, le);
      return den ? num / den : 0;
    };

    if (!isGps) {
      switch (tag) {
        case 0x010E: meta.description = str(); break;
        case 0x010F: meta.cameraMake = str(); break;
        case 0x0110: meta.cameraModel = str(); break;
        case 0x0131: meta.softwareGenerator = str(); break;
        case 0x013B: meta.author = str(); break;
        case 0x0132: meta.modifiedAt = str(); break;
        case 0x9003: meta.createdAt = str(); break;  // DateTimeOriginal
        case 0x9291: meta.createdAt = meta.createdAt || str(); break; // SubSecTimeOriginal
        case 0xA002: {
          const v = cnt <= 1 ? raw : dv.getUint32(raw + base, le);
          meta.imageWidth = v;
          break;
        }
        case 0xA003: {
          const v = cnt <= 1 ? raw : dv.getUint32(raw + base, le);
          meta.imageHeight = v;
          break;
        }
        case 0x9209: meta.flashUsed = raw & 1 ? 'Yes' : 'No'; break;
        case 0x9201: {
          const off2 = raw + base;
          meta.exposureTime = `1/${Math.round(1 / sRational(off2))}s`;
          break;
        }
        case 0x829D: {
          const off2 = raw + base;
          meta.fNumber = `f/${rational(off2).toFixed(1)}`;
          break;
        }
        case 0x8827: meta.isoSpeed = String(raw); break;
        case 0x920A: {
          const off2 = raw + base;
          meta.focalLength = `${rational(off2).toFixed(0)}mm`;
          break;
        }
        case 0xA001: meta.colorSpace = raw === 1 ? 'sRGB' : 'Adobe RGB'; break;
        case 0x8769: {
          // Sub IFD (Exif)
          const subOff = raw + base;
          readIfd(dv, subOff, base, le, meta, false);
          break;
        }
        case 0x8825: {
          // GPS IFD
          const gpsOff = raw + base;
          readIfd(dv, gpsOff, base, le, meta, true);
          break;
        }
      }
    } else {
      // GPS tags
      switch (tag) {
        case 2: { // GPSLatitude
          const off2 = raw + base;
          meta.gpsLat = (meta.gpsLat || 0) + rational(off2) + rational(off2 + 8) / 60 + rational(off2 + 16) / 3600;
          break;
        }
        case 1: { // GPSLatitudeRef
          const ref = str();
          if (ref === 'S' && meta.gpsLat !== undefined) meta.gpsLat = -meta.gpsLat;
          break;
        }
        case 4: { // GPSLongitude
          const off2 = raw + base;
          meta.gpsLng = (meta.gpsLng || 0) + rational(off2) + rational(off2 + 8) / 60 + rational(off2 + 16) / 3600;
          break;
        }
        case 3: { // GPSLongitudeRef
          const ref = str();
          if (ref === 'W' && meta.gpsLng !== undefined) meta.gpsLng = -meta.gpsLng;
          break;
        }
        case 6: { // GPSAltitude
          const off2 = raw + base;
          meta.gpsAlt = rational(off2);
          break;
        }
        case 29: meta.gpsTimestamp = str(); break;
      }
    }
  }
}

// ─── Generic text / binary ────────────────────────────────────────────────────

async function extractGeneric(buffer: ArrayBuffer, fileName: string): Promise<ExtractedMetadata> {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('latin1').decode(bytes);
  const meta: ExtractedMetadata = {
    fileName,
    fileType: detectFileType(fileName),
    fileSize: buffer.byteLength,
    mimeType: '',
  };

  meta.embeddedEmails = extractEmails(text);
  meta.embeddedUrls = extractURLs(text);
  meta.embeddedIPs = extractIPs(text);
  meta.embeddedPaths = extractPaths(text);
  meta.internalServers = detectInternalServers(meta.embeddedPaths);
  meta.rawChunks = [{ label: 'Hex Header', value: bytesToHex(bytes) }];
  meta.riskFlags = buildRiskFlags(meta);
  return meta;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function detectFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'PDF', docx: 'DOCX', doc: 'DOC', xlsx: 'XLSX', xls: 'XLS',
    pptx: 'PPTX', ppt: 'PPT', odt: 'ODT', ods: 'ODS', odp: 'ODP',
    jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', tif: 'TIFF', tiff: 'TIFF',
    gif: 'GIF', svg: 'SVG', mp4: 'MP4', mov: 'MOV', avi: 'AVI',
    mp3: 'MP3', wav: 'WAV', zip: 'ZIP', rar: 'RAR', '7z': '7Z',
  };
  return map[ext] || ext.toUpperCase() || 'UNKNOWN';
}

function extractAuthorFromPath(path: string): string | undefined {
  const m = path.match(/(?:Users|home)[\\/]+([^\\/\s"'<>]+)/i);
  return m ? m[1] : undefined;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function analyzeFile(file: File): Promise<HiddenDataReport> {
  const buffer = await file.arrayBuffer();
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  let meta: ExtractedMetadata;
  if (['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
    meta = await extractFromZipXml(buffer, name);
  } else if (ext === 'pdf') {
    meta = await extractFromPDF(buffer, name);
  } else if (['jpg', 'jpeg', 'tif', 'tiff', 'png'].includes(ext)) {
    meta = await extractFromImage(buffer, name);
  } else {
    meta = await extractGeneric(buffer, name);
  }

  return {
    id: uid(),
    source: 'upload',
    sourceLabel: name,
    extractedAt: new Date().toISOString(),
    meta,
  };
}

export async function analyzeURL(url: string): Promise<HiddenDataReport> {
  // Fetch via CORS proxy
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} — cannot fetch URL`);

  const ct = res.headers.get('content-type') || '';
  const buffer = await res.arrayBuffer();

  // Determine filename from URL
  const parts = url.split('/');
  const raw = parts[parts.length - 1].split('?')[0] || 'remote_file';
  const name = raw || 'remote_file';
  const ext = name.split('.').pop()?.toLowerCase() || '';

  let meta: ExtractedMetadata;
  if (['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
    meta = await extractFromZipXml(buffer, name);
  } else if (ext === 'pdf' || ct.includes('pdf')) {
    meta = await extractFromPDF(buffer, name);
  } else if (['jpg', 'jpeg', 'tif', 'tiff', 'png'].includes(ext) || ct.startsWith('image/')) {
    meta = await extractFromImage(buffer, name);
  } else {
    meta = await extractGeneric(buffer, name);
  }

  return {
    id: uid(),
    source: 'url',
    sourceLabel: url,
    extractedAt: new Date().toISOString(),
    meta,
  };
}
