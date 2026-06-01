const BASE = import.meta.env.VITE_API_URL ?? '/api';

function getToken(): string | null {
  return localStorage.getItem('oblige_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'API Error');
  return json as T;
}

export const api = {
  get:    <T>(path: string, auth = true) => request<T>('GET', path, undefined, auth),
  post:   <T>(path: string, body: unknown, auth = true) => request<T>('POST', path, body, auth),
  put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }, false),
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }, false),
  me: () => api.get<User>('/auth/me'),
};

// ── Products ─────────────────────────────────────────────
export const productApi = {
  list:   (params?: Record<string, string>) =>
    api.get<Product[]>('/products' + (params ? '?' + new URLSearchParams(params) : ''), false),
  detail: (id: number) => api.get<Product>(`/products/${id}`, false),
};

// ── Cart ──────────────────────────────────────────────────
export const cartApi = {
  get:    () => api.get<CartResponse>('/cart'),
  add:    (product_id: number, quantity = 1) => api.post('/cart', { product_id, quantity }),
  update: (cart_item_id: number, quantity: number) => api.patch(`/cart/${cart_item_id}`, { quantity }),
  remove: (cart_item_id: number) => api.delete(`/cart/${cart_item_id}`),
};

// ── Orders ────────────────────────────────────────────────
export const orderApi = {
  list:   () => api.get<Order[]>('/orders'),
  detail: (id: number) => api.get<Order>(`/orders/${id}`),
  create: (data: CreateOrderInput) => api.post<{ order_id: number; order_number: string }>('/orders', data),
  cancel: (id: number) => api.patch(`/orders/${id}/cancel`, {}),
};

// ── Returns ───────────────────────────────────────────────
export const returnApi = {
  list:   () => api.get<ReturnRequest[]>('/returns'),
  detail: (id: number) => api.get<ReturnRequest>(`/returns/${id}`),
  create: (data: CreateReturnInput) => api.post('/returns', data),
};

// ── Points ────────────────────────────────────────────────
export const pointApi = {
  history: () => api.get<PointResponse>('/points'),
  summary: () => api.get<PointSummary>('/points/summary'),
};

// ── User ─────────────────────────────────────────────────
export const userApi = {
  mypage:   () => api.get<MyPage>('/user/mypage'),
  esg:      () => api.get<EsgImpact>('/user/esg'),
  profile:  (data: Partial<User>) => api.put('/user/profile', data),
  password: (current: string, next: string) =>
    api.put('/user/password', { current_password: current, new_password: next }),
};

// ── Notifications ─────────────────────────────────────────
export const notificationApi = {
  list:    () => api.get<NotificationResponse>('/notifications'),
  read:    (id: number) => api.patch(`/notifications/${id}`, {}),
  readAll: () => api.patch('/notifications/read-all', {}),
};

// ── Campaigns ─────────────────────────────────────────────
export const campaignApi = {
  list:   () => api.get<Campaign[]>('/campaigns', false),
  detail: (id: number) => api.get<Campaign>(`/campaigns/${id}`, false),
  join:   (id: number, sns_url?: string) => api.post(`/campaigns/${id}/join`, { sns_url }),
};

// ── Types ─────────────────────────────────────────────────
export interface User {
  user_id: number; email: string; name: string; phone?: string;
  total_point: number; total_returns: number; role: 'USER' | 'ADMIN';
  grade_name: string; grade_icon: string; point_rate?: number; benefit?: string;
}

export interface Product {
  product_id: number; product_name: string; price: number; stock: number;
  category_name: string; description?: string; ingredients?: string;
  is_vegan: boolean; is_refillable: boolean; return_point: number; earn_point: number;
  avg_rating?: string; review_count?: number; main_image?: string;
  images?: ProductImage[]; reviews?: Review[];
}

export interface ProductImage { image_id: number; image_url: string; is_main: boolean; }

export interface CartItem {
  cart_item_id: number; product_id: number; product_name: string;
  price: number; quantity: number; subtotal: number; main_image?: string;
}

export interface CartResponse {
  items: CartItem[]; total_price: number; shipping_fee: number;
}

export interface Order {
  order_id: number; order_number: string; final_price: number;
  order_status: string; created_at: string; items?: OrderItem[];
  shipping_address?: string;
}

export interface OrderItem {
  product_name: string; price: number; quantity: number;
}

export interface CreateOrderInput {
  from_cart?: boolean; items?: { product_id: number; quantity: number }[];
  used_point?: number; receiver_name: string; receiver_phone: string;
  zipcode?: string; shipping_address: string; detail_address?: string; delivery_memo?: string;
}

export interface ReturnRequest {
  return_id: number; return_number: string; return_method: string;
  return_status: string; total_quantity: number; total_point: number; created_at: string;
}

export interface CreateReturnInput {
  return_method: 'DELIVERY' | 'OFFLINE';
  items: { product_id: number; quantity: number }[];
}

export interface PointSummary { balance: number; total_earned: number; total_used: number; }
export interface PointResponse { data: PointTransaction[]; total: number; }
export interface PointTransaction {
  pt_id: number; point_type: 'EARN' | 'USE'; amount: number;
  source: string; reason: string; created_at: string;
}

export interface MyPage extends User {
  recent_orders: Order[]; recent_returns: ReturnRequest[];
  campaign_count: number; next_grade?: string; next_grade_at?: number;
}

export interface EsgImpact {
  total_bottles: number; plastic_kg_saved: number; co2_kg_saved: number; message: string;
}

export interface Campaign {
  campaign_id: number; title: string; content: string; reward_point: number;
  mission_desc: string; start_date: string; end_date: string; participant_count?: number;
}

export interface Review {
  review_id: number; reviewer_name: string; rating: number; content: string; created_at: string;
}

export interface NotificationResponse { items: Notification[]; unread_count: number; }
export interface Notification {
  notification_id: number; noti_type: string; title: string; message: string;
  is_read: boolean; created_at: string;
}
