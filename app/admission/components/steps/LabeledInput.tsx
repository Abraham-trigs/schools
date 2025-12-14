// app/admission/components/LabeledInput.tsx
// Purpose: Accessible, reusable input with label, error display, and normalized onChange for form usage.

"use client";

import React from "react";

interface LabeledInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  error?: string;
  /** Returns the input value directly instead of the event object */
  onChangeValue?: (value: string) => void;
}

export default function LabeledInput({
  label,
  error,
  onChangeValue,
  ...props
}: LabeledInputProps) {
  return (
    <div className="flex flex-col w-full mb-4">
      <label className="mb-1 text-gray-700 font-medium">{label}</label>
      <input
        {...props}
        onChange={(e) => onChangeValue?.(e.target.value)}
        className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-600 text-xs mt-1">{error}</span>}
    </div>
  );
}

/*
Design reasoning:
- Normalizes input events so parent components receive only the raw value.
- Provides error display and accessible label.
- Prevents accidental [object Object] assignments in state.

Structure:
- Single LabeledInput component
- Props: label, error, onChangeValue, plus all other input attributes via spread

Implementation guidance:
- Replace all current uses of LabeledInput with onChangeValue for updating zustand or form state.
- Optional error prop displays field-specific messages.
- Supports all standard HTML input types.

Scalability insight:
- Can be extended to handle select, textarea, or masked inputs consistently.
- Centralizing onChange normalization avoids repeating e.target.value extraction across all forms.
*/
