"use client";

import { useId, useState } from "react";

import { Modal } from "./Modal";

/** In-app replacement for window.prompt: one text field, plus optional extra controls. */
export function PromptDialog({
  title,
  label,
  placeholder,
  confirmLabel,
  required = false,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  /** Disable the confirm button until something is typed. */
  required?: boolean;
  children?: React.ReactNode;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const id = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (required && !value.trim()) return;
    onConfirm(value.trim());
    onClose();
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field" htmlFor={id}>
          <span className="field__label">{label}</span>
          <textarea
            id={id}
            name="instructions"
            className="input"
            rows={2}
            maxLength={500}
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>
        {children}
        <div className="row row--end">
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={required && !value.trim()}>{confirmLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
