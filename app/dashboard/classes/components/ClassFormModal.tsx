// "use client";

// import { useState, useEffect } from "react";
// import clsx from "clsx";
// import axios from "axios";
// import { motion } from "framer-motion";
// import { z } from "zod";

// interface ClassFormModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   initialData?: { id?: string; name?: string; schoolId?: string };
//   onSuccess?: () => void;
// }

// const classSchema = z.object({
//   name: z.string().min(1, "Class name is required"),
//   schoolId: z.string().cuid(),
// });

// export default function ClassFormModal({ isOpen, onClose, initialData, onSuccess }: ClassFormModalProps) {
//   const [name, setName] = useState(initialData?.name || "");
//   const [schoolId, setSchoolId] = useState(initialData?.schoolId || "");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (initialData) {
//       setName(initialData.name || "");
//       setSchoolId(initialData.schoolId || "");
//     }
//   }, [initialData]);

//   const handleSubmit = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       classSchema.parse({ name, schoolId });

//       if (initialData?.id) {
//         // Edit
//         await axios.patch(`/api/classes/${initialData.id}`, { name });
//       } else {
//         // Create
//         await axios.post("/api/classes", { name, schoolId });
//       }

//       onSuccess?.();
//       onClose();
//     } catch (err: any) {
//       setError(err?.response?.data?.message || err.message || "Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         exit={{ opacity: 0, scale: 0.95 }}
//         className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
//       >
//         <h2 className="text-xl font-bold mb-4">{initialData?.id ? "Edit Class" : "Add Class"}</h2>

//         {error && <p className="text-red-500 mb-2">{error}</p>}

//         <input
//           type="text"
//           placeholder="Class Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="w-full mb-3 p-2 border rounded"
//         />
//         <input
//           type="text"
//           placeholder="School ID"
//           value={schoolId}
//           onChange={(e) => setSchoolId(e.target.value)}
//           className="w-full mb-3 p-2 border rounded"
//         />

//         <div className="flex justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className={clsx(
//               "px-4 py-2 rounded text-white",
//               loading ? "bg-gray-400" : "bg-ford-primary hover:bg-ford-secondary"
//             )}
//           >
//             {loading ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
