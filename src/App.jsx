import { useState, useRef, useEffect, useCallback } from "react";

const STAMP_COLORS = ['#FFFDF8','#FDE2E4','#DDEAFB','#E9E6FF','#DFF4EE','#FFF0D2','#F7D7E8','#F8ECE6'];
const CURRENT_YEAR = 2026;
const COLLECTIONS = ['Destinations','Nature','Architecture','Food & Culture','Wildlife','People & Culture','Abstract'];
const PROFILE_STORAGE_KEY = 'stampz.profile';
const COLLECTION_STORAGE_PREFIX = 'stampz.collection';
const LEGACY_PROFILE_STORAGE_KEY = 'stampworld.profile';
const LEGACY_COLLECTION_STORAGE_PREFIX = 'stampworld.collection';

const COMMUNITY_STAMPS = [
  { id:'c1', type:'stamp', country:'NIPPON', denomination:'¥120', label:'Cherry Blossom', gradient:'linear-gradient(135deg,#f8b4c8,#ff6b9d,#c44569)', collection:'Nature', author:'hanami_ko', likes:247, accentColor:'#c44569' },
  { id:'c2', type:'stamp', country:'FRANCE', denomination:'€0.88', label:'La Tour Eiffel', gradient:'linear-gradient(135deg,#a5b4fc,#c4b5fd)', collection:'Destinations', author:'paris_phil', likes:189, accentColor:'#6C63FF' },
  { id:'c3', type:'stamp', country:'BRASIL', denomination:'R$3.75', label:'Carnaval', gradient:'linear-gradient(135deg,#f7971e,#ffd200)', collection:'Food & Culture', author:'rio_stamps', likes:134, accentColor:'#B87333' },
  { id:'c4', type:'stamp', country:'KENYA', denomination:'KES 50', label:'Savanna Dusk', gradient:'linear-gradient(135deg,#d4a843,#8B6014)', collection:'Wildlife', author:'safari_co', likes:312, accentColor:'#8B4513' },
  { id:'c5', type:'stamp', country:'ÍSLAND', denomination:'kr.250', label:'Norðurljós', gradient:'linear-gradient(135deg,#0f3460,#533483,#16c79a)', collection:'Nature', author:'aurora_fan', likes:428, accentColor:'#533483' },
  { id:'c6', type:'stamp', country:'INDIA', denomination:'₹5.00', label:'Taj Mahal', gradient:'linear-gradient(135deg,#f093fb,#f5576c)', collection:'Architecture', author:'heritage_stamps', likes:267, accentColor:'#f5576c' },
  { id:'c7', type:'stamp', country:'PERÚ', denomination:'S/.3.00', label:'Machu Picchu', gradient:'linear-gradient(135deg,#4facfe,#00f2fe)', collection:'Destinations', author:'inca_trail', likes:198, accentColor:'#336699' },
  { id:'c8', type:'stamp', country:'ITALIA', denomination:'€1.20', label:'La Cucina', gradient:'linear-gradient(135deg,#a8edea,#fed6e3)', collection:'Food & Culture', author:'cucina_co', likes:156, accentColor:'#FF7AA8' },
  { id:'c9', type:'stamp', country:'MAROC', denomination:'MAD 8', label:'Medina', gradient:'linear-gradient(135deg,#e96c2a,#f5a623,#c0392b)', collection:'Architecture', author:'souk_stamps', likes:203, accentColor:'#c0392b' },
  { id:'c10', type:'stamp', country:'CANADA', denomination:'CA$1.07', label:'Aurora', gradient:'linear-gradient(135deg,#a7f3d0,#a5b4fc,#f0abfc)', collection:'Nature', author:'northern_phil', likes:381, accentColor:'#FF7AA8' },
  { id:'c11', type:'stamp', country:'GREECE', denomination:'€0.95', label:'Santorini', gradient:'linear-gradient(135deg,#0099cc,#ffffff,#0055aa)', collection:'Destinations', author:'aegean_stamps', likes:145, accentColor:'#0055aa' },
  { id:'c12', type:'stamp', country:'GHANA', denomination:'GHS 5', label:'Kente Cloth', gradient:'linear-gradient(135deg,#006b3f,#fcd116,#ce1126)', collection:'People & Culture', author:'accra_philately', likes:289, accentColor:'#006b3f' },
];

const COMMUNITY_PROFILES = {
  hanami_ko: { name:'Ko Arai', location:'Kyoto, Japan', bio:'Soft botanical issues and seasonal Japan finds.', color:'#FF7AA8' },
  paris_phil: { name:'Philippe Laurent', location:'Paris, France', bio:'Landmark stamps, postal history, and city breaks.', color:'#6C63FF' },
  rio_stamps: { name:'Ana Costa', location:'Rio de Janeiro, Brasil', bio:'Colorful culture stamps from festivals and food markets.', color:'#FFB86B' },
  safari_co: { name:'Amara Njoroge', location:'Nairobi, Kenya', bio:'Wildlife releases and golden-hour conservation issues.', color:'#8B4513' },
  aurora_fan: { name:'Elin Jóns', location:'Reykjavík, Iceland', bio:'Northern light palettes, landscapes, and quiet nature collections.', color:'#B48CFF' },
  heritage_stamps: { name:'Mira Kapoor', location:'Agra, India', bio:'Architecture, monuments, and heritage stamp sheets.', color:'#f5576c' },
  inca_trail: { name:'Mateo Quispe', location:'Cusco, Peru', bio:'Mountain destinations and travel-led issues.', color:'#336699' },
  cucina_co: { name:'Lucia Romano', location:'Bologna, Italia', bio:'Food culture, kitchen stories, and warm pastel stamps.', color:'#FF7AA8' },
  souk_stamps: { name:'Youssef Amrani', location:'Marrakesh, Maroc', bio:'Markets, medinas, and architectural texture.', color:'#c0392b' },
  northern_phil: { name:'Nora Ellis', location:'Yellowknife, Canada', bio:'Aurora collections and cold-weather commemoratives.', color:'#7BDCB5' },
  aegean_stamps: { name:'Nikos Vale', location:'Santorini, Greece', bio:'Island palettes, sea blues, and travel keepsakes.', color:'#0055aa' },
  accra_philately: { name:'Ama Mensah', location:'Accra, Ghana', bio:'Textiles, culture, and bold commemorative releases.', color:'#006b3f' },
};

const AUTH_HERO_STAMP = {
  type:'stamp',
  country:'CANADA',
  label:'North Shore Morning',
  note:'Sea glass skies and a quiet harbor.',
  stampColor:'#DDEAFB',
  agingIntensity:18,
  createdAt:new Date(`${CURRENT_YEAR}-01-01`).toISOString(),
  image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
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
    holes.push({ cx: x,     cy: y + i * vSp });
    holes.push({ cx: x + w, cy: y + i * vSp });
  }
  return holes;
}

/* ── CSS/SVG stamp mask for StampView ── */
function buildStampMask(w, h, hole, sp) {
  const hCount = Math.max(3, Math.round(w / sp));
  const vCount = Math.max(3, Math.round(h / sp));
  const hSp = w / hCount;
  const vSp = h / vCount;
  const inset = hole;
  let scallops = '';
  for (let i = 0; i <= hCount; i++) {
    const x = (i * hSp).toFixed(1);
    scallops += `<circle cx="${x}" cy="${inset}" r="${hole}"/><circle cx="${x}" cy="${(h - inset).toFixed(1)}" r="${hole}"/>`;
  }
  for (let i = 1; i < vCount; i++) {
    const y = (i * vSp).toFixed(1);
    scallops += `<circle cx="${inset}" cy="${y}" r="${hole}"/><circle cx="${(w - inset).toFixed(1)}" cy="${y}" r="${hole}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${Math.max(1, hole * 0.34)}" fill="white"/><g fill="white">${scallops}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const STAMP_SIZES = {
  xs:{ w:86,  h:106, frame:10, hole:4.2, sp:8.5 },
  sm:{ w:124, h:154, frame:13, hole:5.2, sp:10 },
  md:{ w:158, h:198, frame:15, hole:6,   sp:11.5 },
  lg:{ w:218, h:272, frame:20, hole:7.5, sp:14.5 },
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

function ScallopEdges({ inset, marginX, marginY, radius, step, color='white' }) {
  const diameter = radius * 2;
  return (
    <div style={{ position:'absolute', inset, pointerEvents:'none' }}>
      <div
        style={{
          position:'absolute',
          left:marginX,
          right:marginX,
          top:-radius,
          height:diameter,
          background:`radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${step}px ${diameter}px repeat-x`,
        }}
      />
      <div
        style={{
          position:'absolute',
          left:marginX,
          right:marginX,
          bottom:-radius,
          height:diameter,
          background:`radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${step}px ${diameter}px repeat-x`,
        }}
      />
      <div
        style={{
          position:'absolute',
          top:marginY,
          bottom:marginY,
          left:-radius,
          width:diameter,
          background:`radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${diameter}px ${step}px repeat-y`,
        }}
      />
      <div
        style={{
          position:'absolute',
          top:marginY,
          bottom:marginY,
          right:-radius,
          width:diameter,
          background:`radial-gradient(circle at ${radius}px ${radius}px, ${color} 0 ${radius}px, transparent ${radius + 0.5}px) 0 0 / ${diameter}px ${step}px repeat-y`,
        }}
      />
    </div>
  );
}

/* ── StampView ── */
function StampView({ item, size='md', onClick, showMeta=false }) {
  const { w, h } = STAMP_SIZES[size];
  const stampCode = (item.label || item.note || '824-A').toUpperCase().slice(0, 18);
  const stampBg = item.stampColor || '#F6DDE2';
  const stampPaper = '#FFFDFC';
  const edgeStroke = 'rgba(188, 172, 172, 0.82)';
  const aging = getAgingStyle(item.agingIntensity ?? 36);
  const outerRadius = Math.max(12, w * 0.08);
  const maskImage = buildStampMask(w, h, Math.max(4.2, w * 0.032), Math.max(8.8, w * 0.064));
  const photoInsetX = Math.max(10, w * 0.068);
  const photoInsetTop = Math.max(10, w * 0.068);
  const photoInsetBottom = Math.max(20, h * 0.12);
  const imageHeight = h - photoInsetTop - photoInsetBottom;
  const countryFont = Math.max(8, w * 0.06);
  const labelFont = Math.max(7, w * 0.05);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
      <div style={{ cursor:onClick?'pointer':'default', transition:'transform 0.22s', filter:'drop-shadow(0 18px 30px rgba(30, 34, 48, 0.16))' }}
        onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform='scale(1.05) rotate(-1.5deg)'; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform=''; }}
        onClick={onClick}>
        <div style={{ width:w, height:h, position:'relative', overflow:'visible' }}>
          <div style={{ position:'absolute', inset:0, background:edgeStroke, borderRadius:outerRadius, WebkitMaskImage:maskImage, maskImage:maskImage, WebkitMaskSize:'100% 100%', maskSize:'100% 100%', WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', filter:'drop-shadow(0 1px 0 rgba(255,255,255,0.55)) drop-shadow(0 8px 16px rgba(70,52,52,0.12))' }}/>
          <div style={{ position:'absolute', inset:1.5, background:stampBg, borderRadius:Math.max(outerRadius - 1, 0), WebkitMaskImage:maskImage, maskImage:maskImage, WebkitMaskSize:'100% 100%', maskSize:'100% 100%', WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat' }}/>
          <div style={{ position:'absolute', inset:Math.max(6, w * 0.034), background:'rgba(255,255,255,0.42)', borderRadius:Math.max(outerRadius - 5, 0), WebkitMaskImage:maskImage, maskImage:maskImage, WebkitMaskSize:'100% 100%', maskSize:'100% 100%', WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', opacity:0.72 }}/>
          <div style={{ position:'absolute', left:photoInsetX, right:photoInsetX, top:photoInsetTop, height:imageHeight, background:stampPaper, overflow:'hidden', boxShadow:`0 0 0 1px ${aging.borderColor}, inset 0 0 0 1px rgba(255,255,255,0.56)` }}>
            {item.image
              ? <img src={item.image} alt={item.label} style={{ width:'100%', aspectRatio:'1 / 1.18', objectFit:'cover', objectPosition:'center center', display:'block', background:stampPaper, filter:aging.imageFilter }}/>
              : <div style={{ width:'100%', height:'100%', background:stampPaper, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#8C6E6E', fontSize:Math.max(10, w * 0.1), fontStyle:'italic', textAlign:'center', padding:6, fontFamily:'"Playfair Display",Georgia,serif', lineHeight:1.3 }}>{item.label || 'Stamp'}</span>
                </div>
            }
            <div style={{ position:'absolute', inset:0, ...aging.paperOverlay, pointerEvents:'none', zIndex:1 }}/>
            <div style={{ position:'absolute', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity:aging.grainOpacity, mixBlendMode:'multiply', pointerEvents:'none', zIndex:1 }}/>
            <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.18)', pointerEvents:'none', zIndex:1 }}/>
            <div style={{ position:'absolute', top:10, right:8, color:'#4A322D', fontSize:countryFont, letterSpacing:'0.22em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', writingMode:'vertical-rl', textOrientation:'mixed', zIndex:2, textShadow:'0 1px 0 rgba(255,255,255,0.58)' }}>
              {item.country || 'STAMPZ'}
            </div>
          </div>
          <div style={{ position:'absolute', left:photoInsetX, right:photoInsetX, bottom:Math.max(8, h * 0.045), display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:8, zIndex:2 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ color:'#4A322D', fontSize:labelFont, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', textShadow:'0 1px 0 rgba(255,255,255,0.6)' }}>
                  {item.label || 'Untitled Stamp'}
                </div>
                <div style={{ color:'rgba(74,50,45,0.76)', fontSize:Math.max(6, w * 0.038), letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', marginTop:2 }}>
                  {item.createdAt ? new Date(item.createdAt).getFullYear() : CURRENT_YEAR}
                </div>
              </div>
              <div style={{ padding:`${Math.max(6, w * 0.03)}px ${Math.max(10, w * 0.05)}px`, background:'rgba(255,249,247,0.78)', backdropFilter:'blur(6px)', color:'#4A322D', fontSize:labelFont, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', whiteSpace:'nowrap', border:'1px solid rgba(255,255,255,0.72)', borderRadius:999 }}>
                {`Stamp No. ${stampCode}`}
              </div>
          </div>
        </div>
      </div>
      {showMeta && item.likes!=null && <span style={{ fontSize:10, color:'#999', fontFamily:'Georgia,serif' }}>♥ {item.likes.toLocaleString()}</span>}
      {showMeta && item.author && <span style={{ fontSize:9, color:'#bbb', fontFamily:'Georgia,serif' }}>@{item.author}</span>}
    </div>
  );
}

function EditorStampPreview({ item, onClick }) {
  const preview = (
    <div style={{ width:'100%', display:'grid', placeItems:'center', padding:'8px 0' }}>
      <StampView item={item} size="lg" />
    </div>
  );
  if (!onClick) return preview;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open stamp preview"
      style={{ width:'100%', border:'none', background:'transparent', padding:0, display:'grid', placeItems:'center', cursor:'pointer' }}
    >
      {preview}
    </button>
  );
}

function WorldMap({ items, currentLocation, selectedItemId, onSelectStamp, onRequestLocation, focusSignal }) {
  const mapFrameRef = useRef(null);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const placedItems = items.filter(item=>Number.isFinite(item.locationLat) && Number.isFinite(item.locationLng));
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
  const tiles = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    const safeTileY = clampTileY(tileY, mapView.zoom);
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
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    const next = worldToLatLng(
      dragRef.current.centerWorldX - dx,
      dragRef.current.centerWorldY - dy,
      mapView.zoom
    );
    setMapView(view => ({
      ...view,
      centerLat: next.lat,
      centerLng: next.lng,
    }));
  };

  const handlePointerEnd = event => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    mapFrameRef.current?.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      ref={mapFrameRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ position:'relative', borderRadius:28, overflow:'hidden', background:'#d4d4d6', border:'1px solid rgba(173, 168, 169, 0.42)', boxShadow:'0 18px 42px rgba(95, 109, 136, 0.12)', minHeight:520, cursor:isDragging ? 'grabbing' : 'grab', touchAction:'none' }}
    >
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(120,126,141,0.08))', pointerEvents:'none', zIndex:1 }}/>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle, rgba(182,69,18,0.16) 1px, transparent 1.25px) 0 0 / 22px 22px', opacity:0.18, pointerEvents:'none', zIndex:2 }}/>
      <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none', transform:'scale(1.02)' }}>
        {tiles.map(tile=>(
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable="false"
            style={{
              position:'absolute',
              left:tile.left,
              top:tile.top,
              width:TILE_SIZE,
              height:TILE_SIZE,
              objectFit:'cover',
              filter:'saturate(0.9) contrast(1.03) brightness(1.02)',
              userSelect:'none',
              pointerEvents:'none',
            }}
          />
        ))}
      </div>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, rgba(255,255,255,0.18), transparent 32%, rgba(62,73,96,0.12))', pointerEvents:'none', zIndex:1 }}/>
      <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none' }}>
        {placedItems.map(item=>{
          const point = projectPoint(item.locationLat, item.locationLng, viewport.width, viewport.height);
          const isSelected = item.id===selectedItemId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={()=>onSelectStamp(item)}
              aria-label={`Open ${item.label || item.country || 'stamp'} on map`}
              style={{ position:'absolute', left:point.x - 10, top:point.y - 24, width:20, height:24, padding:0, border:'none', background:'transparent', cursor:'pointer', pointerEvents:'auto' }}
            >
              <div style={{ width:'100%', height:'100%', position:'relative', transform:isSelected ? 'translateY(-1px) scale(1.08)' : 'scale(1)', transition:'transform 0.18s', filter:isSelected ? 'drop-shadow(0 8px 14px rgba(37,85,255,0.28))' : 'drop-shadow(0 6px 12px rgba(40,47,63,0.18))' }}>
                <div style={{ position:'absolute', left:'50%', bottom:1, width:8, height:8, background:isSelected ? '#2555FF' : '#B64512', transform:'translateX(-50%) rotate(45deg)', borderRadius:'0 0 2px 0' }}/>
                <div style={{ position:'absolute', left:'50%', top:0, width:18, height:18, transform:'translateX(-50%)', borderRadius:'50%', background:isSelected ? '#2555FF' : '#B64512', border:'2px solid rgba(255,255,255,0.92)', boxShadow:'0 1px 0 rgba(255,255,255,0.35) inset' }}/>
                <div style={{ position:'absolute', left:'50%', top:5, width:8, height:8, transform:'translateX(-50%)', borderRadius:'50%', background:'rgba(255,255,255,0.96)' }}/>
              </div>
            </button>
          );
        })}
        {currentLocation && (() => {
          const point = projectPoint(currentLocation.lat, currentLocation.lng, viewport.width, viewport.height);
          return (
            <div
              style={{
                position:'absolute',
                left:point.x - 7,
                top:point.y - 7,
                width:14,
                height:14,
                borderRadius:'50%',
                background:'#2555FF',
                border:'2px solid rgba(255,255,255,0.95)',
                boxShadow:'0 0 0 8px rgba(37,85,255,0.16)',
                pointerEvents:'none'
              }}
            />
          );
        })()}
      </div>
      <div style={{ position:'absolute', right:16, bottom:18, zIndex:4, display:'grid', gap:10 }}>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={()=>setMapView(view=>({ ...view, zoom: clamp(view.zoom + 1, 1, 12) }))}
          style={{ minHeight:0, width:54, height:54, borderRadius:18, border:'1px solid rgba(255,255,255,0.72)', background:'rgba(255,245,246,0.96)', color:'#5a291f', cursor:'pointer', fontSize:28, fontWeight:700, boxShadow:'0 10px 24px rgba(95, 109, 136, 0.14)' }}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={()=>setMapView(view=>({ ...view, zoom: clamp(view.zoom - 1, 1, 12) }))}
          style={{ minHeight:0, width:54, height:54, borderRadius:18, border:'1px solid rgba(255,255,255,0.72)', background:'rgba(255,245,246,0.96)', color:'#5a291f', cursor:'pointer', fontSize:28, fontWeight:700, boxShadow:'0 10px 24px rgba(95, 109, 136, 0.14)' }}
        >
          −
        </button>
        <button
          type="button"
          aria-label={currentLocation ? 'Center on my location' : 'Enable location'}
          onClick={()=>{
            if (currentLocation) {
              setMapView(view=>({
                ...view,
                centerLat: currentLocation.lat,
                centerLng: currentLocation.lng,
                zoom: Math.max(view.zoom, 7),
              }));
              return;
            }
            onRequestLocation?.();
          }}
          style={{ minHeight:0, width:54, height:54, borderRadius:18, border:'none', background:'#B64512', color:'white', cursor:'pointer', fontSize:22, boxShadow:'0 12px 24px rgba(182,69,18,0.22)' }}
        >
          ◎
        </button>
      </div>
      <div style={{ position:'absolute', left:14, bottom:12, zIndex:2, color:'rgba(61,53,56,0.68)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', pointerEvents:'none' }}>
        © OpenStreetMap
      </div>
    </div>
  );
}

/* ── PostcardView ── */
function PostcardView({ item, scale=1 }) {
  const [flipped, setFlipped] = useState(false);
  const W=360*scale, H=230*scale;
  return (
    <div style={{ width:W, height:H, perspective:1000, cursor:'pointer' }} onClick={()=>setFlipped(f=>!f)}>
      <div style={{ width:'100%', height:'100%', position:'relative', transformStyle:'preserve-3d', transition:'transform 0.65s', transform:flipped?'rotateY(180deg)':'none' }}>
        <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', borderRadius:5*scale, overflow:'hidden', boxShadow:'0 4px 18px rgba(0,0,0,0.28)' }}>
          {item.image
            ? <img src={item.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/>
            : <div style={{ width:'100%', height:'100%', background:item.gradient||'#aaa', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'white', fontSize:18*scale, fontStyle:'italic', fontFamily:'"Playfair Display",Georgia,serif', textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{item.destination}</span>
              </div>
          }
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'45%', background:'linear-gradient(transparent,rgba(0,0,0,0.58))', padding:`${14*scale}px ${12*scale}px ${10*scale}px` }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:0, color:'rgba(255,255,255,0.65)', fontSize:8*scale, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:'Georgia,serif' }}>Postcard</p>
                <p style={{ margin:0, color:'white', fontSize:15*scale, fontStyle:'italic', fontFamily:'"Playfair Display",Georgia,serif' }}>{item.destination}</p>
              </div>
              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:9*scale, fontFamily:'Georgia,serif' }}>tap to flip ↩</span>
            </div>
          </div>
        </div>
        <div style={{ position:'absolute', width:'100%', height:'100%', backfaceVisibility:'hidden', transform:'rotateY(180deg)', borderRadius:5*scale, boxShadow:'0 4px 18px rgba(0,0,0,0.28)', background:'#FAF7F0', display:'flex', flexDirection:'column', padding:`${10*scale}px`, boxSizing:'border-box' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #bbb', paddingBottom:4*scale, marginBottom:8*scale }}>
            <span style={{ fontSize:8*scale, letterSpacing:'0.3em', fontFamily:'Georgia,serif', color:'#555', textTransform:'uppercase', fontWeight:700 }}>Post Card</span>
            <span style={{ fontSize:8*scale, color:'#aaa', fontFamily:'Georgia,serif' }}>{item.country||''}</span>
          </div>
          <div style={{ flex:1, display:'flex', gap:10*scale, overflow:'hidden' }}>
            <div style={{ flex:'0 0 42%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              {item.message
                ? <p style={{ margin:0, fontSize:8*scale, color:'#444', fontFamily:'Georgia,serif', lineHeight:1.75 }}>{item.message}</p>
                : <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-around' }}>{[0,1,2,3,4,5].map(i=><div key={i} style={{ height:1, background:'#d0c8bb' }}/>)}</div>
              }
              {item.from && <span style={{ fontSize:8*scale, color:'#888', fontFamily:'Georgia,serif', fontStyle:'italic', marginTop:6*scale }}>— {item.from}</span>}
            </div>
            <div style={{ width:1, background:'#d0c8bb', alignSelf:'stretch' }}/>
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div style={{ alignSelf:'flex-end', width:38*scale, height:46*scale, border:'1.5px dashed #bbb', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:2 }}>
                <span style={{ fontSize:6*scale, color:'#ccc', textAlign:'center', fontFamily:'Georgia,serif', lineHeight:1.4, whiteSpace:'pre' }}>{'stamp\nhere'}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:9*scale }}>
                {item.recipient
                  ? <span style={{ fontSize:9*scale, color:'#333', fontFamily:'Georgia,serif' }}>{item.recipient}</span>
                  : [0,1,2,3].map(i=><div key={i} style={{ height:1, background:'#d0c8bb' }}/>)
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
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pinchRef = useRef(null);
  const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);
  const [ready, setReady]   = useState(false);
  const [flash, setFlash]   = useState(false);
  const [error, setError]   = useState(() => (
    cameraSupported ? null : 'Camera access is not available in this app view. Please use Upload Photo instead.'
  ));
  const getViewportDims = () => {
    const vv = window.visualViewport;
    return { vw: Math.round(vv?.width || window.innerWidth), vh: Math.round(vv?.height || window.innerHeight) };
  };
  const [dims,  setDims]    = useState(getViewportDims);
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
      video: { facingMode:'environment', width:{ ideal:1920 }, height:{ ideal:1080 } },
      audio: false,
    }).then(stream => {
      if (!alive) { stream.getTracks().forEach(t=>t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { if (alive) setReady(true); };
      }
    }).catch(e => { if (alive) setError(e.message||'Camera not available'); });
    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach(t=>t.stop());
    };
  }, [cameraSupported]);

  const isPostcard = type === 'postcard';
  const { vw, vh } = dims;

  /* Stamp box in viewport */
  const STAMP_AR = isPostcard ? (360/230) : (1/1.25);
  const pad = 52;
  const { boxW, boxH } = (() => {
    if (isPostcard) {
      const initialW = Math.min(vw - pad*2, 430);
      const initialH = initialW / STAMP_AR;
      return initialH > vh*0.54
        ? { boxW: vh*0.54 * STAMP_AR, boxH: vh*0.54 }
        : { boxW: initialW, boxH: initialH };
    }

    const initialH = Math.min(vh*0.62, 450);
    const initialW = initialH * STAMP_AR;
    return initialW > vw - pad*2
      ? { boxW: vw - pad*2, boxH: (vw - pad*2) / STAMP_AR }
      : { boxW: initialW, boxH: initialH };
  })();
  const boxX = (vw - boxW) / 2;
  const boxY = Math.max(
    24 + (window.visualViewport?.offsetTop || 0),
    (vh - boxH) / 2 - (isPostcard ? 0 : 14)
  );

  /* Perforation geometry */
  const holeR   = isPostcard ? Math.max(5, boxW*0.011) : Math.max(6, boxW*0.030);
  const spacing = holeR * (isPostcard ? 3.8 : 3.5);
  const holes   = buildPerfHoles(boxX, boxY, boxW, boxH, holeR, spacing);

  /* Capture */
  const doCapture = useCallback(() => {
    if (!ready || !videoRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    const OUT_W = isPostcard ? 1200 : 800;
    const OUT_H = isPostcard ? Math.round(1200/STAMP_AR) : Math.round(800/STAMP_AR);
    canvas.width  = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');

    const vW = video.videoWidth  || video.offsetWidth;
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
    streamRef.current?.getTracks().forEach(t=>t.stop());
    onCapture(canvas.toDataURL('image/png'));
  }, [ready, isPostcard, STAMP_AR, boxW, boxH, onCapture, vw, vh, boxX, boxY, cameraZoom]);

  useEffect(() => {
    const onKey = e => { if (e.code==='Space'||e.code==='Enter') doCapture(); };
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
      style={{ position:'fixed', inset:0, zIndex:900, background:'#000', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'env(safe-area-inset-top)', paddingBottom:'env(safe-area-inset-bottom)', touchAction:'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >

      {/* Live video */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:ready?1:0, transform:`scale(${cameraZoom})`, transition:'opacity 0.5s, transform 0.18s ease-out' }}
      />
      <canvas ref={canvasRef} style={{ display:'none' }}/>

      {/* ─── SVG viewfinder overlay ─── */}
      <svg width={vw} height={vh}
        style={{ position:'absolute', inset:0, pointerEvents:'none' }}
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
            <rect width={vw} height={vh} fill="white"/>
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="black"/>
            {holes.map((h, i) => (
              <circle key={i} cx={h.cx} cy={h.cy} r={holeR} fill="white"/>
            ))}
          </mask>
        </defs>

        {/* Dark vignette around stamp cutout */}
        <rect width={vw} height={vh} fill="rgba(0,0,0,0.74)" mask={`url(#${maskId})`}/>

        {/* Faint border around the stamp window */}
        <rect x={boxX} y={boxY} width={boxW} height={boxH}
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>

        {/* Perforation circle outlines for visual polish */}
        {holes.map((h, i) => (
          <circle key={`o${i}`} cx={h.cx} cy={h.cy} r={holeR}
            fill="rgba(0,0,0,0.55)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.75"
          />
        ))}

        {/* Corner crosshair guides */}
        {[[boxX, boxY],[boxX+boxW, boxY],[boxX, boxY+boxH],[boxX+boxW, boxY+boxH]].map(([cx,cy], i) => (
          <g key={`cr${i}`}>
            <line x1={cx-10} y1={cy} x2={cx+10} y2={cy} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
            <line x1={cx} y1={cy-10} x2={cx} y2={cy+10} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
          </g>
        ))}

        {/* Top label */}
        <text x={vw/2} y={boxY - holeR - 16}
          textAnchor="middle" fill="rgba(255,255,255,0.78)"
          fontSize="11" fontFamily="Georgia,serif" letterSpacing="0.2em">
          {isPostcard ? 'FRAME YOUR POSTCARD' : 'FRAME YOUR STAMP'}
        </text>

        {/* Bottom hint */}
        <text x={vw/2} y={boxY + boxH + holeR + 28}
          textAnchor="middle" fill="rgba(255,255,255,0.42)"
          fontSize="9.5" fontFamily="Georgia,serif" letterSpacing="0.1em">
          {isPostcard
            ? 'Scene fills the card front'
            : 'Perforated edges will be applied to your image'}
        </text>
      </svg>

      {/* Shutter flash */}
      {flash && <div style={{ position:'absolute', inset:0, background:'white', opacity:0.8, zIndex:10, pointerEvents:'none' }}/>}

      {/* Error */}
      {error && (
        <div style={{ position:'relative', zIndex:5, textAlign:'center', color:'white', padding:30 }}>
          <p style={{ fontFamily:'"Playfair Display",Georgia,serif', fontSize:20, fontStyle:'italic', marginBottom:10 }}>Camera unavailable</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:22, fontFamily:'Georgia,serif' }}>{error}</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:22, fontFamily:'Georgia,serif' }}>Try "Upload Photo" instead to import from your library.</p>
          <button onClick={onCancel} style={{ padding:'10px 28px', background:'white', color:'#6C63FF', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'Georgia,serif', fontSize:13 }}>← Go Back</button>
        </div>
      )}

      {/* Loading */}
      {!ready && !error && (
        <div style={{ position:'relative', zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ width:36, height:36, border:'2px solid rgba(255,255,255,0.2)', borderTop:'2px solid white', borderRadius:'50%', animation:'vf-spin 0.85s linear infinite' }}/>
          <span style={{ color:'rgba(255,255,255,0.55)', fontSize:11, fontFamily:'Georgia,serif', letterSpacing:'0.2em' }}>OPENING CAMERA</span>
        </div>
      )}

      {/* Controls bar */}
      {ready && !error && (
        <label style={{ position:'absolute', left:24, right:24, bottom:'calc(142px + env(safe-area-inset-bottom))', zIndex:7, display:'grid', gap:8, color:'white', fontFamily:'Georgia,serif', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Zoom {cameraZoom.toFixed(1)}x
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={cameraZoom}
            onChange={e=>setCameraZoom(Number(e.target.value))}
            style={{ width:'100%', accentColor:'#FF7AA8' }}
          />
        </label>
      )}

      {/* Controls bar */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'22px 36px calc(44px + env(safe-area-inset-bottom))', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(transparent,rgba(0,0,0,0.68))', zIndex:6 }}>

        {/* Cancel */}
        <button
          onClick={() => { streamRef.current?.getTracks().forEach(t=>t.stop()); onCancel(); }}
          style={{ width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.13)', border:'1.5px solid rgba(255,255,255,0.28)', color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.26)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.13)'}
        >✕</button>

        {/* Shutter */}
        <button
          onClick={doCapture}
          disabled={!ready}
          style={{
            width:76, height:76, borderRadius:'50%',
            background: ready ? 'white' : 'rgba(255,255,255,0.25)',
            border:'5px solid rgba(255,255,255,0.45)',
            cursor: ready ? 'pointer' : 'default',
            boxShadow: ready ? '0 0 0 8px rgba(255,255,255,0.14)' : 'none',
            transition:'all 0.15s',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
          onMouseEnter={e=>{ if(ready){e.currentTarget.style.transform='scale(0.93)'; e.currentTarget.style.background='#e8e8e8';} }}
          onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.background=ready?'white':'rgba(255,255,255,0.25)'; }}
        >
          {/* Mini stamp icon */}
          <div style={{ width:30, height:30, border:'2.5px solid #7DA9D9', borderRadius:2, opacity:ready?1:0.4, position:'relative' }}>
            {[-1,0,1].map(i=>(
              <div key={i} style={{ position:'absolute', width:6, height:6, borderRadius:'50%', background:'#7DA9D9',
                top: i===-1?-4 : i===1?'calc(100% - 2px)' : 'calc(50% - 3px)',
                left:-4 }}/>
            ))}
            {[-1,0,1].map(i=>(
              <div key={i} style={{ position:'absolute', width:6, height:6, borderRadius:'50%', background:'#7DA9D9',
                top: i===-1?-4 : i===1?'calc(100% - 2px)' : 'calc(50% - 3px)',
                right:-4 }}/>
            ))}
          </div>
        </button>

        {/* Spacer to balance layout */}
        <div style={{ width:50 }}/>
      </div>

      <style>{`
        @keyframes vf-spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Field helper ── */
function Field({ label, value, onChange, placeholder, multiline }) {
  const base = { width:'100%', padding:'9px 12px', border:'1.5px solid #F4D7E6', borderRadius:4, fontSize:16, fontFamily:'"Libre Baskerville",Georgia,serif', color:'#333', background:'white', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' };
  return (
    <div>
      <label style={{ fontSize:10, color:'#888', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:5, fontFamily:'"Libre Baskerville",Georgia,serif' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize:'vertical', height:80, lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='#6C63FF'} onBlur={e=>e.target.style.borderColor='#F4D7E6'}/>
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e=>e.target.style.borderColor='#6C63FF'} onBlur={e=>e.target.style.borderColor='#F4D7E6'}/>
      }
    </div>
  );
}

function StampImageFramer({ image, onApply, onBack }) {
  const frame = { w:270, h:338 };
  const imageBox = { x:22, y:22, w:226, h:266 };
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1.15);
  const [offset, setOffset] = useState({ x:0, y:0 });

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
    const nextNatural = { w:e.currentTarget.naturalWidth, h:e.currentTarget.naturalHeight };
    setNatural(nextNatural);
    setOffset(clampOffset({ x:0, y:0 }, zoom, nextNatural));
  };

  const handleZoom = e => {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    setOffset(current=>clampOffset(current, nextZoom));
  };

  const handlePointerDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x:e.clientX, y:e.clientY, origin:offset };
  };

  const handlePointerMove = e => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clampOffset({ x:dragRef.current.origin.x + dx, y:dragRef.current.origin.y + dy }));
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
    onApply(canvas.toDataURL('image/png'));
  };

  const scale = natural ? Math.max(imageBox.w / natural.w, imageBox.h / natural.h) * zoom : 1;
  const stampMask = buildStampMask(frame.w, frame.h, 8, 22);

  return (
    <div style={{ display:'flex', gap:28, flexWrap:'wrap', alignItems:'center' }}>
      <div style={{ flex:'0 1 320px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div style={{ width:frame.w, height:frame.h, background:'#070712', borderRadius:2, boxShadow:'0 18px 50px rgba(108,99,255,0.24)' }}>
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width:frame.w, height:frame.h, position:'relative', touchAction:'none', cursor:'grab', background:'#FFFDF8', WebkitMaskImage:stampMask, maskImage:stampMask, WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskSize:'100% 100%', maskSize:'100% 100%' }}
          >
            <div style={{ position:'absolute', left:imageBox.x, top:imageBox.y, width:imageBox.w, height:imageBox.h, overflow:'hidden', background:'#F7D7E8' }}>
              <img
                ref={imgRef}
                src={image}
                alt="Uploaded stamp crop"
                onLoad={handleLoad}
                draggable="false"
                style={{ position:'absolute', left:'50%', top:'50%', width:natural ? natural.w * scale : '100%', height:natural ? natural.h * scale : '100%', maxWidth:'none', transform:`translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`, userSelect:'none', pointerEvents:'none' }}
              />
              <div style={{ position:'absolute', inset:0, border:'2px solid rgba(255,255,255,0.78)', pointerEvents:'none' }}/>
            </div>
            <div style={{ position:'absolute', left:imageBox.x, top:imageBox.y + imageBox.h + 8, right:imageBox.x, height:20, display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #FF7AA855', color:'#FF7AA8', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif', pointerEvents:'none' }}>
              <span>Stampz</span>
              <span>✉️</span>
            </div>
          </div>
        </div>
        <p style={{ margin:0, color:'#9B7BAE', fontSize:11, fontFamily:'Georgia,serif', textAlign:'center' }}>Drag the photo into the stamp frame</p>
      </div>
      <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:28, margin:'0 0 6px' }}>Frame your stamp</h2>
          <p style={{ margin:0, color:'#9B7BAE', fontSize:12, lineHeight:1.7 }}>Zoom and drag your uploaded photo until the part you want sits inside the stamp-edged background.</p>
        </div>
        <label style={{ fontSize:10, color:'#888', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', fontFamily:'"Libre Baskerville",Georgia,serif' }}>
          Zoom
          <input type="range" min="1" max="2.8" step="0.01" value={zoom} onChange={handleZoom} style={{ width:'100%', accentColor:'#FF7AA8', marginTop:10 }}/>
        </label>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={applyCrop} disabled={!natural} style={{ flex:'1 1 180px', padding:'12px 20px', background:natural?'#6C63FF':'#D8D0FF', color:'white', border:'none', borderRadius:999, cursor:natural?'pointer':'default', fontSize:13, fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700, letterSpacing:'0.08em' }}>Use this crop</button>
          <button onClick={onBack} style={{ padding:'12px 16px', background:'white', color:'#9B7BAE', border:'1px solid #F7D7E8', borderRadius:999, cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>Choose another</button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, icon, label, active, onSelect }) {
  return (
    <button onClick={()=>onSelect(id)} className={active ? 'is-active' : ''}>
      <span>{icon}</span>
      {label}
    </button>
  );
}

function Pill({ label, active, onClick, activeColor='#6C63FF' }) {
  return (
    <button onClick={onClick} style={{ padding:'4px 12px', borderRadius:20, fontSize:10, cursor:'pointer', border:`1px solid ${active?activeColor:'#ddd'}`, background:active?activeColor:'white', color:active?'white':'#666', fontFamily:'Georgia,serif', letterSpacing:'0.05em', transition:'all 0.15s' }}>{label}</button>
  );
}

function SignInScreen({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSignup = mode === 'signup';

  const handleSubmit = e => {
    e.preventDefault();
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail || !password) return;
    onSignIn({
      email: safeEmail,
      name: safeEmail.split('@')[0],
    });
  };

  return (
    <main className="auth-screen">
      <section className="auth-hero" aria-labelledby="signin-title">
        <div className="auth-copy">
          <p className="eyebrow">Stampz Account</p>
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">✉️</span>
            <span className="auth-brand-name">Stampz</span>
          </div>
          <h1 id="signin-title">Keep your collection safe between visits.</h1>
          <p>
            Sign in before you create, save, and browse so your stamps and postcards stay tied
            to your account on this device.
          </p>
          <div className="auth-feature-row" aria-hidden="true">
            <span>Map every memory</span>
            <span>Save your collection</span>
            <span>Travel-ready archive</span>
          </div>
        </div>

        <div className="auth-stage">
          <div className="auth-stage__frame">
            <div className="auth-stage__note auth-stage__note--top">Atlas Edition</div>
            <div className="auth-stage__stamp">
              <StampView item={AUTH_HERO_STAMP} size="lg" />
            </div>
            <div className="auth-stage__meta">
              <div>
                <p className="auth-stage__label">Personal archive</p>
                <strong>Capture once, keep it pinned.</strong>
              </div>
              <span className="auth-stage__chip">Map-first</span>
            </div>
          </div>
        </div>

        <form className="auth-panel" onSubmit={handleSubmit}>
          <div>
            <p className="auth-panel__label">Account preservation</p>
            <h2>{isSignup ? 'Create account' : 'Welcome back'}</h2>
          </div>
          <label>
            Email address
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Enter your password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
          </label>
          <button type="submit">{isSignup ? 'Create account' : 'Sign in'}</button>
          {!isSignup && (
            <button type="button" className="auth-link" onClick={()=>setMode('signup')}>
              Don't have an account already? Create account
            </button>
          )}
          {isSignup && (
            <button type="button" className="auth-link" onClick={()=>setMode('signin')}>
              Already have an account? Sign in
            </button>
          )}
          <p className="auth-footnote">
            {isSignup
              ? 'Create a local Stampz account to preserve your collection on this device.'
              : 'Sign in with the same email to restore your saved local collection.'}
          </p>
        </form>
      </section>
    </main>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════ */
export default function StampApp() {
  const [tab,         setTab]         = useState('map');
  const [account,     setAccount]     = useState(() => readStoredProfile());
  const [myItems,     setMyItems]     = useState(() => {
    const savedAccount = readStoredProfile();
    if (!savedAccount?.email) return [];
    return readStoredCollection(savedAccount.email);
  });
  const [collectionReady, setCollectionReady] = useState(() => Boolean(readStoredProfile()?.email));
  const [step,        setStep]        = useState('type');
  const [draft,       setDraft]       = useState(null);
  const [showCamera,  setShowCamera]  = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [colFilter,   setColFilter]   = useState('All');
  const [browseFilter,setBrowseFilter]= useState('All');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [lightbox,    setLightbox]    = useState(null);
  const [liked,       setLiked]       = useState({});
  const [toast,       setToast]       = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(() => (navigator.geolocation ? 'idle' : 'unsupported'));
  const [selectedMapItemId, setSelectedMapItemId] = useState(null);
  const [mapFocusSignal, setMapFocusSignal] = useState(0);
  const fileRef = useRef();
  const debugScrollRef = useRef(null);

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
    if (!account?.email || !collectionReady) return;
    localStorage.setItem(collectionStorageKey(account.email), JSON.stringify(myItems));
  }, [account?.email, collectionReady, myItems]);

  const handleSignIn = user => {
    const savedItems = readStoredCollection(user.email);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(user));
    setMyItems(Array.isArray(savedItems) ? savedItems : []);
    setCollectionReady(true);
    setAccount(user);
  };

  const handleSignOut = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
    setAccount(null);
    setTab('map');
    setStep('type');
    setDraft(null);
    setShowCreateModal(false);
    setCollectionReady(false);
  };

  const showToast = (msg, dur=2400) => { setToast(msg); setTimeout(()=>setToast(null), dur); };
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      showToast('Location is unavailable on this device.');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      position => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus('ready');
        setMapFocusSignal(signal=>signal + 1);
      },
      () => {
        setLocationStatus('denied');
        showToast('Enable location for Stampz in iPhone Settings.');
      },
      { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
    );
  };

  const handleImage = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const draftType = draft?.type;
    const r = new FileReader();
    r.onload = ev => {
      setDraft(d=>({...d, image:draftType==='stamp' ? null : ev.target.result, imageRaw:ev.target.result}));
      setStep(draftType==='stamp' ? 'frame' : 'customize');
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCameraCapture = url => {
    setDraft(d=>({...d, image:url, imageRaw:null}));
    setShowCamera(false);
    setStep('customize');
  };

  const handleCameraCancel = () => {
    if (draft?.image) {
      setShowCamera(false);
      return;
    }
    closeCreateModal();
  };

  const handleSave = () => {
    const nextItem = {
      ...draft,
      id: editingItemId || genId(),
      createdAt: draft.createdAt || Date.now(),
      locationLat: draft.locationLat ?? currentLocation?.lat ?? null,
      locationLng: draft.locationLng ?? currentLocation?.lng ?? null,
      locationLabel: draft.locationLabel || (currentLocation ? `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 'Unplaced'),
    };
    if (editingItemId) {
      setMyItems(items => items.map(item => item.id === editingItemId ? nextItem : item));
    } else {
      setMyItems(items => [nextItem, ...items]);
    }
    if (nextItem.locationLat != null && nextItem.locationLng != null) setSelectedMapItemId(nextItem.id);
    setEditingItemId(null);
    setDraft(null); setStep('type'); setTab('map'); setShowCreateModal(false);
    showToast(
      editingItemId
        ? (nextItem.type === 'stamp' ? '✉️ Stamp updated!' : '✉ Postcard updated!')
        : nextItem.type==='stamp'
          ? (nextItem.locationLat != null ? '✉️ Stamp pinned to your map!' : '✉️ Stamp saved to your archive!')
          : '✉ Postcard saved!'
    );
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setEditingItemId(null);
    setDraft({ type:'stamp', image:null, imageRaw:null, country:'', label:'', note:'', accentColor:'#6C63FF', stampColor:'#FFFDF8', agingIntensity:36, collection:'Destinations', destination:'', message:'', from:'', recipient:'', gradient:'' });
    setStep('customize');
    setShowCamera(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setShowCamera(false);
    setEditingItemId(null);
    setDraft(null);
    setStep('type');
  };

  const initDraft = type => {
    setEditingItemId(null);
    setDraft({ type, image:null, imageRaw:null, country:'', label:'', note:'', accentColor:'#6C63FF', stampColor:'#FFFDF8', agingIntensity:36, collection:'Destinations', destination:'', message:'', from:'', recipient:'', gradient:'' });
    setShowCreateModal(true);
    setStep('upload');
  };

  const startEditingItem = item => {
    setLightbox(null);
    setEditingItemId(item.id);
    setDraft({
      ...item,
      note: item.note || '',
      country: item.country || '',
      label: item.label || '',
      stampColor: item.stampColor || '#FFFDF8',
      agingIntensity: item.agingIntensity ?? 36,
      collection: item.collection || 'Destinations',
    });
    setShowCreateModal(true);
    setStep('customize');
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

  const savedStampItems = myItems.filter(item=>item.type==='stamp');
  const filteredMine      = colFilter==='All'      ? myItems          : myItems.filter(i=>i.collection===colFilter);
  const placedMine = savedStampItems.filter(item=>Number.isFinite(item.locationLat) && Number.isFinite(item.locationLng));
  const unplacedMine = savedStampItems.filter(item=>!Number.isFinite(item.locationLat) || !Number.isFinite(item.locationLng));
  const selectedMapItem = savedStampItems.find(item=>item.id===selectedMapItemId) || placedMine[0] || null;
  const filteredCommunity = browseFilter==='All'   ? COMMUNITY_STAMPS : COMMUNITY_STAMPS.filter(s=>s.collection===browseFilter);
  const profileStamps = viewingProfile
    ? COMMUNITY_STAMPS.filter(stamp=>stamp.author===viewingProfile)
    : [];
  const profile = viewingProfile ? getCommunityProfile(viewingProfile) : null;

  if (!account) {
    return <SignInScreen onSignIn={handleSignIn}/>;
  }

  return (
    <div className="app-shell">

      {/* Noise */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E")`, pointerEvents:'none', zIndex:0 }}/>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Camera */}
      {showCamera && draft && (
        <CameraViewfinder type={draft.type} onCapture={handleCameraCapture} onCancel={handleCameraCancel}/>
      )}

      {!showCreateModal && (
        <header className="app-header">
          <div className="account-chip">
            <span>{myItems.length>0?`${myItems.length} in collection`:'Start collecting'}</span>
            <strong>{account.name}</strong>
            <button onClick={handleSignOut}>Sign out</button>
          </div>
          <h1 className="app-brand-title">Stampz</h1>
          <button className="header-create-button" type="button" onClick={openCreateModal} aria-label="Create a stamp or postcard">
            <span>+</span>
          </button>
        </header>
      )}

      <main className="app-main">

        {/* ══ CREATE MODAL */}
        {showCreateModal && (
          <div className="create-modal" role="dialog" aria-modal="true" aria-label="Create a Stampz item" onClick={closeCreateModal}>
            <div className="create-modal__panel" onClick={e=>e.stopPropagation()}>
              <button className="create-modal__close" onClick={closeCreateModal} aria-label="Close create modal">×</button>
            {/* Progress */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, flexWrap:'wrap' }}>
              {[{s:'type',l:'Choose Type'},{s:'upload',l:'Add Photo'},{s:'frame',l:'Frame'},{s:'customize',l:'Customize'}].map(({s,l},i)=>{
                const steps=['type','upload','frame','customize'];
                const past=steps.indexOf(step)>i, active=step===s;
                return (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:active?'#FF7AA8':past?'#6C63FF':'#E8DFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:700 }}>{i+1}</div>
                    <span style={{ fontSize:10, color:active?'#FF7AA8':past?'#6C63FF':'#aaa', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:active?700:400 }}>{l}</span>
                    {i<3&&<span style={{ color:'#ccc', fontSize:14, marginLeft:2 }}>›</span>}
                  </div>
                );
              })}
            </div>

            {/* Step 1 */}
            {step==='type' && (
              <div>
                <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:28, margin:'0 0 6px' }}>What would you like to create?</h2>
                <p style={{ color:'#9B7BAE', fontSize:12, margin:'0 0 30px' }}>Choose your collectible format</p>
                <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                  {[
                    { type:'stamp',    icon:'✉️', title:'Postage Stamp',   desc:'Frame your shot through the live stamp viewfinder, then customize country, label, and stamp color.' },
                    { type:'postcard', icon:'✉', title:'Postcard',         desc:'Shoot through the postcard frame guide, then write your message & address on the classic flip-card back.' },
                  ].map(opt=>(
                    <button key={opt.type} onClick={()=>initDraft(opt.type)} style={{ flex:'1 1 200px', background:'white', border:'2px solid #F7D7E8', borderRadius:8, padding:'28px 24px', cursor:'pointer', textAlign:'center', transition:'all 0.22s', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF7AA8';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.13)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#F7D7E8';e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)';}}>
                      <div style={{ fontSize:38, marginBottom:14 }}>{opt.icon}</div>
                      <h3 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:19, margin:'0 0 10px' }}>{opt.title}</h3>
                      <p style={{ color:'#9B7BAE', fontSize:12, lineHeight:1.65, margin:0 }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Upload or Camera */}
            {step==='upload' && draft && (
              <div>
                <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:28, margin:'0 0 6px' }}>Add Your Photo</h2>
                <p style={{ color:'#9B7BAE', fontSize:12, margin:'0 0 28px' }}>
                  {draft.type==='stamp'
                    ? 'Use the camera to frame your shot — the live perforated overlay shows exactly what your stamp will contain.'
                    : 'Use the camera with the postcard frame guide, or import a photo from your library.'}
                </p>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
                  {/* Camera */}
                  <button onClick={()=>setShowCamera(true)} style={{ flex:'1 1 180px', height:190, background:'#6C63FF', border:'none', borderRadius:10, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, transition:'all 0.2s', boxShadow:'0 4px 20px rgba(108,99,255,0.3)', overflow:'hidden', position:'relative' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#FF7AA8';e.currentTarget.style.transform='translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#6C63FF';e.currentTarget.style.transform='';}}>
                    {/* Decorative mini stamp outline */}
                    <div style={{ opacity:0.15, position:'absolute', top:16, right:18 }}>
                      {draft.type==='stamp'
                        ? <div style={{ width:36, height:44, border:'2px solid white', borderRadius:1, position:'relative' }}>
                            {[{t:-4,l:'calc(50% - 3px)',},{t:'calc(50% - 3px)',l:-4},{t:'calc(50% - 3px)',r:-4},{b:-4,l:'calc(50% - 3px)'}].map((s,i)=>(
                              <div key={i} style={{ position:'absolute', width:6, height:6, borderRadius:'50%', border:'1.5px solid white', ...s }}/>
                            ))}
                          </div>
                        : <div style={{ width:54, height:34, border:'2px solid white', borderRadius:1 }}/>
                      }
                    </div>
                    <span style={{ fontSize:30, position:'relative' }}>📷</span>
                    <div style={{ textAlign:'center', position:'relative' }}>
                      <p style={{ margin:0, fontSize:14, color:'white', fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700 }}>Use Camera</p>
                      <p style={{ margin:'4px 0 0', fontSize:10, color:'rgba(255,255,255,0.6)', fontFamily:'Georgia,serif', letterSpacing:'0.06em' }}>Live {draft.type} overlay</p>
                    </div>
                  </button>

                  {/* Upload */}
                  <button onClick={()=>fileRef.current.click()} style={{ flex:'1 1 180px', height:190, background:'white', border:'2px dashed #F7BFD7', borderRadius:10, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF7AA8';e.currentTarget.style.background='#FFF1F8';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#F7BFD7';e.currentTarget.style.background='white';}}>
                    <span style={{ fontSize:32 }}>🖼</span>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ margin:0, fontSize:13, color:'#6C63FF', fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700 }}>Upload Photo</p>
                      <p style={{ margin:'4px 0 0', fontSize:10, color:'#aaa', fontFamily:'Georgia,serif' }}>From your library</p>
                    </div>
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImage}/>
                <button onClick={()=>setStep('type')} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:11, fontFamily:'Georgia,serif', letterSpacing:'0.08em' }}>← Back</button>
              </div>
            )}

            {/* Step 3: Frame uploaded stamp image */}
            {step==='frame' && draft?.type==='stamp' && draft.imageRaw && (
              <StampImageFramer
                image={draft.imageRaw}
                onApply={url=>{setDraft(d=>({...d, image:url})); setStep('customize');}}
                onBack={()=>setStep('upload')}
              />
            )}

            {/* Step 4: Customize */}
            {step==='customize' && draft && (
              draft.type==='stamp' ? (
                <div style={{ maxWidth:520, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                    <button onClick={()=>setShowCamera(true)} style={{ minHeight:0, padding:0, border:'none', background:'transparent', color:'#B33A0B', cursor:'pointer', fontSize:18, fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700 }}>← Edit Stamp</button>
                    <button onClick={handleSave} style={{ minHeight:0, padding:0, border:'none', background:'transparent', color:'#B33A0B', cursor:'pointer', fontSize:18, fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700 }}>Done</button>
                  </div>

                  <EditorStampPreview item={draft} onClick={()=>setLightbox(draft)}/>

                  <div style={{ display:'grid', gap:12 }}>
                    <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', fontFamily:'"Libre Baskerville",Georgia,serif' }}>Background Color</label>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {STAMP_COLORS.map(c=>(
                        <button
                          key={c}
                          type="button"
                          aria-label={`Use ${c} stamp color`}
                          aria-pressed={(draft.stampColor || '#FFFDF8') === c}
                          onClick={()=>setDraft(d=>({...d, stampColor:c, backgroundColor:c }))}
                          style={{ width:40, height:40, minWidth:40, minHeight:40, flex:'0 0 40px', borderRadius:'50%', background:c, border:`3px solid ${(draft.stampColor || '#FFFDF8') === c ? '#FFFFFF' : 'transparent'}`, boxShadow:(draft.stampColor || '#FFFDF8') === c ? '0 0 0 2px #B33A0B, 0 8px 18px rgba(179,58,11,0.18)' : '0 4px 10px rgba(95,109,136,0.12)', cursor:'pointer', padding:0 }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ background:'rgba(255,240,240,0.9)', borderRadius:18, padding:'18px 18px 22px', boxShadow:'0 10px 24px rgba(215,163,163,0.12)', display:'grid', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                      <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif' }}>Aging Intensity</label>
                      <span style={{ color:'#B33A0B', fontSize:16, fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700 }}>{draft.agingIntensity ?? 36}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={draft.agingIntensity ?? 36} onChange={e=>setDraft(d=>({...d, agingIntensity:Number(e.target.value)}))} style={{ width:'100%', accentColor:'#B33A0B' }}/>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:14 }}>
                    <div style={{ background:'rgba(255,240,240,0.9)', borderRadius:16, padding:'18px 16px', boxShadow:'0 10px 24px rgba(215,163,163,0.12)' }}>
                      <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:10, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Stamp Name</label>
                      <input value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} placeholder="Freedom Flags" style={{ width:'100%', border:'none', background:'transparent', padding:0, fontSize:16, lineHeight:1.4, color:'#34160F', fontFamily:'"Playfair Display",Georgia,serif', outline:'none' }}/>
                    </div>
                    <div style={{ background:'rgba(255,240,240,0.9)', borderRadius:16, padding:'18px 16px', boxShadow:'0 10px 24px rgba(215,163,163,0.12)' }}>
                      <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:10, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Origin</label>
                      <input value={draft.country} onChange={e=>setDraft(d=>({...d,country:e.target.value.toUpperCase()}))} placeholder="CANADA" style={{ width:'100%', border:'none', background:'transparent', padding:0, fontSize:16, lineHeight:1.4, color:'#34160F', fontFamily:'"Playfair Display",Georgia,serif', outline:'none' }}/>
                    </div>
                    <div style={{ background:'rgba(255,240,240,0.9)', borderRadius:16, padding:'18px 16px', boxShadow:'0 10px 24px rgba(215,163,163,0.12)' }}>
                      <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:10, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Archived</label>
                      <div style={{ fontSize:16, color:'#34160F', fontFamily:'"Playfair Display",Georgia,serif' }}>{new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>
                    </div>
                  </div>

                  <div style={{ background:'linear-gradient(180deg,#FFD0D0,#FFC8C8)', borderRadius:18, padding:'18px 18px 16px', boxShadow:'0 14px 30px rgba(215,163,163,0.18)' }}>
                    <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:12, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Curator&apos;s Note</label>
                    <textarea value={draft.note || ''} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="Describe the atmosphere of the collection..." style={{ width:'100%', minHeight:92, border:'none', borderBottom:'1px solid rgba(154,109,104,0.25)', background:'transparent', resize:'vertical', fontSize:16, lineHeight:1.55, color:'#5A626E', fontFamily:'"Playfair Display",Georgia,serif', fontStyle:'italic', outline:'none' }}/>
                  </div>

                  <div>
                    <label style={{ fontSize:10, color:'#9A6D68', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:8, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Collection</label>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {COLLECTIONS.map(c=><Pill key={c} label={c} active={draft.collection===c} onClick={()=>setDraft(d=>({...d,collection:c}))} activeColor="#B33A0B"/>)}
                    </div>
                  </div>

                  <button onClick={closeCreateModal} style={{ alignSelf:'center', background:'none', border:'none', color:'#9A6D68', cursor:'pointer', fontSize:11, fontFamily:'Georgia,serif', letterSpacing:'0.08em' }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start', justifyContent:'center' }}>
                  <div style={{ flex:'1 1 280px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                    <button onClick={()=>setLightbox(draft)} style={{ background:'white', border:'none', borderRadius:8, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} aria-label="Open stamp preview">
                      <PostcardView item={draft} scale={0.78}/>
                    </button>
                    <button onClick={()=>setShowCamera(true)} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:10, fontFamily:'Georgia,serif', letterSpacing:'0.08em' }}>← Retake photo</button>
                  </div>
                  <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:16 }}>
                    <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:22, margin:0 }}>Customize Your Postcard</h2>
                    <Field label="Destination" value={draft.destination} placeholder="e.g. Kyoto, Japan" onChange={v=>setDraft(d=>({...d,destination:v,label:v}))}/>
                    <Field label="Your Message" value={draft.message} placeholder="Wish you were here…" multiline onChange={v=>setDraft(d=>({...d,message:v}))}/>
                    <Field label="From" value={draft.from} placeholder="Your name" onChange={v=>setDraft(d=>({...d,from:v}))}/>
                    <Field label="To (Recipient)" value={draft.recipient} placeholder="Recipient name & address" onChange={v=>setDraft(d=>({...d,recipient:v}))}/>
                    <Field label="Country" value={draft.country} placeholder="e.g. JAPAN" onChange={v=>setDraft(d=>({...d,country:v.toUpperCase()}))}/>
                    <div>
                      <label style={{ fontSize:10, color:'#888', letterSpacing:'0.12em', textTransform:'uppercase', display:'block', marginBottom:8, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Add to Collection</label>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {COLLECTIONS.map(c=><Pill key={c} label={c} active={draft.collection===c} onClick={()=>setDraft(d=>({...d,collection:c}))} activeColor="#FF7AA8"/>)}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <button onClick={handleSave} style={{ flex:1, padding:'12px 20px', background:'#6C63FF', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:13, fontFamily:'"Playfair Display",Georgia,serif', fontWeight:700, letterSpacing:'0.08em', transition:'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#FF7AA8'} onMouseLeave={e=>e.currentTarget.style.background='#6C63FF'}>
                        Save to Collection ✉️
                      </button>
                      <button onClick={closeCreateModal} style={{ padding:'12px 14px', background:'white', color:'#888', border:'1px solid #ddd', borderRadius:4, cursor:'pointer', fontSize:11, fontFamily:'Georgia,serif' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )
            )}
            </div>
          </div>
        )}

        {/* ══ SAVED STAMPS */}
        {tab==='saved' && (
          <div style={{ maxWidth:430, margin:'0 auto', color:'#4A1019' }}>
            <section style={{ textAlign:'center', padding:'12px 0 24px' }}>
              <div style={{ width:92, height:92, margin:'0 auto 18px', borderRadius:18, background:'#2555FF', boxShadow:'0 16px 32px rgba(37,85,255,0.18)', display:'grid', placeItems:'center', position:'relative' }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background:'white', color:'#2555FF', display:'grid', placeItems:'center', fontSize:24 }}>✓</div>
                <div style={{ position:'absolute', right:-8, top:-8, width:28, height:28, borderRadius:10, background:'#FFD227', color:'#4A3D00', display:'grid', placeItems:'center', fontSize:14, fontWeight:700 }}>✦</div>
              </div>
              <h2 style={{ margin:'0 0 8px', fontFamily:'"Playfair Display",Georgia,serif', fontSize:34, lineHeight:0.98, color:'#A82412', fontWeight:700 }}>Stamp Collection</h2>
              <p style={{ margin:'0 0 20px', color:'#6E6B78', fontSize:13, lineHeight:1.6 }}>{account.name}&apos;s catalogued collection.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:22 }}>
                {[
                  { value:myItems.length.toLocaleString(), label:'Stampz' },
                  { value:Math.max(0, myItems.reduce((sum,item)=>sum + (item.likes||0), 0)).toLocaleString(), label:'Likes' },
                  { value:new Set(myItems.map(item=>item.collection)).size || 0, label:'Sets' },
                ].map(stat=>(
                  <div key={stat.label}>
                    <p style={{ margin:0, color:'#4A1019', fontFamily:'"Playfair Display",Georgia,serif', fontSize:24, fontWeight:700 }}>{stat.value}</p>
                    <p style={{ margin:'4px 0 0', color:'#9B7BAE', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={openCreateModal} style={{ width:'min(100%, 320px)', padding:'17px 20px', border:'none', borderRadius:13, background:'#B64512', color:'white', cursor:'pointer', fontFamily:'"Libre Baskerville",Georgia,serif', fontSize:16, fontWeight:700, boxShadow:'0 18px 34px rgba(199,50,18,0.18)' }}>Capture New Stamp</button>
            </section>

            <section>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:20 }}>
                <h2 style={{ margin:0, fontFamily:'"Playfair Display",Georgia,serif', color:'#4A1019', fontSize:28, lineHeight:1.05 }}>Stamp<br/>Collection</h2>
                <button style={{ minHeight:0, padding:'10px 18px', border:'none', borderRadius:14, background:'#C7D1FF', color:'#2555FF', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif' }}>Archive<br/>View</button>
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
                {['All',...COLLECTIONS].map(c=><Pill key={c} label={c} active={colFilter===c} onClick={()=>setColFilter(c)} activeColor="#C73212"/>)}
              </div>

              {filteredMine.length===0 ? (
                <div style={{ background:'white', borderRadius:18, padding:'48px 24px', textAlign:'center', boxShadow:'0 16px 36px rgba(108,99,255,0.08)' }}>
                  <div style={{ fontSize:54, marginBottom:16, opacity:0.4 }}>✉️</div>
                  <p style={{ fontFamily:'"Playfair Display",Georgia,serif', fontSize:24, color:'#4A1019', margin:'0 0 8px' }}>No stampz yet</p>
                  <p style={{ margin:'0 0 20px', color:'#9B7BAE', fontSize:12 }}>Capture your first stamp to start your archive.</p>
                  <button onClick={openCreateModal} style={{ padding:'12px 24px', background:'#C73212', color:'white', border:'none', borderRadius:999, cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>Create Now ✉️</button>
                </div>
              ) : (
                <div style={{ display:'grid', gap:18 }}>
                  {filteredMine.slice(0,1).map(item=>(
                    <div key={item.id} style={{ background:'rgba(255,255,255,0.9)', borderRadius:26, padding:'18px 16px 20px', boxShadow:'0 18px 36px rgba(95,109,136,0.08)', border:'1px solid rgba(241,231,233,0.9)' }}>
                      <div style={{ textAlign:'center', marginBottom:18 }}>
                        <p style={{ margin:'0 0 6px', color:'#A82412', fontFamily:'"Playfair Display",Georgia,serif', fontSize:44, lineHeight:0.95, fontWeight:700 }}>Stamp<br/>Saved!</p>
                        <p style={{ margin:0, color:'#7A4E4A', fontSize:13, lineHeight:1.6 }}>Your capture has been officially catalogued.</p>
                      </div>
                      <button onClick={()=>setLightbox(item)} style={{ width:'100%', border:'none', background:'#fff8fb', borderRadius:22, padding:'16px 14px', cursor:'pointer', boxShadow:'inset 0 0 0 1px rgba(244,224,228,0.9)' }}>
                        <div style={{ display:'grid', placeItems:'center', marginBottom:12 }}>
                          {item.type==='stamp' ? <StampView item={item} size="lg"/> : <PostcardView item={item} scale={0.72}/>}
                        </div>
                        <div style={{ textAlign:'left' }}>
                          <p style={{ margin:'0 0 6px', color:'#A82412', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase' }}>Official Catalogue Entry</p>
                          <p style={{ margin:'0 0 4px', color:'#4A1019', fontFamily:'"Playfair Display",Georgia,serif', fontSize:22, fontWeight:700, lineHeight:1.05 }}>{item.label||item.destination||'Untitled stamp'}</p>
                          <p style={{ margin:0, color:'#7A4E4A', fontSize:12 }}>{item.locationLabel || item.country || item.collection}</p>
                        </div>
                      </button>
                      <div style={{ display:'grid', gap:12, marginTop:18 }}>
                        <button onClick={()=>setTab('map')} style={{ width:'100%', padding:'16px 18px', border:'none', borderRadius:14, background:'#B64512', color:'white', cursor:'pointer', fontFamily:'"Libre Baskerville",Georgia,serif', fontSize:16, fontWeight:700 }}>View on Map</button>
                        <button onClick={()=>setLightbox(item)} style={{ width:'100%', padding:'16px 18px', border:'none', borderRadius:14, background:'#C7D1FF', color:'#123DBF', cursor:'pointer', fontFamily:'"Libre Baskerville",Georgia,serif', fontSize:16, fontWeight:700 }}>Open Stamp</button>
                        {item.type === 'stamp' && (
                          <button onClick={()=>startEditingItem(item)} style={{ width:'100%', padding:'16px 18px', border:'1px solid rgba(182,69,18,0.2)', borderRadius:14, background:'white', color:'#B64512', cursor:'pointer', fontFamily:'"Libre Baskerville",Georgia,serif', fontSize:16, fontWeight:700 }}>Edit Stamp</button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredMine.length > 1 && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:16 }}>
                      {filteredMine.slice(1,5).map(item=>(
                        <button key={item.id} onClick={()=>setLightbox(item)} style={{ background:'rgba(255,255,255,0.92)', border:'1px solid rgba(241,231,233,0.9)', borderRadius:18, padding:'14px 12px', cursor:'pointer', textAlign:'left', boxShadow:'0 12px 24px rgba(95,109,136,0.06)' }}>
                          <div style={{ display:'grid', placeItems:'center', minHeight:140, marginBottom:10 }}>
                            {item.type==='stamp' ? <StampView item={item} size="sm"/> : <PostcardView item={item} scale={0.34}/>}
                          </div>
                          <p style={{ margin:'0 0 4px', color:'#9B2414', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase' }}>{item.collection}</p>
                          <p style={{ margin:0, color:'#4A1019', fontFamily:'"Playfair Display",Georgia,serif', fontSize:16, lineHeight:1.1 }}>{item.label||item.destination||'Saved stamp'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══ MAP VIEW */}
        {tab==='map' && (
          <div style={{ maxWidth:430, margin:'0 auto' }}>
            <section style={{ marginBottom:28 }}>
              <div style={{ marginBottom:18 }}>
                <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#A82412', fontSize:26, margin:'0 0 6px', lineHeight:1.05 }}>Map View</h2>
                <p style={{ margin:0, fontSize:12, color:'#6E6B78', lineHeight:1.6 }}>Pin your journeys, then open each stamp from the map.</p>
              </div>

              <div style={{ display:'grid', gap:16, marginBottom:16 }}>
                {locationStatus !== 'ready' && (
                  <div style={{ padding:'14px 16px', borderRadius:20, background:'rgba(255,255,255,0.84)', border:'1px solid rgba(214,203,206,0.86)', color:'#7A4E4A', fontSize:12, lineHeight:1.65 }}>
                    Turn on location to pin each new stamp automatically. You can still capture now and start building your archive.
                  </div>
                )}

                <div style={{ position:'relative', paddingTop:44 }}>
                  <div style={{ position:'absolute', left:16, top:12, zIndex:5, display:'inline-flex', alignItems:'center', gap:12, background:'#FFD6D6', borderRadius:20, padding:'12px 16px', boxShadow:'0 10px 24px rgba(95,109,136,0.1)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      {['#B64512','#2555FF','#7A680D'].map(color=><span key={color} style={{ width:18, height:18, borderRadius:'50%', background:color }}/>)}
                    </span>
                    <strong style={{ color:'#4A1F18', fontFamily:'"Libre Baskerville",Georgia,serif', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase' }}>{placedMine.length} stamped</strong>
                  </div>
                  <WorldMap
                    items={savedStampItems}
                    currentLocation={currentLocation}
                    selectedItemId={selectedMapItem?.id}
                    onSelectStamp={item=>{
                      setSelectedMapItemId(item.id);
                      setLightbox(item);
                    }}
                    onRequestLocation={requestLocation}
                    focusSignal={mapFocusSignal}
                  />
                </div>

                <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:22, padding:'16px 18px', boxShadow:'0 14px 30px rgba(95,109,136,0.08)', border:'1px solid rgba(223,216,218,0.9)' }}>
                  <p style={{ margin:'0 0 6px', color:'#A82412', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:'"Libre Baskerville",Georgia,serif' }}>{selectedMapItem ? 'Selected stamp' : 'Explorer ready'}</p>
                  <p style={{ margin:'0 0 6px', color:'#24160F', fontFamily:'"Playfair Display",Georgia,serif', fontSize:22, lineHeight:1.05 }}>
                    {selectedMapItem ? (selectedMapItem.label || selectedMapItem.country || 'Pinned stamp') : 'Tap a pin to open its stamp.'}
                  </p>
                  <p style={{ margin:0, color:'#6E6B78', fontSize:12, lineHeight:1.6 }}>
                    {selectedMapItem
                      ? `Saved to ${selectedMapItem.collection || 'Archive'} as a ${selectedMapItem.type}.`
                      : 'Capture a new stamp, then revisit it from the map or your archive.'}
                  </p>
                </div>
              </div>

              {savedStampItems.length > 0 && (
                <div style={{ display:'grid', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                    <h3 style={{ margin:0, color:'#24160F', fontFamily:'"Playfair Display",Georgia,serif', fontSize:22 }}>Recent Journey Stamps</h3>
                    <button onClick={()=>setTab('saved')} style={{ minHeight:0, padding:0, border:'none', background:'transparent', color:'#6C63FF', cursor:'pointer', fontSize:11, fontFamily:'"Libre Baskerville",Georgia,serif', letterSpacing:'0.08em' }}>Open archive →</button>
                  </div>
                  <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:6 }}>
                    {savedStampItems.slice(0, 6).map(item=>(
                      <button key={item.id} onClick={()=>setLightbox(item)} style={{ minWidth:156, border:'none', background:'white', borderRadius:18, padding:'14px 12px', display:'grid', gap:10, cursor:'pointer', boxShadow:'0 12px 30px rgba(108,99,255,0.08)', textAlign:'left' }}>
                        <div style={{ display:'grid', placeItems:'center', minHeight:138 }}>
                          {item.type==='stamp' ? <StampView item={item} size="sm"/> : <PostcardView item={item} scale={0.32}/>}
                        </div>
                        <div>
                          <p style={{ margin:'0 0 4px', color:'#A82412', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase' }}>{item.locationLabel || item.collection}</p>
                          <p style={{ margin:0, color:'#24160F', fontFamily:'"Playfair Display",Georgia,serif', fontSize:16, lineHeight:1.1 }}>{item.label || item.destination || 'Untitled stamp'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {unplacedMine.length > 0 && (
                <div style={{ marginTop:16, background:'rgba(255,255,255,0.88)', border:'1px solid rgba(247,215,232,0.9)', borderRadius:18, padding:'14px 16px' }}>
                  <p style={{ margin:'0 0 6px', color:'#A82412', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase' }}>Unplaced memories</p>
                  <p style={{ margin:0, fontSize:12, color:'#7A7487', lineHeight:1.6 }}>
                    {unplacedMine.length} saved {unplacedMine.length===1 ? 'stamp is' : 'stamps are'} waiting for a location. New captures will pin automatically when location access is available.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══ FEED VIEW */}
        {tab==='feed' && (
          <div>
            {viewingProfile && profile ? (
              <div>
                <button onClick={()=>setViewingProfile(null)} style={{ background:'none', border:'none', color:'#9B7BAE', cursor:'pointer', fontSize:11, fontFamily:'Georgia,serif', letterSpacing:'0.08em', marginBottom:18 }}>← Back to Feed</button>
                <div style={{ background:'white', border:'2px solid #F7D7E8', borderRadius:18, padding:22, marginBottom:26, boxShadow:'0 12px 30px rgba(108,99,255,0.12)' }}>
                  <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg, ${profile.color}, #FFD166)`, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Playfair Display",Georgia,serif', fontSize:28, fontWeight:700 }}>{profile.name.charAt(0)}</div>
                    <div style={{ flex:'1 1 220px' }}>
                      <p style={{ margin:0, fontSize:10, color:'#FF7AA8', textTransform:'uppercase', letterSpacing:'0.18em', fontFamily:'"Libre Baskerville",Georgia,serif' }}>@{viewingProfile}</p>
                      <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:30, margin:'2px 0 4px' }}>{profile.name}</h2>
                      <p style={{ margin:0, fontSize:12, color:'#9B7BAE', lineHeight:1.65 }}>{profile.location} · {profile.bio}</p>
                    </div>
                    <div style={{ display:'flex', gap:16, color:'#6C63FF', fontSize:11, fontFamily:'Georgia,serif' }}>
                      <span>{profileStamps.length} stampz</span>
                      <span>{profileStamps.reduce((sum, stamp)=>sum + stamp.likes, 0).toLocaleString()} likes</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:22, alignItems:'flex-start' }}>
                  {profileStamps.map(stamp=>(
                    <div key={stamp.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                      <StampView item={stamp} size="md" onClick={()=>setLightbox(stamp)} showMeta/>
                      <button onClick={()=>{ if(myItems.find(i=>i.id===stamp.id)){showToast('Already in collection');return;} setMyItems(p=>[{...stamp,id:genId(),createdAt:Date.now()},...p]);showToast('✉️ Saved to collection!'); }}
                        style={{ padding:'3px 12px', fontSize:10, borderRadius:20, border:'1px solid #F7D7E8', background:'white', color:'#6C63FF', cursor:'pointer', fontFamily:'Georgia,serif' }}>
                        + Save
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth:430, margin:'0 auto' }}>
                <div style={{ marginBottom:18 }}>
                  <h2 style={{ fontFamily:'"Playfair Display",Georgia,serif', color:'#111', fontSize:28, margin:'0 0 4px' }}>Feed View</h2>
                  <p style={{ margin:0, fontSize:12, color:'#9B7BAE' }}>Fresh stampz from the collector community.</p>
                </div>
                <div style={{ display:'flex', gap:14, overflowX:'auto', padding:'2px 2px 16px', margin:'0 -2px 14px' }}>
                  {[...new Set(COMMUNITY_STAMPS.map(stamp=>stamp.author))].map(author=>{
                    const storyProfile = getCommunityProfile(author);
                    return (
                      <button key={author} onClick={()=>setViewingProfile(author)} style={{ minWidth:66, minHeight:0, padding:0, border:'none', background:'transparent', cursor:'pointer', display:'grid', justifyItems:'center', gap:6, color:'#111' }}>
                        <span style={{ width:62, height:62, borderRadius:'50%', padding:3, background:'linear-gradient(135deg,#6C63FF,#FF7AA8,#FFD166)', display:'grid', placeItems:'center' }}>
                          <span style={{ width:'100%', height:'100%', borderRadius:'50%', border:'3px solid white', background:`linear-gradient(145deg, ${storyProfile.color}, #FFD166)`, color:'white', display:'grid', placeItems:'center', fontFamily:'"Playfair Display",Georgia,serif', fontSize:22, fontWeight:700 }}>
                            {storyProfile.name.charAt(0)}
                          </span>
                        </span>
                        <span style={{ maxWidth:66, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:10, fontFamily:'system-ui, sans-serif', color:'#4A1019' }}>@{author}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
                  {['All',...COLLECTIONS].map(c=><Pill key={c} label={c} active={browseFilter===c} onClick={()=>setBrowseFilter(c)} activeColor="#FF7AA8"/>)}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                  {filteredCommunity.map(stamp=>{
                    const stampProfile = getCommunityProfile(stamp.author);
                    const isLiked = Boolean(liked[stamp.id]);
                    return (
                      <article key={stamp.id} style={{ overflow:'hidden', background:'white', border:'1px solid #F0E8F4', borderRadius:22, boxShadow:'0 16px 38px rgba(108,99,255,0.08)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 14px' }}>
                          <button onClick={()=>setViewingProfile(stamp.author)} style={{ minHeight:0, padding:0, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left', flex:1 }}>
                            <span style={{ width:38, height:38, borderRadius:'50%', padding:2, background:'linear-gradient(135deg,#6C63FF,#FF7AA8,#FFD166)', display:'grid', placeItems:'center', flex:'0 0 auto' }}>
                              <span style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid white', background:stampProfile.color, color:'white', display:'grid', placeItems:'center', fontWeight:700 }}>
                                {stampProfile.name.charAt(0)}
                              </span>
                            </span>
                            <span>
                              <strong style={{ display:'block', color:'#111', fontFamily:'system-ui, sans-serif', fontSize:13, lineHeight:1.2 }}>@{stamp.author}</strong>
                              <span style={{ display:'block', color:'#9B7BAE', fontSize:10, marginTop:2 }}>{stampProfile.location}</span>
                            </span>
                          </button>
                          <button onClick={()=>setViewingProfile(stamp.author)} style={{ minHeight:0, border:'none', background:'#FFF1F8', color:'#FF4D8D', borderRadius:999, padding:'8px 12px', fontSize:10, fontWeight:700, cursor:'pointer' }}>View</button>
                        </div>
                        <button onClick={()=>setLightbox(stamp)} style={{ width:'100%', border:'none', background:'linear-gradient(180deg,#FFF,#FFF7FB)', padding:'20px 14px 14px', display:'grid', placeItems:'center', cursor:'pointer' }}>
                          <StampView item={stamp} size="lg" showMeta={false}/>
                        </button>
                        <div style={{ padding:'12px 14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <button onClick={()=>{setLiked(l=>({...l,[stamp.id]:!l[stamp.id]}));showToast(isLiked?'Removed like':'♥ Liked!');}} style={{ minHeight:0, padding:0, border:'none', background:'transparent', color:isLiked?'#FF4D8D':'#111', cursor:'pointer', fontSize:24, lineHeight:1 }}>{isLiked?'♥':'♡'}</button>
                            <button onClick={()=>{ if(myItems.find(i=>i.id===stamp.id)){showToast('Already in collection');return;} setMyItems(p=>[{...stamp,id:genId(),createdAt:Date.now()},...p]);showToast('✉️ Saved to collection!'); }} style={{ minHeight:0, padding:0, border:'none', background:'transparent', color:'#111', cursor:'pointer', fontSize:22, lineHeight:1 }}>＋</button>
                            <span style={{ marginLeft:'auto', color:'#9B7BAE', fontSize:11 }}>{stamp.collection}</span>
                          </div>
                          <p style={{ margin:'0 0 6px', color:'#111', fontFamily:'system-ui, sans-serif', fontSize:13, fontWeight:700 }}>{(stamp.likes+(isLiked?1:0)).toLocaleString()} likes</p>
                          <p style={{ margin:0, color:'#4A1019', fontSize:12, lineHeight:1.55 }}><strong>@{stamp.author}</strong> {stamp.label || stamp.country || 'New stamp drop'} from the {stamp.collection} collection.</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {!showCreateModal && (
        <nav className="app-nav" aria-label="Primary">
          <TabButton id="map" icon="🗺️" label="Map View" active={tab==='map'} onSelect={handleTabSelect}/>
          <TabButton id="feed" icon="📰" label="Feed View" active={tab==='feed'} onSelect={handleTabSelect}/>
          <TabButton id="saved" icon="✉️" label="Saved Stamps" active={tab==='saved'} onSelect={handleTabSelect}/>
        </nav>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#FFF6D8', borderRadius:10, padding:32, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', alignItems:'center', gap:22 }}>
            <div style={{ background:'white', borderRadius:8, padding:24, width:'100%', display:'flex', justifyContent:'center' }}>
              {lightbox.type==='stamp'?<EditorStampPreview item={lightbox}/>:<PostcardView item={lightbox} scale={0.82}/>}
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ margin:'0 0 4px', fontFamily:'"Playfair Display",Georgia,serif', color:'#6C63FF', fontSize:20, fontStyle:'italic' }}>{lightbox.label||lightbox.destination||'Untitled'}</p>
              <p style={{ margin:0, fontSize:11, color:'#9B7BAE', fontFamily:'Georgia,serif' }}>Collection: {lightbox.collection}</p>
              {lightbox.author && <p style={{ margin:'4px 0 0', fontSize:10, color:'#bbb', fontFamily:'Georgia,serif' }}>by @{lightbox.author}</p>}
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              <button onClick={()=>{navigator.clipboard?.writeText(window.location.href).catch(()=>{});showToast('📋 Link copied!');setLightbox(null);}} style={{ padding:'9px 22px', background:'#6C63FF', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:'"Libre Baskerville",Georgia,serif', letterSpacing:'0.08em', transition:'background 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#FF7AA8'} onMouseLeave={e=>e.currentTarget.style.background='#6C63FF'}>Share ✉️</button>
              {myItems.find(i=>i.id===lightbox.id)&&lightbox.type==='stamp'&&(
                <button onClick={()=>startEditingItem(lightbox)} style={{ padding:'9px 22px', background:'white', color:'#B64512', border:'1.5px solid #B64512', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Edit Stamp</button>
              )}
              {!myItems.find(i=>i.id===lightbox.id)&&lightbox.author&&(
                <button onClick={()=>{setMyItems(p=>[{...lightbox,id:genId(),createdAt:Date.now()},...p]);showToast('✉️ Saved!');setLightbox(null);}} style={{ padding:'9px 22px', background:'white', color:'#6C63FF', border:'1.5px solid #6C63FF', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:'"Libre Baskerville",Georgia,serif', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='#6C63FF';e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#6C63FF';}}>Save to Collection</button>
              )}
              {myItems.find(i=>i.id===lightbox.id)&&(
                <button onClick={()=>{setMyItems(p=>p.filter(i=>i.id!==lightbox.id));showToast('Removed');setLightbox(null);}} style={{ padding:'9px 22px', background:'white', color:'#FF7AA8', border:'1.5px solid #FF7AA8', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:'"Libre Baskerville",Georgia,serif' }}>Remove</button>
              )}
              <button onClick={()=>setLightbox(null)} style={{ padding:'9px 16px', background:'none', color:'#aaa', border:'1px solid #ddd', borderRadius:4, cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#FFF6D8; }
        ::-webkit-scrollbar-thumb { background:#F7BFD7; border-radius:3px; }
      `}</style>
    </div>
  );
}
