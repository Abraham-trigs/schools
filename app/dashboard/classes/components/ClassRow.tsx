// "use client";

// import { useState } from "react";
// import { ClassData } from "../types";
// import EditClassModal from "./EditClassModal.tsx";
// import DeleteClassModal from "./DeleteClassModal.tsx";

// interface ClassRowProps {
//   cls: ClassData;
//   onUpdate: () => void;
// }

// export default function ClassRow({ cls, onUpdate }: ClassRowProps) {
//   const [editOpen, setEditOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);

//   return (
//     <>
//       <tr className="border-b hover:bg-gray-50">
//         <td className="px-4 py-2">{cls.name}</td>
//         <td className="px-4 py-2">{cls.school.name}</td>
//         <td className="px-4 py-2">{cls.students.length}</td>
//         <td className="px-4 py-2 flex gap-2">
//           <button
//             onClick={() => setEditOpen(true)}
//             className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
//           >
//             Edit
//           </button>
//           <button
//             onClick={() => setDeleteOpen(true)}
//             className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
//           >
//             Delete
//           </button>
//         </td>
//       </tr>

//       {/* Modals */}
//       <EditClassModal
//         id={cls.id}
//         name={cls.name}
//         isOpen={editOpen}
//         onClose={() => setEditOpen(false)}
//         onSuccess={onUpdate}
//       />
//       <DeleteClassModal
//         id={cls.id}
//         isOpen={deleteOpen}
//         onClose={() => setDeleteOpen(false)}
//         onSuccess={onUpdate}
//       />
//     </>
//   );
// }
