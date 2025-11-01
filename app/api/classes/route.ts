import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

// GET all classes
export async function GET(req: Request) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const perPage = Number(searchParams.get("perPage") || "10");
  const search = searchParams.get("search") || "";

  const where = {
    schoolId: user.schoolId,
    name: search ? { contains: search, mode: "insensitive" } : undefined,
  };

  const total = await prisma.class.count({ where });
  const classes = await prisma.class.findMany({
    where,
    include: {
      students: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ classes, total, page, perPage });
}

// POST create class
export async function POST(req: Request) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = classSchema.parse(body);

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create class" },
      { status: 400 }
    );
  }
}
