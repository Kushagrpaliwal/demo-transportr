import React from "react";

export default function LoadingButton({
    loading,
    onClick,
    children,
    className = "",
    disabled = false
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`flex items-center justify-center gap-2 ${className} ${loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                children
            )}
        </button>
    );
}