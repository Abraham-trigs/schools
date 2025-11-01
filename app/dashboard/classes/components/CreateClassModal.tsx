// "use client";

// import { useState } from "react";
// import { Dialog } from "@headlessui/react";
// import { Plus } from "lucide-react";
// import axios from "axios";

// export default function CreateClassModal() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [name, setName] = useState("");

//   const handleCreate = async () => {
//     try {
//       await axios.post("/api/classes", { name });
//       setIsOpen(false);
//       setName("");
//       // Ideally: refresh table after creation
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <>
//       <button
//         className="flex items-center gap-2 px-4 py-2 bg-ford-primary text-white rounded hover:bg-ford-secondary"
//         onClick={() => setIsOpen(true)}
//       >
//         <Plus className="w-4 h-4" />
//         Add Class
//       </button>

//       <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
//         <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
//         <div className="fixed inset-0 flex items-center justify-center p-4">
//           <Dialog.Panel className="bg-ford-card rounded-lg p-6 w-full max-w-sm shadow-lg">
//             <Dialog.Title className="text-lg font-bold text-white mb-4">Create Class</Dialog.Title>
//             <input
//               type="text"
//               className="w-full p-2 rounded bg-white text-black mb-4"
//               placeholder="Class Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//             />
//             <div className="flex justify-end gap-2">
//               <button
//                 className="px-4 py-2 bg-white text-black rounded"
//                 onClick={() => setIsOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-ford-primary text-white rounded"
//                 onClick={handleCreate}
//               >
//                 Create
//               </button>
//             </div>
//           </Dialog.Panel>
//         </div>
//       </Dialog>
//     </>
//   );
// }
