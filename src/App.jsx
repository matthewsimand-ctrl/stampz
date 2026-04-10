import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./lib/supabase.js";

function dataURLtoBlob(dataurl) {
  let arr = dataurl.split(","), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const dbmapItem = item => ({
  ...item,
  id: item.id,
  type: item.type,
  image: item.image_url,
  label: item.label,
  location: item.location,
  city: item.city,
  country: item.country,
  note: item.note || "",
  stampColor: item.stamp_color,
  textColor: item.text_color,
  textStrokeColor: item.text_stroke_color,
  locationTextColor: item.location_text_color,
  locationStrokeColor: item.location_stroke_color,
  labelTextColor: item.label_text_color,
  labelStrokeColor: item.label_stroke_color,
  copyrightTextColor: item.copyright_text_color,
  copyrightStrokeColor: item.copyright_stroke_color,
  agingIntensity: item.aging_intensity,
  collection: item.collection,
  author: item.profiles?.username || "collector",
  accentColor: item.profiles?.avatar_color || "#4A322D",
  locationLat: item.location_lat,
  locationLng: item.location_lng,
  locationLabel: item.location_label,
  gradient: item.gradient,
  createdAt: item.created_at
});


const STAMP_COLORS = ['#FFFDF8', '#FDE2E4', '#DDEAFB', '#E9E6FF', '#DFF4EE', '#FFF0D2', '#F7D7E8', '#F8ECE6'];
const STAMP_TEXT_COLORS = ['#FFFFFF', '#4A322D', '#315476', '#8A3D2C', '#5B4F7E', '#476758', '#A95A3B', '#1F3F63', '#8C2146', '#7A680D', '#3A3A5A', '#2E5B4F', '#A24A16'];
const STAMP_STROKE_COLORS = ['#FFFDFC', '#F6E5D8', '#D7E4F6', '#D9D1EE', '#EED7CF', '#F7D7E8', '#DCEEDD', '#B8CADF', '#8F766D', '#4A322D'];
const LOCATION_SETTINGS_KEY = 'stampz.locationTrackingEnabled';
const CURRENT_YEAR = 2026;
const COLLECTIONS = ['Destinations', 'Nature', 'Architecture', 'Food & Culture', 'Wildlife', 'People & Culture', 'Abstract'];
const PROFILE_STORAGE_KEY = 'stampz.profile';
const COLLECTION_STORAGE_PREFIX = 'stampz.collection';
const LEGACY_PROFILE_STORAGE_KEY = 'stampworld.profile';
const LEGACY_COLLECTION_STORAGE_PREFIX = 'stampworld.collection';

const COMMUNITY_STAMPS = [
  { id: 'c1', type: 'stamp', country: 'NIPPON', denomination: '¥120', label: 'Cherry Blossom', gradient: 'linear-gradient(135deg,#f8b4c8,#ff6b9d,#c44569)', collection: 'Nature', author: 'hanami_ko', likes: 247, accentColor: '#c44569' },
  { id: 'c2', type: 'stamp', country: 'FRANCE', denomination: '€0.88', label: 'La Tour Eiffel', gradient: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', collection: 'Destinations', author: 'paris_phil', likes: 189, accentColor: 'var(--accent-strong)' },
  { id: 'c3', type: 'stamp', country: 'BRASIL', denomination: 'R$3.75', label: 'Carnaval', gradient: 'linear-gradient(135deg,#f7971e,#ffd200)', collection: 'Food & Culture', author: 'rio_stamps', likes: 134, accentColor: '#B87333' },
  { id: 'c4', type: 'stamp', country: 'KENYA', denomination: 'KES 50', label: 'Savanna Dusk', gradient: 'linear-gradient(135deg,#d4a843,#8B6014)', collection: 'Wildlife', author: 'safari_co', likes: 312, accentColor: '#8B4513' },
  { id: 'c5', type: 'stamp', country: 'ÍSLAND', denomination: 'kr.250', label: 'Norðurljós', gradient: 'linear-gradient(135deg,#0f3460,#533483,#16c79a)', collection: 'Nature', author: 'aurora_fan', likes: 428, accentColor: '#533483' },
  { id: 'c6', type: 'stamp', country: 'INDIA', denomination: '₹5.00', label: 'Taj Mahal', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', collection: 'Architecture', author: 'heritage_stamps', likes: 267, accentColor: '#f5576c' },
  { id: 'c7', type: 'stamp', country: 'PERÚ', denomination: 'S/.3.00', label: 'Machu Picchu', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', collection: 'Destinations', author: 'inca_trail', likes: 198, accentColor: '#336699' },
  { id: 'c8', type: 'stamp', country: 'ITALIA', denomination: '€1.20', label: 'La Cucina', gradient: 'linear-gradient(135deg,#a8edea,#fed6e3)', collection: 'Food & Culture', author: 'cucina_co', likes: 156, accentColor: 'var(--accent-red)' },
  { id: 'c9', type: 'stamp', country: 'MAROC', denomination: 'MAD 8', label: 'Medina', gradient: 'linear-gradient(135deg,#e96c2a,#f5a623,#c0392b)', collection: 'Architecture', author: 'souk_stamps', likes: 203, accentColor: '#c0392b' },
  { id: 'c10', type: 'stamp', country: 'CANADA', denomination: 'CA$1.07', label: 'Aurora', gradient: 'linear-gradient(135deg,#a7f3d0,#a5b4fc,#f0abfc)', collection: 'Nature', author: 'northern_phil', likes: 381, accentColor: 'var(--accent-red)' },
  { id: 'c11', type: 'stamp', country: 'GREECE', denomination: '€0.95', label: 'Santorini', gradient: 'linear-gradient(135deg,#0099cc,#ffffff,#0055aa)', collection: 'Destinations', author: 'aegean_stamps', likes: 145, accentColor: '#0055aa' },
  { id: 'c12', type: 'stamp', country: 'GHANA', denomination: 'GHS 5', label: 'Kente Cloth', gradient: 'linear-gradient(135deg,#006b3f,#fcd116,#ce1126)', collection: 'People & Culture', author: 'accra_philately', likes: 289, accentColor: '#006b3f' },
];

const COMMUNITY_PROFILES = {
  hanami_ko: { name: 'Ko Arai', location: 'Kyoto, Japan', bio: 'Soft botanical issues and seasonal Japan finds.', color: 'var(--accent-red)' },
  paris_phil: { name: 'Philippe Laurent', location: 'Paris, France', bio: 'Landmark stamps, postal history, and city breaks.', color: 'var(--accent-strong)' },
  rio_stamps: { name: 'Ana Costa', location: 'Rio de Janeiro, Brasil', bio: 'Colorful culture stamps from festivals and food markets.', color: '#FFB86B' },
  safari_co: { name: 'Amara Njoroge', location: 'Nairobi, Kenya', bio: 'Wildlife releases and golden-hour conservation issues.', color: '#8B4513' },
  aurora_fan: { name: 'Elin Jóns', location: 'Reykjavík, Iceland', bio: 'Northern light palettes, landscapes, and quiet nature collections.', color: '#B48CFF' },
  heritage_stamps: { name: 'Mira Kapoor', location: 'Agra, India', bio: 'Architecture, monuments, and heritage stamp sheets.', color: '#f5576c' },
  inca_trail: { name: 'Mateo Quispe', location: 'Cusco, Peru', bio: 'Mountain destinations and travel-led issues.', color: '#336699' },
  cucina_co: { name: 'Lucia Romano', location: 'Bologna, Italia', bio: 'Food culture, kitchen stories, and warm pastel stamps.', color: 'var(--accent-red)' },
  souk_stamps: { name: 'Youssef Amrani', location: 'Marrakesh, Maroc', bio: 'Markets, medinas, and architectural texture.', color: '#c0392b' },
  northern_phil: { name: 'Nora Ellis', location: 'Yellowknife, Canada', bio: 'Aurora collections and cold-weather commemoratives.', color: '#7BDCB5' },
  aegean_stamps: { name: 'Nikos Vale', location: 'Santorini, Greece', bio: 'Island palettes, sea blues, and travel keepsakes.', color: '#0055aa' },
  accra_philately: { name: 'Ama Mensah', location: 'Accra, Ghana', bio: 'Textiles, culture, and bold commemorative releases.', color: '#006b3f' },
};

const AUTH_HERO_STAMP = {
  type: 'stamp',
  country: 'CANADA',
  origin: 'Vancouver, Canada',
  label: 'North Shore Morning',
  note: 'Sea glass skies and a quiet harbor.',
  stampColor: '#DDEAFB',
  agingIntensity: 18,
  createdAt: new Date(`${CURRENT_YEAR}-01-01`).toISOString(),
  image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
};

let _n = 0;
const genId = () => `item_${Date.now()}_${_n++}`;

function readStoredJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function collectionStorageKey(email) {
  return `${COLLECTION_STORAGE_PREFIX}:${email.trim().toLowerCase()}`;
}

function legacyCollectionStorageKey(email) {
  return `${LEGACY_COLLECTION_STORAGE_PREFIX}:${email.trim().toLowerCase()}`;
}

function readStoredProfile() {
  return readStoredJSON(PROFILE_STORAGE_KEY, null) || readStoredJSON(LEGACY_PROFILE_STORAGE_KEY, null);
}

function readStoredCollection(email) {
  const savedItems = readStoredJSON(collectionStorageKey(email), null);
  if (Array.isArray(savedItems)) return savedItems;

  const legacyItems = readStoredJSON(legacyCollectionStorageKey(email), []);
  return Array.isArray(legacyItems) ? legacyItems : [];
}

function getCommunityProfile(author) {
  return COMMUNITY_PROFILES[author] || {
    name: author,
    location: 'Stampz community',
    bio: 'Collector profile from the Stampz community.',
    color: '#7DA9D9',
  };
}

function createDraft(type, currentLocation = null) {
  return {
    type,
    image: null,
    imageRaw: null,
    location: '',
    label: '',
    note: '',
    accentColor: 'var(--accent-strong)',
    stampColor: '#FFFDF8',
    textColor: '#4A322D',
    textStrokeColor: '#FFFDFC',
    locationTextColor: null,
    locationStrokeColor: null,
    labelTextColor: null,
    labelStrokeColor: null,
    copyrightTextColor: null,
    copyrightStrokeColor: null,
    agingIntensity: 36,
    collection: 'Destinations',
    destination: '',
    message: '',
    from: '',
    recipient: '',
    gradient: '',
    locationLat: currentLocation?.lat ?? null,
    locationLng: currentLocation?.lng ?? null,
    locationLabel: currentLocation ? `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 'Unplaced',
  };
}

/* ── Perforation hole geometry ── */
function buildPerfHoles(x, y, w, h, holeR, spacing) {
  const hCount = Math.max(3, Math.round(w / spacing));
  const vCount = Math.max(3, Math.round(h / spacing));
  const hSp = w / hCount;
  const vSp = h / vCount;
  const holes = [];
  for (let i = 0; i <= hCount; i++) {
    holes.push({ cx: x + i * hSp, cy: y });
    holes.push({ cx: x + i * hSp, cy: y + h });
  }
  for (let i = 1; i < vCount; i++) {
    holes.push({ cx: x, cy: y + i * vSp });
    holes.push({ cx: x + w, cy: y + i * vSp });
  }
  return holes;
}

/* ── CSS/SVG stamp mask for StampView ── */
function buildStampMask(w, h, hole, sp, maskId) {
  const hCount = Math.round(w / sp);
  const hSp = w / hCount;
  const vCount = Math.round(h / sp);
  const vSp = h / vCount;

  let cutouts = '';
  // Draw circles exactly on the geometric boundaries
  for (let i = 0; i <= hCount; i++) {
    const x = (i * hSp).toFixed(1);
    cutouts += `<circle cx="${x}" cy="0" r="${hole}"/><circle cx="${x}" cy="${h}" r="${hole}"/>`;
  }
  for (let i = 0; i <= vCount; i++) {
    const y = (i * vSp).toFixed(1);
    cutouts += `<circle cx="0" cy="${y}" r="${hole}"/><circle cx="${w}" cy="${y}" r="${hole}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><mask id="${maskId}"><rect width="${w}" height="${h}" fill="white"/><g fill="black" stroke="black" stroke-width="0.5">${cutouts}</g></mask></defs><rect width="${w}" height="${h}" fill="white" mask="url(#${maskId})"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const STAMP_SIZES = {
  xs: { w: 86, h: 106, frame: 8, hole: 2.8, sp: 8.8 },
  sm: { w: 124, h: 154, frame: 12, hole: 4.2, sp: 12.8 },
  md: { w: 158, h: 198, frame: 14, hole: 5.2, sp: 15.6 },
  lg: { w: 218, h: 272, frame: 20, hole: 7.2, sp: 21.4 },
  xl: { w: 280, h: 350, frame: 24, hole: 9, sp: 27.6 },
};

const TILE_SIZE = 256;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function latLngToWorld(lat, lng, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const safeLat = clamp(lat, -85.05112878, 85.05112878);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (safeLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

function worldToLatLng(x, y, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: clamp(lat, -85.05112878, 85.05112878),
    lng,
  };
}

function normalizeTileX(x, zoom) {
  const tilesPerAxis = Math.pow(2, zoom);
  return ((x % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
}

function clampTileY(y, zoom) {
  const max = Math.pow(2, zoom) - 1;
  return clamp(y, 0, max);
}

function getAgingStyle(intensity = 36) {
  const age = clamp(intensity, 0, 100) / 100;
  return {
    imageFilter: `sepia(${(age * 0.42).toFixed(2)}) saturate(${(1 - age * 0.28).toFixed(2)}) contrast(${(1 - age * 0.12).toFixed(2)}) brightness(${(1 - age * 0.09).toFixed(2)})`,
    paperOverlay: {
      background: `linear-gradient(180deg, rgba(196, 164, 118, ${(age * 0.14).toFixed(3)}), rgba(120, 92, 62, ${(age * 0.08).toFixed(3)}))`,
      mixBlendMode: 'multiply',
      opacity: 1,
    },
    grainOpacity: 0.06 + age * 0.18,
    borderColor: `rgba(181, 157, 141, ${(0.45 + age * 0.34).toFixed(3)})`,
  };
}

function ScallopEdges({ inset, marginX, marginY, radius, step, color = 'white' }) {
  const diameter = radius * 2;
  return (
    <div style={{ position: 'absolute', inset, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: marginX,
          right: marginX,
          top: -radius,
          height: diameter,
          background: `radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${step}px ${diameter}px repeat-x`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: marginX,
          right: marginX,
          bottom: -radius,
          height: diameter,
          background: `radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${step}px ${diameter}px repeat-x`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: marginY,
          bottom: marginY,
          left: -radius,
          width: diameter,
          background: `radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${diameter}px ${step}px repeat-y`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: marginY,
          bottom: marginY,
          right: -radius,
          width: diameter,
          background: `radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${diameter}px ${step}px repeat-y`,
        }}
      />
    </div>
  );
}

/* ── StampView ── */
function StampView({ item, size = 'md', onClick, showMeta = false }) {
  const { w, h, hole, sp } = STAMP_SIZES[size];
  const stampBg = item.stampColor || '#F6DDE2';
  const stampPaper = '#FFFDFC';
  const edgeStroke = 'rgba(188, 172, 172, 0.82)';
  const textColor = item.textColor || '#4A322D';
  const textStrokeColor = item.textStrokeColor || 'rgba(255,252,248,0.92)';
  const aging = getAgingStyle(item.agingIntensity ?? 36);
  const outerRadius = Math.max(12, w * 0.08);
  const maskId = useMemo(() => `mask_${Math.random().toString(36).slice(2, 11)}`, []);

  const cutouts = useMemo(() => {
    let circles = [];
    const hCount = Math.floor(w / sp);
    const hSp = w / hCount;
    for (let i = 0; i <= hCount; i++) {
      const x = i * hSp;
      circles.push(<circle key={`hT-${i}`} cx={x} cy={0} r={hole} />);
      circles.push(<circle key={`hB-${i}`} cx={x} cy={h} r={hole} />);
    }
    const vCount = Math.floor(h / sp);
    const vSp = h / vCount;
    for (let i = 0; i <= vCount; i++) {
      const y = i * vSp;
      circles.push(<circle key={`vL-${i}`} cx={0} cy={y} r={hole} />);
      circles.push(<circle key={`vR-${i}`} cx={w} cy={y} r={hole} />);
    }
    return circles;
  }, [w, h, hole, sp]);

  const photoInsetX = Math.max(15, w * 0.095);
  const photoInsetTop = Math.max(15, w * 0.095);
  const photoInsetBottom = Math.max(38, h * 0.22);
  const imageHeight = h - photoInsetTop - photoInsetBottom;
  const countryFont = Math.max(8, w * 0.06);
  const labelFont = Math.max(8, w * 0.056);
  const metaFont = Math.max(6, w * 0.038);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.22s', filter: 'drop-shadow(0 18px 30px rgba(30, 34, 48, 0.16))' }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'scale(1.05) rotate(-1.5deg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
        onClick={onClick}>
        <div style={{ width: w, height: h, position: 'relative', overflow: 'visible' }}>
          {/* True Vector Perforations using SVG Component */}
          <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, width: w, height: h, overflow: 'visible' }}>
            <defs>
              <mask id={maskId}>
                <rect width={w} height={h} fill="white" rx={outerRadius} />
                <g fill="black">{cutouts}</g>
              </mask>
            </defs>
            {/* Edge Stroke Layer */}
            <rect width={w} height={h} fill={edgeStroke} mask={`url(#${maskId})`} />
            {/* Paper Background Layer (Inset 1.5px for border effect) */}
            <rect x="1.5" y="1.5" width={w - 3} height={h - 3} fill={stampBg} rx={Math.max(outerRadius - 1, 0)} mask={`url(#${maskId})`} />
            {/* Inner Glow/Shadow Layer */}
            <rect x={w * 0.034} y={w * 0.034} width={w - (w * 0.068)} height={h - (w * 0.068)} fill="rgba(255,255,255,0.42)" rx={Math.max(outerRadius - 5, 0)} mask={`url(#${maskId})`} opacity="0.72" />
          </svg>

          {/* Photo and Text Content */}
          <div style={{ position: 'absolute', left: photoInsetX, right: photoInsetX, top: photoInsetTop, height: imageHeight, background: stampPaper, overflow: 'hidden', boxShadow: `0 0 0 1px ${aging.borderColor}, inset 0 0 0 1px rgba(255,255,255,0.56)` }}>
            {item.image
              ? <img src={item.image} alt={item.label} style={{ width: '100%', aspectRatio: '1 / 1.18', objectFit: 'cover', objectPosition: 'center center', display: 'block', background: stampPaper, filter: aging.imageFilter }} />
              : <div style={{ width: '100%', height: '100%', background: stampPaper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: Math.max(10, w * 0.1), fontStyle: 'italic', textAlign: 'center', padding: 6, fontFamily: 'var(--heading)', lineHeight: 1.3 }}>{item.label || 'Stamp'}</span>
              </div>
            }
            <div style={{ position: 'absolute', inset: 0, ...aging.paperOverlay, pointerEvents: 'none', zIndex: 1 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: aging.grainOpacity, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 1 }} />
            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)', pointerEvents: 'none', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: 10, right: 10, color: item.locationTextColor || textColor, fontSize: countryFont, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--sans)', writingMode: 'vertical-rl', textOrientation: 'mixed', zIndex: 2, textShadow: '0 1px 0 rgba(255,255,255,0.58)', WebkitTextStroke: `0.45px ${item.locationStrokeColor || textStrokeColor}` }}>
              {item.location || item.country || item.origin || 'STAMPZ'}
            </div>
          </div>
          <div style={{ position: 'absolute', left: photoInsetX, right: photoInsetX, bottom: 0, height: photoInsetBottom, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, zIndex: 2 }}>
            <div style={{ color: item.copyrightTextColor || textColor, opacity: 0.76, fontSize: metaFont, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--sans)', whiteSpace: 'nowrap', WebkitTextStroke: `0.35px ${item.copyrightStrokeColor || textStrokeColor}`, transform: 'translateY(-1px)' }}>
              {item.copyright || `© ${item.createdAt ? new Date(item.createdAt).getFullYear() : CURRENT_YEAR}`}
            </div>
            <div style={{ color: item.labelTextColor || textColor, fontSize: labelFont, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)', textShadow: '0 1px 0 rgba(255,255,255,0.6)', textAlign: 'right', WebkitTextStroke: `0.45px ${item.labelStrokeColor || textStrokeColor}`, transform: 'translateY(-1px)' }}>
              {item.label || ''}
            </div>
          </div>
        </div>
      </div>
      {showMeta && item.likes != null && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>♥ {item.likes.toLocaleString()}</span>}
      {showMeta && item.author && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>@{item.author}</span>}
    </div>
  );
}

function EditorStampPreview({ item, onClick, isTrayOpen, editorZoom = 1, setEditorZoom }) {
  const [prevDist, setPrevDist] = useState(0);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setPrevDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      if (prevDist > 0) {
        const delta = dist - prevDist;
        const zoomDelta = delta * 0.004;
        setEditorZoom?.(prev => Math.min(2.5, Math.max(0.5, prev + zoomDelta)));
      }
      setPrevDist(dist);
    }
  };

  const handleTouchEnd = () => setPrevDist(0);

  const preview = (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: isTrayOpen ? `scale(${0.85 * editorZoom}) translateY(-30vh)` : `scale(${1.35 * editorZoom}) translateY(-10vh)`, padding: '8px 0', touchAction: 'none' }}
    >
      <StampView item={item} size="xl" />
    </div>
  );
  if (!onClick) return preview;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open stamp preview"
      style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
    >
      {preview}
    </button>
  );
}

function WorldMap({ items, currentLocation, selectedItemId, onSelectStamp, onRequestLocation, focusSignal }) {
  const mapFrameRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const placedItems = items.filter(item => Number.isFinite(item.locationLat) && Number.isFinite(item.locationLng));
  const initialCenter = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [20, 0];
  const initialZoom = currentLocation ? 3 : 2;
  const [mapView, setMapView] = useState({
    centerLat: initialCenter[0],
    centerLng: initialCenter[1],
    zoom: initialZoom,
  });
  const [viewport, setViewport] = useState({ width: 430, height: 520 });

  useEffect(() => {
    if (!mapFrameRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setViewport({
        width: rect.width || 430,
        height: rect.height || 520,
      });
    });
    observer.observe(mapFrameRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!currentLocation || focusSignal == null) return;
    const frame = window.requestAnimationFrame(() => {
      setMapView(view => ({
        ...view,
        centerLat: currentLocation.lat,
        centerLng: currentLocation.lng,
        zoom: Math.max(view.zoom, 3),
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentLocation, focusSignal]);

  const projectPoint = useCallback((lat, lng, width, height) => {
    const center = latLngToWorld(mapView.centerLat, mapView.centerLng, mapView.zoom);
    const point = latLngToWorld(lat, lng, mapView.zoom);
    return {
      x: width / 2 + (point.x - center.x),
      y: height / 2 + (point.y - center.y),
    };
  }, [mapView.centerLat, mapView.centerLng, mapView.zoom]);

  const centerWorld = latLngToWorld(mapView.centerLat, mapView.centerLng, mapView.zoom);
  const viewLeft = centerWorld.x - viewport.width / 2;
  const viewTop = centerWorld.y - viewport.height / 2;
  const startTileX = Math.floor(viewLeft / TILE_SIZE);
  const endTileX = Math.floor((viewLeft + viewport.width) / TILE_SIZE);
  const startTileY = Math.floor(viewTop / TILE_SIZE);
  const endTileY = Math.floor((viewTop + viewport.height) / TILE_SIZE);
  const tilesPerAxis = Math.pow(2, mapView.zoom);
  const tiles = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tilesPerAxis) continue;
    const safeTileY = tileY;
    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      const safeTileX = normalizeTileX(tileX, mapView.zoom);
      tiles.push({
        key: `${mapView.zoom}-${tileX}-${tileY}`,
        src: `https://tile.openstreetmap.org/${mapView.zoom}/${safeTileX}/${safeTileY}.png`,
        left: tileX * TILE_SIZE - viewLeft,
        top: tileY * TILE_SIZE - viewTop,
      });
    }
  }

  const handlePointerDown = event => {
    if (event.pointerType === 'touch') return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    if (!mapFrameRef.current) return;
    const centerWorldPoint = latLngToWorld(mapView.centerLat, mapView.centerLng, mapView.zoom);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerWorldX: centerWorldPoint.x,
      centerWorldY: centerWorldPoint.y,
    };
    setIsDragging(true);
    mapFrameRef.current.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = event => {
    if (event.pointerType === 'touch') return;
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const next = worldToLatLng(
      dragRef.current.centerWorldX - dx,
      dragRef.current.centerWorldY - dy,
      mapView.zoom
    );

    // Limit boundaries
    const worldSize = TILE_SIZE * Math.pow(2, mapView.zoom);
    const halfH = viewport.height / 2;
    let finalWorldY;
    if (worldSize <= viewport.height) {
      finalWorldY = worldSize / 2;
    } else {
      const centerWorld = latLngToWorld(next.lat, next.lng, mapView.zoom);
      finalWorldY = clamp(centerWorld.y, halfH, worldSize - halfH);
    }
    const safeLatLng = worldToLatLng(dragRef.current.centerWorldX - dx, finalWorldY, mapView.zoom);

    setMapView(view => ({
      ...view,
      centerLat: safeLatLng.lat,
      centerLng: next.lng,
    }));
  };

  const handlePointerEnd = event => {
    if (event.pointerType === 'touch') return;
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    mapFrameRef.current?.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  };

  const getTouchDistance = touches => {
    if (touches.length < 2) return 0;
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = event => {
    if (event.target instanceof Element && event.target.closest('button')) return;
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const centerWorldPoint = latLngToWorld(mapView.centerLat, mapView.centerLng, mapView.zoom);
      dragRef.current = {
        touchId: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        centerWorldX: centerWorldPoint.x,
        centerWorldY: centerWorldPoint.y,
      };
      pinchRef.current = null;
      setIsDragging(true);
      return;
    }

    if (event.touches.length === 2) {
      pinchRef.current = {
        distance: getTouchDistance(event.touches),
        zoom: mapView.zoom,
      };
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const handleTouchMove = event => {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault();
      const nextDistance = getTouchDistance(event.touches);
      const zoomDelta = Math.log2(Math.max(nextDistance, 1) / Math.max(pinchRef.current.distance, 1));
      const nextZoom = clamp(Math.round((pinchRef.current.zoom + zoomDelta) * 2) / 2, 1, 12);
      if (nextZoom !== mapView.zoom) {
        setMapView(view => ({ ...view, zoom: nextZoom }));
      }
      return;
    }

    if (event.touches.length === 1 && dragRef.current) {
      const touch = event.touches[0];
      if (touch.identifier !== dragRef.current.touchId) return;
      event.preventDefault();
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      const next = worldToLatLng(
        dragRef.current.centerWorldX - dx,
        dragRef.current.centerWorldY - dy,
        mapView.zoom
      );

      // Limit boundaries
      const worldSize = TILE_SIZE * Math.pow(2, mapView.zoom);
      const halfH = viewport.height / 2;
      let finalWorldY;
      if (worldSize <= viewport.height) {
        finalWorldY = worldSize / 2;
      } else {
        const centerWorld = latLngToWorld(next.lat, next.lng, mapView.zoom);
        finalWorldY = clamp(centerWorld.y, halfH, worldSize - halfH);
      }
      const safeLatLng = worldToLatLng(dragRef.current.centerWorldX - dx, finalWorldY, mapView.zoom);

      setMapView(view => ({
        ...view,
        centerLat: safeLatLng.lat,
        centerLng: next.lng,
      }));
    }
  };

  const handleTouchEnd = event => {
    if (event.touches.length < 2) pinchRef.current = null;
    if (event.touches.length === 0) {
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  return (
    <div
      ref={mapFrameRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        borderRadius: 0,
        overflow: 'hidden',
        background: '#d4d4d6',
        borderBottom: '1px solid var(--border)',
        height: 'calc(100vh - 64px - env(safe-area-inset-top) - 74px - env(safe-area-inset-bottom))',
        minHeight: 380,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(120,126,141,0.08))', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(182,69,18,0.16) 1px, transparent 1.25px) 0 0 / 22px 22px', opacity: 0.18, pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {tiles.map(tile => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable="false"
            style={{
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              objectFit: 'cover',
              filter: 'saturate(0.9) contrast(1.03) brightness(1.02)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.18), transparent 32%, rgba(62,73,96,0.12))', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        {placedItems.map(item => {
          const point = projectPoint(item.locationLat, item.locationLng, viewport.width, viewport.height);
          const isSelected = item.id === selectedItemId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStamp(item)}
              aria-label={`Open ${item.label || item.country || 'stamp'} on map`}
              style={{ position: 'absolute', left: point.x - 10, top: point.y - 24, width: 20, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', pointerEvents: 'auto' }}
            >
              <div style={{ width: '100%', height: '100%', position: 'relative', transform: isSelected ? 'translateY(-1px) scale(1.08)' : 'scale(1)', transition: 'transform 0.18s', filter: isSelected ? 'drop-shadow(0 8px 14px rgba(176,117,86,0.32))' : 'drop-shadow(0 6px 12px rgba(40,47,63,0.18))' }}>
                <div style={{ position: 'absolute', left: '50%', bottom: 1, width: 8, height: 8, background: isSelected ? 'var(--accent-strong)' : 'var(--accent-red)', transform: 'translateX(-50%) rotate(45deg)', borderRadius: '0 0 2px 0' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, width: 18, height: 18, transform: 'translateX(-50%)', borderRadius: '50%', background: isSelected ? 'var(--accent-strong)' : 'var(--accent-red)', border: '2px solid rgba(255,255,255,0.92)', boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset' }} />
                <div style={{ position: 'absolute', left: '50%', top: 5, width: 8, height: 8, transform: 'translateX(-50%)', borderRadius: '50%', background: 'rgba(255,255,255,0.96)' }} />
              </div>
            </button>
          );
        })}
        {currentLocation && (() => {
          const point = projectPoint(currentLocation.lat, currentLocation.lng, viewport.width, viewport.height);
          return (
            <div
              style={{
                position: 'absolute',
                left: point.x - 7,
                top: point.y - 7,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--accent-strong)',
                border: '2px solid rgba(255,255,255,0.95)',
                boxShadow: '0 0 0 8px rgba(176,117,86,0.18)',
                pointerEvents: 'none'
              }}
            />
          );
        })()}
      </div>
      <div style={{ position: 'absolute', right: 16, bottom: 84, zIndex: 4, display: 'grid', gap: 10 }}>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setMapView(view => ({ ...view, zoom: clamp(view.zoom + 1, 1, 12) }))}
          style={{ minHeight: 0, width: 54, height: 54, borderRadius: 18, border: '1px solid rgba(255,255,255,0.72)', background: 'rgba(255,245,246,0.96)', color: '#5a291f', cursor: 'pointer', fontSize: 28, fontWeight: 700, boxShadow: '0 10px 24px rgba(95, 109, 136, 0.14)' }}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setMapView(view => ({ ...view, zoom: clamp(view.zoom - 1, 1, 12) }))}
          style={{ minHeight: 0, width: 54, height: 54, borderRadius: 18, border: '1px solid rgba(255,255,255,0.72)', background: 'rgba(255,245,246,0.96)', color: '#5a291f', cursor: 'pointer', fontSize: 28, fontWeight: 700, boxShadow: '0 10px 24px rgba(95, 109, 136, 0.14)' }}
        >
          −
        </button>
        <button
          type="button"
          aria-label={currentLocation ? 'Center on my location' : 'Enable location'}
          onClick={async () => {
            if (currentLocation) {
              setMapView(view => ({
                ...view,
                centerLat: currentLocation.lat,
                centerLng: currentLocation.lng,
                zoom: Math.max(view.zoom, 7),
              }));
              return;
            }
            const nextLocation = await onRequestLocation?.();
            if (!nextLocation) return;
            setMapView(view => ({
              ...view,
              centerLat: nextLocation.lat,
              centerLng: nextLocation.lng,
              zoom: Math.max(view.zoom, 7),
            }));
          }}
          style={{ minHeight: 0, width: 54, height: 54, borderRadius: 18, border: 'none', background: 'var(--accent-red)', color: 'white', cursor: 'pointer', fontSize: 22, boxShadow: '0 12px 24px rgba(182,69,18,0.22)' }}
        >
          ⌖
        </button>
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 12, zIndex: 2, color: 'rgba(61,53,56,0.68)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)', pointerEvents: 'none' }}>
        © OpenStreetMap
      </div>
    </div>
  );
}

/* ── PostcardView ── */
function PostcardView({ item, scale = 1 }) {
  const [flipped, setFlipped] = useState(false);
  const W = 360 * scale, H = 230 * scale;
  return (
    <div style={{ width: W, height: H, perspective: 1000, cursor: 'pointer' }} onClick={() => setFlipped(f => !f)}>
      <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.65s', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 5 * scale, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.28)' }}>
          {item.image
            ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <div style={{ width: '100%', height: '100%', background: item.gradient || '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 18 * scale, fontStyle: 'italic', fontFamily: 'var(--heading)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{item.destination}</span>
            </div>
          }
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(transparent,rgba(0,0,0,0.58))', padding: `${14 * scale}px ${12 * scale}px ${10 * scale}px` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 8 * scale, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Postcard</p>
                <p style={{ margin: 0, color: 'white', fontSize: 15 * scale, fontStyle: 'italic', fontFamily: 'var(--heading)' }}>{item.destination}</p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 * scale, fontFamily: 'var(--sans)' }}>tap to flip ↩</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 5 * scale, boxShadow: '0 4px 18px rgba(0,0,0,0.28)', background: '#FAF7F0', display: 'flex', flexDirection: 'column', padding: `${10 * scale}px`, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #bbb', paddingBottom: 4 * scale, marginBottom: 8 * scale }}>
            <span style={{ fontSize: 8 * scale, letterSpacing: '0.3em', fontFamily: 'var(--sans)', color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Post Card</span>
            <span style={{ fontSize: 8 * scale, color: '#aaa', fontFamily: 'var(--sans)' }}>{item.location || item.country || ''}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 10 * scale, overflow: 'hidden' }}>
            <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {item.message
                ? <p style={{ margin: 0, fontSize: 8 * scale, color: '#444', fontFamily: 'var(--sans)', lineHeight: 1.75 }}>{item.message}</p>
                : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>{[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 1, background: '#d0c8bb' }} />)}</div>
              }
              {item.from && <span style={{ fontSize: 8 * scale, color: '#888', fontFamily: 'var(--sans)', fontStyle: 'italic', marginTop: 6 * scale }}>— {item.from}</span>}
            </div>
            <div style={{ width: 1, background: '#d0c8bb', alignSelf: 'stretch' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ alignSelf: 'flex-end', width: 38 * scale, height: 46 * scale, border: '1.5px dashed #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                <span style={{ fontSize: 6 * scale, color: '#ccc', textAlign: 'center', fontFamily: 'var(--sans)', lineHeight: 1.4, whiteSpace: 'pre' }}>{'stamp\nhere'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 * scale }}>
                {item.recipient
                  ? <span style={{ fontSize: 9 * scale, color: '#333', fontFamily: 'var(--sans)' }}>{item.recipient}</span>
                  : [0, 1, 2, 3].map(i => <div key={i} style={{ height: 1, background: '#d0c8bb' }} />)
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CAMERA VIEWFINDER — live stamp/postcard overlay
════════════════════════════════════════════════════════ */
function CameraViewfinder({ type, onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef(null);
  const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(() => (
    cameraSupported ? null : 'Camera access is not available in this app view. Please use Upload Photo instead.'
  ));
  const getViewportDims = () => {
    const vv = window.visualViewport;
    return { vw: Math.round(vv?.width || window.innerWidth), vh: Math.round(vv?.height || window.innerHeight) };
  };
  const [dims, setDims] = useState(getViewportDims);
  const [cameraZoom, setCameraZoom] = useState(1);

  useEffect(() => {
    const onResize = () => setDims(getViewportDims());
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!cameraSupported) {
      return () => { alive = false; };
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    }).then(stream => {
      if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { if (alive) setReady(true); };
      }
    }).catch(e => { if (alive) setError(e.message || 'Camera not available'); });
    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [cameraSupported]);

  const isPostcard = type === 'postcard';
  const { vw, vh } = dims;

  /* Stamp box in viewport */
  const STAMP_AR = isPostcard ? (360 / 230) : (1 / 1.25);
  const pad = 52;
  const { boxW, boxH } = (() => {
    if (isPostcard) {
      const initialW = Math.min(vw - pad * 2, 430);
      const initialH = initialW / STAMP_AR;
      return initialH > vh * 0.54
        ? { boxW: vh * 0.54 * STAMP_AR, boxH: vh * 0.54 }
        : { boxW: initialW, boxH: initialH };
    }

    const initialH = Math.min(vh * 0.62, 450);
    const initialW = initialH * STAMP_AR;
    return initialW > vw - pad * 2
      ? { boxW: vw - pad * 2, boxH: (vw - pad * 2) / STAMP_AR }
      : { boxW: initialW, boxH: initialH };
  })();
  const boxX = (vw - boxW) / 2;
  const boxY = Math.max(
    24 + (window.visualViewport?.offsetTop || 0),
    (vh - boxH) / 2 - (isPostcard ? 0 : 14)
  );

  /* Perforation geometry */
  const holeR = isPostcard ? Math.max(5, boxW * 0.011) : Math.max(6, boxW * 0.030);
  const spacing = holeR * (isPostcard ? 3.8 : 3.5);
  const holes = buildPerfHoles(boxX, boxY, boxW, boxH, holeR, spacing);

  /* Capture */
  const doCapture = useCallback(() => {
    if (!ready || !videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const OUT_W = isPostcard ? 1200 : 800;
    const OUT_H = isPostcard ? Math.round(1200 / STAMP_AR) : Math.round(800 / STAMP_AR);
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');

    const vW = video.videoWidth || video.offsetWidth;
    const vH = video.videoHeight || video.offsetHeight;
    const renderScale = Math.max(vw / vW, vh / vH) * cameraZoom;
    const renderedW = vW * renderScale;
    const renderedH = vH * renderScale;
    const offsetX = (vw - renderedW) / 2;
    const offsetY = (vh - renderedH) / 2;
    const sw = Math.min(vW, boxW / renderScale);
    const sh = Math.min(vH, boxH / renderScale);
    const sx = Math.max(0, Math.min(vW - sw, (boxX - offsetX) / renderScale));
    const sy = Math.max(0, Math.min(vH - sh, (boxY - offsetY) / renderScale));

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);

    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(canvas.toDataURL('image/jpeg', 0.82));
  }, [ready, isPostcard, STAMP_AR, boxW, boxH, onCapture, vw, vh, boxX, boxY, cameraZoom]);

  useEffect(() => {
    const onKey = e => { if (e.code === 'Space' || e.code === 'Enter') doCapture(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doCapture]);

  const pinchDistance = touches => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = e => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        distance: pinchDistance(e.touches),
        zoom: cameraZoom,
      };
    }
  };

  const handleTouchMove = e => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const nextDistance = pinchDistance(e.touches);
    const ratio = nextDistance / pinchRef.current.distance;
    const nextZoom = Math.min(3, Math.max(1, pinchRef.current.zoom * ratio));
    setCameraZoom(Number(nextZoom.toFixed(2)));
  };

  const handleTouchEnd = e => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  /* SVG unique mask id */
  const maskId = 'vf-mask-stamp';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >

      {/* Live video */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: ready ? 1 : 0, transform: `scale(${cameraZoom})`, transition: 'opacity 0.5s, transform 0.18s ease-out' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ─── SVG viewfinder overlay ─── */}
      <svg width={vw} height={vh}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/*
            Mask logic:
              white  → dark overlay is rendered
              black  → transparent (camera shows through)
            So: fill everything white, punch out stamp box in black,
            then add perforation circles back in white (dark shows through holes).
          */}
          <mask id={maskId}>
            <rect width={vw} height={vh} fill="white" />
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="black" />
            {holes.map((h, i) => (
              <circle key={i} cx={h.cx} cy={h.cy} r={holeR} fill="white" />
            ))}
          </mask>
        </defs>

        {/* Dark vignette around stamp cutout */}
        <rect width={vw} height={vh} fill="rgba(0,0,0,0.74)" mask={`url(#${maskId})`} />

        {/* Faint border around the stamp window */}
        <rect x={boxX} y={boxY} width={boxW} height={boxH}
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        {/* Perforation circle outlines for visual polish */}
        {holes.map((h, i) => (
          <circle key={`o${i}`} cx={h.cx} cy={h.cy} r={holeR}
            fill="rgba(0,0,0,0.55)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.75"
          />
        ))}

        {/* Corner crosshair guides */}
        {[[boxX, boxY], [boxX + boxW, boxY], [boxX, boxY + boxH], [boxX + boxW, boxY + boxH]].map(([cx, cy], i) => (
          <g key={`cr${i}`}>
            <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
            <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          </g>
        ))}

        {/* Top label */}
        <text x={vw / 2} y={boxY - holeR - 16}
          textAnchor="middle" fill="rgba(255,255,255,0.78)"
          fontSize="11" fontFamily="Georgia,serif" letterSpacing="0.2em">
          {isPostcard ? 'FRAME YOUR POSTCARD' : 'FRAME YOUR STAMP'}
        </text>

        {/* Bottom hint */}
        <text x={vw / 2} y={boxY + boxH + holeR + 28}
          textAnchor="middle" fill="rgba(255,255,255,0.42)"
          fontSize="9.5" fontFamily="Georgia,serif" letterSpacing="0.1em">
          {isPostcard
            ? 'Scene fills the card front'
            : 'Perforated edges will be applied to your image'}
        </text>
      </svg>

      {/* Shutter flash */}
      {flash && <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.8, zIndex: 10, pointerEvents: 'none' }} />}

      {/* Error */}
      {error && (
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', color: 'white', padding: 30 }}>
          <p style={{ fontFamily: 'var(--heading)', fontSize: 20, fontStyle: 'italic', marginBottom: 10 }}>Camera unavailable</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 22, fontFamily: 'var(--sans)' }}>{error}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 22, fontFamily: 'var(--sans)' }}>Try "Upload Photo" instead to import from your library.</p>
          <button onClick={onCancel} style={{ padding: '10px 28px', background: 'white', color: 'var(--accent-strong)', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13 }}>← Go Back</button>
        </div>
      )}

      {/* Loading */}
      {!ready && !error && (
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'vf-spin 0.85s linear infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'var(--sans)', letterSpacing: '0.2em' }}>OPENING CAMERA</span>
        </div>
      )}

      {/* Controls bar */}
      {ready && !error && (
        <label style={{ position: 'absolute', left: 24, right: 24, bottom: 'calc(142px + env(safe-area-inset-bottom))', zIndex: 7, display: 'grid', gap: 8, color: 'white', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Zoom {cameraZoom.toFixed(1)}x
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={cameraZoom}
            onChange={e => setCameraZoom(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-red)' }}
          />
        </label>
      )}

      {/* Controls bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 36px calc(44px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(transparent,rgba(0,0,0,0.68))', zIndex: 6 }}>

        {/* Cancel */}
        <button
          onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onCancel(); }}
          style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.13)', border: '1.5px solid rgba(255,255,255,0.28)', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
        >✕</button>

        {/* Shutter */}
        <button
          onClick={doCapture}
          disabled={!ready}
          style={{
            width: 76, height: 76, borderRadius: '50%',
            background: ready ? 'white' : 'rgba(255,255,255,0.25)',
            border: '5px solid rgba(255,255,255,0.45)',
            cursor: ready ? 'pointer' : 'default',
            boxShadow: ready ? '0 0 0 8px rgba(255,255,255,0.14)' : 'none',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { if (ready) { e.currentTarget.style.transform = 'scale(0.93)'; e.currentTarget.style.background = '#e8e8e8'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = ready ? 'white' : 'rgba(255,255,255,0.25)'; }}
        >
          {/* Mini stamp icon */}
          <div style={{ width: 30, height: 30, border: '2.5px solid #7DA9D9', borderRadius: 2, opacity: ready ? 1 : 0.4, position: 'relative' }}>
            {[-1, 0, 1].map(i => (
              <div key={i} style={{
                position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#7DA9D9',
                top: i === -1 ? -4 : i === 1 ? 'calc(100% - 2px)' : 'calc(50% - 3px)',
                left: -4
              }} />
            ))}
            {[-1, 0, 1].map(i => (
              <div key={i} style={{
                position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#7DA9D9',
                top: i === -1 ? -4 : i === 1 ? 'calc(100% - 2px)' : 'calc(50% - 3px)',
                right: -4
              }} />
            ))}
          </div>
        </button>

        {/* Spacer to balance layout */}
        <div style={{ width: 50 }} />
      </div>

      <style>{`
        @keyframes vf-spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Field helper ── */
function Field({ label, value, onChange, placeholder, multiline }) {
  const base = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--accent-border)', borderRadius: 12, fontSize: 15, fontFamily: 'var(--sans)', color: 'var(--text-h)', background: 'rgba(255,255,255,0.96)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' };
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 6, fontFamily: 'var(--sans)' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize: 'vertical', height: 80, lineHeight: 1.6 }} onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }} onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none'; }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-bg)'; }} onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none'; }} />
      }
    </div>
  );
}

function StampImageFramer({ image, onApply, onBack }) {
  const frame = { w: 270, h: 338 };
  const imageBox = { x: 22, y: 22, w: 226, h: 266 };
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1.15);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const clampOffset = (next, nextZoom = zoom, nextNatural = natural) => {
    if (!nextNatural) return next;
    const scale = Math.max(imageBox.w / nextNatural.w, imageBox.h / nextNatural.h) * nextZoom;
    const maxX = Math.max(0, (nextNatural.w * scale - imageBox.w) / 2);
    const maxY = Math.max(0, (nextNatural.h * scale - imageBox.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  const handleLoad = e => {
    const nextNatural = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
    setNatural(nextNatural);
    setOffset(clampOffset({ x: 0, y: 0 }, zoom, nextNatural));
  };

  const handleZoom = e => {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    setOffset(current => clampOffset(current, nextZoom));
  };

  const handlePointerDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, origin: offset };
  };

  const handlePointerMove = e => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clampOffset({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }));
  };

  const handlePointerUp = e => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const applyCrop = () => {
    if (!imgRef.current || !natural) return;
    const outW = 900;
    const outH = Math.round(outW * imageBox.h / imageBox.w);
    const scale = Math.max(imageBox.w / natural.w, imageBox.h / natural.h) * zoom;
    const drawW = natural.w * scale;
    const drawH = natural.h * scale;
    const dx = imageBox.w / 2 + offset.x - drawW / 2;
    const dy = imageBox.h / 2 + offset.y - drawH / 2;
    const sx = Math.max(0, -dx / scale);
    const sy = Math.max(0, -dy / scale);
    const sw = Math.min(natural.w - sx, imageBox.w / scale);
    const sh = Math.min(natural.h - sy, imageBox.h / scale);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outW, outH);
    onApply(canvas.toDataURL('image/jpeg', 0.86));
  };

  const scale = natural ? Math.max(imageBox.w / natural.w, imageBox.h / natural.h) * zoom : 1;
  const stampMask = buildStampMask(frame.w, frame.h, 8, 22);

  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ flex: '0 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: frame.w, height: frame.h, background: '#070712', borderRadius: 2, boxShadow: '0 18px 50px rgba(108,99,255,0.24)' }}>
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: frame.w, height: frame.h, position: 'relative', touchAction: 'none', cursor: 'grab', background: '#FFFDF8', WebkitMaskImage: stampMask, maskImage: stampMask, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }}
          >
            <div style={{ position: 'absolute', left: imageBox.x, top: imageBox.y, width: imageBox.w, height: imageBox.h, overflow: 'hidden', background: 'var(--surface-tint)' }}>
              <img
                ref={imgRef}
                src={image}
                alt="Uploaded stamp crop"
                onLoad={handleLoad}
                draggable="false"
                style={{ position: 'absolute', left: '50%', top: '50%', width: natural ? natural.w * scale : '100%', height: natural ? natural.h * scale : '100%', maxWidth: 'none', transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`, userSelect: 'none', pointerEvents: 'none' }}
              />
              <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,255,0.78)', pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'absolute', left: imageBox.x, top: imageBox.y + imageBox.h + 8, right: imageBox.x, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--accent-red)55', color: 'var(--accent-red)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sans)', pointerEvents: 'none' }}>
              <span>Stampz</span>
              <span>✉️</span>
            </div>
          </div>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--sans)', textAlign: 'center' }}>Drag the photo into the stamp frame</p>
      </div>
      <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--accent-strong)', fontSize: 28, margin: '0 0 6px' }}>Frame your stamp</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7 }}>Zoom and drag your uploaded photo until the part you want sits inside the stamp-edged background.</p>
        </div>
        <label style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', fontFamily: 'var(--sans)' }}>
          Zoom
          <input type="range" min="1" max="2.8" step="0.01" value={zoom} onChange={handleZoom} style={{ width: '100%', accentColor: 'var(--accent-red)', marginTop: 10 }} />
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={applyCrop} disabled={!natural} style={{ flex: '1 1 180px', padding: '12px 20px', background: natural ? 'var(--accent-strong)' : 'var(--accent-bg)', color: natural ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-pill)', cursor: natural ? 'pointer' : 'default', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 700, letterSpacing: '0.06em' }}>Use this crop</button>
          <button onClick={onBack} style={{ padding: '12px 16px', background: 'var(--surface-strong)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)' }}>Choose another</button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, icon, label, active, onSelect, isCenter }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`${active ? 'is-active' : ''} ${isCenter ? 'nav-center-action' : ''}`}
      aria-label={label}
      title={label}
    >
      <span>{icon}</span>
      {!isCenter && label}
    </button>
  );
}

function Pill({ label, active, onClick, activeColor = 'var(--accent-strong)' }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, cursor: 'pointer', border: `1px solid ${active ? activeColor : 'var(--border)'}`, background: active ? activeColor : 'var(--surface-card)', color: active ? 'white' : 'var(--text)', fontFamily: 'var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.18s', boxShadow: active ? 'var(--shadow-soft)' : 'none', minHeight: 0 }}>{label}</button>
  );
}

function SignInScreen({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const isSignup = mode === 'signup';

  const handleResetPassword = async () => {
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) {
      setErrorMsg('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail);
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail || !password) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = isSignup
        ? await supabase.auth.signUp({ email: safeEmail, password, options: { data: { username: safeEmail.split('@')[0] } } })
        : await supabase.auth.signInWithPassword({ email: safeEmail, password });

      if (error) throw error;
      if (data.user) {
        onSignIn(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, #1aa3ff, #ff6b9d, #ffd200)'
    }}>
      <div style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} />
          <h1 style={{ fontFamily: 'var(--heading)', fontSize: 44, color: 'white', margin: 0, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Stampz</h1>
        </div>

        {/* Info */}
        <div style={{ textAlign: 'center', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: 1.5, fontFamily: 'var(--sans)' }}>
            Turn your photos into travel stamps.<br />Pin them to the map and build your archive.
          </p>
        </div>

        {/* Hero Stamp Example */}
        <div style={{ transform: 'scale(0.85) rotate(-4deg)', transition: 'transform 0.4s', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))', margin: '-10px 0' }}>
          <StampView item={AUTH_HERO_STAMP} size="lg" />
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} style={{ width: '100%', background: 'rgba(255, 255, 255, 0.96)', padding: '32px 24px', borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--heading)', fontSize: 26, color: '#222' }}>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          </div>

          {errorMsg && <p style={{ margin: 0, color: 'var(--accent-red)', fontSize: 13, background: 'rgba(255,0,0,0.05)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>{errorMsg}</p>}

          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            required
            style={{ width: '100%', padding: '16px', fontSize: 16, border: '1.5px solid #E5E5E5', borderRadius: 12, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--sans)' }}
            onFocus={e => e.target.style.borderColor = '#ff6b9d'}
            onBlur={e => e.target.style.borderColor = '#E5E5E5'}
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            style={{ width: '100%', padding: '16px', fontSize: 16, border: '1.5px solid #E5E5E5', borderRadius: 12, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--sans)' }}
            onFocus={e => e.target.style.borderColor = '#ff6b9d'}
            onBlur={e => e.target.style.borderColor = '#E5E5E5'}
          />

          {resetSent && <p style={{ margin: 0, color: '#16a34a', fontSize: 13, background: 'rgba(22, 163, 74, 0.1)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>Password reset email sent. Check your inbox.</p>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', marginTop: 12, background: 'linear-gradient(135deg, #ff6b9d, #f5576c)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(245, 87, 108, 0.4)', transition: 'transform 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>

          {!isSignup && (
            <button type="button" onClick={handleResetPassword} disabled={loading} style={{ background: 'none', border: 'none', color: '#ff6b9d', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Forgot your password?
            </button>
          )}

          <button type="button" onClick={() => setMode(isSignup ? 'signin' : 'signup')} disabled={loading} style={{ background: 'none', border: 'none', color: '#666', fontSize: 14, cursor: 'pointer', marginTop: 8, padding: 8, fontFamily: 'var(--sans)' }}>
            {isSignup ? Object.assign(<span>Already have an account? <span style={{ fontWeight: 600, color: '#ff6b9d' }}>Sign in</span></span>)
              : Object.assign(<span>Don't have an account? <span style={{ fontWeight: 600, color: '#ff6b9d' }}>Create one</span></span>)}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════ */
function App() {
  const [tab, setTab] = useState('map');
  const [account, setAccount] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [communityItems, setCommunityItems] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState('type');
  const [draft, setDraft] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [stampEditorTab, setStampEditorTab] = useState(null);
  const [editorZoom, setEditorZoom] = useState(1);
  const [colFilter, setColFilter] = useState('All');
  const [browseFilter, setBrowseFilter] = useState('All');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [liked, setLiked] = useState({});
  const [toast, setToast] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(() => (navigator.geolocation ? 'idle' : 'unsupported'));
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(() => readStoredJSON(LOCATION_SETTINGS_KEY, true));
  const [selectedMapItemId, setSelectedMapItemId] = useState(null);
  const [mapFocusSignal, setMapFocusSignal] = useState(0);
  const fileRef = useRef();
  const debugScrollRef = useRef(null);
  const placeLookupRef = useRef('');

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflowY = showCreateModal ? 'hidden' : 'auto';
    document.body.style.overflowY = showCreateModal ? 'hidden' : 'auto';
    document.body.classList.toggle('creator-open', showCreateModal);
    return () => {
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
      document.body.classList.remove('creator-open');
    };
  }, [showCreateModal]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isDesktop = window.matchMedia('(pointer:fine)').matches && window.innerWidth >= 960;
    if (!isDesktop || showCreateModal) return undefined;

    const logScrollState = (reason, target) => {
      if (!window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') return;
      const next = {
        reason,
        scrollY: Math.round(window.scrollY),
        innerHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        docScrollHeight: document.documentElement.scrollHeight,
        bodyOverflow: getComputedStyle(document.body).overflowY,
        htmlOverflow: getComputedStyle(document.documentElement).overflowY,
        target: target instanceof Element ? `${target.tagName.toLowerCase()}.${target.className || ''}` : String(target),
      };
      const sameAsLast = JSON.stringify(next) === debugScrollRef.current;
      if (!sameAsLast) {
        debugScrollRef.current = JSON.stringify(next);
        console.info('[stampz-scroll-debug]', next);
      }
    };

    const onWheel = event => {
      const target = event.target;
      const interactiveTarget = target instanceof Element
        ? target.closest('input, textarea, select, [data-native-scroll], [contenteditable="true"]')
        : null;
      if (interactiveTarget) return;
      if (document.body.classList.contains('creator-open')) return;
      const before = window.scrollY;
      window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
      const after = window.scrollY;
      if (before === after && Math.abs(event.deltaY) > 0) {
        logScrollState('wheel-stuck', target);
      }
    };

    const onLoadState = () => logScrollState('mount', document.body);
    const wheelOptions = { passive: true, capture: true };
    window.addEventListener('wheel', onWheel, wheelOptions);
    window.addEventListener('resize', onLoadState);
    onLoadState();
    return () => {
      window.removeEventListener('wheel', onWheel, wheelOptions);
      window.removeEventListener('resize', onLoadState);
    };
  }, [showCreateModal]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccount(session?.user ?? null);
      if (session?.user) fetchMyItems(session.user.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(session?.user ?? null);
      if (session?.user) {
        fetchMyItems(session.user.id);
      } else {
        setMyItems([]);
      }
    });

    fetchCommunityItems();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(locationTrackingEnabled));
  }, [locationTrackingEnabled]);

  const fetchMyItems = async (userId) => {
    const { data } = await supabase.from('stamps').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setMyItems(data.map(dbmapItem));
  };

  const fetchCommunityItems = async () => {
    const { data } = await supabase.from('stamps').select('*, profiles(username, avatar_color)').order('created_at', { ascending: false }).limit(60);
    if (data) setCommunityItems(data.map(dbmapItem));
  };

  const handleSignIn = user => {
    setAccount(user);
    fetchCommunityItems();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAccount(null);
    setTab('map');
    setStep('type');
    setDraft(null);
    setShowCreateModal(false);
  };

  const showToast = (msg, dur = 2400) => { setToast(msg); setTimeout(() => setToast(null), dur); };
  const reverseGeocode = useCallback(async location => {
    if (!location) return null;
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(location.lat),
        lon: String(location.lng),
        zoom: '10',
        addressdetails: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.hamlet || address.county || '';
      const country = address.country || '';
      const countryCode = (address.country_code || '').toUpperCase();
      const locationLabel = [city, country].filter(Boolean).join(', ') || data.display_name || '';
      return { city, country, countryCode, origin: country, locationLabel };
    } catch {
      return null;
    }
  }, []);

  const fetchCurrentLocation = useCallback(({ silent = false, force = false } = {}) => {
    if (!force && !locationTrackingEnabled) {
      setLocationStatus('idle');
      if (!silent) showToast('Turn on location tracking in Settings.');
      return Promise.resolve(null);
    }

    // Diagnostic: iOS/Android browsers block geolocation on non-HTTPS origins (except localhost)
    if (window.isSecureContext === false && !window.location.hostname.includes('localhost')) {
      setLocationStatus('unsupported');
      if (!silent) showToast('Location requires HTTPS secure connection on mobile devices.');
      return Promise.resolve(null);
    }

    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      if (!silent) showToast('Geographic tracking is not supported on this browser.');
      return Promise.resolve(null);
    }

    setLocationStatus('locating');
    return new Promise(resolve => {
      const onLocationSuccess = position => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(nextLocation);
        setLocationStatus('ready');
        setMapFocusSignal(signal => signal + 1);
        resolve(nextLocation);
      };

      const onLocationError = error => {
        if (error.code === 1) { // Permission Denied
          setLocationStatus('denied');
          if (!silent) showToast('Please enable Location in iPhone Settings > Privacy > Location Services.');
          resolve(null);
        } else if (error.code === 3) { // Timeout
          // Fallback: try one more time with lower accuracy (often succeeds when GPS fails)
          navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            () => {
              setLocationStatus('idle');
              if (!silent) showToast('Location request timed out. Check your signal.');
              resolve(null);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        } else {
          setLocationStatus('idle');
          if (!silent) showToast('Could not find location. Try again in a moment.');
          resolve(null);
        }
      };

      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        onLocationError,
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, [locationTrackingEnabled]);

  const requestLocation = () => {
    return fetchCurrentLocation({ force: true });
  };

  const handleLocationTrackingToggle = async () => {
    const nextEnabled = !locationTrackingEnabled;
    setLocationTrackingEnabled(nextEnabled);
    if (!nextEnabled) {
      setCurrentLocation(null);
      setLocationStatus(navigator.geolocation ? 'idle' : 'unsupported');
      return;
    }
    await fetchCurrentLocation({ force: true });
  };

  const resolveDraftPlace = useCallback(async baseDraft => {
    if (!baseDraft || baseDraft.type !== 'stamp') return baseDraft;

    let nextDraft = { ...baseDraft };
    let location = Number.isFinite(nextDraft.locationLat) && Number.isFinite(nextDraft.locationLng)
      ? { lat: nextDraft.locationLat, lng: nextDraft.locationLng }
      : currentLocation;

    if (!location && nextDraft.locationLat == null && !nextDraft.image) {
      location = await fetchCurrentLocation({ silent: true });
    }

    if (location) {
      nextDraft.locationLat = location.lat;
      nextDraft.locationLng = location.lng;
      if (!nextDraft.locationLabel || nextDraft.locationLabel === 'Unplaced') {
        nextDraft.locationLabel = `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;
      }

      if (!nextDraft.location) {
        const place = await reverseGeocode(location);
        if (place) {
          nextDraft.location = nextDraft.location || place.country || nextDraft.location;
          nextDraft.city = nextDraft.city || place.city || nextDraft.city;
          nextDraft.locationLabel = place.locationLabel || nextDraft.locationLabel;
        }
      }
    }

    return nextDraft;
  }, [currentLocation, locationStatus, fetchCurrentLocation, reverseGeocode]);

  useEffect(() => {
    if (!draft || draft.type !== 'stamp') return;
    const hasCoords = Number.isFinite(draft.locationLat) && Number.isFinite(draft.locationLng);
    if (!hasCoords || draft.location) return;

    const lookupKey = `${draft.locationLat}:${draft.locationLng}`;
    if (placeLookupRef.current === lookupKey) return;
    placeLookupRef.current = lookupKey;

    let alive = true;
    reverseGeocode({ lat: draft.locationLat, lng: draft.locationLng }).then(place => {
      if (!alive || !place) return;
      setDraft(current => {
        if (!current) return current;
        if (current.location && current.location.trim()) return current;
        return {
          ...current,
          location: place.country || current.location,
          city: place.city || current.city,
          locationLabel: place.locationLabel || current.locationLabel,
        };
      });
    });

    return () => {
      alive = false;
    };
  }, [draft, reverseGeocode]);

  const handleImage = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const draftType = draft?.type;
    const r = new FileReader();
    r.onload = ev => {
      setDraft(d => ({ ...d, image: draftType === 'stamp' ? null : ev.target.result, imageRaw: ev.target.result }));
      setStep(draftType === 'stamp' ? 'frame' : 'customize');
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCameraCapture = async url => {
    const existingLocation = currentLocation;
    const existingLabel = existingLocation
      ? `${existingLocation.lat.toFixed(2)}, ${existingLocation.lng.toFixed(2)}`
      : null;

    setDraft(d => ({
      ...d,
      image: url,
      imageRaw: null,
      locationLat: existingLocation?.lat ?? d?.locationLat ?? null,
      locationLng: existingLocation?.lng ?? d?.locationLng ?? null,
      locationLabel: existingLabel || d?.locationLabel || 'Unplaced',
    }));
    setShowCamera(false);
    setStep('customize');
    setShowCreateModal(true);

    if (existingLocation) {
      const place = await reverseGeocode(existingLocation);
      if (!place) return;
      setDraft(d => {
        if (!d || d.image !== url) return d;
        return {
          ...d,
          location: d.location || place.country || d.location,
          city: d.city || place.city || d.city,
          locationLabel: place.locationLabel || d.locationLabel,
        };
      });
      return;
    }

    if (locationStatus === 'unsupported') return;

    const nextLocation = await fetchCurrentLocation({ silent: true });
    if (!nextLocation) return;

    const place = await reverseGeocode(nextLocation);

    setDraft(d => {
      if (!d || d.image !== url) return d;
      return {
        ...d,
        locationLat: nextLocation.lat,
        locationLng: nextLocation.lng,
        location: d.location || place?.country || d.location,
        city: d.city || place?.city || d.city,
        locationLabel: place?.locationLabel || `${nextLocation.lat.toFixed(2)}, ${nextLocation.lng.toFixed(2)}`,
      };
    });
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
    setShowCreateModal(false);
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving || !draft || !account) return;
    setIsSaving(true);
    try {
      const resolvedDraft = await resolveDraftPlace(draft);
      let imageUrl = resolvedDraft.image;

      if (imageUrl && imageUrl.startsWith('data:')) {
        const fileExt = imageUrl.split(';')[0].match(/jpeg|png|gif|webp/)?.[0] || 'jpg';
        const fileName = `${account.id}_${Date.now()}.${fileExt}`;
        const blob = dataURLtoBlob(imageUrl);
        const { data: uploadData, error: uploadError } = await supabase.storage.from('stamps').upload(fileName, blob, {
          contentType: `image/${fileExt}`
        });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('stamps').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const isUpdate = !!editingItemId && !String(editingItemId).startsWith('item_');

      const payload = {
        user_id: account.id,
        type: resolvedDraft.type,
        image_url: imageUrl,
        label: resolvedDraft.label || '',
        location: resolvedDraft.location || '',
        city: resolvedDraft.city || '',
        country: resolvedDraft.country || '',
        note: resolvedDraft.note || '',
        stamp_color: resolvedDraft.stampColor,
        text_color: resolvedDraft.textColor,
        text_stroke_color: resolvedDraft.textStrokeColor,
        location_text_color: resolvedDraft.locationTextColor,
        location_stroke_color: resolvedDraft.locationStrokeColor,
        label_text_color: resolvedDraft.labelTextColor,
        label_stroke_color: resolvedDraft.labelStrokeColor,
        copyright_text_color: resolvedDraft.copyrightTextColor,
        copyright_stroke_color: resolvedDraft.copyrightStrokeColor,
        aging_intensity: resolvedDraft.agingIntensity,
        collection: resolvedDraft.collection || 'Destinations',
        location_lat: resolvedDraft.locationLat ?? currentLocation?.lat ?? null,
        location_lng: resolvedDraft.locationLng ?? currentLocation?.lng ?? null,
        location_label: resolvedDraft.locationLabel || (currentLocation ? `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 'Unplaced'),
        gradient: resolvedDraft.gradient || ''
      };

      let saveResult;
      let nextItem;
      if (isUpdate) {
        saveResult = await supabase.from('stamps').update(payload).eq('id', editingItemId).select('*, profiles(username, avatar_color)').single();
        if (saveResult.error) throw saveResult.error;
        nextItem = dbmapItem(saveResult.data);
      } else {
        saveResult = await supabase.from('stamps').insert(payload).select('*, profiles(username, avatar_color)').single();
        if (saveResult.error) throw saveResult.error;
        nextItem = dbmapItem(saveResult.data);
      }

      setMyItems(items => {
        if (isUpdate) {
          return items.map(item => item.id === editingItemId ? nextItem : item);
        } else {
          return [nextItem, ...items];
        }
      });

      setCommunityItems(prev => {
        if (isUpdate) return prev.map(p => p.id === nextItem.id ? nextItem : p);
        return [nextItem, ...prev].slice(0, 60);
      });

      if (nextItem.locationLat != null && nextItem.locationLng != null) {
        setSelectedMapItemId(nextItem.id);
      }

      setEditingItemId(null);
      setDraft(null);
      setStep('type');
      setTab('saved');
      setShowCreateModal(false);
      setIsSaving(false);

      showToast(
        editingItemId
          ? (nextItem.type === 'stamp' ? '✉️ Stamp updated!' : '✉ Postcard updated!')
          : nextItem.type === 'stamp'
            ? (nextItem.locationLat != null ? '✉️ Stamp pinned to your map!' : '✉️ Stamp saved to your archive!')
            : '✉ Postcard saved!'
      );
    } catch (err) {
      console.error('handleSave error:', err);
      setIsSaving(false);
      showToast('Something went wrong saving your stamp. Please try again.');
    }
  };

  const openCreateModal = () => {
    setEditingItemId(null);
    setStampEditorTab(null);
    setDraft(createDraft('stamp', currentLocation));
    setStep('customize');
    setShowCamera(true);
    setShowCreateModal(false); // Only show after capture
    if (locationTrackingEnabled && !currentLocation) {
      fetchCurrentLocation({ silent: true, force: true });
    }
  };

  const closeCreateModal = () => {
    if (draft && draft.type === 'stamp' && step === 'customize') {
      if (!window.confirm('Discard changes and return to menu?')) return;
    }
    setShowCreateModal(false);
    setShowCamera(false);
    setEditingItemId(null);
    setStampEditorTab(null);
    setDraft(null);
    setStep('type');
  };

  const initDraft = type => {
    setEditingItemId(null);
    setStampEditorTab(null);
    setDraft(createDraft(type, currentLocation));
    setShowCreateModal(true);
    setStep('upload');
    if (locationTrackingEnabled && !currentLocation) {
      fetchCurrentLocation({ silent: true, force: true });
    }
  };

  const startEditingItem = item => {
    setLightbox(null);
    setEditingItemId(item.id);
    setStampEditorTab('details');
    setDraft({
      ...item,
      note: item.note || '',
      location: item.location || item.country || item.origin || '',
      label: item.label || '',
      copyright: item.copyright || '',
      locationTextColor: item.locationTextColor || null,
      labelTextColor: item.labelTextColor || null,
      copyrightTextColor: item.copyrightTextColor || null,
      stampColor: item.stampColor || '#FFFDF8',
      textColor: item.textColor || '#4A322D',
      textStrokeColor: item.textStrokeColor || '#FFFDFC',
      agingIntensity: item.agingIntensity ?? 36,
      collection: item.collection || 'Destinations',
    });
    setShowCreateModal(true);
    setStep('customize');
  };

  const handleCreateBack = () => {
    closeCreateModal();
  };

  const handleTabSelect = id => {
    if (id === tab) {
      if (id === 'feed') setViewingProfile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTab(id);
    if (id === 'feed') setViewingProfile(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const savedStampItems = myItems.filter(item => item.type === 'stamp');
  const filteredMine = colFilter === 'All' ? myItems : myItems.filter(i => i.collection === colFilter);
  const placedMine = savedStampItems.filter(item => Number.isFinite(item.locationLat) && Number.isFinite(item.locationLng));
  const unplacedMine = savedStampItems.filter(item => !Number.isFinite(item.locationLat) || !Number.isFinite(item.locationLng));
  const selectedMapItem = savedStampItems.find(item => item.id === selectedMapItemId) || placedMine[0] || null;
  const filteredCommunity = browseFilter === 'All' ? COMMUNITY_STAMPS : COMMUNITY_STAMPS.filter(s => s.collection === browseFilter);
  const profileStamps = viewingProfile
    ? COMMUNITY_STAMPS.filter(stamp => stamp.author === viewingProfile)
    : [];
  const profile = viewingProfile ? getCommunityProfile(viewingProfile) : null;

  if (!account) {
    return <SignInScreen onSignIn={handleSignIn} />;
  }

  return (
    <div className="app-shell">
      {/* Noise */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E")`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Camera */}
      {showCamera && draft && (
        <CameraViewfinder type={draft.type} onCapture={handleCameraCapture} onCancel={handleCameraCancel} />
      )}

      {!showCreateModal && !showCamera && (
        <header className="app-header">
          <h1 className="app-brand-title">Stampz</h1>
        </header>
      )}

      <main className={`app-main ${tab === 'map' ? 'app-main--full' : ''}`}>

        {/* ══ CREATE MODAL */}
        {showCreateModal && (
          <div className="create-modal" role="dialog" aria-modal="true" aria-label="Create a Stampz item" onClick={closeCreateModal}>
            <div
              className={`create-modal__panel${step === 'customize' && draft?.type === 'stamp' ? ' create-modal__panel--editor' : ''}`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`create-modal__topbar ${step === 'customize' && draft?.type === 'stamp' ? 'create-modal__topbar--editor' : ''}`} style={step === 'customize' && draft?.type === 'stamp' ? { background: '#080808', border: 'none', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingTop: 'calc(16px + env(safe-area-inset-top))', height: 'calc(60px + env(safe-area-inset-top))' } : {}}>
                <button
                  type="button"
                  className="create-modal__topaction"
                  onClick={handleCreateBack}
                  style={step === 'customize' && draft?.type === 'stamp' ? { color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.4)', fontSize: 16 } : {}}
                >
                  ← Back
                </button>
                {step === 'customize' && draft?.type === 'stamp' && (
                  <button onClick={() => { setShowCamera(true); setShowCreateModal(false); }} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 100, color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    Retake
                  </button>
                )}
                {step === 'customize' ? (
                  <button
                    type="button"
                    onClick={() => setStampEditorTab('share')}
                    disabled={isSaving}
                    style={{
                      minHeight: 0,
                      padding: '8px 20px',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      background: isSaving ? 'rgba(255,255,255,0.4)' : '#fff',
                      color: isSaving ? 'rgba(0,0,0,0.4)' : '#000',
                      cursor: isSaving ? 'default' : 'pointer',
                      fontFamily: 'var(--sans)',
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <span className="create-modal__topspacer" aria-hidden="true" />
                )}
              </div>

              {/* Step 1 */}
              {step === 'type' && (
                <div>
                  <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 24, margin: '0 0 6px' }}>What would you like to create?</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 28px' }}>Choose your collectible format</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { type: 'stamp', icon: '✉️', title: 'Postage Stamp', desc: 'Frame your shot through the live stamp viewfinder, then customize location, label, and colors.' },
                      { type: 'postcard', icon: '✉', title: 'Postcard', desc: 'Shoot through the postcard frame guide, then write your message on the classic flip-card back.' },
                    ].map(opt => (
                      <button key={opt.type} onClick={() => initDraft(opt.type)} style={{ flex: '1 1 200px', background: 'var(--surface-strong)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '28px 22px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.22s', boxShadow: 'var(--shadow-soft)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; }}>
                        <div style={{ fontSize: 34, marginBottom: 14 }}>{opt.icon}</div>
                        <h3 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 18, margin: '0 0 8px' }}>{opt.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.65, margin: 0 }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Upload or Camera */}
              {step === 'upload' && draft && (
                <div>
                  <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 24, margin: '0 0 6px' }}>Add Your Photo</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px' }}>
                    {draft.type === 'stamp'
                      ? 'Use the camera to frame your shot — the live perforated overlay shows exactly what your stamp will contain.'
                      : 'Use the camera with the postcard frame guide, or import a photo from your library.'}
                  </p>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                    {/* Camera */}
                    <button onClick={() => setShowCamera(true)} style={{ flex: '1 1 180px', height: 180, background: 'var(--accent-strong)', border: 'none', borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(79,134,184,0.22)', overflow: 'hidden', position: 'relative' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-red)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-strong)'; e.currentTarget.style.transform = ''; }}>
                      <span style={{ fontSize: 28, position: 'relative' }}>📷</span>
                      <div style={{ textAlign: 'center', position: 'relative' }}>
                        <p style={{ margin: 0, fontSize: 14, color: 'white', fontFamily: 'var(--sans)', fontWeight: 700 }}>Use Camera</p>
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--sans)', letterSpacing: '0.06em' }}>Live {draft.type} overlay</p>
                      </div>
                    </button>

                    {/* Upload */}
                    <button onClick={() => fileRef.current.click()} style={{ flex: '1 1 180px', height: 180, background: 'var(--surface-strong)', border: '1.5px dashed var(--accent-border)', borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = 'var(--surface-strong)'; }}>
                      <span style={{ fontSize: 28 }}>🖼</span>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-h)', fontFamily: 'var(--sans)', fontWeight: 700 }}>Upload Photo</p>
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>From your library</p>
                      </div>
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                  <button onClick={() => setStep('type')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)', letterSpacing: '0.06em', minHeight: 0 }}>← Back</button>
                </div>
              )}

              {/* Step 3: Frame uploaded stamp image */}
              {step === 'frame' && draft?.type === 'stamp' && draft.imageRaw && (
                <StampImageFramer
                  image={draft.imageRaw}
                  onApply={url => { setDraft(d => ({ ...d, image: url })); setStep('customize'); }}
                  onBack={() => setStep('upload')}
                />
              )}

              {/* Step 4: Customize */}
              {step === 'customize' && draft && (
                draft.type === 'stamp' ? (
                  <div className="stamp-editor-shell" style={{ background: '#080808', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div className="stamp-editor-preview" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', padding: '40px 16px 80px', paddingTop: 'calc(60px + env(safe-area-inset-top))' }}>
                      <EditorStampPreview item={draft} isTrayOpen={!!stampEditorTab} editorZoom={editorZoom} setEditorZoom={setEditorZoom} onClick={() => setStampEditorTab(null)} />
                    </div>

                    <div style={{ position: 'absolute', bottom: stampEditorTab ? '48vh' : 90, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 15, transition: 'bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)', opacity: 0, pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: 20, backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                        <button onClick={() => setEditorZoom(z => Math.max(0.5, z - 0.1))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: '0 4px', cursor: 'pointer', opacity: 0.8 }}>−</button>
                        <input type="range" min="0.5" max="1.5" step="0.05" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} style={{ width: 100, accentColor: '#fff', height: 4, opacity: 0.9 }} />
                        <button onClick={() => setEditorZoom(z => Math.min(1.5, z + 0.1))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: '0 4px', cursor: 'pointer', opacity: 0.8 }}>+</button>
                      </div>
                    </div>

                    {!stampEditorTab ? (
                      <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 24, zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                          {[
                            { id: 'details', label: 'Aa', sub: 'Details' },
                            { id: 'style', label: '✨', sub: 'Style' },
                            { id: 'notes', label: '📝', sub: 'Notes' },
                          ].map(tabItem => (
                            <button
                              key={tabItem.id}
                              type="button"
                              onClick={() => setStampEditorTab(tabItem.id)}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none'
                              }}
                            >
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 18, border: '1px solid rgba(255,255,255,0.2)' }}>
                                {tabItem.label}
                              </div>
                              <span style={{ fontSize: 10, fontFamily: 'var(--sans)', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{tabItem.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="stamp-editor-tray" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45vh', minHeight: 380, background: '#1c1c1c', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', zIndex: 20, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                          <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--sans)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {stampEditorTab === 'details' ? 'Details' : stampEditorTab === 'style' ? 'Style' : stampEditorTab === 'share' ? 'Saving Options' : 'Notes'}
                          </h3>
                          <button onClick={() => setStampEditorTab(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 999, width: 28, height: 28, minWidth: 28, minHeight: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, flexGrow: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ display: 'block' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>

                        <div className="stamp-editor-tray__scroller" data-native-scroll style={{ flex: 1, overflowY: 'auto' }}>

                          {stampEditorTab === 'share' && (
                            <div style={{ display: 'grid', gap: 14, paddingTop: 10 }}>
                              <button onClick={() => { handleSave(); }} disabled={isSaving} style={{ padding: 18, background: 'var(--accent-strong)', color: 'white', borderRadius: 16, border: 'none', fontWeight: 700, fontSize: 16, fontFamily: 'var(--sans)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 22 }}>💾</span>
                                <div>
                                  <div style={{ marginBottom: 2 }}>{isSaving ? 'Saving...' : 'Save Locally (My Collection)'}</div>
                                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Keep it to yourself on your device</div>
                                </div>
                              </button>
                              <button onClick={() => { handleSave(); }} disabled={isSaving} style={{ padding: 18, background: '#2c2c2c', color: 'white', borderRadius: 16, border: '1px solid #444', fontWeight: 700, fontSize: 16, fontFamily: 'var(--sans)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 22 }}>🌍</span>
                                <div>
                                  <div style={{ marginBottom: 2 }}>{isSaving ? 'Sharing...' : 'Share to Community Feed'}</div>
                                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Let other collectors discover it</div>
                                </div>
                              </button>
                            </div>
                          )}

                          {stampEditorTab === 'details' && (
                            <div style={{ display: 'grid', gap: 14 }}>
                              <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '14px', border: '1px solid #3c3c3c' }}>
                                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Stamp Paper Color</label>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12 }}>
                                  <div style={{ position: 'relative', width: 42, height: 42 }}>
                                    <input type="color" value={draft.stampColor || '#FFFDF8'} onChange={e => setDraft(d => ({ ...d, stampColor: e.target.value }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: draft.stampColor || '#FFFDF8', border: '2px solid rgba(255,255,255,0.8)' }} />
                                  </div>
                                </div>
                              </div>

                              <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '14px', border: '1px solid #3c3c3c' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Stamp Name</label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ position: 'relative', width: 20, height: 20 }}>
                                      <input type="color" value={draft.labelTextColor || draft.textColor || '#4A322D'} onChange={e => setDraft(d => ({ ...d, labelTextColor: e.target.value }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: draft.labelTextColor || draft.textColor || '#4A322D', border: '1px solid rgba(255,255,255,0.4)' }} />
                                    </div>
                                  </div>
                                </div>
                                <input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder="e.g. Freedom Flags" style={{ width: '100%', border: 'none', background: 'transparent', padding: '4px 0', fontSize: 16, color: '#fff', fontFamily: 'var(--sans)', outline: 'none' }} />
                              </div>

                              <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '14px', border: '1px solid #3c3c3c' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Location</label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ position: 'relative', width: 20, height: 20 }}>
                                      <input type="color" value={draft.locationTextColor || draft.textColor || '#4A322D'} onChange={e => setDraft(d => ({ ...d, locationTextColor: e.target.value }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: draft.locationTextColor || draft.textColor || '#4A322D', border: '1px solid rgba(255,255,255,0.4)' }} />
                                    </div>
                                  </div>
                                </div>
                                <input value={draft.location || ''} onChange={e => setDraft(d => ({ ...d, location: e.target.value.toUpperCase() }))} placeholder="e.g. CANADA" style={{ width: '100%', border: 'none', background: 'transparent', padding: '4px 0', fontSize: 16, color: '#fff', fontFamily: 'var(--sans)', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }} />
                              </div>

                              <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '14px', border: '1px solid #3c3c3c' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Copyright</label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ position: 'relative', width: 20, height: 20 }}>
                                      <input type="color" value={draft.copyrightTextColor || draft.textColor || '#4A322D'} onChange={e => setDraft(d => ({ ...d, copyrightTextColor: e.target.value }))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: draft.copyrightTextColor || draft.textColor || '#4A322D', border: '1px solid rgba(255,255,255,0.4)' }} />
                                    </div>
                                  </div>
                                </div>
                                <input value={draft.copyright ?? `© ${new Date().getFullYear()}`} onChange={e => setDraft(d => ({ ...d, copyright: e.target.value }))} placeholder={`© ${new Date().getFullYear()}`} style={{ width: '100%', border: 'none', background: 'transparent', padding: '4px 0', fontSize: 16, color: '#fff', fontFamily: 'var(--sans)', outline: 'none' }} />
                              </div>
                            </div>
                          )}

                          {stampEditorTab === 'style' && (
                            <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '20px 16px', border: '1px solid #3c3c3c' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Aging Effect</label>
                                <span style={{ color: '#fff', fontSize: 14, fontFamily: 'var(--sans)', fontWeight: 700 }}>{draft.agingIntensity ?? 36}%</span>
                              </div>
                              <input type="range" min="0" max="100" step="1" value={draft.agingIntensity ?? 36} onChange={e => setDraft(d => ({ ...d, agingIntensity: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#fff', height: 4 }} />
                            </div>
                          )}

                          {stampEditorTab === 'notes' && (
                            <div style={{ background: '#2c2c2c', borderRadius: 12, padding: '16px', border: '1px solid #3c3c3c' }}>
                              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.10em', textTransform: 'uppercase', display: 'block', marginBottom: 10, fontFamily: 'var(--sans)' }}>Description / Memory</label>
                              <textarea value={draft.note || ''} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="Write a memory about this stamp..." style={{ width: '100%', minHeight: 140, border: 'none', background: 'transparent', resize: 'none', fontSize: 15, lineHeight: 1.55, color: '#fff', fontFamily: 'var(--sans)', outline: 'none' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <button onClick={() => setLightbox(draft)} style={{ background: 'var(--surface-strong)', border: 'none', borderRadius: 'var(--radius-card)', padding: 20, boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Open postcard preview">
                        <PostcardView item={draft} scale={0.78} />
                      </button>
                      <button onClick={() => setShowCamera(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--sans)', letterSpacing: '0.06em', minHeight: 0 }}>← Retake photo</button>
                    </div>
                    <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 20, margin: 0 }}>Customize Your Postcard</h2>
                      <Field label="Destination" value={draft.destination} placeholder="e.g. Kyoto, Japan" onChange={v => setDraft(d => ({ ...d, destination: v, label: v }))} />
                      <Field label="Your Message" value={draft.message} placeholder="Wish you were here…" multiline onChange={v => setDraft(d => ({ ...d, message: v }))} />
                      <Field label="From" value={draft.from} placeholder="Your name" onChange={v => setDraft(d => ({ ...d, from: v }))} />
                      <Field label="To (Recipient)" value={draft.recipient} placeholder="Recipient name & address" onChange={v => setDraft(d => ({ ...d, recipient: v }))} />
                      <Field label="Location" value={draft.location} placeholder="e.g. JAPAN" onChange={v => setDraft(d => ({ ...d, location: v.toUpperCase() }))} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={handleSave} style={{ flex: 1, padding: '12px 20px', background: 'var(--accent-strong)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 700, letterSpacing: '0.06em', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-strong)'}>
                          Save to Collection ✉️
                        </button>
                        <button onClick={closeCreateModal} style={{ padding: '12px 14px', background: 'var(--surface-strong)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)', minHeight: 0 }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ══ SETTINGS */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 'var(--desktop-max)', margin: '0 auto', color: 'var(--text-h)', padding: '20px 16px' }}>
            <section style={{ marginBottom: 20, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '18px 18px 20px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-red-soft))', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--heading)', fontSize: 22, fontWeight: 700 }}>
                  {account.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Profile</p>
                  <h3 style={{ margin: '0 0 3px', color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 22, lineHeight: 1.05 }}>{account.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text)', fontSize: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={openCreateModal} style={{ minHeight: 38, padding: '9px 14px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--accent-bg)', color: 'var(--accent-strong)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>New Stamp</button>
                <button onClick={handleSignOut} style={{ minHeight: 38, padding: '9px 14px', border: '1px solid rgba(192,82,48,0.16)', borderRadius: 'var(--radius-pill)', background: 'var(--surface-strong)', color: 'var(--accent-red)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sign Out</button>
              </div>
            </section>

            <section style={{ marginBottom: 20, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '18px 18px 20px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Settings</p>
                  <h3 style={{ margin: '0 0 6px', color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 22, lineHeight: 1.05 }}>Geographic Tracking</h3>
                  <p style={{ margin: 0, color: 'var(--text)', fontSize: 12, lineHeight: 1.6 }}>
                    Turn this on to detect your location while capturing so new stamps can auto-fill origin and pin directly onto your map.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLocationTrackingToggle}
                  aria-pressed={locationTrackingEnabled}
                  style={{
                    minHeight: 0,
                    width: 68,
                    height: 38,
                    border: 'none',
                    borderRadius: 999,
                    padding: 4,
                    background: locationTrackingEnabled ? 'var(--accent)' : '#e0dada',
                    cursor: 'pointer',
                    position: 'relative',
                    flex: '0 0 auto',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: locationTrackingEnabled ? 34 : 4,
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>
              <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>
                {locationTrackingEnabled
                  ? (locationStatus === 'ready' ? 'Tracking enabled' : 'Tracking enabled • awaiting location')
                  : 'Tracking disabled'}
              </div>
            </section>
          </div>
        )}

        {/* ══ SAVED STAMPS */}
        {tab === 'saved' && (
          <div style={{ maxWidth: 'var(--desktop-max)', margin: '0 auto', color: 'var(--text-h)', padding: '20px 16px' }}>
            <section style={{ textAlign: 'center', padding: '10px 0 32px' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 16px', borderRadius: 16, background: 'var(--accent-strong)', boxShadow: '0 12px 28px rgba(79,134,184,0.18)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'white', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontSize: 22 }}>✓</div>
                <div style={{ position: 'absolute', right: -6, top: -6, width: 24, height: 24, borderRadius: 8, background: '#e8b730', color: '#4A3D00', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>✦</div>
              </div>
              <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--heading)', fontSize: 32, lineHeight: 1.1, color: 'var(--text-h)', fontWeight: 700 }}>Stamp Collection</h2>
              <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{account.name}&apos;s catalogued memories across the globe.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                {[
                  { value: myItems.length.toLocaleString(), label: 'Stampz' },
                  { value: Math.max(0, myItems.reduce((sum, item) => sum + (item.likes || 0), 0)).toLocaleString(), label: 'Likes' },
                  { value: new Set(myItems.map(item => item.collection)).size || 0, label: 'Sets' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p style={{ margin: 0, color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 24, fontWeight: 700 }}>{stat.value}</p>
                    <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={openCreateModal} style={{ width: 'min(100%, 300px)', padding: '14px 20px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--accent-red)', color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700, boxShadow: '0 12px 28px rgba(192,82,48,0.16)' }}>Capture New Stamp</button>
            </section>

            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 22 }}>Your Archive</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {['All', ...COLLECTIONS].map(c => <Pill key={c} label={c} active={colFilter === c} onClick={() => setColFilter(c)} activeColor="var(--accent-red)" />)}
                </div>
              </div>

              {filteredMine.length === 0 ? (
                <div style={{ background: 'var(--surface-strong)', borderRadius: 'var(--radius-card)', padding: '60px 24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 16, opacity: 0.4 }}><img src="/logo.png" alt="" style={{ width: 64, height: 64, filter: 'grayscale(1)' }} /></div>
                  <p style={{ fontFamily: 'var(--heading)', fontSize: 22, color: 'var(--text-h)', margin: '0 0 8px' }}>No stampz caught yet</p>
                  <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Your collection is looking a bit sparse. Head out into the world and capture some memories!</p>
                  <button onClick={openCreateModal} style={{ padding: '12px 28px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)' }}>Start Capturing</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                  {filteredMine.map(item => (
                    <button key={item.id} onClick={() => setLightbox(item)} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '16px 12px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-soft)', display: 'grid', gap: 12 }}>
                      <div style={{ display: 'grid', placeItems: 'center', minHeight: 140 }}>
                        {item.type === 'stamp' ? <StampView item={item} size="sm" /> : <PostcardView item={item} scale={0.34} />}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.locationLabel || item.collection}</p>
                        <p style={{ margin: 0, color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 16, lineHeight: 1.2 }}>{item.label || item.destination || 'Saved stamp'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══ MAP VIEW (Home) */}
        {tab === 'map' && (
          <div style={{ maxWidth: 'var(--desktop-max)', margin: '0 auto' }}>
            <div style={{ position: 'relative', width: '100%', background: 'var(--surface-tint)', overflow: 'hidden' }}>
              <WorldMap
                items={savedStampItems}
                currentLocation={currentLocation}
                selectedItemId={selectedMapItem?.id}
                onSelectStamp={item => {
                  setSelectedMapItemId(item.id);
                  setLightbox(item);
                }}
                onRequestLocation={requestLocation}
                focusSignal={mapFocusSignal}
              />
              <button
                onClick={() => requestLocation()}
                style={{ position: 'absolute', right: 16, top: 16, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-card)', color: 'var(--accent-strong)' }}
                aria-label="Recenter"
              >
                <span style={{ fontSize: 20 }}>📍</span>
              </button>

              <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 10, background: 'rgba(255,255,255,0.94)', padding: '10px 16px', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-soft)' }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-strong)' }} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-h)', letterSpacing: '0.05em' }}>{placedMine.length} Pinned</span>
              </div>
            </div>

            <div style={{ padding: '24px 16px' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ margin: '0 0 6px', color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 32, lineHeight: 1.1 }}>Explore Journeys</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Your captures pinned across the world map. Tap to revisit a memory.</p>
              </div>

              {savedStampItems.length > 0 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h3 style={{ margin: 0, color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 20 }}>Recent Discoveries</h3>
                    <button onClick={() => setTab('saved')} style={{ minHeight: 0, padding: 0, border: 'none', background: 'transparent', color: 'var(--accent-strong)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)', letterSpacing: '0.06em', fontWeight: 600 }}>Full Archive →</button>
                  </div>
                  <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, margin: '0 -4px', paddingLeft: 4 }}>
                    {savedStampItems.slice(0, 8).map(item => (
                      <button key={item.id} onClick={() => setLightbox(item)} style={{ minWidth: 160, border: 'none', background: 'var(--surface-strong)', borderRadius: 'var(--radius-card)', padding: '14px 12px', display: 'grid', gap: 10, cursor: 'pointer', boxShadow: 'var(--shadow-soft)', textAlign: 'left', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', placeItems: 'center', minHeight: 140 }}>
                          {item.type === 'stamp' ? <StampView item={item} size="sm" /> : <PostcardView item={item} scale={0.34} />}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.locationLabel || item.collection}</p>
                          <p style={{ margin: 0, color: 'var(--text-h)', fontFamily: 'var(--heading)', fontSize: 16, lineHeight: 1.2 }}>{item.label || item.destination || 'Stamp Name'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {unplacedMine.length > 0 && (
                <div style={{ marginTop: 24, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 24 }}>📍</div>
                  <div>
                    <p style={{ margin: '0 0 4px', color: 'var(--accent-strong)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Unplaced Memories</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                      {unplacedMine.length} saved captured {unplacedMine.length === 1 ? 'is' : 'are'} waiting for a location to be pinned.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ FEED VIEW */}
        {tab === 'feed' && (
          <div style={{ maxWidth: 'var(--desktop-max)', margin: '0 auto', padding: '20px 16px' }}>
            {viewingProfile && profile ? (
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <button onClick={() => setViewingProfile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', letterSpacing: '0.06em', marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>← Back to Community</button>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 24, marginBottom: 28, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${profile.color}, #FFD166)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--heading)', fontSize: 28, fontWeight: 700, border: '4px solid white', boxShadow: 'var(--shadow-soft)' }}>{profile.name.charAt(0)}</div>
                    <div style={{ flex: '1 1 240px' }}>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-strong)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>@{viewingProfile}</p>
                      <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 28, margin: '2px 0 6px' }}>{profile.name}</h2>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{profile.location} · {profile.bio}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 24 }}>
                  {profileStamps.map(stamp => (
                    <div key={stamp.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <StampView item={stamp} size="md" onClick={() => setLightbox(stamp)} showMeta />
                      <button onClick={() => { if (myItems.find(i => i.id === stamp.id)) { showToast('Already in collection'); return; } setMyItems(p => [{ ...stamp, id: genId(), createdAt: Date.now() }, ...p]); showToast('✉️ Saved to collection!'); }}
                        style={{ padding: '6px 16px', fontSize: 11, borderRadius: 20, border: '1.5px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--accent-strong)', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 700, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-strong)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}>
                        + Save to Collection
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 32, margin: '0 0 6px' }}>Collector Community</h2>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Discover global perspectives through captured moments.</p>
                </div>

                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 4px 20px', margin: '0 -4px 18px', scrollbarWidth: 'none' }}>
                  {[...new Set(communityItems.map(stamp => stamp.author))].map(author => {
                    const storyProfile = getCommunityProfile(author);
                    return (
                      <button key={author} onClick={() => setViewingProfile(author)} style={{ minWidth: 70, border: 'none', background: 'transparent', cursor: 'pointer', display: 'grid', justifyItems: 'center', gap: 8, color: 'var(--text-h)' }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg,var(--accent-strong),var(--accent-red),#FFD166)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-soft)' }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid white', background: storyProfile.color, color: 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--heading)', fontSize: 24, fontWeight: 700 }}>
                            {storyProfile.name.charAt(0)}
                          </div>
                        </div>
                        <span style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, fontFamily: 'var(--sans)', fontWeight: 600 }}>@{author}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {['All', ...COLLECTIONS].map(c => <Pill key={c} label={c} active={browseFilter === c} onClick={() => setBrowseFilter(c)} activeColor="var(--accent-red)" />)}
                </div>

                <div style={{ display: 'grid', gap: 28 }}>
                  {filteredCommunity.map(stamp => {
                    const stampProfile = getCommunityProfile(stamp.author);
                    const isLiked = Boolean(liked[stamp.id]);
                    return (
                      <article key={stamp.id} style={{ overflow: 'hidden', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                          <button onClick={() => setViewingProfile(stamp.author)} style={{ minHeight: 0, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', flex: 1 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg,var(--accent-strong),var(--accent-red),#FFD166)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid white', background: stampProfile.color, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                                {stampProfile.name.charAt(0)}
                              </div>
                            </div>
                            <span>
                              <strong style={{ display: 'block', color: 'var(--text-h)', fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.2 }}>@{stamp.author}</strong>
                              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{stampProfile.location}</span>
                            </span>
                          </button>
                          <button onClick={() => setViewingProfile(stamp.author)} style={{ minHeight: 0, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text-h)', borderRadius: 'var(--radius-pill)', padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View</button>
                        </div>
                        <button onClick={() => setLightbox(stamp)} style={{ width: '100%', border: 'none', background: 'var(--surface-tint)', padding: '24px 16px', display: 'grid', placeItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <StampView item={stamp} size="lg" showMeta={false} />
                        </button>
                        <div style={{ padding: '16px 18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                            <button onClick={() => { setLiked(l => ({ ...l, [stamp.id]: !l[stamp.id] })); showToast(isLiked ? 'Removed like' : '♥ Liked!'); }} style={{ minHeight: 0, padding: 0, border: 'none', background: 'transparent', color: isLiked ? 'var(--accent-red)' : 'var(--text-h)', cursor: 'pointer', fontSize: 26, lineHeight: 1 }}>{isLiked ? '♥' : '♡'}</button>
                            <button onClick={() => { if (myItems.find(i => i.id === stamp.id)) { showToast('Already in collection'); return; } setMyItems(p => [{ ...stamp, id: genId(), createdAt: Date.now() }, ...p]); showToast('✉️ Saved to collection!'); }} style={{ minHeight: 0, padding: 0, border: 'none', background: 'transparent', color: 'var(--text-h)', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>＋</button>
                            <span style={{ marginLeft: 'auto', color: 'var(--accent-strong)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stamp.collection}</span>
                          </div>
                          <p style={{ margin: '0 0 6px', color: 'var(--text-h)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700 }}>{(stamp.likes + (isLiked ? 1 : 0)).toLocaleString()} likes</p>
                          <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}><strong>@{stamp.author}</strong> {stamp.label || stamp.country || 'A new capture'} meticulously catalogued in the {stamp.collection} collection.</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main >

      {!showCreateModal && !showCamera && (
        <nav className="app-nav" aria-label="Primary">
          <TabButton id="map" icon="⌖" label="World" active={tab === 'map'} onSelect={handleTabSelect} />
          <TabButton id="feed" icon="▤" label="Feed" active={tab === 'feed'} onSelect={handleTabSelect} />
          <TabButton id="create" icon="+" label="Create" active={false} onSelect={openCreateModal} isCenter />
          <TabButton id="saved" icon="⚐" label="Saved" active={tab === 'saved'} onSelect={handleTabSelect} />
          <TabButton id="settings" icon="○" label="Menu" active={tab === 'settings'} onSelect={handleTabSelect} />
        </nav>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,14,0.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 24, backdropFilter: 'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 'var(--radius-card)', padding: '32px 24px', maxWidth: 480, width: '100%', boxShadow: '0 32px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'transparent', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>×</button>
            <div style={{ background: 'var(--surface-strong)', borderRadius: 'var(--radius-sm)', padding: 24, width: '100%', display: 'flex', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px var(--border)' }}>
              {lightbox.type === 'stamp' ? <StampView item={lightbox} size="lg" /> : <PostcardView item={lightbox} scale={0.82} />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontFamily: 'var(--heading)', color: 'var(--text-h)', fontSize: 22, fontWeight: 700 }}>{lightbox.label || lightbox.destination || 'Untitled Journey'}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--sans)', letterSpacing: '0.04em' }}>Collection: {lightbox.collection}</p>
              {lightbox.author && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--accent-strong)', fontFamily: 'var(--sans)', fontWeight: 700 }}>Captured by @{lightbox.author}</p>}
            </div>
            {lightbox.note && (
              <div style={{ padding: '16px', background: 'var(--surface-tint)', borderRadius: 12, width: '100%', fontStyle: 'italic', fontSize: 14, color: 'var(--text)', lineHeight: 1.6, textAlign: 'center' }}>
                &ldquo;{lightbox.note}&rdquo;
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => { }); showToast('📋 Link copied!'); setLightbox(null); }} style={{ flex: 1, minWidth: 120, padding: '12px 20px', background: 'var(--accent-strong)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)' }}>Share Capture</button>
              {myItems.find(i => i.id === lightbox.id) && lightbox.type === 'stamp' && (
                <button onClick={() => { setLightbox(null); startEditingItem(lightbox); }} style={{ flex: 1, minWidth: 120, padding: '12px 20px', background: 'var(--surface-strong)', color: 'var(--accent-red)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--sans)' }}>Edit Style</button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        .app-shell { position: relative; width: 100%; min-height: 100vh; overflow-x: hidden; background: var(--bg); }
        .app-header { display: flex; align-items: center; justify-content: center; height: calc(64px + env(safe-area-inset-top)); position: sticky; top: 0; background: rgba(253, 248, 244, 0.94); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); z-index: 1000; padding: env(safe-area-inset-top) 16px 0; }
        .app-brand-title { margin: 0; font-family: var(--heading); font-size: 26px; color: var(--text-h); font-style: italic; font-weight: 400; letter-spacing: -0.01em; }
        .header-create-button { position: absolute; left: 16px; top: calc(env(safe-area-inset-top) + 16px); width: 32px; height: 32px; borderRadius: 50%; background: var(--accent-red); color: white; border: none; display: grid; place-items: center; cursor: pointer; boxShadow: 0 4px 12px rgba(192,82,48,0.22); transition: all 0.2s; }
        .app-main { padding-bottom: 110px; }
        .app-nav { position: fixed; bottom: 0; left: 0; right: 0; height: calc(74px + env(safe-area-inset-bottom)); background: rgba(253, 248, 244, 0.94); backdrop-filter: blur(16px); border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-around; padding: 0 12px env(safe-area-inset-bottom); z-index: 1000; }
        @media (min-width: 1024px) {
          .app-main { width: 100%; max-width: none; margin: 0; }
        }
        .create-modal { position: fixed; inset: 0; background: rgba(20,16,14,0.36); backdrop-filter: blur(8px); display: flex; flex-direction: column; z-index: 2000; animation: fadeIn 0.2s ease-out; }
        .create-modal__panel { background: var(--bg); width: 100%; max-width: 680px; margin: 0 auto; height: 100%; padding: 20px 16px; position: relative; overflow-y: auto; }
        .create-modal__panel--editor { width: 100%; height: calc(100% - 40px) !important; margin-top: auto; border-radius: 32px 32px 0 0; display: flex !important; flex-direction: column !important; padding: 0 !important; background: var(--bg); overflow: hidden; max-width: 440px; }
        .create-modal__topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--bg); z-index: 10; height: 60px; }
        .create-modal__topaction { background: none; border: none; color: var(--text-muted); cursor: pointer; fontSize: 13; fontFamily: var(--sans); letterSpacing: '0.04em'; fontWeight: 600; padding: 0; minHeight: 0; }
        .stamp-editor-shell { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .stamp-editor-preview { padding: 40px 16px; background: var(--surface-tint); display: grid; place-items: center; border-bottom: 1px solid var(--border); }
        .stamp-editor-tray { flex: 1; display: flex; flex-direction: column; padding: 20px 24px 44px; background: var(--bg); min-height: 0; overflow: hidden; }
        .stamp-editor-tray__scroller { flex: 1; overflow-y: auto; padding-right: 4px; padding-bottom: 40px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default App;
