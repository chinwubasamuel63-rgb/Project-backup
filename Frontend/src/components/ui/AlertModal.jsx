import "./alert-modal.css";

export default function AlertModal({
  message,
  onClose,
  title = "Notice",
  onConfirm,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  inputValue,
  onInputChange,
  inputPlaceholder,
}) {
  if (!message) return null;

  return (
    <div className="alert-modal-backdrop" role="presentation">
      <section
        className="alert-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
      >
        <h2 id="alert-modal-title">{title}</h2>
        <p id="alert-modal-message">{message}</p>
        {onInputChange ? (
          <input
            className="alert-modal-input"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={inputPlaceholder}
            autoFocus
          />
        ) : null}
        <div className="alert-modal-actions">
          <button
            className="alert-modal-button"
            type="button"
            onClick={onClose}
          >
            {onConfirm ? cancelLabel : confirmLabel}
          </button>
          {onConfirm ? (
            <button
              className="alert-modal-button alert-modal-confirm-button"
              type="button"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
