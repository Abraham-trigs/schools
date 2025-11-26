"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore";
import { useUserStore } from "@/app/store/useUserStore.ts"; // handles SchoolAccount

export default function Step1CreateUser() {
  const { formData, setField, errors, loading, markUserCreated } =
    useAdmissionStore();
  const { createUser } = useUserStore();

  const handleCreate = async () => {
    if (!formData.wardEmail || !formData.firstName || !formData.surname) return;

    try {
      const payload = {
        name: `${formData.firstName} ${formData.surname}`,
        email: formData.wardEmail,
        password: formData.password || "default123",
        role: "STUDENT",
      };

      const user = await createUser(payload);
      if (user?.id) markUserCreated(user.id); // store studentId in admissionStore
    } catch (err: any) {
      console.error("Error creating user:", err);
    }
  };

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

      {errors.createUser && (
        <div className="text-red-600" role="alert" aria-live="assertive">
          {errors.createUser.join(", ")}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={
          loading ||
          !formData.firstName ||
          !formData.surname ||
          !formData.wardEmail
        }
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </div>
  );
}
