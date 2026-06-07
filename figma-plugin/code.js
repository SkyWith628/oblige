// OBLIGE Design Import Plugin v2.0
// 수정된 디자인 시스템 반영: Playfair Display + Inter, 그라디언트, 필 버튼, 애니메이션 UI

// ── 브랜드 컬러 ──────────────────────────────────────────
const C = {
  navy:    { r:0.051, g:0.071, b:0.251 },  // #0D1240
  navyD:   { r:0.024, g:0.031, b:0.102 },  // #06081a (footer)
  navyM:   { r:0.063, g:0.082, b:0.314 },  // #101450 (gradient mid)
  pink:    { r:0.941, g:0.243, b:0.549 },  // #F03E8C
  pink2:   { r:1.000, g:0.431, b:0.690 },  // #FF6EB0
  white:   { r:1,     g:1,     b:1     },
  off:     { r:0.976, g:0.973, b:0.961 },  // #F9F8F5
  light:   { r:0.941, g:0.937, b:0.976 },  // #F0EFF9
  muted:   { r:0.420, g:0.420, b:0.494 },  // #6B6B7E
  success: { r:0.133, g:0.773, b:0.369 },  // #22C55E
  bg:      { r:0.957, g:0.961, b:0.980 },  // admin bg
};

// ── 헬퍼 ──────────────────────────────────────────────────
const solid  = c      => [{ type:'SOLID', color:c }];
const solidA = (c, a) => [{ type:'SOLID', color:c, opacity:a }];
function ca(c, a) { return { r:c.r, g:c.g, b:c.b, a:a }; }
const grad   = (c1, c2, angle) => [{
  type: 'GRADIENT_LINEAR',
  gradientTransform: angleToTransform(angle === undefined ? 135 : angle),
  gradientStops: [
    { position:0, color:ca(c1, 1) },
    { position:1, color:ca(c2, 1) },
  ],
}];
const gradA = (c1, a1, c2, a2, angle) => [{
  type: 'GRADIENT_LINEAR',
  gradientTransform: angleToTransform(angle === undefined ? 135 : angle),
  gradientStops: [
    { position:0, color:ca(c1, a1) },
    { position:1, color:ca(c2, a2) },
  ],
}];
function radGrad(cx, cy, rx, ry, c1, a1, c2, a2) {
  return [{
    type: 'GRADIENT_RADIAL',
    gradientTransform: [[rx, 0, cx], [0, ry, cy]],
    gradientStops: [
      { position:0, color:ca(c1, a1) },
      { position:1, color:ca(c2, a2) },
    ],
  }];
}

function angleToTransform(deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return [[cos, -sin, (1-cos)/2 + sin/2], [sin, cos, (1-sin)/2 - cos/2]];
}

// 폰트 캐시
const _fc = {};
async function loadFont(family='Inter', style='Regular') {
  const key = `${family}:${style}`;
  if (_fc[key]) return _fc[key];
  const tries = [
    { family, style },
    { family:'Inter', style },
    { family:'Inter', style:'Regular' },
  ];
  for (const f of tries) {
    try { await figma.loadFontAsync(f); _fc[key]=f; return f; } catch(e) {}
  }
  throw new Error(`폰트 로드 실패: ${family} ${style}`);
}

// 제목용 폰트 (Playfair Display 없으면 Inter Bold fallback)
async function loadHeadFont(style='Bold') {
  try {
    await figma.loadFontAsync({ family:'Playfair Display', style });
    _fc[`PD:${style}`] = { family:'Playfair Display', style };
    return { family:'Playfair Display', style };
  } catch(e) {
    return loadFont('Inter', style === 'Bold' ? 'Extra Bold' : style);
  }
}

function mkRect(parent, { x=0,y=0,w=100,h=100,fill=null,radius=0,name='rect',
                           stroke=null, strokeW=1.5, opacity=1 }) {
  const r = figma.createRectangle();
  r.name = name; r.x=x; r.y=y; r.resize(w,h);
  if (fill) r.fills = fill; else r.fills = [];
  if (radius) r.cornerRadius = radius;
  if (stroke) { r.strokes = stroke; r.strokeWeight = strokeW; }
  if (opacity < 1) r.opacity = opacity;
  parent.appendChild(r);
  return r;
}

async function mkText(parent, {
  x=0, y=0, content='', size=16, family='Inter', style='Regular',
  color=C.navy, w=null, align='LEFT', name='text', lineH=null, opacity=1, letterSpacing=0
}) {
  const font = family === 'Playfair Display' || family === 'PD'
    ? await loadHeadFont(style)
    : await loadFont(family, style);
  const t = figma.createText();
  t.name = name; t.fontName = font; t.fontSize = size;
  t.fills = solid(color); t.textAlignHorizontal = align;
  if (lineH) t.lineHeight = { value:lineH, unit:'PIXELS' };
  if (letterSpacing) t.letterSpacing = { value:letterSpacing, unit:'PERCENT' };
  t.characters = content;
  if (w) { t.textAutoResize='HEIGHT'; t.resize(w, t.height); }
  t.x=x; t.y=y;
  if (opacity < 1) t.opacity = opacity;
  parent.appendChild(t);
  return t;
}

function mkFrame(parent, { x=0,y=0,w=1440,h=100,fill=null,name='frame',
                             clip=true,radius=0,stroke=null,strokeW=1.5,opacity=1 }) {
  const f = figma.createFrame();
  f.name=name; f.x=x; f.y=y; f.resize(w,h); f.clipsContent=clip;
  if (fill) f.fills=fill; else f.fills=[];
  if (radius) f.cornerRadius=radius;
  if (stroke) { f.strokes=stroke; f.strokeWeight=strokeW; }
  if (opacity<1) f.opacity=opacity;
  if (parent) parent.appendChild(f);
  return f;
}

// 장식 원형 (오브 효과)
function mkCircle(parent, {x,y,d,fill,name='orb',opacity=0.35}) {
  const c = figma.createEllipse();
  c.name=name; c.x=x; c.y=y; c.resize(d,d);
  c.fills=fill; c.opacity=opacity;
  parent.appendChild(c);
  return c;
}

// 확정 로고마크 — 사선 바 3개 (브랜드 심볼)
function mkLogoMark(parent, { x=0, y=0, size=26, name='logo-mark' }) {
  const mark = figma.createFrame();
  mark.name = name; mark.x = x; mark.y = y; mark.resize(size, size);
  mark.fills = []; mark.clipsContent = false;
  const barW = size * 0.17;
  const barH = size * 0.62;
  const gap  = size * 0.26;
  const startX = size * 0.14;
  const topY = size * 0.19;
  const grd = grad(C.pink, C.pink2, 160);
  for (let i = 0; i < 3; i++) {
    const bar = figma.createRectangle();
    bar.name = `bar-${i+1}`;
    bar.resize(barW, barH);
    bar.cornerRadius = barW / 2;
    bar.fills = grd;
    if (i === 2) bar.opacity = 0.55;
    mark.appendChild(bar);
    bar.x = startX + i * gap;
    bar.y = topY;
    bar.rotation = 13; // 앞으로 기운 사선
  }
  parent.appendChild(mark);
  return mark;
}

// 컬러 스타일
async function createColorStyles() {
  const styles = [
    ['OBLIGE/Navy',    C.navy],
    ['OBLIGE/Pink',    C.pink],
    ['OBLIGE/Pink 2',  C.pink2],
    ['OBLIGE/White',   C.white],
    ['OBLIGE/Off White', C.off],
    ['OBLIGE/Light',   C.light],
    ['OBLIGE/Muted',   C.muted],
    ['OBLIGE/Success', C.success],
    ['OBLIGE/Footer',  C.navyD],
  ];
  for (const [name, color] of styles) {
    const s = figma.createPaintStyle();
    s.name=name;
    s.paints=[{ type:'SOLID', color }];
  }
}

// ══════════════════════════════════════════════════════════
// 메인 페이지
// ══════════════════════════════════════════════════════════
async function buildMainPage() {
  const W = 1440;
  let y = 0;

  const root = mkFrame(null, { w:W, h:9000, fill:solid(C.white), name:'🌐 OBLIGE — 메인 페이지' });
  figma.currentPage.appendChild(root);

  // ── NAV ────────────────────────────────────────────────
  const nav = mkFrame(root, { w:W, h:72, fill:solidA(C.white, 0.9), name:'NAV' });
  // border bottom
  mkRect(nav, { x:0, y:71, w:W, h:1, fill:solidA(C.navy, 0.06), name:'border' });

  await loadFont('Inter','Extra Bold');
  // Logo (확정 로고마크 + 워드마크)
  const logoF = mkFrame(nav, { x:56, y:21, w:170, h:30, name:'logo-group' });
  mkLogoMark(logoF, { x:0, y:2, size:26 });
  await mkText(logoF, { x:38, y:1, content:'OBLI', size:22, style:'Extra Bold', color:C.navy });
  await mkText(logoF, { x:96, y:1, content:'GE', size:22, style:'Extra Bold', color:C.pink });

  // nav links with underline style
  const links = ['Brand','Product','Recycle','Reward','Campaign'];
  let lx = W - 620;
  for (const link of links) {
    const lg = mkFrame(nav, { x:lx, y:20, w:80, h:32, name:`link-${link}` });
    await mkText(lg, { x:0, y:4, content:link, size:12, style:'Bold', color:C.navy, letterSpacing:8 });
    mkRect(lg, { x:0, y:28, w:40, h:1.5, fill:solid(C.pink), name:'underline', opacity:0 }); // hover state ref
    lx += 84;
  }

  // Nav CTA — pill shape
  const navCta = mkFrame(nav, { x:W-170, y:18, w:114, h:36,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'nav-cta-btn' });
  // shadow effect (inner)
  await mkText(navCta, { x:10, y:9, content:'공병 반납하기', size:12, style:'Bold', color:C.white });

  // Cart icon area
  const cartArea = mkFrame(nav, { x:W-200, y:16, w:36, h:36, radius:18, name:'cart-icon' });
  await mkText(cartArea, { x:8, y:7, content:'🛒', size:18 });

  y = 72;

  // ── HERO ────────────────────────────────────────────────
  const hero = mkFrame(root, { x:0, y, w:W, h:920, fill:solid(C.navy), name:'HERO' });

  // 배경 그라디언트 오버레이
  mkRect(hero, { x:0, y:0, w:W, h:920,
    fill: radGrad(0.1, 0.2, 0.8, 0.6, C.pink, 0.18, C.pink, 0),
    name:'hero-glow-1' });

  // 오브 (빛 효과)
  mkCircle(hero, { x:W-500, y:-100, d:600,
    fill: radGrad(0, 0, 1, 1, C.pink, 1, C.pink, 0),
    opacity:0.30, name:'orb-1' });
  mkCircle(hero, { x:100, y:600, d:350,
    fill: radGrad(0, 0, 1, 1, {r:0.36,g:0.42,b:0.75}, 1, {r:0.36,g:0.42,b:0.75}, 0),
    opacity:0.35, name:'orb-2' });

  // 워터마크
  const wm = figma.createText();
  wm.name='watermark';
  const wmFont = await loadFont('Inter','Extra Bold');
  wm.fontName=wmFont; wm.fontSize=380; wm.characters='OBLIGE';
  wm.fills=[{ type:'SOLID', color:C.pink, opacity:0.04 }];
  wm.x=420; wm.y=280;
  hero.appendChild(wm);

  // 배지
  const badge = mkFrame(hero, { x:56, y:128, w:360, h:38,
    fill:solidA(C.pink, 0.08), radius:100, name:'hero-badge',
    stroke:[{ type:'SOLID', color:C.pink, opacity:0.4 }], strokeW:1 });
  await mkText(badge, { x:16, y:10, content:'● VEGAN · SUSTAINABLE · ESG COSMETICS',
    size:11, style:'Bold', color:C.pink, letterSpacing:10 });

  // 타이틀 (Playfair Display)
  await mkText(hero, { x:56, y:180, content:'Return Beauty,', size:96,
    family:'Playfair Display', style:'Bold', color:C.white, lineH:96, name:'hero-t1' });
  await mkText(hero, { x:56, y:283, content:'Refill Value.', size:96,
    family:'Playfair Display', style:'Bold',
    color:C.pink, lineH:96, name:'hero-t2' });

  // 서브
  await mkText(hero, { x:56, y:404, w:520,
    content:'공병을 반납하고, 지속가능한 아름다움을 채우다.\n비건 화장품 구매 · 공병 반납 · 포인트 적립 · 리필 보상까지\n연결된 ESG 코스메틱 플랫폼.',
    size:17, style:'Regular', color:C.white, lineH:30, name:'hero-sub', opacity:0.55 });

  // 버튼 (pill + gradient)
  const hBtn1 = mkFrame(hero, { x:56, y:536, w:200, h:56,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'btn-primary' });
  await mkText(hBtn1, { x:36, y:17, content:'공병 반납하기', size:14, style:'Bold', color:C.white });
  // 버튼 그림자 레퍼런스 (하이라이트)
  mkRect(hBtn1, { x:0, y:0, w:200, h:28,
    fill:solidA(C.white, 0.08), radius:100, name:'btn-highlight' });

  const hBtn2 = mkFrame(hero, { x:272, y:536, w:220, h:56,
    fill:solidA(C.white, 0.06), radius:100, name:'btn-outline-products',
    stroke:[{ type:'SOLID', color:C.white, opacity:0.25 }], strokeW:1.5 });
  await mkText(hBtn2, { x:28, y:17, content:'비건 제품 보러가기', size:14, style:'Bold', color:C.white });

  const hBtn3 = mkFrame(hero, { x:508, y:536, w:180, h:56,
    fill:solidA(C.white, 0.06), radius:100, name:'btn-outline-brand',
    stroke:[{ type:'SOLID', color:C.white, opacity:0.25 }], strokeW:1.5 });
  await mkText(hBtn3, { x:28, y:17, content:'OBLIGE 소개', size:14, style:'Bold', color:C.white });

  // 스크롤 힌트
  const scrollHint = mkFrame(hero, { x:W/2-30, y:856, w:60, h:48, name:'scroll-hint' });
  mkRect(scrollHint, { x:29, y:0, w:1, h:40, fill:solidA(C.white, 0.3), name:'scroll-line' });
  await mkText(scrollHint, { x:2, y:36, content:'SCROLL', size:9, style:'Bold',
    color:C.white, opacity:0.3, letterSpacing:10 });

  y += 920;

  // ── VALUE MARQUEE ────────────────────────────────────────
  const marquee = mkFrame(root, { x:0, y, w:W, h:84, fill:solid(C.navy), name:'MARQUEE' });
  mkRect(marquee, { x:0, y:0,  w:W, h:1, fill:solidA(C.white, 0.06) });
  mkRect(marquee, { x:0, y:83, w:W, h:1, fill:solidA(C.white, 0.06) });
  const mItems = ['Vegan Beauty','Refill Value','Zero Waste','Cruelty Free','Circular ESG'];
  let mx = 56;
  for (let i = 0; i < mItems.length; i++) {
    const ghost = i % 2 === 1;
    const t = await mkText(marquee, { x:mx, y:24, content:mItems[i], size:26,
      family:'Playfair Display', style:'Bold',
      color:ghost ? C.navy : C.white, opacity:ghost ? 0.001 : 0.85,
      name:`marquee-${mItems[i]}` });
    if (ghost) {
      t.fills = []; t.opacity = 1;
      t.strokes = [{ type:'SOLID', color:C.white, opacity:0.22 }];
      t.strokeWeight = 1;
    }
    mx += t.width + 28;
    // 구분 점
    const dot = figma.createEllipse();
    dot.resize(8, 8); dot.x = mx; dot.y = 38; dot.fills = grad(C.pink, C.pink2, 135);
    marquee.appendChild(dot);
    mx += 8 + 28;
  }
  y += 84;

  // ── BRAND ────────────────────────────────────────────────
  const brand = mkFrame(root, { x:0, y, w:W, h:560, fill:solid(C.off), name:'BRAND' });

  // 로고 비주얼 (고급 카드)
  const logoCard = mkFrame(brand, { x:56, y:64, w:580, h:432,
    fill:grad(C.navy, C.navyM, 135), radius:24, name:'brand-visual' });
  mkRect(logoCard, { x:0, y:0, w:580, h:432,
    fill: radGrad(0.15, 0.3, 0.7, 0.7, C.pink, 0.2, C.pink, 0),
    name:'visual-glow', radius:24 });
  // 배경 워터마크 로고마크
  const wmMark = mkLogoMark(logoCard, { x:300, y:60, size:300, name:'visual-watermark' });
  wmMark.opacity = 0.08;
  // 확정 로고: 마크 + 워드마크
  mkLogoMark(logoCard, { x:240, y:130, size:100, name:'visual-mark' });
  await mkText(logoCard, { x:158, y:250, content:'OBLI', size:60,
    family:'Inter', style:'Extra Bold', color:C.white });
  await mkText(logoCard, { x:312, y:250, content:'GE', size:60,
    family:'Inter', style:'Extra Bold', color:C.pink });

  // 텍스트
  const brandLabel = mkFrame(brand, { x:700, y:80, w:180, h:20, name:'brand-label' });
  mkRect(brandLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(brandLabel, { x:32, y:0, content:'BRAND STORY', size:11, style:'Bold',
    color:C.pink, letterSpacing:14 });

  await mkText(brand, { x:700, y:112,
    content:'책임 있는\n아름다움을 제안하다', size:52,
    family:'Playfair Display', style:'Bold', color:C.navy, lineH:58, w:680 });
  await mkText(brand, { x:700, y:288, w:680,
    content:'OBLIGE는 사회적 책임과 지속가능한 소비를 의미하는 브랜드입니다.\n화장품 공병을 회수·재사이클링하는 친환경 비건 코스메틱 플랫폼으로,\n아름다움이 지구에 빚지지 않는 세상을 만들어갑니다.',
    size:17, style:'Regular', color:C.muted, lineH:28 });

  // 키워드 칩
  const chips = ['Clean','Vegan','Refill','Responsibility','Sustainable'];
  let cx = 700;
  for (const chip of chips) {
    const cw = chip.length * 8 + 40;
    const cf = mkFrame(brand, { x:cx, y:424, w:cw, h:36,
      fill:[], radius:100, name:`chip-${chip}`,
      stroke:[{ type:'SOLID', color:C.navy, opacity:0.2 }], strokeW:1.5 });
    await mkText(cf, { x:14, y:9, content:chip.toUpperCase(), size:11,
      style:'Bold', color:C.navy, letterSpacing:8 });
    cx += cw + 10;
  }

  y += 560;

  // ── PROBLEM — BENTO GRID ─────────────────────────────────
  // Layout:
  //   [140억+ wide navy 2col] [과대포장 1col]
  //   [재활용 1col] [72% wide navy 2col]
  const prob = mkFrame(root, { x:0, y, w:W, h:580,
    fill:solid(C.white), name:'PROBLEM — 우리가 바꾸고자 하는 문제 (Bento)' });

  const probLabel = mkFrame(prob, { x:56, y:56, w:260, h:20, name:'prob-label' });
  mkRect(probLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(probLabel, { x:32, y:0, content:'WHY OBLIGE', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(prob, { x:56, y:84, content:'우리가 바꾸고자 하는 문제', size:40,
    family:'Playfair Display', style:'Bold', color:C.navy });

  // 그리드 파라미터
  const PG = { x:56, gridY:160, gap:14 };
  const pColW = Math.floor((W - 112 - PG.gap * 2) / 3); // ~437
  const pRowH = 170;
  const pRow2Y = PG.gridY + pRowH + PG.gap;
  const pWideW = pColW * 2 + PG.gap;

  // ① 플라스틱 (wide navy, col1-2, row1)
  const p1 = mkFrame(prob, { x:PG.x, y:PG.gridY, w:pWideW, h:pRowH,
    fill:grad(C.navy, C.navyM, 135), radius:20, name:'prob-plastic (wide)' });
  mkRect(p1, { x:0, y:0, w:pWideW, h:pRowH,
    fill: radGrad(0.05, 0.3, 0.7, 0.7, C.pink, 0.15, C.pink, 0),
    radius:20, name:'p1-glow' });
  // stat
  await mkText(p1, { x:28, y:20, content:'140억+', size:36,
    family:'Playfair Display', style:'Bold', color:C.pink });
  await mkText(p1, { x:28, y:62, content:'매년 버려지는 화장품 용기 수', size:11,
    style:'Bold', color:C.pink, letterSpacing:6, opacity:0.8 });
  await mkText(p1, { x:28, y:88, content:'🧴', size:24 });
  await mkText(p1, { x:28, y:120, content:'플라스틱 용기 증가', size:14,
    style:'Extra Bold', color:C.white });
  await mkText(p1, { x:28, y:144, w:pWideW-56,
    content:'매년 수십억 개의 화장품 플라스틱 용기가 환경에 버려지고 있습니다.', size:11,
    style:'Regular', color:C.white, lineH:17, opacity:0.55 });

  // ② 과대포장 (col3, row1)
  const p2 = mkFrame(prob, { x:PG.x + pWideW + PG.gap, y:PG.gridY, w:pColW, h:pRowH,
    fill:solid(C.light), radius:20, name:'prob-packaging' });
  await mkText(p2, { x:24, y:24, content:'📦', size:28 });
  await mkText(p2, { x:24, y:68, content:'과대포장 · 단기 소비', size:13,
    style:'Extra Bold', color:C.navy, lineH:20 });
  await mkText(p2, { x:24, y:100, w:pColW-48,
    content:'불필요한 패키징과 빠른 소비 사이클이 폐기물을 가속화합니다.', size:11,
    style:'Regular', color:C.muted, lineH:17 });

  // ③ 재활용 어려움 (col1, row2)
  const p3 = mkFrame(prob, { x:PG.x, y:pRow2Y, w:pColW, h:pRowH,
    fill:solid(C.light), radius:20, name:'prob-recycle' });
  await mkText(p3, { x:24, y:24, content:'♻️', size:28 });
  await mkText(p3, { x:24, y:68, content:'복합 소재 재활용 어려움', size:13,
    style:'Extra Bold', color:C.navy, lineH:20 });
  await mkText(p3, { x:24, y:100, w:pColW-48,
    content:'다양한 소재 결합 용기는 일반 재활용 과정에서 걸러지지 않습니다.', size:11,
    style:'Regular', color:C.muted, lineH:17 });

  // ④ 원료 부담 (wide navy, col2-3, row2)
  const p4 = mkFrame(prob, { x:PG.x + pColW + PG.gap, y:pRow2Y, w:pWideW, h:pRowH,
    fill:grad(C.navy, C.navyM, 135), radius:20, name:'prob-ingredients (wide)' });
  mkRect(p4, { x:0, y:0, w:pWideW, h:pRowH,
    fill: radGrad(0.85, 0.3, 0.7, 0.7, C.pink, 0.15, C.pink, 0),
    radius:20, name:'p4-glow' });
  await mkText(p4, { x:28, y:20, content:'72%', size:36,
    family:'Playfair Display', style:'Bold', color:C.pink });
  await mkText(p4, { x:28, y:62, content:'동물 유래 원료 사용 비율 (글로벌)', size:11,
    style:'Bold', color:C.pink, letterSpacing:6, opacity:0.8 });
  await mkText(p4, { x:28, y:88, content:'🌱', size:24 });
  await mkText(p4, { x:28, y:120, content:'원료 · 생산 환경 부담', size:14,
    style:'Extra Bold', color:C.white });
  await mkText(p4, { x:28, y:144, w:pWideW-56,
    content:'동물 성분과 화학 원료가 생태계에 미치는 부정적 영향을 줄여야 합니다.', size:11,
    style:'Regular', color:C.white, lineH:17, opacity:0.55 });

  y += 580;

  // ── SOLUTION (ESG) ──────────────────────────────────────
  const sol = mkFrame(root, { x:0, y, w:W, h:560,
    fill:grad(C.navyD, C.navy, 160), name:'SOLUTION — ESG 순환 시스템' });

  // 배경 오브
  mkCircle(sol, { x:-100, y:-100, d:400,
    fill: radGrad(0, 0, 1, 1, C.pink, 1, C.pink, 0),
    opacity:0.08 });

  const solLabel = mkFrame(sol, { x:56, y:80, w:220, h:20, name:'sol-label' });
  mkRect(solLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(solLabel, { x:32, y:0, content:'HOW IT WORKS', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(sol, { x:56, y:108, content:'OBLIGE의 순환형 ESG 시스템', size:48,
    family:'Playfair Display', style:'Bold', color:C.white, w:700 });

  // 라인 (그라디언트)
  mkRect(sol, { x:160, y:308, w:1120, h:1.5,
    fill:grad(C.pink, C.pink2, 0), name:'cycle-line', opacity:0.35 });

  const steps = [
    ['1','비건 화장품\n구매','동물 성분 무첨가\n친환경 패키지'],
    ['2','공병 준비','세척 후 반납 가능한\nOBLIGE 공병 준비'],
    ['3','공병 반납 &\n포인트 적립','오프라인 또는\n택배 반납'],
    ['4','리필 혜택 &\n리워드','기준 달성 시\n리필 또는 굿즈'],
    ['5','재사용 &\n업사이클링','공병 리사이클링\n파트너 협력 처리'],
  ];

  for (let i = 0; i < steps.length; i++) {
    const sx = 122 + i * 268;
    // gradient circle
    const circle = mkFrame(sol, { x:sx, y:272, w:72, h:72,
      fill:grad(C.pink, C.pink2, 135), radius:36, name:`step-${i+1}` });
    await mkText(circle, { x:22, y:16, content:steps[i][0], size:22,
      style:'Extra Bold', color:C.white });

    await mkText(sol, { x:sx-24, y:362, w:120, content:steps[i][1], size:14,
      style:'Bold', color:C.white, align:'CENTER', lineH:22 });
    await mkText(sol, { x:sx-24, y:406, w:120, content:steps[i][2], size:12,
      style:'Regular', color:C.white, lineH:18, align:'CENTER', opacity:0.45 });
  }

  y += 560;

  // ── PRODUCTS ────────────────────────────────────────────
  const prods = mkFrame(root, { x:0, y, w:W, h:700,
    fill:solid(C.off), name:'PRODUCTS' });

  const prodsLabel = mkFrame(prods, { x:56, y:80, w:260, h:20, name:'prod-label' });
  mkRect(prodsLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(prodsLabel, { x:32, y:0, content:'VEGAN COLLECTION', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(prods, { x:56, y:108, content:'대표 제품 라인업', size:48,
    family:'Playfair Display', style:'Bold', color:C.navy });

  const prodData = [
    { emoji:'🌿', cat:'VEGAN TONER',   name:'OBLIGE Calm Toner',   price:'₩38,000', pt:'공병 반납 시 500P · 리필 가능' },
    { emoji:'✨', cat:'VEGAN AMPOULE', name:'OBLIGE Glow Ampoule',  price:'₩45,000', pt:'공병 반납 시 700P · 리필 가능' },
    { emoji:'💧', cat:'VEGAN CREAM',   name:'OBLIGE Barrier Cream', price:'₩42,000', pt:'공병 반납 시 600P · 리필 가능' },
    { emoji:'🔄', cat:'REFILL',        name:'OBLIGE Refill Set',    price:'₩29,000', pt:'공병 보유 회원 전용 · 20% 할인' },
  ];

  for (let i = 0; i < prodData.length; i++) {
    const p = prodData[i];
    const px = 56 + i * 332;
    const card = mkFrame(prods, { x:px, y:192, w:308, h:420,
      fill:solid(C.white), radius:20, name:`card-${p.name}` });

    // 이미지 영역 (그라디언트 배경)
    const imgBg = mkFrame(card, { x:0, y:0, w:308, h:220,
      fill:grad(C.navy, C.navyM, 135), name:'img-bg' });
    // 이미지 오버레이
    mkRect(imgBg, { x:0, y:0, w:308, h:220,
      fill: radGrad(0.1, 0.2, 0.8, 0.6, C.pink, 0.15, C.pink, 0),
      name:'img-glow' });
    await mkText(imgBg, { x:114, y:76, content:p.emoji, size:64 });

    // 카드 정보
    await mkText(card, { x:22, y:236, content:p.cat, size:10,
      style:'Bold', color:C.pink, letterSpacing:12 });
    await mkText(card, { x:22, y:256, content:p.name, size:15,
      style:'Extra Bold', color:C.navy });
    await mkText(card, { x:22, y:282, content:p.price, size:16,
      style:'Extra Bold', color:C.navy });

    // 포인트 pill chip
    const ptChip = mkFrame(card, { x:22, y:314, w:264, h:30,
      fill:solid(C.off), radius:100, name:'point-chip' });
    await mkText(ptChip, { x:14, y:7, content:p.pt, size:11,
      style:'Regular', color:C.muted });

    // 별점 + 담기 버튼
    await mkText(card, { x:22, y:360, content:'★ 4.8', size:13,
      style:'Semi Bold', color:{r:0.984,g:0.749,b:0.141} });
    const addBtn = mkFrame(card, { x:220, y:352, w:70, h:32,
      fill:solid(C.navy), radius:100, name:'btn-담기' });
    await mkText(addBtn, { x:12, y:8, content:'담기 🛒', size:11, style:'Bold', color:C.white });
  }

  y += 700;

  // ── RECYCLE ────────────────────────────────────────────
  const recycle = mkFrame(root, { x:0, y, w:W, h:640,
    fill:solid(C.white), name:'RECYCLE — 공병 반납' });

  // 왼쪽
  const recLabel = mkFrame(recycle, { x:56, y:80, w:280, h:20, name:'rec-label' });
  mkRect(recLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(recLabel, { x:32, y:0, content:'EMPTY BOTTLE RETURN', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(recycle, { x:56, y:108, content:'공병 반납 방법', size:48,
    family:'Playfair Display', style:'Bold', color:C.navy });
  await mkText(recycle, { x:56, y:188, w:520,
    content:'사용한 OBLIGE 공병을 반납하면 포인트가 적립되고,\n지구가 조금 더 깨끗해집니다.',
    size:17, style:'Regular', color:C.muted, lineH:28 });

  // 버튼 (pill)
  const rb1 = mkFrame(recycle, { x:56, y:284, w:220, h:52,
    fill:solid(C.navy), radius:100, name:'btn-반납신청' });
  await mkText(rb1, { x:36, y:14, content:'공병 반납 신청하기', size:14, style:'Bold', color:C.white });

  const rb2 = mkFrame(recycle, { x:292, y:284, w:180, h:52,
    fill:[], radius:100, name:'btn-내역',
    stroke:[{ type:'SOLID', color:C.navy, opacity:0.2 }], strokeW:1.5 });
  await mkText(rb2, { x:28, y:14, content:'내 반납 내역', size:14, style:'Bold', color:C.navy });

  // 오른쪽 — 5단계 (rounded number)
  const rSteps = [
    ['공병 준비', '사용한 OBLIGE 공병을 깨끗하게 세척하여 준비'],
    ['반납 신청', '웹사이트에서 공병 반납 신청을 진행'],
    ['반납 방법 선택', '오프라인 수거함 또는 택배 발송 중 선택'],
    ['검수 후 포인트 지급', '검수 완료 시 영업일 기준 3일 이내 지급'],
    ['리필 혜택 또는 굿즈', '기준 충족 시 리필 혜택 또는 친환경 굿즈 수령'],
  ];

  for (let i = 0; i < rSteps.length; i++) {
    const ry = 64 + i * 108;
    const numBox = mkFrame(recycle, { x:720, y:ry, w:44, h:44,
      fill:grad(C.pink, C.pink2, 135), radius:14, name:`r-num-${i+1}` });
    await mkText(numBox, { x:13, y:10, content:`${i+1}`, size:16, style:'Bold', color:C.white });
    await mkText(recycle, { x:784, y:ry+4, content:rSteps[i][0], size:15,
      style:'Extra Bold', color:C.navy });
    await mkText(recycle, { x:784, y:ry+28, w:560, content:rSteps[i][1], size:13,
      style:'Regular', color:C.muted, lineH:20 });
    if (i < rSteps.length-1)
      mkRect(recycle, { x:741, y:ry+44, w:1, h:64,
        fill:solidA(C.navy, 0.06), name:'step-connector' });
  }

  y += 640;

  // ── REWARD — BENTO GRID ──────────────────────────────
  // Layout: 3-col bento
  //   [Seed] [Leaf] [Tree★ tall]
  //   [Forest wide──────] [Tree★]
  const reward = mkFrame(root, { x:0, y, w:W, h:680,
    fill:solid(C.off), name:'REWARD — 등급 시스템 (Bento)' });

  const rwLabel = mkFrame(reward, { x:56, y:80, w:240, h:20, name:'rw-label' });
  mkRect(rwLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(rwLabel, { x:32, y:0, content:'REWARD PROGRAM', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(reward, { x:56, y:108, content:'회원 등급 시스템', size:48,
    family:'Playfair Display', style:'Bold', color:C.navy });
  await mkText(reward, { x:56, y:176, w:640,
    content:'공병을 반납할수록 등급이 올라가고, 더 많은 혜택이 주어집니다.',
    size:17, style:'Regular', color:C.muted });

  // 그리드 파라미터
  const BG = { x:56, y:228, gap:16, colW:417 }; // 3-col: (1328-32)/3 ≈ 432
  const colW = Math.floor((W - 112 - BG.gap * 2) / 3); // ~437
  const rowH1 = 220, rowH2 = 200;
  const row2Y = BG.y + rowH1 + BG.gap;

  // ① Seed — col1 row1
  const seedCard = mkFrame(reward, { x:BG.x, y:BG.y, w:colW, h:rowH1,
    fill:solid(C.white), radius:20, name:'tier-Seed' });
  seedCard.strokes = [{ type:'SOLID', color:C.navy, opacity:0.06 }];
  seedCard.strokeWeight = 1.5;
  await mkText(seedCard, { x:28, y:28, content:'🌱', size:36 });
  await mkText(seedCard, { x:28, y:78, content:'Seed', size:22,
    family:'Playfair Display', style:'Bold', color:C.navy });
  await mkText(seedCard, { x:28, y:110, content:'가입 회원', size:12,
    style:'Regular', color:C.muted });
  mkRect(seedCard, { x:28, y:136, w:32, h:2, fill:grad(C.pink, C.pink2, 0), radius:2 });
  await mkText(seedCard, { x:28, y:150, w:colW-56,
    content:'기본 포인트 적립\n회원 전용 뉴스레터', size:12, style:'Semi Bold', color:C.navy, lineH:20 });

  // ② Leaf — col2 row1
  const leafCard = mkFrame(reward, { x:BG.x + colW + BG.gap, y:BG.y, w:colW, h:rowH1,
    fill:solid(C.white), radius:20, name:'tier-Leaf' });
  leafCard.strokes = [{ type:'SOLID', color:C.navy, opacity:0.06 }];
  leafCard.strokeWeight = 1.5;
  await mkText(leafCard, { x:28, y:28, content:'🍃', size:36 });
  await mkText(leafCard, { x:28, y:78, content:'Leaf', size:22,
    family:'Playfair Display', style:'Bold', color:C.navy });
  await mkText(leafCard, { x:28, y:110, content:'공병 3개 반납', size:12,
    style:'Regular', color:C.muted });
  mkRect(leafCard, { x:28, y:136, w:32, h:2, fill:grad(C.pink, C.pink2, 0), radius:2 });
  await mkText(leafCard, { x:28, y:150, w:colW-56,
    content:'추가 포인트 +10%\n신제품 우선 구매', size:12, style:'Semi Bold', color:C.navy, lineH:20 });

  // ③ Tree (featured, tall — spans row1+row2) — col3
  const treeH = rowH1 + BG.gap + rowH2;
  const treeCard = mkFrame(reward, { x:BG.x + (colW + BG.gap)*2, y:BG.y, w:colW, h:treeH,
    fill:grad(C.navy, C.navyM, 160), radius:20, name:'tier-Tree ★' });
  mkRect(treeCard, { x:0, y:0, w:colW, h:treeH,
    fill: radGrad(0.1, 0.2, 0.8, 0.6, C.pink, 0.18, C.pink, 0),
    radius:20, name:'tree-glow' });
  // Most Popular badge
  const popularBadge = mkFrame(treeCard, { x:24, y:24, w:110, h:26,
    fill:solidA(C.pink, 0.2), radius:100, name:'popular-badge' });
  await mkText(popularBadge, { x:14, y:6, content:'Most Popular', size:10,
    style:'Bold', color:C.pink, letterSpacing:6 });
  await mkText(treeCard, { x:28, y:72, content:'🌳', size:44 });
  await mkText(treeCard, { x:0, y:132, w:colW, content:'Tree', size:26,
    family:'Playfair Display', style:'Bold', color:C.white, align:'CENTER' });
  await mkText(treeCard, { x:0, y:168, w:colW, content:'공병 7개 반납', size:12,
    style:'Regular', color:C.white, align:'CENTER', opacity:0.5 });
  mkRect(treeCard, { x:colW/2-20, y:198, w:40, h:2,
    fill:grad(C.pink, C.pink2, 0), radius:2 });
  await mkText(treeCard, { x:20, y:214, w:colW-40,
    content:'친환경 굿즈 제공\n포인트 +20%\n리필 할인 쿠폰', size:13,
    style:'Semi Bold', color:C.white, align:'CENTER', lineH:24 });

  // ④ Forest (wide — spans col1+col2, row2)
  const forestW = colW * 2 + BG.gap;
  const forestCard = mkFrame(reward, { x:BG.x, y:row2Y, w:forestW, h:rowH2,
    fill:solid(C.white), radius:20, name:'tier-Forest' });
  forestCard.strokes = [{ type:'SOLID', color:C.navy, opacity:0.06 }];
  forestCard.strokeWeight = 1.5;
  await mkText(forestCard, { x:28, y:32, content:'🌲', size:56 });
  await mkText(forestCard, { x:120, y:32, content:'Forest', size:28,
    family:'Playfair Display', style:'Bold', color:C.navy });
  await mkText(forestCard, { x:120, y:70, content:'공병 15개 이상', size:13,
    style:'Regular', color:C.muted });
  mkRect(forestCard, { x:120, y:98, w:32, h:2, fill:grad(C.pink, C.pink2, 0), radius:2 });
  await mkText(forestCard, { x:120, y:112, w:forestW-148,
    content:'리필 무료 혜택 · 한정 상품 우선 제공 · 앰배서더 자격', size:13,
    style:'Semi Bold', color:C.navy, lineH:22 });

  y += 680;

  // ── CAMPAIGN ────────────────────────────────────────────
  const camp = mkFrame(root, { x:0, y, w:W, h:600,
    fill:grad(C.pink, {r:0.878,g:0.094,b:0.416}, 135), name:'CAMPAIGN' });

  // 패턴 오버레이 (약한 노이즈 느낌)
  for (let pi=0; pi<6; pi++) {
    for (let pj=0; pj<3; pj++) {
      mkRect(camp, { x:pi*240, y:pj*200, w:4, h:4,
        fill:solidA(C.white, 0.04), radius:2, name:'pattern-dot' });
    }
  }

  const campLabel = mkFrame(camp, { x:56, y:80, w:200, h:20, name:'camp-label' });
  mkRect(campLabel, { x:0, y:8, w:24, h:1.5, fill:solidA(C.white, 0.5) });
  await mkText(campLabel, { x:32, y:0, content:'ESG CAMPAIGN', size:11,
    style:'Bold', color:C.white, letterSpacing:14, opacity:0.7 });
  await mkText(camp, { x:56, y:108, content:'함께 만드는\n지속가능한 변화', size:52,
    family:'Playfair Display', style:'Bold', color:C.white, lineH:58, w:580 });

  // 스탯 박스 (glassmorphism)
  const stats = [
    ['12,400+', '누적 공병 반납 수'], ['3,200+', '캠페인 참여 회원'],
    ['98%', '공병 재활용률'],         ['2.4t', '절감된 플라스틱'],
  ];
  const sGrid = mkFrame(camp, { x:56, y:368, w:560, h:180, name:'stats-grid' });
  for (let i=0; i<stats.length; i++) {
    const sx = (i%2) * 284, sy = Math.floor(i/2) * 90;
    const sb = mkFrame(sGrid, { x:sx, y:sy, w:264, h:76,
      fill:solidA(C.white, 0.12), radius:16, name:`stat-${stats[i][0]}`,
      stroke:[{ type:'SOLID', color:C.white, opacity:0.2 }], strokeW:1 });
    await mkText(sb, { x:24, y:12, content:stats[i][0], size:32,
      family:'Playfair Display', style:'Bold', color:C.white });
    await mkText(sb, { x:24, y:50, content:stats[i][1], size:12,
      style:'Regular', color:C.white, opacity:0.7, letterSpacing:4 });
  }

  // 화이트 캠페인 박스
  const campBox = mkFrame(camp, { x:730, y:60, w:654, h:480,
    fill:solid(C.white), radius:24, name:'camp-cta-box' });
  await mkText(campBox, { x:44, y:56, content:'공병 반납 챌린지에\n참여하세요', size:28,
    family:'Playfair Display', style:'Bold', color:C.navy, lineH:36, w:566 });
  await mkText(campBox, { x:44, y:162, w:566,
    content:'SNS에 #OBLIGE공병반납 태그와 함께 인증샷을 올리면\n특별 포인트와 굿즈를 드립니다.',
    size:14, style:'Regular', color:C.muted, lineH:24 });
  const campBtn = mkFrame(campBox, { x:44, y:280, w:200, h:52,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'camp-join-btn' });
  await mkText(campBtn, { x:32, y:14, content:'캠페인 참여하기', size:14, style:'Bold', color:C.white });
  // hashtag chips
  const tags = ['#OBLIGE공병반납','#비건코스메틱','#ESG'];
  let tagX = 44;
  for (const tag of tags) {
    const tw = tag.length * 9 + 28;
    const tf = mkFrame(campBox, { x:tagX, y:358, w:tw, h:34,
      fill:solid(C.off), radius:100, name:`tag-${tag}` });
    await mkText(tf, { x:12, y:8, content:tag, size:12, style:'Bold', color:C.muted });
    tagX += tw + 10;
  }

  y += 600;

  // ── CTA ────────────────────────────────────────────────
  const cta = mkFrame(root, { x:0, y, w:W, h:440,
    fill:grad(C.navyD, C.navy, 160), name:'CTA' });

  mkRect(cta, { x:W/2-300, y:-100, w:600, h:600,
    fill: radGrad(0, 0, 1, 1, C.pink, 0.15, C.pink, 0),
    name:'cta-glow' });

  const ctaLabel = mkFrame(cta, { x:W/2-100, y:80, w:200, h:20, name:'cta-label' });
  mkRect(ctaLabel, { x:0, y:8, w:24, h:1.5, fill:solid(C.pink) });
  await mkText(ctaLabel, { x:32, y:0, content:'JOIN OBLIGE', size:11,
    style:'Bold', color:C.pink, letterSpacing:14 });
  await mkText(cta, { x:0, y:112, w:W, content:'지금 시작하세요', size:64,
    family:'Playfair Display', style:'Bold', color:C.white, align:'CENTER' });
  await mkText(cta, { x:380, y:200, w:680,
    content:'비건 화장품을 구매하고, 공병을 반납하고, 포인트를 적립하세요.\nOBLIGE와 함께하는 책임 있는 아름다움이 시작됩니다.',
    size:17, style:'Regular', color:C.white, lineH:28, align:'CENTER', opacity:0.5 });

  const ctaBtn = mkFrame(cta, { x:W/2-110, y:296, w:220, h:56,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'cta-register-btn' });
  await mkText(ctaBtn, { x:44, y:17, content:'회원가입 하기', size:14, style:'Bold', color:C.white });
  mkRect(ctaBtn, { x:0, y:0, w:220, h:28, fill:solidA(C.white, 0.08), radius:100, name:'btn-highlight' });

  const ctaBtn2 = mkFrame(cta, { x:W/2+126, y:296, w:188, h:56,
    fill:solidA(C.white, 0.08), radius:100, name:'cta-return-btn',
    stroke:[{ type:'SOLID', color:C.white, opacity:0.2 }], strokeW:1.5 });
  await mkText(ctaBtn2, { x:28, y:17, content:'공병 반납 신청', size:14, style:'Bold', color:C.white });

  y += 440;

  // ── FOOTER ───────────────────────────────────────────────
  const footer = mkFrame(root, { x:0, y, w:W, h:280,
    fill:solid(C.navyD), name:'FOOTER' });

  mkLogoMark(footer, { x:56, y:62, size:30, name:'footer-mark' });
  await mkText(footer, { x:96, y:64, content:'OBLIGE', size:28,
    family:'Playfair Display', style:'Bold', color:C.pink });
  await mkText(footer, { x:56, y:104, w:260,
    content:'비건 화장품 구매부터 공병 반납, 포인트 적립,\n리필 보상까지 연결하는 ESG 코스메틱 플랫폼.',
    size:13, style:'Regular', color:C.white, lineH:22, opacity:0.35 });

  const footCols = [
    ['Brand',['브랜드 소개','ESG 순환 시스템','캠페인']],
    ['Product',['토너 / 앰플 / 크림','리필상품','굿즈']],
    ['Recycle & Reward',['공병 반납 신청','포인트 / 등급','마이페이지']],
  ];
  let fcx = 440;
  for (const [title, items] of footCols) {
    await mkText(footer, { x:fcx, y:64, content:title.toUpperCase(), size:10,
      style:'Bold', color:C.white, opacity:0.3, letterSpacing:14 });
    for (let fi=0; fi<items.length; fi++) {
      await mkText(footer, { x:fcx, y:96 + fi*26, content:items[fi], size:14,
        style:'Regular', color:C.white, opacity:0.5 });
    }
    fcx += 260;
  }

  mkRect(footer, { x:56, y:216, w:W-112, h:1, fill:solidA(C.white, 0.06) });
  await mkText(footer, { x:56, y:232, content:'© 2026 OBLIGE. All rights reserved. Responsible Beauty.',
    size:12, style:'Regular', color:C.white, opacity:0.2 });

  const ftags = ['Vegan','ESG','Cruelty Free','Refillable'];
  let ftx = W - 56;
  const ftagsRev = ftags.slice().reverse();
  for (const ft of ftagsRev) {
    const ftw = ft.length * 7 + 28;
    ftx -= ftw + 8;
    const ftf = mkFrame(footer, { x:ftx, y:228, w:ftw, h:28,
      fill:[], radius:100, name:`ftag-${ft}`,
      stroke:[{ type:'SOLID', color:C.white, opacity:0.1 }], strokeW:1 });
    await mkText(ftf, { x:10, y:6, content:ft.toUpperCase(), size:10,
      style:'Bold', color:C.white, opacity:0.3, letterSpacing:8 });
  }

  root.resize(W, y + 280 + 80);
  return root;
}

// ══════════════════════════════════════════════════════════
// 어드민 대시보드
// ══════════════════════════════════════════════════════════
async function buildAdminPage() {
  const W = 1440;

  const root = mkFrame(null, { x:1600, y:0, w:W, h:960,
    fill:solid(C.bg), name:'🛠️ OBLIGE — 관리자 대시보드' });
  figma.currentPage.appendChild(root);

  // 사이드바
  const sidebar = mkFrame(root, { x:0, y:0, w:240, h:960,
    fill:solid(C.navy), name:'sidebar' });
  mkRect(sidebar, { x:0, y:0, w:240, h:960,
    fill:grad(C.navyD, C.navy, 180), opacity:0.8, name:'sidebar-grad' });

  await mkText(sidebar, { x:24, y:28, content:'OBLIGE', size:20,
    family:'Playfair Display', style:'Bold', color:C.pink });
  await mkText(sidebar, { x:24, y:56, content:'ADMIN DASHBOARD', size:9,
    style:'Bold', color:C.white, opacity:0.4, letterSpacing:14 });

  const navItems = [
    ['📊','대시보드',true],['👥','회원 관리',false],['🌿','상품 관리',false],
    ['📦','주문 관리',false],['♻️','공병 반납 관리',false],['📣','캠페인 관리',false],['🌍','ESG 통계',false],
  ];
  for (let i=0; i<navItems.length; i++) {
    const [icon, label, active] = navItems[i];
    const itemBg = mkFrame(sidebar, { x:12, y:112 + i*52, w:216, h:42,
      fill: active ? solidA(C.pink, 0.9) : [],
      radius:12, name:`nav-${label}` });
    if (active) {
      mkRect(itemBg, { x:0, y:0, w:216, h:42,
        fill:solidA(C.white, 0.08), radius:12, name:'active-overlay' });
    }
    await mkText(itemBg, { x:14, y:11, content:`${icon} ${label}`, size:13,
      style: active ? 'Bold' : 'Regular',
      color: active ? C.white : C.white, opacity: active ? 1 : 0.5 });
  }

  // 메인
  const main = mkFrame(root, { x:240, y:0, w:1200, h:960,
    fill:solid(C.bg), name:'main-content' });

  // 헤더
  await mkText(main, { x:40, y:36, content:'대시보드', size:24,
    style:'Extra Bold', color:C.navy });
  await mkText(main, { x:40, y:68, content:'OBLIGE ESG 플랫폼 현황', size:13,
    style:'Regular', color:C.muted });

  // 관리자 정보
  const adminInfo = mkFrame(main, { x:1000, y:28, w:160, h:44,
    fill:solid(C.navy), radius:100, name:'admin-info' });
  await mkText(adminInfo, { x:20, y:12, content:'👤 관리자', size:13,
    style:'Bold', color:C.white });

  // 스탯 카드
  const stats = [
    { label:'총 회원 수',       value:'1,256', sub:'오늘 신규 3명',   accent:C.pink },
    { label:'총 주문 수',       value:'2,847', sub:'매출 ₩89,200,000', accent:{r:0.231,g:0.510,b:0.965} },
    { label:'승인된 공병 반납', value:'1,247', sub:'총 3,120개 수거',  accent:C.success },
    { label:'검수 대기',        value:'5',    sub:'즉시 처리 필요',   accent:{r:0.961,g:0.620,b:0.043} },
  ];

  for (let i=0; i<stats.length; i++) {
    const s = stats[i];
    const sc = mkFrame(main, { x:40 + i*284, y:112, w:264, h:128,
      fill:solid(C.white), radius:20, name:`stat-${s.label}` });
    // accent bar
    mkRect(sc, { x:0, y:0, w:264, h:4, fill:solid(s.accent), radius:20, name:'accent-bar' });
    mkRect(sc, { x:0, y:4, w:264, h:4, fill:solid(s.accent), name:'accent-fix' });
    await mkText(sc, { x:24, y:24, content:s.label, size:12, style:'Bold', color:C.muted });
    await mkText(sc, { x:24, y:46, content:s.value, size:36, style:'Extra Bold', color:C.navy });
    await mkText(sc, { x:24, y:94, content:s.sub, size:12, style:'Semi Bold', color:s.accent });
  }

  // 최근 주문 테이블
  const table = mkFrame(main, { x:40, y:272, w:1120, h:380,
    fill:solid(C.white), radius:20, name:'table-주문목록' });
  await mkText(table, { x:28, y:28, content:'최근 주문', size:16,
    style:'Extra Bold', color:C.navy });

  const headers = ['주문번호','회원명','금액','상태','주문일'];
  const hW = [320, 120, 140, 140, 120];
  let hx = 28;
  for (let i=0; i<headers.length; i++) {
    await mkText(table, { x:hx, y:72, content:headers[i], size:11,
      style:'Bold', color:C.muted });
    hx += hW[i];
  }
  mkRect(table, { x:0, y:92, w:1120, h:1, fill:solidA(C.navy, 0.06) });

  const orders = [
    ['ORD-20260601-0001','김지현','₩83,000','배송중','2026-06-01'],
    ['ORD-20260601-0002','박민준','₩45,000','배송완료','2026-06-01'],
    ['ORD-20260602-0003','이수아','₩122,000','결제완료','2026-06-02'],
    ['ORD-20260602-0004','최동훈','₩38,000','주문접수','2026-06-02'],
    ['ORD-20260602-0005','정하늘','₩67,000','취소','2026-06-02'],
  ];
  const sPillColor = {
    '배송중':   {bg:{r:0.82,g:0.96,b:0.89}, tx:C.success},
    '배송완료': {bg:{r:0.82,g:0.96,b:0.89}, tx:C.success},
    '결제완료': {bg:{r:0.82,g:0.89,b:0.99}, tx:{r:0.12,g:0.35,b:0.87}},
    '주문접수': {bg:{r:0.99,g:0.95,b:0.82}, tx:{r:0.58,g:0.39,b:0.04}},
    '취소':     {bg:{r:0.99,g:0.88,b:0.88}, tx:{r:0.62,g:0.11,b:0.11}},
  };
  for (let i=0; i<orders.length; i++) {
    const o = orders[i];
    const oy = 104 + i*52;
    mkRect(table, { x:0, y:oy+50, w:1120, h:1, fill:solidA(C.navy, 0.04) });
    let ox = 28;
    for (let j=0; j<o.length; j++) {
      if (j===3) {
        const sp = sPillColor[o[j]] || { bg:C.light, tx:C.navy };
        const pw = o[j].length*10+24;
        const pill = mkFrame(table, { x:ox, y:oy+10, w:pw, h:28,
          fill:solid(sp.bg), radius:100, name:`status-pill-${i}` });
        await mkText(pill, { x:10, y:6, content:o[j], size:11, style:'Bold', color:sp.tx });
      } else {
        await mkText(table, { x:ox, y:oy+14, content:o[j], size:13,
          style: j===0?'Bold':'Regular', color:C.navy });
      }
      ox += hW[j];
    }
  }

  // ESG 카드
  const esg = mkFrame(main, { x:40, y:672, w:540, h:248,
    fill:grad(C.navy, C.navyM, 135), radius:20, name:'esg-card' });
  mkRect(esg, { x:0, y:0, w:540, h:248,
    fill: radGrad(0.1, 0.3, 0.8, 0.6, C.pink, 0.2, C.pink, 0),
    radius:20, name:'esg-glow' });
  await mkText(esg, { x:28, y:28, content:'🌍 ESG 영향 지표', size:15,
    style:'Extra Bold', color:C.white });
  const esgItems = [
    ['총 절감 플라스틱', '62.2 kg'],
    ['CO₂ 절감량', '149.4 kg'],
    ['총 반납 공병', '1,244 개'],
  ];
  for (let i=0; i<esgItems.length; i++) {
    const ey = 72 + i*56;
    await mkText(esg, { x:28, y:ey, content:esgItems[i][0], size:12,
      style:'Regular', color:C.white, opacity:0.5 });
    await mkText(esg, { x:28, y:ey+18, content:esgItems[i][1], size:20,
      style:'Extra Bold', color:C.white });
    mkRect(esg, { x:28, y:ey+44, w:480, h:4,
      fill:solidA(C.white, 0.08), radius:100, name:'esg-bar-bg' });
    const barW = [200, 280, 320][i];
    mkRect(esg, { x:28, y:ey+44, w:barW, h:4,
      fill:grad(C.pink, C.pink2, 0), radius:100, name:'esg-bar-fill' });
  }

  // 공병 반납 현황
  const ret = mkFrame(main, { x:600, y:672, w:560, h:248,
    fill:solid(C.white), radius:20, name:'return-status-card' });
  await mkText(ret, { x:28, y:28, content:'♻️ 공병 반납 현황', size:15,
    style:'Extra Bold', color:C.navy });
  const retItems = [
    ['검수 대기', '5', {r:0.961,g:0.620,b:0.043}],
    ['검수 중', '3', {r:0.231,g:0.510,b:0.965}],
    ['승인 완료', '1,244', C.success],
    ['반려', '12', {r:0.961,g:0.243,b:0.243}],
  ];
  for (let i=0; i<retItems.length; i++) {
    const rx = 28 + (i%2)*264, ry = 76 + Math.floor(i/2)*88;
    const rb = mkFrame(ret, { x:rx, y:ry, w:244, h:72,
      fill:solid(C.bg), radius:16, name:`ret-${retItems[i][0]}` });
    await mkText(rb, { x:20, y:14, content:retItems[i][0], size:12,
      style:'Bold', color:C.muted });
    await mkText(rb, { x:20, y:34, content:retItems[i][1], size:22,
      style:'Extra Bold', color:retItems[i][2] });
  }

  return root;
}

// ══════════════════════════════════════════════════════════
// 모바일 프레임 (375px)
// ══════════════════════════════════════════════════════════
async function buildMobilePage() {
  const MW = 375;
  let my = 0;
  const root = mkFrame(null, { x:1600, y:0, w:MW, h:5400,
    fill:solid(C.white), name:'📱 OBLIGE — 모바일 (375px)' });
  figma.currentPage.appendChild(root);

  // ── MOBILE NAV ──
  const nav = mkFrame(root, { x:0, y:0, w:MW, h:60,
    fill:solidA(C.white, 0.92), name:'M-NAV' });
  mkRect(nav, { x:0, y:59, w:MW, h:1, fill:solidA(C.navy, 0.06) });
  const logoF = mkFrame(nav, { x:16, y:16, w:100, h:28, name:'m-logo' });
  mkLogoMark(logoF, { x:0, y:2, size:22 });
  await mkText(logoF, { x:30, y:1, content:'OBLI', size:18, style:'Extra Bold', color:C.navy });
  await mkText(logoF, { x:75, y:1, content:'GE', size:18, style:'Extra Bold', color:C.pink });
  // 햄버거
  const hamBtn = mkFrame(nav, { x:MW-52, y:12, w:36, h:36,
    fill:[], radius:8, name:'hamburger-btn' });
  for (let i=0; i<3; i++) {
    mkRect(hamBtn, { x:6, y:8+i*9, w:24, h:2.5,
      fill:solid(C.navy), radius:2, name:`ham-line-${i}` });
  }
  my = 60;

  // ── MOBILE HERO ──
  const hero = mkFrame(root, { x:0, y:my, w:MW, h:680,
    fill:solid(C.navy), name:'M-HERO' });
  mkRect(hero, { x:0, y:0, w:MW, h:680,
    fill: radGrad(0.8, 0.1, 0.8, 0.6, C.pink, 0.22, C.pink, 0), name:'m-hero-glow' });
  mkCircle(hero, { x:MW-160, y:-60, d:280,
    fill: radGrad(0, 0, 1, 1, C.pink, 1, C.pink, 0), opacity:0.28 });
  // badge
  const mBadge = mkFrame(hero, { x:16, y:64, w:250, h:32,
    fill:solidA(C.pink, 0.08), radius:100, name:'m-hero-badge',
    stroke:[{ type:'SOLID', color:C.pink, opacity:0.35 }], strokeW:1 });
  await mkText(mBadge, { x:12, y:8, content:'● VEGAN · ESG COSMETICS',
    size:9, style:'Bold', color:C.pink, letterSpacing:8 });
  await mkText(hero, { x:16, y:110, content:'Return\nBeauty,', size:52,
    family:'Playfair Display', style:'Bold', color:C.white, lineH:52, name:'m-hero-t1' });
  await mkText(hero, { x:16, y:220, content:'Refill Value.', size:52,
    family:'Playfair Display', style:'Bold', color:C.pink, lineH:52, name:'m-hero-t2' });
  await mkText(hero, { x:16, y:288, w:MW-32,
    content:'공병을 반납하고, 지속가능한 아름다움을 채우다.',
    size:14, style:'Regular', color:C.white, lineH:22, opacity:0.55 });
  // 버튼
  const mBtn1 = mkFrame(hero, { x:16, y:352, w:MW-32, h:52,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'m-btn-primary' });
  await mkText(mBtn1, { x:0, y:15, w:MW-32, content:'공병 반납하기',
    size:14, style:'Bold', color:C.white, align:'CENTER' });
  const mBtn2 = mkFrame(hero, { x:16, y:416, w:MW-32, h:52,
    fill:solidA(C.white, 0.06), radius:100, name:'m-btn-outline',
    stroke:[{ type:'SOLID', color:C.white, opacity:0.25 }], strokeW:1.5 });
  await mkText(mBtn2, { x:0, y:15, w:MW-32, content:'비건 제품 보러가기',
    size:14, style:'Bold', color:C.white, align:'CENTER' });
  my += 680;

  // ── MOBILE MARQUEE ──
  const mmq = mkFrame(root, { x:0, y:my, w:MW, h:64, fill:solid(C.navy), name:'M-MARQUEE' });
  mkRect(mmq, { x:0, y:0, w:MW, h:1, fill:solidA(C.white, 0.06) });
  mkRect(mmq, { x:0, y:63, w:MW, h:1, fill:solidA(C.white, 0.06) });
  const mItems2 = ['Vegan Beauty','Zero Waste','Circular ESG','Cruelty Free'];
  let mmx = 16;
  for (const item of mItems2) {
    await mkText(mmq, { x:mmx, y:18, content:item, size:18,
      family:'Playfair Display', style:'Bold', color:C.white, opacity:0.8 });
    mmx += item.length * 11 + 24;
    const dot2 = figma.createEllipse();
    dot2.resize(6,6); dot2.x=mmx; dot2.y=29; dot2.fills=grad(C.pink,C.pink2,135);
    mmq.appendChild(dot2); mmx += 22;
  }
  my += 64;

  // ── MOBILE BRAND ──
  const mbrand = mkFrame(root, { x:0, y:my, w:MW, h:460, fill:solid(C.off), name:'M-BRAND' });
  const mbLabel = mkFrame(mbrand, { x:16, y:40, w:180, h:20, name:'m-brand-label' });
  mkRect(mbLabel, { x:0, y:8, w:20, h:1.5, fill:solid(C.pink) });
  await mkText(mbLabel, { x:28, y:0, content:'BRAND STORY', size:10, style:'Bold', color:C.pink, letterSpacing:12 });
  await mkText(mbrand, { x:16, y:68, content:'책임 있는\n아름다움을\n제안하다', size:34,
    family:'Playfair Display', style:'Bold', color:C.navy, lineH:38 });
  await mkText(mbrand, { x:16, y:202, w:MW-32,
    content:'OBLIGE는 사회적 책임과 지속가능한 소비를 의미하는 브랜드입니다. 화장품 공병을 회수·재사이클링하는 친환경 비건 코스메틱 플랫폼.',
    size:14, style:'Regular', color:C.muted, lineH:22 });
  const mChips = ['Clean','Vegan','Refill'];
  let mcx = 16;
  for (const chip of mChips) {
    const mcw = chip.length * 8 + 36;
    const mcf = mkFrame(mbrand, { x:mcx, y:340, w:mcw, h:34,
      fill:[], radius:100, name:`m-chip-${chip}`,
      stroke:[{ type:'SOLID', color:C.navy, opacity:0.2 }], strokeW:1.5 });
    await mkText(mcf, { x:12, y:9, content:chip.toUpperCase(), size:10,
      style:'Bold', color:C.navy, letterSpacing:8 });
    mcx += mcw + 8;
  }
  my += 460;

  // ── MOBILE PROBLEM BENTO ──
  const mprob = mkFrame(root, { x:0, y:my, w:MW, h:740, fill:solid(C.white), name:'M-PROBLEM (Bento)' });
  const mpLabel = mkFrame(mprob, { x:16, y:40, w:180, h:20, name:'mp-label' });
  mkRect(mpLabel, { x:0, y:8, w:20, h:1.5, fill:solid(C.pink) });
  await mkText(mpLabel, { x:28, y:0, content:'WHY OBLIGE', size:10, style:'Bold', color:C.pink, letterSpacing:12 });
  await mkText(mprob, { x:16, y:68, content:'우리가 바꾸고자\n하는 문제', size:28,
    family:'Playfair Display', style:'Bold', color:C.navy, lineH:34 });

  const mpCards = [
    { stat:'140억+', statLabel:'매년 버려지는 화장품 용기', emoji:'🧴', title:'플라스틱 용기 증가',
      desc:'매년 수십억 개의 용기가 환경에 버려집니다.', navy:true },
    { emoji:'📦', title:'과대포장 · 단기 소비',
      desc:'불필요한 패키징이 폐기물을 가속화합니다.', navy:false },
    { emoji:'♻️', title:'복합 소재 재활용 어려움',
      desc:'결합 소재 용기는 일반 재활용에서 걸러지지 않습니다.', navy:false },
    { stat:'72%', statLabel:'동물 유래 원료 사용 비율', emoji:'🌱', title:'원료 · 생산 환경 부담',
      desc:'동물 성분과 화학 원료의 생태계 영향을 줄여야 합니다.', navy:true },
  ];
  let mpy = 152;
  for (const pc of mpCards) {
    const mpcH = pc.navy ? 148 : 120;
    const mpc = mkFrame(mprob, { x:16, y:mpy, w:MW-32, h:mpcH,
      fill: pc.navy ? grad(C.navy, C.navyM, 135) : solid(C.light),
      radius:16, name:`m-prob-${pc.title}` });
    if (pc.navy) {
      mkRect(mpc, { x:0, y:0, w:MW-32, h:mpcH,
        fill: radGrad(0.1, 0.3, 0.8, 0.6, C.pink, 0.15, C.pink, 0),
        radius:16, name:'mp-glow' });
      await mkText(mpc, { x:20, y:14, content:pc.stat, size:28,
        family:'Playfair Display', style:'Bold', color:C.pink });
      await mkText(mpc, { x:20, y:48, content:pc.statLabel, size:10,
        style:'Bold', color:C.pink, letterSpacing:6, opacity:0.8 });
      await mkText(mpc, { x:20, y:70, content:pc.emoji, size:20 });
      await mkText(mpc, { x:20, y:96, content:pc.title, size:13,
        style:'Extra Bold', color:C.white });
      await mkText(mpc, { x:20, y:116, w:MW-72, content:pc.desc, size:11,
        style:'Regular', color:C.white, lineH:16, opacity:0.55 });
    } else {
      await mkText(mpc, { x:20, y:16, content:pc.emoji, size:24 });
      await mkText(mpc, { x:20, y:50, content:pc.title, size:13,
        style:'Extra Bold', color:C.navy });
      await mkText(mpc, { x:20, y:72, w:MW-72, content:pc.desc, size:11,
        style:'Regular', color:C.muted, lineH:16 });
    }
    mpy += mpcH + 12;
  }
  my += 740;

  // ── MOBILE REWARD BENTO ──
  const mrw = mkFrame(root, { x:0, y:my, w:MW, h:780, fill:solid(C.off), name:'M-REWARD (Bento)' });
  const mrwLabel = mkFrame(mrw, { x:16, y:40, w:200, h:20, name:'mrw-label' });
  mkRect(mrwLabel, { x:0, y:8, w:20, h:1.5, fill:solid(C.pink) });
  await mkText(mrwLabel, { x:28, y:0, content:'REWARD PROGRAM', size:10, style:'Bold', color:C.pink, letterSpacing:12 });
  await mkText(mrw, { x:16, y:68, content:'회원 등급 시스템', size:28,
    family:'Playfair Display', style:'Bold', color:C.navy });

  const mTiers = [
    { icon:'🌱', name:'Seed', cond:'가입 회원', benefit:'기본 포인트 적립 · 뉴스레터', featured:false },
    { icon:'🍃', name:'Leaf', cond:'공병 3개 반납', benefit:'포인트 +10% · 신제품 우선 구매', featured:false },
    { icon:'🌳', name:'Tree ★', cond:'공병 7개 반납', benefit:'굿즈 제공 · 포인트 +20% · 리필 쿠폰', featured:true },
    { icon:'🌲', name:'Forest', cond:'공병 15개 이상', benefit:'리필 무료 · 한정 상품 · 앰배서더', featured:false },
  ];
  let mty = 120;
  for (const mt of mTiers) {
    const mth = mt.featured ? 148 : 112;
    const mtc = mkFrame(mrw, { x:16, y:mty, w:MW-32, h:mth,
      fill: mt.featured ? grad(C.navy, C.navyM, 160) : solid(C.white),
      radius:16, name:`m-tier-${mt.name}` });
    if (!mt.featured) {
      mtc.strokes = [{ type:'SOLID', color:C.navy, opacity:0.06 }];
      mtc.strokeWeight = 1.5;
    } else {
      mkRect(mtc, { x:0, y:0, w:MW-32, h:mth,
        fill: radGrad(0.1, 0.2, 0.8, 0.6, C.pink, 0.15, C.pink, 0),
        radius:16, name:'mt-glow' });
      const popB = mkFrame(mtc, { x:20, y:16, w:100, h:24,
        fill:solidA(C.pink, 0.2), radius:100, name:'popular' });
      await mkText(popB, { x:12, y:5, content:'Most Popular', size:9, style:'Bold', color:C.pink, letterSpacing:4 });
    }
    const tc2 = mt.featured ? C.white : C.navy;
    const mc2 = mt.featured ? C.white : C.muted;
    const toff = mt.featured ? 48 : 16;
    await mkText(mtc, { x:20, y:toff, content:mt.icon, size:28 });
    await mkText(mtc, { x:64, y:toff+2, content:mt.name, size:18,
      family:'Playfair Display', style:'Bold', color:tc2 });
    await mkText(mtc, { x:64, y:toff+28, content:mt.cond, size:11,
      style:'Regular', color:mc2, opacity:0.6 });
    mkRect(mtc, { x:20, y:toff+52, w:28, h:2, fill:grad(C.pink, C.pink2, 0), radius:2 });
    await mkText(mtc, { x:20, y:toff+64, w:MW-72, content:mt.benefit, size:12,
      style:'Semi Bold', color:tc2, lineH:18 });
    mty += mth + 12;
  }
  my += 780;

  // 모바일 푸터
  const mfooter = mkFrame(root, { x:0, y:my, w:MW, h:240, fill:solid(C.navyD), name:'M-FOOTER' });
  mkLogoMark(mfooter, { x:16, y:36, size:24 });
  await mkText(mfooter, { x:48, y:38, content:'OBLIGE', size:20,
    family:'Playfair Display', style:'Bold', color:C.pink });
  await mkText(mfooter, { x:16, y:76, w:MW-32,
    content:'비건 화장품 구매부터 공병 반납, ESG까지\n연결하는 코스메틱 플랫폼.',
    size:12, style:'Regular', color:C.white, lineH:19, opacity:0.35 });
  mkRect(mfooter, { x:16, y:140, w:MW-32, h:1, fill:solidA(C.white, 0.06) });
  await mkText(mfooter, { x:0, y:160, w:MW,
    content:'© 2026 OBLIGE. All rights reserved.', size:11,
    style:'Regular', color:C.white, align:'CENTER', opacity:0.2 });
  const mFtags = ['VEGAN','ESG','CRUELTY FREE'];
  let mftx = MW/2 - 130;
  for (const ft of mFtags) {
    const ftw = ft.length * 7 + 24;
    const ftf = mkFrame(mfooter, { x:mftx, y:188, w:ftw, h:26,
      fill:[], radius:100, name:`mftag-${ft}`,
      stroke:[{ type:'SOLID', color:C.white, opacity:0.1 }], strokeW:1 });
    await mkText(ftf, { x:8, y:6, content:ft, size:9, style:'Bold',
      color:C.white, opacity:0.3, letterSpacing:6 });
    mftx += ftw + 8;
  }

  root.resize(MW, my + 240 + 40);
  return root;
}

// ── 모달 컴포넌트 (참고용) ───────────────────────────────
async function buildComponents() {
  const W = 480;

  const loginModal = mkFrame(null, { x:3200, y:0, w:W, h:540,
    fill:solid(C.white), radius:24, name:'🧩 컴포넌트 — 로그인 모달' });
  figma.currentPage.appendChild(loginModal);

  // 헤더
  await mkText(loginModal, { x:40, y:40, content:'OBLI', size:20,
    style:'Extra Bold', color:C.navy });
  await mkText(loginModal, { x:96, y:40, content:'GE', size:20,
    style:'Extra Bold', color:C.pink });

  // 탭
  const tabLine = mkRect(loginModal, { x:0, y:100, w:W, h:2, fill:solid(C.light) });
  const activeTab = mkFrame(loginModal, { x:0, y:72, w:240, h:30, name:'tab-login' });
  await mkText(activeTab, { x:80, y:4, content:'로그인', size:14, style:'Bold', color:C.pink, align:'CENTER' });
  mkRect(loginModal, { x:0, y:99, w:240, h:2.5, fill:solid(C.pink) });
  const inactiveTab = mkFrame(loginModal, { x:240, y:72, w:240, h:30, name:'tab-register' });
  await mkText(inactiveTab, { x:80, y:4, content:'회원가입', size:14, style:'Regular', color:C.muted, align:'CENTER' });

  // 입력 필드
  const fields = [['이메일', 'your@email.com'], ['비밀번호', '••••••••']];
  for (let i=0; i<fields.length; i++) {
    const fy = 128 + i*88;
    await mkText(loginModal, { x:40, y:fy, content:fields[i][0], size:11,
      style:'Bold', color:C.navy, letterSpacing:6 });
    const input = mkFrame(loginModal, { x:40, y:fy+20, w:400, h:48,
      fill:solid(C.off), radius:12, name:`input-${fields[i][0]}`,
      stroke:[{ type:'SOLID', color:C.navy, opacity:0.1 }], strokeW:1.5 });
    await mkText(input, { x:18, y:14, content:fields[i][1], size:14,
      style:'Regular', color:C.muted });
  }

  // 버튼
  const authBtn = mkFrame(loginModal, { x:40, y:320, w:400, h:52,
    fill:grad(C.pink, C.pink2, 135), radius:100, name:'auth-submit-btn' });
  await mkText(authBtn, { x:0, y:15, w:400, content:'로그인', size:15,
    style:'Bold', color:C.white, align:'CENTER' });

  await mkText(loginModal, { x:0, y:400, w:W, content:'또는 소셜 로그인', size:12,
    style:'Regular', color:C.muted, align:'CENTER' });

  return loginModal;
}

// ── 실행 ────────────────────────────────────────────────
(async () => {
  figma.showUI(__html__, { width:440, height:340 });

  try {
    figma.ui.postMessage({ type:'progress', key:'colors', msg:'컬러 & 폰트 스타일 생성 중...' });
    await createColorStyles();

    figma.ui.postMessage({ type:'progress', key:'main', msg:'메인 페이지 생성 중... (Bento Grid 포함)' });
    const mainFrame = await buildMainPage();

    figma.ui.postMessage({ type:'progress', key:'mobile', msg:'모바일 프레임 생성 중... (375px)' });
    await buildMobilePage();

    figma.ui.postMessage({ type:'progress', key:'admin', msg:'관리자 대시보드 & 컴포넌트 생성 중...' });
    await buildAdminPage();
    await buildComponents();

    figma.viewport.scrollAndZoomIntoView([mainFrame]);
    figma.ui.postMessage({ type:'done' });
  } catch(err) {
    figma.ui.postMessage({ type:'error', msg:err.message });
  }
})();
