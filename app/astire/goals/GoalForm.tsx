// "use client";
// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";

// export default function GoalForm() {
//   const [title, setTitle] = useState("");
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: async (newGoal: { title: string }) => {
//       const res = await fetch("/app/astire/goals/api", {
//         method: "POST",
//         body: JSON.stringify(newGoal),
//       });
//       return res.json();
//     },
//     onSuccess: () => queryClient.invalidateQueries(["goals"]),
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     mutation.mutate({ title });
//     setTitle("");
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         type="text"
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="New Goal"
//         className="border p-2 rounded"
//       />
//       <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded">
//         Add
//       </button>
//     </form>
//   );
// }
