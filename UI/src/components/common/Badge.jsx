import React from 'react';

const Badge = ({ text, type }) => {
    const getStatusClass = () => {
        switch (type) {
            case 'normal': return 'status-normal';
            case 'warning': return 'status-warning';
            case 'soldout': return 'status-soldout';
            case 'done': return 'done';
            default: return '';
        }
    };

    return (
        <span className={`status-badge ${getStatusClass()}`}>
            {text}
        </span>
    );
};

export default Badge;
