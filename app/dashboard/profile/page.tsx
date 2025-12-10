"use client";

import React, { useEffect, useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { formData, fetchAdmission, loading, errors } = useAdmissionStore();
  const user = useAuthStore((state) => state.user);

  // Example: load data on mount if user has applicationId
  useEffect(() => {
    if (user?.applicationId) fetchAdmission(user.applicationId);
  }, [user?.applicationId, fetchAdmission]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {loading && <div className="text-blue-600">Loading profile...</div>}
      {errors.fetchAdmission && (
        <div className="text-red-600">{errors.fetchAdmission.join(", ")}</div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-4 border rounded shadow-sm bg-white">
        <img
          src={formData.profilePicture || "/default-avatar.png"}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border"
        />
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">
            {formData.surname} {formData.firstName} {formData.otherNames}
          </h1>
          <p className="text-gray-600">{formData.email}</p>
          <p className="text-gray-600">
            Admission Progress: {formData.progress || 0}%
          </p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Family Members */}
        <div className="border rounded shadow-sm bg-white">
          <button
            onClick={() => toggleSection("familyMembers")}
            className="w-full flex justify-between items-center p-4 text-left font-medium text-blue-600 hover:bg-blue-50 transition"
          >
            Family Members ({formData.familyMembers?.length || 0})
            <span>
              {expandedSections.includes("familyMembers") ? "▲" : "▼"}
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.includes("familyMembers") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-t space-y-2"
              >
                {formData.familyMembers?.length ? (
                  formData.familyMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-2 border rounded flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div>
                        <p>
                          <strong>Relation:</strong> {member.relation}
                        </p>
                        <p>
                          <strong>Name:</strong> {member.name}
                        </p>
                        <p>
                          <strong>Postal:</strong> {member.postalAddress}
                        </p>
                        <p>
                          <strong>Residential:</strong>{" "}
                          {member.residentialAddress}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No family members added yet.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous Schools */}
        <div className="border rounded shadow-sm bg-white">
          <button
            onClick={() => toggleSection("previousSchools")}
            className="w-full flex justify-between items-center p-4 text-left font-medium text-blue-600 hover:bg-blue-50 transition"
          >
            Previous Schools ({formData.previousSchools?.length || 0})
            <span>
              {expandedSections.includes("previousSchools") ? "▲" : "▼"}
            </span>
          </button>
          <AnimatePresence>
            {expandedSections.includes("previousSchools") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-t space-y-2"
              >
                {formData.previousSchools?.length ? (
                  formData.previousSchools.map((school, idx) => (
                    <div
                      key={idx}
                      className="p-2 border rounded flex flex-col md:flex-row justify-between gap-4"
                    >
                      <p>
                        <strong>Name:</strong> {school.name}
                      </p>
                      <p>
                        <strong>Location:</strong> {school.location}
                      </p>
                      <p>
                        <strong>Start:</strong>{" "}
                        {new Date(school.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>End:</strong>{" "}
                        {new Date(school.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No previous schools added yet.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Medical Info */}
        <div className="border rounded shadow-sm bg-white">
          <button
            onClick={() => toggleSection("medicalInfo")}
            className="w-full flex justify-between items-center p-4 text-left font-medium text-blue-600 hover:bg-blue-50 transition"
          >
            Medical Info
            <span>{expandedSections.includes("medicalInfo") ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {expandedSections.includes("medicalInfo") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-t space-y-2"
              >
                <p>
                  <strong>Medical Summary:</strong>{" "}
                  {formData.medicalSummary || "N/A"}
                </p>
                <p>
                  <strong>Blood Type:</strong> {formData.bloodType || "N/A"}
                </p>
                <p>
                  <strong>Special Disability:</strong>{" "}
                  {formData.specialDisability || "N/A"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
