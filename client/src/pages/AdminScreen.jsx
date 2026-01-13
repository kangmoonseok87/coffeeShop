import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Package, ShoppingBag, Plus, Minus, ChevronRight, AlertTriangle } from 'lucide-react'; // 아이콘

/**
 * 관리자 화면 (AdminScreen)
 * 전체 주문 현황 모니터링, 주문 상태 변경, 재고 관리를 통합 수행하는 대시보드입니다.
 */
const AdminScreen = () => {
    // --- 1. 상태(State) 관리 ---
    const [orders, setOrders] = useState([]);      // 모든 주문 목록 데이터
    const [menus, setMenus] = useState([]);        // 모든 메뉴 및 재고 데이터
    const [showCancelModal, setShowCancelModal] = useState(false); // 취소 확인 모달 노출 여부
    const [orderToCancel, setOrderToCancel] = useState(null);       // 취소 대상 주문의 ID

    // --- 2. 데이터 자동 갱신 (useEffect) ---
    // 배포 환경의 주소를 사용하고, 없으면 기본 로컬 주소를 사용합니다.
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [API_URL]);

    /** [데이터 가져오기] 주문 목록과 메뉴 목록을 동시에 병렬로(Promise.all) 가져옵니다. */
    const fetchData = async () => {
        try {
            const [orderRes, menuRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/orders`),
                axios.get(`${API_URL}/api/menu`)
            ]);
            setOrders(orderRes.data);
            setMenus(menuRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    /** [주문 상태 업데이트] '주문 접수 -> 제조 중 -> 제조 완료' 순서로 상태를 변경합니다. */
    const updateStatus = (id, currentStatus) => {
        let nextStatus = '';
        // 현재 상태에 따라 다음 단계의 상태를 결정합니다.
        if (currentStatus === '주문 접수') nextStatus = '제조 중';
        else if (currentStatus === '제조 중') nextStatus = '제조 완료';
        else return; //        // 서버의 POST /api/orders 통로로 데이터를 보냅니다.
        axios.patch(`${API_URL}/api/admin/orders/${id}`, { status: nextStatus })
            .then(() => fetchData()) // 변경 후 최신 목록으로 화면 갱신
            .catch(err => alert('상태 업데이트 실패: ' + err.message));
    };

    /** [실시간 재고 수정] 관리자가 직접 + / - 버튼으로 재고를 조절합니다. */
    const updateStock = (id, currentStock, delta) => {
        // 0 미만으로 내려가지 않게 Math.max를 사용합니다.
        const newStock = Math.max(0, currentStock + delta);
        axios.patch(`${API_URL}/api/admin/menu/${id}/stock`, { stock: newStock })
            .then(() => fetchData())
            .catch(err => alert('재고 업데이트 실패: ' + err.message));
    };

    // --- 3. 통계 데이터 계산 ---
    // 전체 주문 리스트를 필터링하여 각 상태별 건수를 셉니다.
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === '주문 접수').length,
        preparing: orders.filter(o => o.status === '제조 중').length,
        done: orders.filter(o => o.status === '제조 완료').length
    };

    /** 상태에 따라 배지(Badge) 색상을 결정하는 함수 */
    const getStatusBadgeClass = (status) => {
        if (status === '주문 접수') return 'badge-pending';
        if (status === '제조 중') return 'badge-preparing';
        if (status === '제조 완료') return 'badge-done';
        return '';
    };

    // --- 4. 화면 렌더링 (JSX) ---
    return (
        <div className="container">
            {/* 상단 통계 카드 영역 */}
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Overview</p>
                        <h2 className="section-title">Admin Dashboard</h2>
                    </div>
                    <LayoutDashboard size={28} color="#3d2b1f" opacity={0.6} />
                </div>
                <div className="glass-card stats-grid">
                    <div className="stat-item">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-item" style={{ borderLeft: '1px solid var(--border-light)' }}>
                        <div className="stat-value" style={{ color: '#ffa000' }}>{stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-item" style={{ borderLeft: '1px solid var(--border-light)' }}>
                        <div className="stat-value" style={{ color: '#1976d2' }}>{stats.preparing}</div>
                        <div className="stat-label">Preparing</div>
                    </div>
                    <div className="stat-item" style={{ borderLeft: '1px solid var(--border-light)' }}>
                        <div className="stat-value" style={{ color: '#388e3c' }}>{stats.done}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
            </div>

            {/* 재고 관리 영역 */}
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Management</p>
                        <h2 className="section-title">Stock Status</h2>
                    </div>
                    <Package size={28} color="#3d2b1f" opacity={0.6} />
                </div>
                <div className="inventory-grid">
                    {menus.map(menu => (
                        <div key={menu.id} className="glass-card item-card">
                            <h4 className="item-name">{menu.name}</h4>
                            <div className="item-stock" style={{ color: menu.stock < 5 ? '#e53935' : 'var(--text-muted)' }}>
                                Current Stock: <strong>{menu.stock}</strong>
                            </div>
                            <div className="stock-control">
                                <button className="ctrl-btn" onClick={() => updateStock(menu.id, menu.stock, -1)}><Minus size={16} /></button>
                                <button className="ctrl-btn" onClick={() => updateStock(menu.id, menu.stock, 1)}><Plus size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 최근 주문 목록 영역 */}
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Realtime</p>
                        <h2 className="section-title">Recent Orders</h2>
                    </div>
                    <ShoppingBag size={28} color="#3d2b1f" opacity={0.6} />
                </div>
                <div className="glass-card" style={{ padding: '0' }}>
                    <div className="order-list">
                        {orders.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                아직 들어온 주문이 없습니다.
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="order-row">
                                    {/* 주문 시각 표시 */}
                                    <div className="order-time">
                                        {new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                            {new Date(order.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    {/* 주문 상품 내용 */}
                                    <div className="order-content">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{ marginBottom: '0.2rem' }}>
                                                {item.name}
                                                {item.selectedOptions && <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}> ({item.selectedOptions})</span>}
                                                {' '} <span style={{ color: 'var(--accent)' }}>x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="order-price">
                                        {order.totalAmount.toLocaleString()}원
                                    </div>
                                    {/* 주문 상태 버튼 및 취소 버튼 */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                        <div
                                            className={`badge ${getStatusBadgeClass(order.status)}`}
                                            onClick={() => updateStatus(order.id, order.status)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            {order.status}
                                            {order.status !== '제조 완료' && order.status !== '취소됨' && <ChevronRight size={14} />}
                                        </div>
                                        {/* 취소하기 버튼 (주문 접수 상태일 때만 노출) */}
                                        {order.status === '주문 접수' && (
                                            <div
                                                className="badge"
                                                style={{
                                                    background: '#f5f5f5',
                                                    color: '#9e9e9e',
                                                    border: '1px solid #e0e0e0',
                                                    fontWeight: '500'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToCancel(order.id);
                                                    setShowCancelModal(true);
                                                }}
                                            >
                                                취소하기
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 관리자용 주문 취소 확인 모달 */}
            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="warning-icon">
                            <AlertTriangle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="modal-title">주문 취소 확인</h3>
                        <p className="modal-desc">
                            이 주문을 정말 취소하시겠습니까?<br />
                            <strong>취소 시 차감된 재고가 자동으로 복구됩니다.</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-main"
                                style={{ flex: 1, background: '#f5f5f5', color: '#616161', boxShadow: 'none' }}
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setOrderToCancel(null);
                                }}
                            >
                                돌아가기
                            </button>
                            <button
                                className="btn-main"
                                style={{ flex: 1, background: '#c62828' }}
                                onClick={() => {
                                    // 서버로 '취소됨' 상태 전송
                                    axios.patch(`${API_URL}/api/admin/orders/${orderToCancel}`, { status: '취소됨' })
                                        .then(() => {
                                            fetchData(); // 화면 갱신
                                            setShowCancelModal(false);
                                            setOrderToCancel(null);
                                        })
                                        .catch(err => alert('취소 실패: ' + err.message));
                                }}
                            >
                                취소 확정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminScreen;
