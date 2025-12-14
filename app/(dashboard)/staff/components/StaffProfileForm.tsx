"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  positionRoleMap,
  inferDepartmentFromPosition,
  requiresClass,
  inferRoleFromPosition,
} from "@/lib/api/constants/roleInference";
import { useUserStore } from "@/app/store/useUserStore";
import { useStaffStore } from "@/app/store/useStaffStore";

interface UserFormData {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface StaffFormData {
  position: string;
  department: string;
  classId: string;
  salary: string;
  hireDate: string;
}

export default function StaffStepForm() {
  const createUser = useUserStore((state) => state.createUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const createStaffRecord = useStaffStore((state) => state.createStaffRecord);

  const [step, setStep] = useState(1);

  const [userData, setUserData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [staffData, setStaffData] = useState<StaffFormData>({
    position: "",
    department: "",
    classId: "",
    salary: "",
    hireDate: "",
  });

  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const positionOptions = useMemo(() => Object.keys(positionRoleMap), []);

  const isStep1Valid = userData.name && userData.email && userData.password;
  const isStep2Valid =
    staffData.position &&
    (!requiresClass(staffData.position) || staffData.classId) &&
    !!userData.id;

  // ------------------- Handlers -------------------
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleStaffChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let updated = { ...staffData, [name]: value };

    if (name === "position") {
      updated.department = inferDepartmentFromPosition(value);
      if (!requiresClass(value)) updated.classId = "";
    }

    setStaffData(updated);
  };

  const handleNext = async () => {
    if (!isStep1Valid) return setStep1Error("Please fill all user fields");
    setStep1Error(null);
    setStep1Loading(true);

    try {
      const newUser = await createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      if (!newUser?.id) throw new Error("User creation failed");

      setUserData({
        ...userData,
        id: newUser.id,
        role: newUser.role || inferRoleFromPosition(staffData.position),
      });

      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.message || "Failed to create user");
    } finally {
      setStep1Loading(false);
    }
  };

  const handlePrev = () => setStep(1);

  const handleSubmit = async () => {
    if (!isStep2Valid)
      return setStep2Error(
        "Please select a position, class (if required), and ensure user is created"
      );

    setStep2Error(null);
    setStep2Loading(true);

    const prevUserData = { ...userData }; // for undo
    try {
      const newStaff = await createStaffRecord({
        userId: userData.id!,
        position: staffData.position,
        department: staffData.department || "",
        classId: staffData.classId || "",
        salary: staffData.salary || "",
        hireDate: staffData.hireDate || "",
      });

      if (!newStaff) throw new Error("Staff creation failed");

      toast.success("User and staff created successfully!");

      // Reset form
      resetForm();
    } catch (err: any) {
      setStep2Error(err?.message || "Failed to create staff");

      // Rollback user if staff creation fails
      if (userData.id) {
        try {
          await deleteUser(userData.id);
          toast(
            (t) => (
              <span>
                User rolled back due to staff creation failure.
                <button
                  className="ml-2 underline"
                  onClick={async () => {
                    await createUser({
                      name: prevUserData.name,
                      email: prevUserData.email,
                      password: prevUserData.password,
                    });
                    toast.dismiss(t.id);
                  }}
                >
                  Undo
                </button>
              </span>
            ),
            { duration: 10000 }
          );
        } catch (rollbackErr: any) {
          console.error("Failed to rollback user:", rollbackErr);
        }
      }
    } finally {
      setStep2Loading(false);
    }
  };

  const resetForm = () => {
    setUserData({ name: "", email: "", password: "", role: "" });
    setStaffData({
      position: "",
      department: "",
      classId: "",
      salary: "",
      hireDate: "",
    });
    setStep(1);
  };

  // ------------------- Render -------------------
  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Step Indicator */}
      <div className="flex mb-6">
        <div
          className={`flex-1 py-2 text-center rounded-t-lg font-semibold transition ${
            step === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          User
        </div>
        <div
          className={`flex-1 py-2 text-center rounded-t-lg font-semibold transition ${
            step === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          Staff
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          {step1Error && <div className="text-red-600">{step1Error}</div>}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={userData.name}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={userData.email}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={userData.password}
            onChange={handleUserChange}
            className="w-full border rounded px-3 py-2"
          />
          <button
            className={`w-full py-2 rounded text-white ${
              isStep1Valid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleNext}
            disabled={!isStep1Valid || step1Loading}
          >
            {step1Loading ? "Creating user..." : "Next"}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {step2Error && <div className="text-red-600">{step2Error}</div>}
          <select
            name="position"
            value={staffData.position}
            onChange={handleStaffChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Position</option>
            {positionOptions.map((pos) => (
              <option key={pos} value={pos}>
                {pos.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="department"
            value={staffData.department}
            readOnly
            placeholder="Department (auto)"
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />

          {staffData.position && requiresClass(staffData.position) && (
            <input
              type="text"
              name="classId"
              value={staffData.classId}
              onChange={handleStaffChange}
              placeholder="Class ID"
              className="w-full border rounded px-3 py-2"
            />
          )}

          <input
            type="number"
            name="salary"
            value={staffData.salary}
            onChange={handleStaffChange}
            placeholder="Salary"
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="date"
            name="hireDate"
            value={staffData.hireDate}
            onChange={handleStaffChange}
            className="w-full border rounded px-3 py-2"
          />

          <div className="flex justify-between mt-4">
            <button
              className="px-4 py-2 border rounded"
              onClick={handlePrev}
              disabled={step2Loading}
            >
              Prev
            </button>
            <button
              className={`px-4 py-2 rounded text-white ${
                isStep2Valid
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleSubmit}
              disabled={!isStep2Valid || step2Loading}
            >
              {step2Loading ? "Creating staff..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
