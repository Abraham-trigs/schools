// "use client";

// import { useState, useEffect } from "react";
// import axios from "axios";

// interface Student {
//   id: string;
//   name: string;
// }

// interface ClassData {
//   id: string;
//   name: string;
//   school: { id: string; name: string };
//   students: Student[];
// }

// interface ViewClassModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   classData: ClassData;
// }

// export default function ViewClassModal({
//   isOpen,
//   onClose,
//   classData,
// }: ViewClassModalProps) {
//   const [students, setStudents] = useState<Student[]>(classData.students ?? []);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Optional: fetch fresh students if needed
//   useEffect(() => {
//     const fetchStudents = async () => {
//       if (!classData.id) return;
//       setLoading(true);
//       setError("");
//       try {
//         const res = await axios.get<ClassData>(
//           `/api/classes/${classData.id}/students`,
//           { withCredentials: true }
//         );
//         setStudents(res.data.students ?? []);
//       } catch (err: any) {
//         setError(err.response?.data?.message || "Failed to load students");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStudents();
//   }, [classData.id]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-opacity-30 flex justify-center items-start pt-20 z-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-auto max-h-[80vh]">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <div>
//             <h1 className="text-2xl font-bold">{classData.name}</h1>
//             <p className="text-gray-600">School: {classData.school}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
//           >
//             ✕
//           </button>
//         </div>

//         {/* Students Section */}
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Students</h2>
//           {loading ? (
//             <p>Loading students...</p>
//           ) : error ? (
//             <p className="text-red-500">{error}</p>
//           ) : students.length === 0 ? (
//             <p className="text-gray-500">No students in this class yet.</p>
//           ) : (
//             <ul className="divide-y border rounded-md">
//               {students.map((s) => (
//                 <li
//                   key={s.id}
//                   className="px-4 py-2 flex justify-between items-center"
//                 >
//                   <span>{s.name}</span>
//                   <div className="flex gap-2">
//                     <button className="text-yellow-600 hover:underline">
//                       Edit
//                     </button>
//                     <button className="text-red-600 hover:underline">
//                       Remove
//                     </button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
