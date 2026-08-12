import { useEffect, useRef } from "react";

const Popup = ({ title, message, onClose, type, onMouseEnter, onMouseLeave }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        ref={popupRef}
        className={`${
          type === "success" ? "bg-green-500" : type === "info" ? "bg-blue-500" : "bg-red-500"
        } text-white px-4 py-6 rounded-lg shadow-lg min-w-[250px] w-[90vw] max-w-md break-words animate-slide-in`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            {title ? <p className="text-base font-semibold mb-1">{title}</p> : null}
            <p className="text-lg">{message}</p>
          </div>
          <button onClick={onClose} className="cursor-pointer">✕</button>
        </div>
      </div>
    </div>
  );
};

export default Popup;