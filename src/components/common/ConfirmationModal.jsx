const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-[#EF4444] text-white hover:bg-red-600",
  cancelButtonClass = "bg-[#E6F0FF] text-black hover:bg-[#D0E3FF]",
  icon = null,
  isLoading = false,
  disableConfirm = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-1000 px-4">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-lg flex flex-col items-center">
        <h3 className="text-xl font-bold text-black mb-4">{title}</h3>
        <p className="text-[#666666] text-center mb-6">{message}</p>
        <div className="flex w-full gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 py-3 font-semibold rounded-full transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || disableConfirm}
            className={`flex-1 py-3 font-semibold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${confirmButtonClass}`}
          >
            {icon && (
              <div
                dangerouslySetInnerHTML={{ __html: icon }}
                className="scale-[0.8] invert brightness-0"
              />
            )}
            {isLoading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
