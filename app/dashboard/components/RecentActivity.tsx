"use client";

import { motion } from "framer-motion";

interface Activity {
  id: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  data: Activity[];
}

export default function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="bg-ford-card p-4 md:p-6 lg:p-8 rounded-lg shadow-lg">
      <h3 className="text-white font-semibold text-lg mb-4">Recent Activity</h3>
      <div className="flex flex-col gap-3">
        {data.length === 0 ? (
          <p className="text-white/70 text-sm">No recent activity.</p>
        ) : (
          data.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
              className="flex justify-between items-center p-3 bg-white/10 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            >
              <p className="text-white text-sm">{activity.description}</p>
              <p className="text-white/70 text-xs">
                {new Date(activity.timestamp).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
