const { PrismaClient, UserRole, Gender, SemesterName, ResultStatus, PaymentStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 12);
  const studentUser = await prisma.user.upsert({
    where: { email: "student@demo.unicross.edu.ng" },
    update: { passwordHash, firstName: "Demo", lastName: "Student", role: UserRole.STUDENT, isActive: true },
    create: { email: "student@demo.unicross.edu.ng", firstName: "Demo", lastName: "Student", role: UserRole.STUDENT, passwordHash },
  });
  await prisma.user.upsert({
    where: { email: "lecturer@demo.unicross.edu.ng" },
    update: { passwordHash, firstName: "Demo", lastName: "Lecturer", role: UserRole.LECTURER, isActive: true },
    create: { email: "lecturer@demo.unicross.edu.ng", firstName: "Demo", lastName: "Lecturer", role: UserRole.LECTURER, passwordHash },
  });
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.unicross.edu.ng" },
    update: { passwordHash, firstName: "Demo", lastName: "Administrator", role: UserRole.UNIVERSITY_ADMIN, isActive: true },
    create: { email: "admin@demo.unicross.edu.ng", firstName: "Demo", lastName: "Administrator", role: UserRole.UNIVERSITY_ADMIN, passwordHash },
  });
  const campus = await prisma.campus.upsert({ where: { code: "MC" }, update: {}, create: { name: "Main Campus", code: "MC", address: "Calabar, Cross River State" } });
  const faculty = await prisma.faculty.upsert({ where: { code: "SCI" }, update: { campusId: campus.id }, create: { name: "Faculty of Science", code: "SCI", campusId: campus.id } });
  const department = await prisma.department.upsert({ where: { code: "CSC" }, update: { facultyId: faculty.id }, create: { name: "Computer Science", code: "CSC", facultyId: faculty.id } });
  const programme = await prisma.programme.upsert({ where: { code: "BSC-CS" }, update: { departmentId: department.id }, create: { name: "Computer Science", code: "BSC-CS", award: "B.Sc.", durationYears: 4, departmentId: department.id } });
  const session = await prisma.academicSession.upsert({ where: { name: "2025/2026" }, update: { isCurrent: true }, create: { name: "2025/2026", startDate: new Date("2025-10-01"), endDate: new Date("2026-09-30"), isCurrent: true } });
  await prisma.academicSession.updateMany({ where: { id: { not: session.id } }, data: { isCurrent: false } });
  const semester = await prisma.semester.upsert({ where: { name_sessionId: { name: SemesterName.FIRST, sessionId: session.id } }, update: {}, create: { name: SemesterName.FIRST, sessionId: session.id } });
  const student = await prisma.student.upsert({ where: { userId: studentUser.id }, update: { programmeId: programme.id, departmentId: department.id, entrySessionId: session.id, level: 300, gender: Gender.MALE, matricNumber: "UNICROSS/CSC/23/001" }, create: { userId: studentUser.id, programmeId: programme.id, departmentId: department.id, entrySessionId: session.id, level: 300, gender: Gender.MALE, matricNumber: "UNICROSS/CSC/23/001" } });

  // The demo student starts with no course registrations.
  // This lets the Course Registration module demonstrate the real registration workflow.
  await prisma.enrollment.deleteMany({ where: { studentId: student.id } });

  const courseData = [["CSC 301","Data Structures",3],["CSC 303","Database Systems",3],["CSC 305","Operating Systems",3],["CSC 307","Software Engineering",3],["CSC 309","Computer Networks",2]];
  for (const [code,title,unit] of courseData) {
    const course = await prisma.course.upsert({ where: { code }, update: { title, unit, level: 300, departmentId: department.id }, create: { code, title, unit, level: 300, departmentId: department.id } });
    await prisma.courseOffering.upsert({ where: { courseId_semesterId: { courseId: course.id, semesterId: semester.id } }, update: { sessionId: session.id }, create: { courseId: course.id, sessionId: session.id, semesterId: semester.id } });
  }

  const grades = [["CSC 301",24,62,86,"A",4],["CSC 303",22,57,79,"B",3],["CSC 305",21,55,76,"B",3],["CSC 307",25,60,85,"A",4],["CSC 309",18,53,71,"B",3]];
  for (const [code,caScore,examScore,totalScore,grade,gradePoint] of grades) {
    const course = await prisma.course.findUniqueOrThrow({ where: { code } });
    const offering = await prisma.courseOffering.findUniqueOrThrow({ where: { courseId_semesterId: { courseId: course.id, semesterId: semester.id } } });
    await prisma.result.upsert({ where: { studentId_offeringId: { studentId: student.id, offeringId: offering.id } }, update: { semesterId: semester.id, caScore, examScore, totalScore, grade, gradePoint, status: ResultStatus.PUBLISHED }, create: { studentId: student.id, offeringId: offering.id, semesterId: semester.id, caScore, examScore, totalScore, grade, gradePoint, status: ResultStatus.PUBLISHED } });
  }
  const fee = await prisma.feeStructure.upsert({ where: { id: "demo-fee-2025-2026" }, update: { amount: 180000, sessionId: session.id, programmeId: programme.id }, create: { id: "demo-fee-2025-2026", name: "2025/2026 Undergraduate School Fees", amount: 180000, sessionId: session.id, programmeId: programme.id } });
  await prisma.payment.upsert({ where: { reference: "DEMO-PAY-001" }, update: { studentId: student.id, userId: studentUser.id, feeStructureId: fee.id, amount: 180000, status: PaymentStatus.SUCCESSFUL, paidAt: new Date("2026-01-15") }, create: { reference: "DEMO-PAY-001", studentId: student.id, userId: studentUser.id, feeStructureId: fee.id, amount: 180000, status: PaymentStatus.SUCCESSFUL, paidAt: new Date("2026-01-15") } });
  await prisma.announcement.upsert({ where: { id: "demo-announcement-1" }, update: { title: "Course registration reminder", body: "Students should review their registered courses before the published deadline.", published: true, publishedAt: new Date(), authorId: adminUser.id }, create: { id: "demo-announcement-1", title: "Course registration reminder", body: "Students should review their registered courses before the published deadline.", published: true, publishedAt: new Date(), authorId: adminUser.id } });
  console.log("Demo university data seeded.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());