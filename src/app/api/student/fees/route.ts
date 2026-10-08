import {NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({error:"Unauthorized."},{status:401});

  const s = await prisma.student.findUnique({where:{userId:u.id}});
  if (!s) return NextResponse.json({error:"Student record not found."},{status:404});

  const session = await prisma.academicSession.findFirst({where:{isCurrent:true}});
  if (!session) return NextResponse.json({fee:null,payments:[],paid:0,balance:0});

  const fee = await prisma.feeStructure.findFirst({
    where:{programmeId:s.programmeId,sessionId:session.id},
    orderBy:{createdAt:"desc"},
  }) ?? await prisma.feeStructure.findFirst({
    where:{programmeId:null,sessionId:session.id},
    orderBy:{createdAt:"desc"},
  });

  const payments = await prisma.payment.findMany({
    where:{studentId:s.id},
    include:{feeStructure:true},
    orderBy:{createdAt:"desc"},
  });

  const paid = fee
    ? payments
        .filter(p=>p.feeStructureId===fee.id && p.status==="SUCCESSFUL")
        .reduce((a,p)=>a+Number(p.amount),0)
    : 0;

  return NextResponse.json({
    fee,
    payments,
    paid,
    balance:Math.max(Number(fee?.amount||0)-paid,0),
  });
}
