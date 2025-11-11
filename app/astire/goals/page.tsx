// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { prisma } from "@/lib/prisma";
// import GoalCard from "../components/GoalCard.tsx";

// export default function GoalsPage() {
//   const { data, isLoading } = useQuery(["goals"], async () => {
//     const res = await fetch("/astire/goals/api/route");
//     return res.json();
//   });

//   if (isLoading) return <p>Loading goals...</p>;

//   return (
//     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//       {data?.map((goal: any) => (
//         <GoalCard key={goal.id} goal={goal} />
//       ))}
//     </div>
//   );
// }
