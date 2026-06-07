/**
 * OBLIGE — Supabase 클라이언트 + apiCall 호환 레이어
 * index.html / admin.html 에서 기존 fetch 기반 apiCall 을 대체합니다.
 */
(function () {
  'use strict';

  /* ── 클라이언트 초기화 ────────────────────────────────── */
  const cfg = window.OBLIGE_CONFIG || {};
  const SB_URL = cfg.SUPABASE_URL;
  const SB_KEY = cfg.SUPABASE_ANON_KEY;

  if (!SB_URL || SB_URL === 'REPLACE_SUPABASE_URL') {
    console.warn('[OBLIGE] Supabase URL이 설정되지 않았습니다. js/config.js를 확인하세요.');
  }

  const { createClient } = window.supabase;
  const sb = createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window._sb = sb; // 디버깅용 전역 노출

  /* ── 세션 캐시 ───────────────────────────────────────── */
  let _session = null;
  sb.auth.getSession().then(({ data }) => { _session = data.session; });
  sb.auth.onAuthStateChange((_e, s) => { _session = s; });

  /* ================================================================
     공개 apiCall — 기존 fetch 기반과 동일 시그니처
  ================================================================ */
  window.apiCall = async function apiCall(method, path, body = null) {
    try {
      return await _dispatch(method, path.replace(/^\//, ''), body);
    } catch (e) {
      console.error('[apiCall]', method, path, e.message);
      return { error: e.message };
    }
  };

  /* ── 라우터 ──────────────────────────────────────────── */
  async function _dispatch(method, path, body) {
    const seg  = path.split('/');
    const r    = seg[0];
    const id   = seg[1] && !isNaN(seg[1]) ? +seg[1] : null;
    // sub: ID 뒤의 액션 또는 리소스 바로 뒤 (예: /auth/login → sub='login')
    const sub  = id !== null ? seg[2] : seg[1];
    const subId = seg[3] && !isNaN(seg[3]) ? +seg[3] : null;
    const subSub = seg[4] || null;

    /* AUTH */
    if (r === 'auth') {
      if (sub === 'login')    return _login(body);
      if (sub === 'register') return _register(body);
      if (sub === 'logout')   return _logout();
      if (sub === 'me')       return _me();
    }

    /* USER */
    if (r === 'user') {
      if (sub === 'me' || sub === 'mypage') return _me();
      if (sub === 'points') return _getPointLogs();
    }

    /* PRODUCTS (공개 읽기 + 관리자 쓰기) */
    if (r === 'products') {
      if (method === 'GET'    && !id)                                    return _listProducts();
      if (method === 'GET'    &&  id && !sub)                            return _getProduct(id);
      if (method === 'POST'   && !id)                                    return _createProduct(body);
      if (method === 'PUT'    &&  id && !sub)                            return _updateProduct(id, body);
      if (method === 'DELETE' &&  id && !sub)                            return _deleteProduct(id);
      if (method === 'DELETE' &&  id && sub === 'images' && subId)       return _deleteImage(id, subId);
      if (method === 'PATCH'  &&  id && sub === 'images' && subSub === 'main') return _setMainImage(id, subId);
    }

    /* CART */
    if (r === 'cart') {
      if (method === 'GET')                    return _getCart();
      if (method === 'POST')                   return _addToCart(body);
      if (method === 'PATCH'  && id)           return _updateCart(id, body);
      if (method === 'DELETE' && id)           return _removeFromCart(id);
      if (method === 'DELETE' && !id)          return _clearCart();
    }

    /* ORDERS */
    if (r === 'orders') {
      if (method === 'GET')                      return _listOrders();
      if (method === 'POST' && !id)              return _createOrder(body);
      if (method === 'PATCH' && sub === 'cancel') return _cancelOrder(id);
    }

    /* RETURNS (공용 + 관리자) */
    if (r === 'returns') {
      if (method === 'GET')                         return _listReturns();
      if (method === 'POST' && !id)                 return _submitReturn(body);
      if (method === 'PATCH' && sub === 'approve')  return _approveReturn(id, body);
      if (method === 'PATCH' && sub === 'reject')   return _rejectReturn(id, body);
      if (method === 'PATCH' && sub === 'status')   return _updateReturnStatus(id, body);
    }

    /* REFILL */
    if (r === 'refill' && method === 'POST') return _submitRefill(body);

    /* CAMPAIGNS */
    if (r === 'campaigns') {
      if (method === 'GET')                           return _listCampaigns();
      if (method === 'POST' && !id)                   return _createCampaign(body);
      if (method === 'POST' && id && sub === 'join')  return _joinCampaign(id, body);
    }

    /* ADMIN */
    if (r === 'admin') {
      const aSub    = seg[1]; // dashboard | orders | users | returns
      const aId     = seg[2] && !isNaN(seg[2]) ? +seg[2] : null;
      const aAction = aId ? seg[3] : seg[2]; // status / approve 등
      if (aSub === 'dashboard')                          return _adminDashboard();
      if (aSub === 'orders' && method === 'GET')         return _adminListOrders();
      if (aSub === 'orders' && method === 'PATCH')       return _adminUpdateOrder(aId, body);
      if (aSub === 'users'  && method === 'GET')         return _adminListUsers();
      if (aSub === 'users'  && method === 'PATCH')       return _adminUpdateUser(aId, body);
      if (aSub === 'returns' && method === 'GET')        return _adminListReturns();
    }

    console.warn('[apiCall] 처리되지 않은 경로:', method, path);
    return { error: 'Not implemented: ' + path };
  }

  /* ================================================================
     AUTH
  ================================================================ */
  async function _login({ email, password }) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const profile = await _fetchProfile(data.user.id);
    const user = _normalizeProfile(data.user, profile);
    return { token: data.session.access_token, user };
  }

  async function _register({ name, email, password }) {
    const { data, error } = await sb.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) return { error: error.message };
    // 트리거가 profiles 행을 자동 생성
    return { message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.' };
  }

  async function _logout() {
    await sb.auth.signOut();
    _session = null;
    return { message: '로그아웃되었습니다' };
  }

  async function _me() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { error: '로그인이 필요합니다' };
    const profile = await _fetchProfile(user.id);
    return _normalizeProfile(user, profile);
  }

  async function _fetchProfile(uid) {
    const { data } = await sb.from('profiles').select('*').eq('id', uid).single();
    return data;
  }

  function _normalizeProfile(authUser, profile) {
    if (!profile) return { error: '프로필을 찾을 수 없습니다' };
    return {
      user_id:      profile.id,
      id:           profile.id,
      name:         profile.name,
      email:        authUser?.email || '',
      role:         profile.role.toUpperCase(), // 'user' → 'USER', 'admin' → 'ADMIN'
      total_point:  profile.point,
      point:        profile.point,
      grade_name:   profile.grade,
      grade:        profile.grade,
      total_returns: profile.bottle_return_count,
      bottle_return_count: profile.bottle_return_count,
      is_active:    profile.is_active,
      created_at:   profile.created_at,
    };
  }

  /* ================================================================
     PRODUCTS
  ================================================================ */
  async function _listProducts() {
    const { data, error } = await sb
      .from('products')
      .select(`
        *,
        categories ( name ),
        product_images ( id, image_url, is_main, sort_order )
      `)
      .eq('is_active', true)
      .order('sort_order')
      .order('id');
    if (error) return [];
    return data.map(_mapProduct);
  }

  async function _getProduct(id) {
    const { data, error } = await sb
      .from('products')
      .select(`
        *,
        categories ( name ),
        product_images ( id, image_url, is_main, sort_order )
      `)
      .eq('id', id)
      .single();
    if (error || !data) return { error: '상품을 찾을 수 없습니다' };
    const p = _mapProduct(data);
    p.images = (data.product_images || []).map(img => ({
      image_id: img.id,
      image_url: img.image_url,
      is_main: img.is_main,
    }));
    return p;
  }

  function _mapProduct(p) {
    const images = p.product_images || [];
    images.sort((a, b) => (b.is_main ? 1 : -1));
    const mainImg = images.find(i => i.is_main) || images[0];
    return {
      product_id:    p.id,
      product_name:  p.name,
      category_id:   p.category_id,
      category_name: p.categories?.name || '',
      price:         p.price,
      stock:         p.stock,
      description:   p.description,
      ingredients:   p.ingredients,
      usage_guide:   p.usage_guide,
      is_vegan:      p.is_vegan,
      is_refillable: p.is_refillable,
      return_point:  p.return_point,
      earn_point:    p.earn_point,
      is_active:     p.is_active,
      sort_order:    p.sort_order,
      main_image:    mainImg?.image_url || null,
    };
  }

  async function _createProduct(body) {
    const payload = {
      category_id:   parseInt(body.category_id) || 1,
      name:          body.product_name,
      price:         parseInt(body.price) || 0,
      stock:         parseInt(body.stock) || 0,
      description:   body.description || null,
      ingredients:   body.ingredients || null,
      usage_guide:   body.usage_guide || null,
      is_vegan:      body.is_vegan !== false,
      is_refillable: !!body.is_refillable,
      return_point:  parseInt(body.return_point) || 0,
      earn_point:    parseInt(body.earn_point) || 0,
    };
    const { data, error } = await sb.from('products').insert(payload).select().single();
    if (error) return { error: error.message };
    return { message: '상품이 등록되었습니다', product_id: data.id };
  }

  async function _updateProduct(id, body) {
    const allowed = ['category_id','name','price','stock','description','ingredients',
                     'usage_guide','is_vegan','is_refillable','return_point','earn_point',
                     'is_active','sort_order'];
    const payload = {};
    // Map product_name → name
    if (body.product_name) body.name = body.product_name;
    for (const k of allowed) {
      if (body[k] !== undefined) payload[k] = body[k];
    }
    const { error } = await sb.from('products').update(payload).eq('id', id);
    if (error) return { error: error.message };
    return { message: '상품이 수정되었습니다' };
  }

  async function _deleteProduct(id) {
    const { error } = await sb.from('products').update({ is_active: false }).eq('id', id);
    if (error) return { error: error.message };
    return { message: '상품이 삭제(비활성화)되었습니다' };
  }

  async function _deleteImage(productId, imageId) {
    // storage_path 먼저 가져오기
    const { data: img } = await sb.from('product_images')
      .select('storage_path, is_main').eq('id', imageId).single();
    // Storage에서 파일 삭제
    if (img?.storage_path) {
      await sb.storage.from('products').remove([img.storage_path]);
    }
    const { error } = await sb.from('product_images').delete().eq('id', imageId);
    if (error) return { error: error.message };
    // 삭제된 게 메인이면 다음 이미지를 메인으로
    if (img?.is_main) {
      const { data: next } = await sb.from('product_images')
        .select('id').eq('product_id', productId).order('sort_order').limit(1).single();
      if (next) await sb.from('product_images').update({ is_main: true }).eq('id', next.id);
    }
    return { message: '이미지가 삭제되었습니다' };
  }

  async function _setMainImage(productId, imageId) {
    await sb.from('product_images').update({ is_main: false }).eq('product_id', productId);
    const { error } = await sb.from('product_images').update({ is_main: true }).eq('id', imageId);
    if (error) return { error: error.message };
    return { message: '대표 이미지가 변경되었습니다' };
  }

  /* Supabase Storage 이미지 업로드 (admin.html의 doUploadImage 대체) */
  window.uploadImageToStorage = async function (productId, file) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `product_${productId}_${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage.from('products').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if (upErr) { console.error('Storage 업로드 실패:', upErr.message); return false; }

    const { data: { publicUrl } } = sb.storage.from('products').getPublicUrl(path);

    // 첫 번째 이미지면 메인으로
    const { count } = await sb.from('product_images')
      .select('*', { count: 'exact', head: true }).eq('product_id', productId);
    const isFirst = (count === 0);

    const { error: dbErr } = await sb.from('product_images').insert({
      product_id:   productId,
      image_url:    publicUrl,
      storage_path: path,
      is_main:      isFirst,
      sort_order:   isFirst ? 0 : 99,
    });
    if (dbErr) { console.error('DB 저장 실패:', dbErr.message); return false; }
    return true;
  };

  /* ================================================================
     CART
  ================================================================ */
  async function _getCart() {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { items: [] };
    const { data } = await sb.from('cart_items')
      .select(`id, quantity,
        products ( id, name, price, return_point, is_refillable,
          product_images ( image_url, is_main ) )`)
      .eq('user_id', uid);
    const items = (data || []).map(c => {
      const p = c.products;
      const img = (p?.product_images || []).find(i => i.is_main) || p?.product_images?.[0];
      return {
        cart_item_id: c.id,
        product_id:   p?.id,
        product_name: p?.name,
        price:        p?.price,
        quantity:     c.quantity,
        return_point: p?.return_point,
        is_refillable: p?.is_refillable,
        main_image:   img?.image_url || null,
      };
    });
    return { items };
  }

  async function _addToCart({ product_id, quantity = 1 }) {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { error: '로그인이 필요합니다' };
    const { error } = await sb.from('cart_items')
      .upsert({ user_id: uid, product_id, quantity },
               { onConflict: 'user_id,product_id', ignoreDuplicates: false });
    if (error) return { error: error.message };
    return { message: '장바구니에 담겼습니다' };
  }

  async function _updateCart(cartItemId, { quantity }) {
    const { error } = await sb.from('cart_items')
      .update({ quantity }).eq('id', cartItemId);
    if (error) return { error: error.message };
    return { message: '수량이 변경되었습니다' };
  }

  async function _removeFromCart(cartItemId) {
    const { error } = await sb.from('cart_items').delete().eq('id', cartItemId);
    if (error) return { error: error.message };
    return { message: '삭제되었습니다' };
  }

  async function _clearCart() {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { error: '로그인이 필요합니다' };
    await sb.from('cart_items').delete().eq('user_id', uid);
    return { message: '장바구니가 비워졌습니다' };
  }

  /* ================================================================
     ORDERS
  ================================================================ */
  async function _listOrders() {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data } = await sb.from('orders')
      .select(`*, order_items ( id, quantity, unit_price, subtotal, products(name) )`)
      .eq('user_id', uid).order('created_at', { ascending: false });
    return (data || []).map(o => ({
      ...o, order_id: o.id, final_price: o.final_price,
      item_count: o.order_items?.length || 0,
    }));
  }

  async function _createOrder({ items, used_point = 0, delivery_address, delivery_name, delivery_phone }) {
    const addr = delivery_address
      ? `${delivery_name || ''} / ${delivery_phone || ''} / ${delivery_address}`
      : null;
    const { data, error } = await sb.rpc('create_order_fn', {
      p_items:         items,
      p_used_point:    used_point,
      p_delivery_addr: addr,
    });
    if (error) return { error: error.message };
    return { message: '주문이 완료되었습니다', order_id: data };
  }

  async function _cancelOrder(orderId) {
    const { error } = await sb.from('orders')
      .update({ order_status: '취소' }).eq('id', orderId);
    if (error) return { error: error.message };
    return { message: '주문이 취소되었습니다' };
  }

  /* ================================================================
     BOTTLE RETURNS
  ================================================================ */
  async function _listReturns() {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return [];
    const { data } = await sb.from('bottle_returns')
      .select('*').eq('user_id', uid).order('created_at', { ascending: false });
    return (data || []).map(r => ({ ...r, return_id: r.id }));
  }

  async function _submitReturn({ return_method, items }) {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { error: '로그인이 필요합니다' };
    const totalBottles = (items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const bottleType = (items || []).map(i => i.product_name || '화장품 용기').join(', ');
    const { error } = await sb.from('bottle_returns').insert({
      user_id: uid, bottle_count: totalBottles || 1,
      bottle_type: bottleType, return_method: return_method || 'DELIVERY',
    });
    if (error) return { error: error.message };
    return { message: '공병 반납 신청이 완료되었습니다' };
  }

  async function _approveReturn(id, { memo } = {}) {
    const { error } = await sb.rpc('approve_bottle_return', { p_return_id: id });
    if (error) return { error: error.message };
    if (memo) await sb.from('bottle_returns').update({ inspection_memo: memo }).eq('id', id);
    return { message: '승인 완료! 포인트가 지급되었습니다' };
  }

  async function _rejectReturn(id, { memo } = {}) {
    const { error } = await sb.from('bottle_returns')
      .update({ return_status: '반려', inspection_memo: memo, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { error: error.message };
    return { message: '반납이 반려되었습니다' };
  }

  async function _updateReturnStatus(id, { status, memo } = {}) {
    const payload = { return_status: status, updated_at: new Date().toISOString() };
    if (memo) payload.inspection_memo = memo;
    const { error } = await sb.from('bottle_returns').update(payload).eq('id', id);
    if (error) return { error: error.message };
    return { message: '상태가 변경되었습니다' };
  }

  /* ================================================================
     REFILL
  ================================================================ */
  async function _submitRefill({ product_id, shipping_address }) {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { error: '로그인이 필요합니다' };
    const { data: p } = await sb.from('products').select('price').eq('id', product_id).single();
    const { error } = await sb.from('refill_requests').insert({
      user_id: uid, product_id,
      refill_amount: p?.price || 0,
      shipping_address,
    });
    if (error) return { error: error.message };
    return { message: '리필 신청이 완료되었습니다' };
  }

  /* ================================================================
     CAMPAIGNS
  ================================================================ */
  async function _listCampaigns() {
    const { data } = await sb.from('campaigns')
      .select(`*, campaign_participants ( count )`)
      .eq('is_active', true).order('created_at', { ascending: false });
    return (data || []).map(c => ({
      ...c, campaign_id: c.id,
      participant_count: c.campaign_participants?.[0]?.count || 0,
    }));
  }

  async function _createCampaign(body) {
    const { error } = await sb.from('campaigns').insert({
      title: body.title, mission_desc: body.mission_desc,
      reward_point: parseInt(body.reward_point) || 0,
      content: body.content, start_date: body.start_date, end_date: body.end_date,
    });
    if (error) return { error: error.message };
    return { message: '캠페인이 등록되었습니다' };
  }

  async function _joinCampaign(campaignId, { sns_url } = {}) {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { error: '로그인이 필요합니다' };
    const { error } = await sb.from('campaign_participants')
      .upsert({ campaign_id: campaignId, user_id: uid, sns_url },
               { onConflict: 'campaign_id,user_id', ignoreDuplicates: true });
    if (error) return { error: error.message };
    return { message: '캠페인에 참여했습니다' };
  }

  /* ================================================================
     POINT LOGS
  ================================================================ */
  async function _getPointLogs() {
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) return { points: [] };
    const { data } = await sb.from('point_logs')
      .select('*').eq('user_id', uid)
      .order('created_at', { ascending: false }).limit(50);
    return { points: data || [] };
  }

  /* ================================================================
     ADMIN
  ================================================================ */
  async function _adminDashboard() {
    const { data, error } = await sb.rpc('get_dashboard_stats');
    if (error) return { error: error.message };
    return data;
  }

  async function _adminListOrders() {
    const { data } = await sb.from('orders')
      .select(`*, profiles ( name ), order_items ( id )`)
      .order('created_at', { ascending: false }).limit(200);
    return (data || []).map(o => ({
      order_id:     o.id,
      order_number: o.order_number,
      user_name:    o.profiles?.name || '-',
      item_count:   o.order_items?.length || 0,
      final_price:  o.final_price,
      order_status: o.order_status,
      created_at:   o.created_at,
    }));
  }

  async function _adminUpdateOrder(orderId, { status, tracking_number } = {}) {
    const payload = {};
    if (status) payload.order_status = status;
    if (tracking_number) payload.tracking_number = tracking_number;
    const { error } = await sb.from('orders').update(payload).eq('id', orderId);
    if (error) return { error: error.message };
    return { message: '주문 상태가 변경되었습니다' };
  }

  async function _adminListUsers() {
    const { data } = await sb.from('profiles')
      .select('*').order('created_at', { ascending: false });
    return (data || []).map(u => ({
      user_id:       u.id,
      name:          u.name,
      email:         '', // auth.users 이메일은 RPC 없이는 조회 어려움
      grade_name:    u.grade,
      grade_icon:    { Seed:'🌱', Leaf:'🍃', Tree:'🌳', Forest:'🌲' }[u.grade] || '🌱',
      total_point:   u.point,
      total_returns: u.bottle_return_count,
      is_active:     u.is_active,
      role:          u.role.toUpperCase(),
      created_at:    u.created_at,
    }));
  }

  async function _adminUpdateUser(userId, { is_active, point_adjust, reason, role } = {}) {
    const payload = {};
    if (is_active !== undefined) payload.is_active = is_active;
    if (role) payload.role = role.toLowerCase();

    if (point_adjust) {
      // 포인트 조정: 먼저 현재 값 읽기
      const { data: p } = await sb.from('profiles').select('point').eq('id', userId).single();
      const newPoint = Math.max(0, (p?.point || 0) + point_adjust);
      payload.point = newPoint;
      // 포인트 로그 기록
      await sb.from('point_logs').insert({
        user_id:      userId,
        point_change: point_adjust,
        balance:      newPoint,
        log_type:     point_adjust > 0 ? '적립' : '차감',
        reason:       reason || '관리자 조정',
      });
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await sb.from('profiles').update(payload).eq('id', userId);
      if (error) return { error: error.message };
    }
    return { message: '회원 정보가 수정되었습니다' };
  }

  async function _adminListReturns() {
    const { data } = await sb.from('bottle_returns')
      .select(`*, profiles ( name )`)
      .order('created_at', { ascending: false }).limit(200);
    return (data || []).map(r => ({
      return_id:     r.id,
      return_number: r.return_number,
      user_name:     r.profiles?.name || '-',
      return_method: r.return_method,
      total_quantity: r.bottle_count,
      total_point:   r.bottle_count * 500,
      return_status: r.return_status,
      created_at:    r.created_at,
    }));
  }

  console.log('[OBLIGE] Supabase 클라이언트 초기화 완료 ✅');
})();
