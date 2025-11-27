"use client";

import React from "react";

interface Step1Props {
  formData: {
    firstName?: string;
    surname?: string;
    wardEmail?: string;
    password?: string;
  };
  setField: (field: string, value: string) => void;
  errors: Record<string, string[]>;
  loading?: boolean;
}

export default function Step1CreateUser({
  formData,
  setField,
  errors,
  loading,
}: Step1Props) {
  return (
    <div className="space-y-4" aria-labelledby="step1-title">
      <h2
        id="step1-title"
        className="text-lg font-bold text-[var(--ford-primary)]"
      >
        Step 1: Create User
      </h2>

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="First Name"
        value={formData.firstName || ""}
        onChange={(e) => setField("firstName", e.target.value)}
        aria-label="First Name"
      />

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Surname"
        value={formData.surname || ""}
        onChange={(e) => setField("surname", e.target.value)}
        aria-label="Surname"
      />

      <input
        type="email"
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Ward Email"
        value={formData.wardEmail || ""}
        onChange={(e) => setField("wardEmail", e.target.value)}
        aria-label="Ward Email"
      />

      <input
        type="password"
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Password"
        value={formData.password || ""}
        onChange={(e) => setField("password", e.target.value)}
        aria-label="Password"
      />

      {errors.createUser && (
        <div className="text-red-600" role="alert" aria-live="assertive">
          {errors.createUser.join(", ")}
        </div>
      )}
    </div>
  );
}
