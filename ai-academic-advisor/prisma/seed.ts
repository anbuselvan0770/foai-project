import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user (Arun Kumar)
  const hashedPassword = await bcrypt.hash('demo123', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@academic.ai' },
    update: {},
    create: {
      name: 'Arun Kumar',
      email: 'demo@academic.ai',
      passwordHash: hashedPassword,
      isDemo: true,
    },
  })

  console.log('✅ Demo user created:', demoUser.email)

  // Create student profile
  await prisma.studentProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      department: 'Computer Science and Engineering',
      year: 3,
      semester: 5,
      studyHoursPerDay: 3,
      learningStyle: 'Videos',
      targetGPA: 75,
      onboardingDone: true,
    },
  })

  console.log('✅ Student profile created')

  // Create subjects (delete existing first)
  await prisma.subject.deleteMany({ where: { userId: demoUser.id } })

  const subjects = [
    { name: 'Data Structures', marks: 82, attendance: 91, difficulty: 'Medium', grade: 'A' },
    { name: 'Operating Systems', marks: 62, attendance: 74, difficulty: 'High', grade: 'B' },
    { name: 'Database Management Systems', marks: 78, attendance: 86, difficulty: 'Medium', grade: 'B+' },
    { name: 'Computer Networks', marks: 68, attendance: 79, difficulty: 'High', grade: 'B' },
    { name: 'Software Engineering', marks: 85, attendance: 90, difficulty: 'Medium', grade: 'A' },
  ]

  for (const subject of subjects) {
    await prisma.subject.create({
      data: {
        userId: demoUser.id,
        ...subject,
        semester: 5,
      },
    })
  }

  console.log('✅ Subjects created:', subjects.map(s => s.name).join(', '))

  // Create interests
  await prisma.interest.deleteMany({ where: { userId: demoUser.id } })

  const interests = ['Cloud Computing', 'DevOps', 'Networking']
  for (const name of interests) {
    await prisma.interest.create({
      data: { userId: demoUser.id, name },
    })
  }

  console.log('✅ Interests created:', interests.join(', '))

  // Create career goal
  await prisma.careerGoal.deleteMany({ where: { userId: demoUser.id } })

  await prisma.careerGoal.create({
    data: {
      userId: demoUser.id,
      title: 'Cloud Engineer',
      isPrimary: true,
      isCustom: false,
    },
  })

  console.log('✅ Career goal: Cloud Engineer')

  // Create academic risk record
  await prisma.academicRisk.deleteMany({ where: { userId: demoUser.id } })

  await prisma.academicRisk.create({
    data: {
      userId: demoUser.id,
      riskLevel: 'MEDIUM',
      riskScore: 45,
      riskFactors: JSON.stringify([
        {
          category: 'Attendance',
          description: 'Attendance in Operating Systems (74%) is below the minimum threshold of 75%',
          severity: 'high',
          weight: 30,
        },
        {
          category: 'Performance',
          description: 'Operating Systems marks (62%) are below target performance level',
          severity: 'medium',
          weight: 20,
        },
        {
          category: 'Attendance Warning',
          description: 'Computer Networks attendance (79%) is approaching minimum threshold',
          severity: 'medium',
          weight: 15,
        },
      ]),
      suggestions: JSON.stringify([
        'Attend all remaining Operating Systems classes to avoid debarment.',
        'Improve attendance for Computer Networks to stay above the warning threshold.',
        'Allocate additional study time for Operating Systems — aim for 2+ hours per day.',
        'Practice previous Operating Systems exam questions to build confidence.',
        'Consult your faculty advisor for personalized academic guidance.',
      ]),
    },
  })

  console.log('✅ Academic risk record created')

  // Create initial chat session
  const chatSession = await prisma.chatSession.upsert({
    where: { id: 'demo-session-001' },
    update: {},
    create: {
      id: 'demo-session-001',
      userId: demoUser.id,
      title: 'Academic Overview',
    },
  })

  await prisma.chatMessage.deleteMany({ where: { chatSessionId: chatSession.id } })

  await prisma.chatMessage.createMany({
    data: [
      {
        chatSessionId: chatSession.id,
        role: 'user',
        content: 'What should I focus on this week?',
      },
      {
        chatSessionId: chatSession.id,
        role: 'assistant',
        content: `Based on your academic profile, here are your top priorities for this week:\n\n1. **Operating Systems (62%)** — 4 hours: Critical attendance (74%) and below-target marks require immediate attention.\n2. **Computer Networks (68%)** — 2 hours: Attendance approaching warning threshold. Practice networking concepts.\n3. **Cloud Fundamentals** — 2 hours: Aligned with your Cloud Engineer career goal.\n\n> AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance.`,
      },
    ],
  })

  console.log('✅ Demo chat session created')

  // Create study plan
  await prisma.studyPlan.deleteMany({ where: { userId: demoUser.id } })

  const studyPlan = await prisma.studyPlan.create({
    data: {
      userId: demoUser.id,
      weekStart: new Date(),
      title: 'Weekly Study Plan — Semester 5',
    },
  })

  const studyTasks = [
    { subject: 'Operating Systems', duration: 1.5, priority: 'Critical', goal: 'Review process management and scheduling algorithms', dayOfWeek: 'Monday', timeSlot: 'Evening' },
    { subject: 'Computer Networks', duration: 1.5, priority: 'High', goal: 'Practice TCP/IP protocols and subnetting', dayOfWeek: 'Monday', timeSlot: 'Night' },
    { subject: 'Operating Systems', duration: 2, priority: 'Critical', goal: 'Study memory management and virtual memory concepts', dayOfWeek: 'Tuesday', timeSlot: 'Evening' },
    { subject: 'Cloud Fundamentals', duration: 1, priority: 'High', goal: 'Complete AWS Cloud Practitioner module 1', dayOfWeek: 'Wednesday', timeSlot: 'Morning' },
    { subject: 'Computer Networks', duration: 1, priority: 'High', goal: 'Review OSI model and application layer protocols', dayOfWeek: 'Wednesday', timeSlot: 'Evening' },
    { subject: 'Database Management Systems', duration: 1, priority: 'Medium', goal: 'Practice SQL queries and normalization', dayOfWeek: 'Thursday', timeSlot: 'Evening' },
    { subject: 'Operating Systems', duration: 2, priority: 'Critical', goal: 'File systems and I/O management — practice questions', dayOfWeek: 'Friday', timeSlot: 'Evening' },
    { subject: 'Data Structures', duration: 1, priority: 'Low', goal: 'Review and maintain — graph algorithms practice', dayOfWeek: 'Saturday', timeSlot: 'Morning' },
    { subject: 'Cloud Fundamentals', duration: 2, priority: 'High', goal: 'Hands-on AWS lab: EC2, S3, and IAM basics', dayOfWeek: 'Saturday', timeSlot: 'Afternoon' },
    { subject: 'Software Engineering', duration: 1, priority: 'Low', goal: 'Review Agile methodologies and design patterns', dayOfWeek: 'Sunday', timeSlot: 'Morning' },
  ]

  for (const task of studyTasks) {
    await prisma.studyTask.create({
      data: { ...task, studyPlanId: studyPlan.id },
    })
  }

  console.log('✅ Study plan with', studyTasks.length, 'tasks created')

  // Create recommendations
  await prisma.recommendation.deleteMany({ where: { userId: demoUser.id } })

  const recommendations = [
    {
      title: 'Urgently Strengthen Operating Systems',
      category: 'Study',
      priority: 'Critical',
      reason: 'Operating Systems marks (62%) are below target and attendance (74%) is critically low — approaching debarment threshold.',
      benefit: 'Avoid exam debarment and improve performance in a subject critical for Cloud Engineering.',
      suggestedAction: 'Dedicate 2 hours daily to Operating Systems. Review process management, memory management, and file systems.',
    },
    {
      title: 'Improve Computer Networks Performance',
      category: 'Study',
      priority: 'High',
      reason: 'Computer Networks (68%) is below target and the subject is directly relevant to your Cloud Engineer career goal.',
      benefit: 'Strong networking knowledge is fundamental for Cloud Engineering roles — this directly impacts employability.',
      suggestedAction: 'Focus on TCP/IP, subnetting, routing protocols, and network security concepts.',
    },
    {
      title: 'Learn Docker & Kubernetes',
      category: 'Skill',
      priority: 'High',
      reason: 'Containerization is a core skill for Cloud Engineering. Your interest in DevOps and Cloud Computing aligns perfectly.',
      benefit: 'Docker and Kubernetes proficiency is required for most Cloud Engineer job descriptions.',
      suggestedAction: 'Complete the official Docker Getting Started guide, then explore Kubernetes basics on kubernetes.io.',
    },
    {
      title: 'Earn AWS Cloud Practitioner Certification',
      category: 'Course',
      priority: 'High',
      reason: 'Your Cloud Engineer career goal and Cloud Computing interest make this certification highly valuable.',
      benefit: 'AWS Cloud Practitioner is the most recognized entry-level cloud certification and validates your cloud knowledge.',
      suggestedAction: 'Use AWS Skill Builder (free) to prepare and schedule the certification exam.',
    },
    {
      title: 'Learn Linux Administration Fundamentals',
      category: 'Skill',
      priority: 'High',
      reason: 'Linux is the foundation of cloud infrastructure. Your Operating Systems course provides theoretical background.',
      benefit: 'Practical Linux skills are required for all Cloud and DevOps engineering roles.',
      suggestedAction: 'Complete "The Missing Semester of CS Education" (MIT, free) and practice on a Linux VM.',
    },
    {
      title: 'Explore Terraform (Infrastructure as Code)',
      category: 'Skill',
      priority: 'Medium',
      reason: 'Infrastructure as Code is a key DevOps/Cloud Engineering skill aligned with your interests.',
      benefit: 'Terraform expertise is highly valued in cloud engineering roles and demonstrates practical cloud skills.',
      suggestedAction: 'Complete HashiCorp Terraform tutorials (free) and deploy a simple cloud infrastructure.',
    },
    {
      title: 'Google Cloud Skills Boost Labs',
      category: 'Resource',
      priority: 'Medium',
      reason: 'Hands-on cloud labs directly support your Cloud Engineer goal and align with your Cloud Computing interest.',
      benefit: 'Practical experience with real cloud environments is more valuable than theoretical knowledge alone.',
      suggestedAction: 'Complete the Cloud Engineering learning path on Google Cloud Skills Boost (free tier available).',
    },
  ]

  for (const rec of recommendations) {
    await prisma.recommendation.create({
      data: { userId: demoUser.id, ...rec },
    })
  }

  console.log('✅ Recommendations created:', recommendations.length)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Demo Login Credentials:')
  console.log('   Email: demo@academic.ai')
  console.log('   Password: demo123')
  console.log('\n🎓 Demo Student: Arun Kumar (CSE Semester 5, Cloud Engineer)')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
