import React, { useEffect } from 'react';

const Toast = ({ message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    if (!message) return null;

    return (
        <div className="toast-container">
            <div className="toast">
                {message}
            </div>
        </div>
    );
};

export default Toast;
