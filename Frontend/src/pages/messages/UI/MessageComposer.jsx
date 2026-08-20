import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizontal, Mic, Plus } from "lucide-react";

function SelectedImagePreview({ file }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const timerId = window.setTimeout(() => setPreviewUrl(url), 0);

    return () => {
      window.clearTimeout(timerId);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return previewUrl ? (
    <img className="msg-selected-image" src={previewUrl} alt={file.name} />
  ) : null;
}

function MessageComposer({
  value,
  onChange,
  onSend,
  sending,
  selectedFiles,
  onFileSelection,
  onRemoveFile,
  onQuickAction,
  replyTo,
  onCancelReply,
}) {
  const MAX_MESSAGE_LENGTH = 2000;
  const [dragActive, setDragActive] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleTogglePopup = () => {
    setPopupOpen((current) => !current);
  };

  const handlePopupAction = (action) => {
    setPopupOpen(false);

    if (action === "attach") {
      fileInputRef.current?.click();
      return;
    }

    if (action === "code") {
      setCodeMode((current) => !current);
    }

    onQuickAction(action);
  };

  const handleInputChange = (nextValue) => {
    if (nextValue.length > MAX_MESSAGE_LENGTH) {
      setLimitExceeded(true);
      onChange(nextValue.slice(0, MAX_MESSAGE_LENGTH));
      return;
    }

    setLimitExceeded(false);
    onChange(nextValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend(event);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length) {
      onFileSelection({ target: { files } });
    }
  };

  return (
    <form
      className={`msg-composer ${dragActive ? "drag-active" : ""}`}
      onSubmit={onSend}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="msg-composer-content">
        {replyTo ? (
          <div className="msg-reply-preview">
            <span>
              Replying to {replyTo.sender?.username || "this message"}
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
            >
              ×
            </button>
          </div>
        ) : null}
        {selectedFiles.length > 0 ? (
          <div className="msg-selected-files">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="msg-selected-file">
                {file.type?.startsWith("image/") ? (
                  <SelectedImagePreview file={file} />
                ) : null}
                <span>{file.name}</span>
                <button type="button" onClick={() => onRemoveFile(index)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="msg-composer-input-row">
          <div className="msg-composer-left">
            <input
              ref={fileInputRef}
              className="msg-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={onFileSelection}
              aria-label="Attach images"
            />
            <div className="msg-popup-trigger">
              <button
                type="button"
                className="msg-icon-btn"
                aria-label="Composer menu"
                onClick={handleTogglePopup}
              >
                <Plus size={16} />
              </button>
              {popupOpen ? (
                <div className="msg-popup-menu msg-popup-top">
                  <button
                    type="button"
                    className="msg-popup-item"
                    onClick={() => handlePopupAction("attach")}
                  >
                    <Paperclip size={16} />
                    Attach
                  </button>
                  <button
                    type="button"
                    className="msg-popup-item"
                    onClick={() => handlePopupAction("code")}
                  >
                    <span className="msg-popup-icon">{`</>`}</span>
                    Code block
                  </button>
                  <button
                    type="button"
                    className="msg-popup-item"
                    onClick={() => handlePopupAction("attach")}
                  >
                    📷 Image
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <textarea
            className={codeMode ? "msg-code-mode" : ""}
            value={value}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <button
            type={
              value.trim().length > 0 || selectedFiles.length > 0
                ? "submit"
                : "button"
            }
            className="msg-btn msg-btn-primary msg-send-button"
            disabled={sending}
            onClick={
              value.trim().length > 0 || selectedFiles.length > 0
                ? undefined
                : () => onQuickAction("record")
            }
          >
            {sending ? (
              "Sending..."
            ) : value.trim().length > 0 || selectedFiles.length > 0 ? (
              <SendHorizontal size={16} />
            ) : (
              <Mic size={16} />
            )}
          </button>
        </div>

        <div className="msg-composer-actions">
          {limitExceeded ? (
            <span className="msg-error">
              You have exceeded the {MAX_MESSAGE_LENGTH} character limit.
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export default MessageComposer;
