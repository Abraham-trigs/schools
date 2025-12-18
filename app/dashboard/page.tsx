import SummaryCard from "./components/SummaryCard.tsx";
import ChartCard from "./components/ChartCard.tsx";
import RecentActivity from "./components/RecentActivity.tsx";
import { prisma } from "@/lib/db";

// Client Components
import StudentsPerClassChart from "./components/StudentsPerClassChart.tsx";
import AttendanceTrendChart from "./components/AttendanceTrendChart.tsx";

export default async function DashboardPage() {
  const students = await prisma.user.count({ where: { role: "STUDENT" } });
  const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
  const classes = await prisma.class.count();
  const parents = await prisma.user.count({ where: { role: "PARENT" } });

  // Ensure previous counts are valid (>= 0)
  const prevStudents = Math.max(0, students - Math.floor(Math.random() * 5));
  const prevTeachers = Math.max(0, teachers - Math.floor(Math.random() * 2));
  const prevClasses = Math.max(0, classes - Math.floor(Math.random() * 1));
  const prevParents = Math.max(0, parents - Math.floor(Math.random() * 3));

  // Calculate trend % (positive or negative)
  const calcTrend = (current: number, previous: number) =>
    previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);

  const summary = [
    {
      title: "Students",
      value: students,
      colorClass:
        "bg-white/10 backdrop-blur-3xl border border-white/90 shadow-xl supports-[backdrop-filter]:bg-[#ffffff]/7 supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 hover:bg-ford-",

      icon: "Users",
      trend: calcTrend(students, prevStudents),
    },
    {
      title: "Teachers",
      value: teachers,
      colorClass:
        "bg-white/10 backdrop-blur-3xl border border-white/90 shadow-xl supports-[backdrop-filter]:bg-[#ffffff]/7 supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 hover:bg-ford-",

      icon: "User",
      trend: calcTrend(teachers, prevTeachers),
    },
    {
      title: "Classes",
      value: classes,
      colorClass:
        "bg-white/10 backdrop-blur-3xl border border-white/90 shadow-xl supports-[backdrop-filter]:bg-[#ffffff]/7 supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 hover:bg-",
      icon: "BookOpen",
      trend: calcTrend(classes, prevClasses),
    },
    {
      title: "Parents",
      value: parents,
      colorClass:
        "bg-white/10 backdrop-blur-3xl border border-white/90 shadow-2xl supports-[backdrop-filter]:bg-[#ffffff]/7 supports-[backdrop-filter]:backdrop-blur-md transition-all duration-300 hover:bg-",

      icon: "Users2",
      trend: calcTrend(parents, prevParents),
    },
  ];

  const studentsPerClassRaw = await prisma.class.findMany({
    select: { name: true, _count: { select: { students: true } } },
  });

  const charts = {
    studentsPerClass: studentsPerClassRaw.map((c) => ({
      className: c.name,
      count: c._count.students,
    })),
    attendanceTrend: [
      { date: "2025-10-01", attendance: 90 },
      { date: "2025-10-02", attendance: 70 },
      { date: "2025-10-03", attendance: 88 },
      { date: "2025-10-04", attendance: 95 },
      { date: "2025-10-05", attendance: 50 },
      { date: "2025-10-08", attendance: 92 },
      { date: "2025-10-09", attendance: 88 },
      { date: "2025-10-10", attendance: 95 },
    ],
  };

  const recentActivityRaw = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentActivity = recentActivityRaw.map((a) => ({
    id: a.id,
    description: a.description,
    timestamp: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 ">
        {summary.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            trend={card.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-red-600">
        <ChartCard title="Students per Class">
          <StudentsPerClassChart data={charts.studentsPerClass} />
        </ChartCard>

        <ChartCard title="Attendance Trend ">
          <AttendanceTrendChart data={charts.attendanceTrend} ss />
        </ChartCard>
      </div>

      <RecentActivity data={recentActivity} />
    </div>
  );
}
