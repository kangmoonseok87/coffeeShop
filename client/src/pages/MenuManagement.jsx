import React, { useState, useEffect } from 'react';
import { Coffee, Plus, Minus, Trash2, Edit2, Upload, X, Package, Check } from 'lucide-react';
import axios from 'axios';

const MenuManagement = () => {
    const [menus, setMenus] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Coffee',
        stock: '0',
        image_url: '',
        description: '',
        options: []
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/menu`);
            setMenus(response.data);
        } catch (err) {
            console.error('메뉴 로딩 실패:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploadingImage(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/admin/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const imageUrl = response.data.imageUrl;
            setFormData(prev => ({ ...prev, image_url: imageUrl }));
            setImagePreview(imageUrl);
        } catch (err) {
            alert('이미지 업로드 실패: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const menuData = {
            ...formData,
            price: parseInt(formData.price),
            stock: parseInt(formData.stock)
        };

        try {
            if (editingMenu) {
                await axios.patch(`${API_URL}/api/admin/menu/${editingMenu.id}`, menuData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('메뉴가 수정되었습니다.');
            } else {
                await axios.post(`${API_URL}/api/admin/menu`, menuData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert('메뉴가 추가되었습니다.');
            }
            fetchMenus();
            resetForm();
        } catch (err) {
            alert('저장 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/api/admin/menu/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('메뉴가 삭제되었습니다.');
            fetchMenus();
        } catch (err) {
            alert('삭제 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    const openEditModal = (menu) => {
        setEditingMenu(menu);
        setFormData({
            name: menu.name,
            price: menu.price.toString(),
            category: menu.category || 'Coffee',
            stock: menu.stock.toString(),
            image_url: menu.image_url || '',
            description: menu.description || '',
            options: menu.options || []
        });
        setImagePreview(menu.image_url || '');
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            category: 'Coffee',
            stock: '0',
            image_url: '',
            description: '',
            options: []
        });
        setImagePreview('');
        setEditingMenu(null);
        setShowModal(false);
    };

    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, { name: '', price: 0 }]
        }));
    };

    const removeOption = (index) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const updateOption = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.map((opt, i) =>
                i === index ? { ...opt, [field]: field === 'price' ? parseInt(value) || 0 : value } : opt
            )
        }));
    };

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <div className="section-wrapper">
                <div className="section-head">
                    <div>
                        <p className="section-label">Management</p>
                        <h2 className="section-title">메뉴 관리</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button className="btn-main" onClick={() => { resetForm(); setShowModal(true); }} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                            <Plus size={18} /> 새 메뉴 추가
                        </button>
                        <Package size={28} color="#3d2b1f" opacity={0.6} />
                    </div>
                </div>

                <div className="inventory-grid">
                    {menus.map(menu => (
                        <div key={menu.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
                            {/* 메뉴 이미지 영역 */}
                            <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
                                {menu.image_url ? (
                                    <img
                                        src={menu.image_url}
                                        alt={menu.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-cream)' }}>
                                        <Coffee size={40} color="var(--primary)" opacity={0.2} />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                                    <button className="icon-btn" onClick={() => openEditModal(menu)} style={{ background: 'white', color: 'var(--primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(menu.id)} style={{ background: 'white', color: '#e53935', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* 메뉴 정보 영역 */}
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 className="item-name">{menu.name}</h3>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent)', background: 'rgba(198, 166, 100, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {menu.category || 'Coffee'}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', flex: 1, lineHeight: '1.4' }}>{menu.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>{menu.price.toLocaleString()}원</span>
                                    <span className="item-stock" style={{ fontSize: '0.85rem', color: menu.stock < 5 ? '#e53935' : 'var(--text-muted)', margin: 0, fontWeight: '600' }}>
                                        재고: {menu.stock}개
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', padding: '2.5rem', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 className="modal-title" style={{ margin: 0 }}>{editingMenu ? '메뉴 수정' : '새 메뉴 추가'}</h3>
                            <button className="icon-btn" onClick={resetForm}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="section-label" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>이미지 업로드</label>
                                <div style={{ border: '2px dashed var(--border-light)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', position: 'relative', background: 'rgba(61,43,31,0.02)' }}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    ) : (
                                        <div style={{ padding: '1rem' }}>
                                            <Upload size={32} color="var(--primary)" opacity={0.3} style={{ marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>이미지 파일을 선택하거나 드래그하세요</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        disabled={uploadingImage}
                                    />
                                    {uploadingImage && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                                            <p style={{ fontWeight: '600', color: 'var(--primary)' }}>업로드 중...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>메뉴 이름 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="예: 에스프레소"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>가격 (원) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>초기 재고</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>카테고리</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Coffee">Coffee</option>
                                    <option value="Non-Coffee">Non-Coffee</option>
                                    <option value="Dessert">Dessert</option>
                                    <option value="MD">MD</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>메뉴 설명</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    placeholder="메뉴에 대한 설명을 입력하세요"
                                    style={{ width: '100%', padding: '0.9rem 1rem', border: '1px solid rgba(61, 43, 31, 0.15)', borderRadius: '12px', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.9)', fontFamily: 'inherit', resize: 'none' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label style={{ margin: 0 }}>옵션 설정</label>
                                    <button type="button" className="nav-btn" onClick={addOption} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: 'rgba(61,43,31,0.05)' }}>
                                        <Plus size={14} /> 옵션 추가
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {formData.options.map((option, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="옵션명"
                                                value={option.name}
                                                onChange={e => updateOption(index, 'name', e.target.value)}
                                                style={{ flex: 2, padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="가격"
                                                value={option.price}
                                                onChange={e => updateOption(index, 'price', e.target.value)}
                                                style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '0.9rem' }}
                                            />
                                            <button type="button" className="icon-btn delete" onClick={() => removeOption(index)} style={{ padding: '0.5rem' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.options.length === 0 && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                                            추가된 옵션이 없습니다.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-main" onClick={resetForm} style={{ flex: 1, background: '#f5f5f5', color: '#616161', boxShadow: 'none' }}>
                                    취소
                                </button>
                                <button type="submit" className="btn-main" style={{ flex: 1 }}>
                                    {editingMenu ? '수정 완료' : '메뉴 등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
