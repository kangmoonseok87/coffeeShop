import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Trash2, UserPlus, Shield, Edit2, RotateCcw } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();

    // 폼 상태
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '', role_id: 3 });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // 사용자 목록 불러오기
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('사용자 목록을 불러오지 못했습니다.');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 폼 제출 (추가 또는 수정)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editingUser) {
                // 수정 모드
                const updateData = { role_id: formData.role_id };
                if (formData.password) {
                    updateData.password = formData.password;
                }

                const response = await fetch(`${API_URL}/api/admin/users/${editingUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || '사용자 수정 실패');
                }
            } else {
                // 추가 모드
                const response = await fetch(`${API_URL}/api/admin/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || '사용자 추가 실패');
                }
            }

            // 목록 새로고침 및 폼 초기화
            fetchUsers();
            const message = editingUser ? '사용자 정보가 성공적으로 수정되었습니다.' : '새 사용자가 성공적으로 추가되었습니다.';
            setSuccessMessage(message);
            resetForm();
            setShowSuccessModal(true);
        } catch (err) {
            alert(err.message);
        }
    };

    // 사용자 삭제 요청 (확인 모달 띄우기)
    const requestDeleteUser = (id) => {
        setUserToDelete(id);
        setShowDeleteModal(true);
    };

    // 사용자 삭제 실행 (확인 완료 시)
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users/${userToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '삭제 실패');
            }

            fetchUsers();
            if (editingUser && editingUser.id === userToDelete) {
                resetForm();
            }
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err) {
            alert(err.message);
        }
    };

    // 수정 버튼 클릭 시 폼 채우기 및 모달 열기
    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            role_id: user.role_id
        });
        setShowModal(true);
    };

    // 폼 초기화 및 모달 닫기
    const resetForm = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', role_id: 3 });
        setShowModal(false);
    };

    if (loading) return <div>사용자 정보를 불러오는 중...</div>;

    return (
        <div className="container admin-container">
            <div className="admin-header-flex">
                <div className="section-head-text">
                    <p className="section-label">Management</p>
                    <h2 className="section-title">사용자 관리</h2>
                </div>
                <button className="btn-primary add-btn" onClick={() => setShowModal(true)}>
                    <UserPlus size={18} /> 새 사용자 추가
                </button>
            </div>

            <div className="card full-card">
                <div className="card-header">
                    <h3>등록된 사용자 목록</h3>
                    <p className="subtitle">전체 {users.length}명의 사용자가 등록되어 있습니다.</p>
                </div>
                {error && <p className="error-text">{error}</p>}
                <div className="table-responsive">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>이름</th>
                                <th>역할</th>
                                <th>가입일</th>
                                <th style={{ textAlign: 'right' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className={editingUser?.id === u.id ? 'active-row' : ''}>
                                    <td><span className="id-badge">#{u.id}</span></td>
                                    <td><span className="username-text">{u.username}</span></td>
                                    <td>
                                        <span className={`badge role-${u.role.toLowerCase()}`}>
                                            {u.role === 'Admin' ? '관리자' : u.role === 'Manager' ? '매니저' : '직원'}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-group">
                                            <button
                                                onClick={() => handleEditClick(u)}
                                                className="icon-btn edit"
                                                title="수정"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {u.id !== currentUser.id && (
                                                <button
                                                    onClick={() => requestDeleteUser(u.id)}
                                                    className="icon-btn delete"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 사용자 추가/수정 모달 */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content user-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
                                {editingUser ? ' 사용자 정보 수정' : ' 새 사용자 추가'}
                            </h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="add-user-form">
                            <div className="form-group">
                                <label>아이디</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    disabled={!!editingUser}
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label>비밀번호 {editingUser && <span className="text-small">(변경 시에만 입력)</span>}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    placeholder={editingUser ? "변경하지 않으려면 비워두세요" : "비밀번호를 입력하세요"}
                                />
                            </div>
                            <div className="form-group">
                                <label>역할</label>
                                <select
                                    value={formData.role_id}
                                    onChange={e => setFormData({ ...formData, role_id: Number(e.target.value) })}
                                    disabled={editingUser && editingUser.id === currentUser.id}
                                >
                                    <option value={1}>Admin (관리자)</option>
                                    <option value={2}>Manager (매니저)</option>
                                    <option value={3}>Staff (직원)</option>
                                </select>
                            </div>

                            <div className="form-actions-modal">
                                <button type="button" onClick={resetForm} className="btn-cancel">
                                    취소
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingUser ? '수정 완료' : '추가하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 사용자 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="warning-icon-container">
                            <Shield size={48} color="#dc3545" />
                        </div>
                        <h3 className="modal-title">사용자 삭제 확인</h3>
                        <p className="modal-desc">
                            정말 이 사용자를 삭제하시겠습니까?<br />
                            <strong>이 작업은 되돌릴 수 없습니다.</strong>
                        </p>
                        <div className="modal-actions-horizontal">
                            <button
                                className="btn-secondary-modal"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                돌아가기
                            </button>
                            <button
                                className="btn-delete-confirm"
                                onClick={handleDeleteUser}
                            >
                                삭제 확정
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 작업 완료(성공) 알림 모달 */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content success-modal" onClick={e => e.stopPropagation()}>
                        <div className="success-icon-container">
                            <div className="check-mark">✓</div>
                        </div>
                        <h3 className="modal-title">작업 완료</h3>
                        <p className="modal-desc">{successMessage}</p>
                        <button
                            className="btn-success-confirm"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .admin-header-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin: 2.5rem 0 1.5rem;
                }
                .section-head-text {
                    display: flex;
                    flex-direction: column;
                }
                .add-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.8rem 1.5rem;
                    width: auto;
                }
                .full-card {
                    width: 100%;
                    overflow: hidden;
                }
                .card-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .card-header h3 { margin: 0; }
                .subtitle {
                    margin: 0.3rem 0 0;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .table-responsive {
                    padding: 1rem 2rem 2rem;
                }
                .id-badge {
                    color: var(--text-muted);
                    font-family: monospace;
                    font-size: 0.9rem;
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .username-text {
                    font-weight: 600;
                    color: var(--primary);
                }
                .action-group {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }
                .modal-content.user-modal {
                    background: white;
                    width: 100%;
                    max-width: 450px;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    animation: slideUp 0.3s ease;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .modal-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--primary);
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-muted);
                }
                .form-actions-modal {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                .btn-cancel, .btn-submit {
                    flex: 1;
                    padding: 1rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-cancel {
                    background: #f5f5f5;
                    color: #616161;
                }
                .btn-submit {
                    background: var(--accent);
                    color: white;
                }
                .btn-cancel:hover { background: #eeeeee; }
                .btn-submit:hover { opacity: 0.9; transform: translateY(-1px); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .active-row {
                    background-color: rgba(198, 166, 100, 0.05);
                }
                .text-small {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    font-weight: normal;
                }

                /* 삭제 모달 전용 스타일 */
                .delete-modal {
                    background: white;
                    width: 100%;
                    max-width: 400px;
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease;
                }
                .warning-icon-container {
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: center;
                }
                .modal-title {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #333;
                    margin-bottom: 1rem;
                }
                .modal-desc {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }
                .modal-actions-horizontal {
                    display: flex;
                    gap: 1rem;
                }
                .btn-secondary-modal, .btn-delete-confirm {
                    flex: 1;
                    padding: 1rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary-modal {
                    background: #f5f5f5;
                    color: #616161;
                }
                .btn-delete-confirm {
                    background: #dc3545;
                    color: white;
                }
                .btn-secondary-modal:hover { background: #eeeeee; }
                .btn-delete-confirm:hover { background: #c82333; transform: translateY(-1px); }

                /* 모바일 대응 스타일 */
                @media (max-width: 768px) {
                    .admin-header-flex {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .add-btn {
                        width: 100%;
                        justify-content: center;
                    }
                    .card-header {
                        padding: 1.5rem 1rem;
                    }
                    .table-responsive {
                        padding: 1rem 0.5rem;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .user-table th, .user-table td {
                        padding: 0.8rem 0.5rem;
                        font-size: 0.85rem;
                    }
                    .modal-content.user-modal, .delete-modal, .success-modal {
                        padding: 1.5rem;
                        width: 95%;
                        margin: 10px;
                    }
                    .form-actions-modal, .modal-actions-horizontal {
                        flex-direction: column;
                    }
                    .btn-cancel, .btn-submit, .btn-secondary-modal, .btn-delete-confirm {
                        width: 100%;
                    }
                }

                /* 성공 알림 모달 전용 스타일 */
                .success-modal {
                    background: white;
                    width: 100%;
                    max-width: 380px;
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease;
                }
                .success-icon-container {
                    width: 64px;
                    height: 64px;
                    background: #e8f5e9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }
                .check-mark {
                    color: #4caf50;
                    font-size: 2rem;
                    font-weight: bold;
                }
                .btn-success-confirm {
                    width: 100%;
                    padding: 1rem;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 1rem;
                }
                .btn-success-confirm:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
