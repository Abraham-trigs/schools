// // app/dashboard/components/UserFormButton.tsx
// "use client";

// import { useState } from "react";
// import { Dialog } from "@headlessui/react";

// interface UserFormButtonProps {
//   buttonLabel?: string;
//   onSuccess?: (user: any) => void; // Replace `any` with your User type
// }

// export default function UserFormButton({
//   buttonLabel = "Add User",
//   onSuccess,
// }: UserFormButtonProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");

//   const handleSubmit = () => {
//     // Mock user creation, replace with API call
//     const newUser = { id: Date.now().toString(), name, email };
//     if (onSuccess) onSuccess(newUser);

//     setName("");
//     setEmail("");
//     setIsOpen(false);
//   };

//   return (
//     <>
//       <button
//         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//         onClick={() => setIsOpen(true)}
//       >
//         {buttonLabel}
//       </button>

//       <Dialog
//         open={isOpen}
//         onClose={() => setIsOpen(false)}
//         className="fixed inset-0 z-50 flex items-center justify-center"
//       >
//         {/* Overlay */}
//         <div className="fixed inset-0 bg-black/30" />

//         {/* Modal content */}
//         <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative z-10">
//           <h2 className="text-lg font-bold mb-4">{buttonLabel}</h2>

//           <div className="flex flex-col gap-3">
//             <input
//               type="text"
//               placeholder="Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
//             />
//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
//             />
//           </div>

//           <div className="flex justify-end gap-2 mt-4">
//             <button
//               className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
//               onClick={() => setIsOpen(false)}
//             >
//               Cancel
//             </button>
//             <button
//               className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//               onClick={handleSubmit}
//             >
//               Submit
//             </button>
//           </div>
//         </div>
//       </Dialog>
//     </>
//   );
// }
