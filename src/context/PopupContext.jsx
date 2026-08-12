/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import Popup from "../components/Common/Popup";

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [popup, setPopup] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const timerRef = useRef(null);

  const showPopup = useCallback(
    (content, type = "success", duration = 4000) => {
      const title = typeof content === "object" ? content?.title || "" : "";
      const message = typeof content === "object" ? content?.message || "" : content;
      setPopup({ show: true, title, message, type });

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setPopup((prev) => ({ ...prev, show: false }));
        }, duration);
      }
    },
    [],
  );

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}

      {popup.show && (
        <Popup
          title={popup.title}
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={() => {
            timerRef.current = setTimeout(() => {
              setPopup((prev) => ({ ...prev, show: false }));
            }, 2000);
          }}
        />
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
};