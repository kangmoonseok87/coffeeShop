import React from 'react';
import Badge from '../common/Badge';

const InventoryTable = ({ menus, inventory, updateInventory }) => {
    return (
        <section className="admin-section">
            <h2 className="admin-title">재고 현황</h2>
            <div className="inventory-table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>메뉴명</th>
                            <th>재고 개수</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menus.map(menu => {
                            const count = inventory[menu.id] || 0;
                            let statusText = '정상';
                            let statusType = 'normal';

                            if (count === 0) {
                                statusText = '품절';
                                statusType = 'soldout';
                            } else if (count < 5) {
                                statusText = '주의';
                                statusType = 'warning';
                            }

                            return (
                                <tr key={menu.id}>
                                    <td>{menu.name}</td>
                                    <td>{count}개</td>
                                    <td><Badge text={statusText} type={statusType} /></td>
                                    <td>
                                        <div className="inventory-controls">
                                            <button className="qty-btn" onClick={() => updateInventory(menu.id, -1)}>-</button>
                                            <button className="qty-btn" onClick={() => updateInventory(menu.id, 1)}>+</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default InventoryTable;
