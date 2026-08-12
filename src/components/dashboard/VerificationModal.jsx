const VerificationModal = ({
  isOpen,
  onClose,
  title,
  description,
  steps = [],
  primaryAction,
  secondaryAction,
}) => {
  if (!isOpen) return null;

  // console.log(steps);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#E6F0FF] rounded-2xl w-[90%] max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center mb-2">{title}</h2>

        <p className="text-gray-500 text-center mb-6">{description}</p>

        <div className="flex justify-between mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center w-full">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full 
                ${step.active ? "bg-blue-500" : "bg-[#D1DDED]"}`}
              >
                <img src={step.icon} alt={step?.label} title={step?.label} />
              </div>

              <p
                className={`text-[10px] text-normal mt-2 ${step.active ? "text-blue-500 font-medium" : "text-gray-500"
                  }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="w-full mt-2 bg-blue-500 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-full font-bold text-xl"
          >
            {primaryAction.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="w-full mt-4 border py-3 rounded-full cursor-pointer font-bold text-xl bg-[#D0E3FF] hover:bg-blue-300  border-white"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationModal;
