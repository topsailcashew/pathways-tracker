import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Get the existing tenant (created during registration)
    const tenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!tenant) {
        console.error('❌ No tenant found. Please register a user first.');
        return;
    }

    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})`);

    // Check if already seeded
    const existingStages = await prisma.stage.count({ where: { tenantId: tenant.id } });
    if (existingStages > 0) {
        console.log('⚠️  Stages already exist. Clearing existing data for re-seeding...');
        // Clear existing data in correct order to avoid foreign key constraints
        await prisma.task.deleteMany({ where: { tenantId: tenant.id } });
        await prisma.note.deleteMany({ where: { member: { tenantId: tenant.id } } });
        await prisma.memberTag.deleteMany({ where: { member: { tenantId: tenant.id } } });
        await prisma.resource.deleteMany({ where: { member: { tenantId: tenant.id } } });
        await prisma.stageHistory.deleteMany({ where: { member: { tenantId: tenant.id } } });
        await prisma.message.deleteMany({ where: { tenantId: tenant.id } });
        await prisma.member.deleteMany({ where: { tenantId: tenant.id } });
        await prisma.automationRule.deleteMany({ where: { tenantId: tenant.id } });
        await prisma.stage.deleteMany({ where: { tenantId: tenant.id } });
        console.log('✅ Cleared existing data');
    }

    // Create additional users (team members)
    const passwordHash = await bcrypt.hash('password123', 10);

    // Get existing users or create new ones
    const existingUsers = await prisma.user.findMany({
        where: { tenantId: tenant.id }
    });

    let pastor = existingUsers.find(u => u.email === 'pastor@church.org' || u.role === 'ADMIN');
    let leader = existingUsers.find(u => u.email === 'leader@church.org' && u.role === 'TEAM_LEADER');
    let volunteer = existingUsers.find(u => u.email === 'volunteer@church.org' && u.role === 'VOLUNTEER');

    if (!pastor) {
        pastor = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: 'pastor@church.org',
                passwordHash,
                firstName: 'John',
                lastName: 'Smith',
                role: 'ADMIN',
                avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=4F46E5',
                onboardingComplete: true,
            },
        });
    }

    if (!leader) {
        leader = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: 'leader@church.org',
                passwordHash,
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: 'TEAM_LEADER',
                avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=EC4899',
                onboardingComplete: true,
            },
        });
    }

    if (!volunteer) {
        volunteer = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: 'volunteer@church.org',
                passwordHash,
                firstName: 'Mike',
                lastName: 'Davis',
                role: 'VOLUNTEER',
                avatar: 'https://ui-avatars.com/api/?name=Mike+Davis&background=10B981',
                onboardingComplete: true,
            },
        });
    }

    const users = [pastor, leader, volunteer].filter(Boolean);

    console.log(`✅ Created ${users.length} team members`);

    // Create Stages for NEWCOMER pathway
    const newcomerStages = await Promise.all([
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'First Visit',
                pathway: 'NEWCOMER',
                order: 1,
                description: 'Visitor attended service for the first time',
                autoAdvanceEnabled: false,
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Follow-up Call',
                pathway: 'NEWCOMER',
                order: 2,
                description: 'Initial contact made via phone or email',
                autoAdvanceEnabled: true,
                autoAdvanceType: 'TASK_COMPLETED',
                autoAdvanceValue: 'welcome call',
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Second Visit',
                pathway: 'NEWCOMER',
                order: 3,
                description: 'Visitor returned for second service',
                autoAdvanceEnabled: false,
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Connect Group',
                pathway: 'NEWCOMER',
                order: 4,
                description: 'Joined a small group or connect group',
                autoAdvanceEnabled: false,
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Regular Attender',
                pathway: 'NEWCOMER',
                order: 5,
                description: 'Attending regularly and engaged',
                autoAdvanceEnabled: false,
            },
        }),
    ]);

    console.log(`✅ Created ${newcomerStages.length} NEWCOMER stages`);

    // Create Stages for NEW_BELIEVER pathway
    const newBelieverStages = await Promise.all([
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Decision Made',
                pathway: 'NEW_BELIEVER',
                order: 1,
                description: 'Made decision to follow Christ',
                autoAdvanceEnabled: false,
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Baptism Class',
                pathway: 'NEW_BELIEVER',
                order: 2,
                description: 'Enrolled in baptism preparation class',
                autoAdvanceEnabled: true,
                autoAdvanceType: 'TASK_COMPLETED',
                autoAdvanceValue: 'baptism class',
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Baptized',
                pathway: 'NEW_BELIEVER',
                order: 3,
                description: 'Baptized and publicly declared faith',
                autoAdvanceEnabled: false,
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Foundations Course',
                pathway: 'NEW_BELIEVER',
                order: 4,
                description: 'Completing foundations of faith course',
                autoAdvanceEnabled: true,
                autoAdvanceType: 'TASK_COMPLETED',
                autoAdvanceValue: 'foundations course',
            },
        }),
        prisma.stage.create({
            data: {
                tenantId: tenant.id,
                name: 'Serving',
                pathway: 'NEW_BELIEVER',
                order: 5,
                description: 'Actively serving in ministry',
                autoAdvanceEnabled: false,
            },
        }),
    ]);

    console.log(`✅ Created ${newBelieverStages.length} NEW_BELIEVER stages`);

    // Create Automation Rules
    const automationRules = await Promise.all([
        prisma.automationRule.create({
            data: {
                tenantId: tenant.id,
                stageId: newcomerStages[0].id, // First Visit
                name: 'Welcome Email',
                taskDescription: 'Send welcome email with church information',
                daysDue: 1,
                priority: 'HIGH',
                enabled: true,
            },
        }),
        prisma.automationRule.create({
            data: {
                tenantId: tenant.id,
                stageId: newcomerStages[0].id, // First Visit
                name: 'Welcome Call',
                taskDescription: 'Make welcome call to introduce yourself',
                daysDue: 3,
                priority: 'HIGH',
                enabled: true,
            },
        }),
        prisma.automationRule.create({
            data: {
                tenantId: tenant.id,
                stageId: newcomerStages[1].id, // Follow-up Call
                name: 'Connect Group Invitation',
                taskDescription: 'Invite to upcoming connect group event',
                daysDue: 7,
                priority: 'MEDIUM',
                enabled: true,
            },
        }),
        prisma.automationRule.create({
            data: {
                tenantId: tenant.id,
                stageId: newBelieverStages[0].id, // Decision Made
                name: 'One-on-One Meeting',
                taskDescription: 'Schedule one-on-one meeting to discuss next steps',
                daysDue: 2,
                priority: 'HIGH',
                enabled: true,
            },
        }),
        prisma.automationRule.create({
            data: {
                tenantId: tenant.id,
                stageId: newBelieverStages[1].id, // Baptism Class
                name: 'Baptism Class Enrollment',
                taskDescription: 'Enroll in baptism class',
                daysDue: 7,
                priority: 'MEDIUM',
                enabled: true,
            },
        }),
    ]);

    console.log(`✅ Created ${automationRules.length} automation rules`);

    // Create sample members
    const members = await Promise.all([
        // Newcomers
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Emily',
                lastName: 'Rodriguez',
                email: 'emily.rodriguez@email.com',
                phone: '+1-555-0101',
                pathway: 'NEWCOMER',
                currentStageId: newcomerStages[0].id,
                assignedToId: users[1].id, // Sarah (Team Leader)
                createdById: users[0].id,
                gender: 'FEMALE',
                dateOfBirth: new Date('1992-05-15'),
                address: '123 Oak Street',
                city: 'Springfield',
                state: 'IL',
                zip: '62701',
                photoUrl: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=F472B6',
            },
        }),
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'James',
                lastName: 'Chen',
                email: 'james.chen@email.com',
                phone: '+1-555-0102',
                pathway: 'NEWCOMER',
                currentStageId: newcomerStages[2].id, // Second Visit
                assignedToId: users[2].id, // Mike (Volunteer)
                createdById: users[0].id,
                gender: 'MALE',
                dateOfBirth: new Date('1988-11-22'),
                address: '456 Maple Ave',
                city: 'Springfield',
                state: 'IL',
                zip: '62702',
                photoUrl: 'https://ui-avatars.com/api/?name=James+Chen&background=60A5FA',
            },
        }),
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Maria',
                lastName: 'Santos',
                email: 'maria.santos@email.com',
                phone: '+1-555-0103',
                pathway: 'NEWCOMER',
                currentStageId: newcomerStages[3].id, // Connect Group
                assignedToId: users[1].id,
                createdById: users[0].id,
                gender: 'FEMALE',
                dateOfBirth: new Date('1995-03-08'),
                maritalStatus: 'MARRIED',
                address: '789 Pine Road',
                city: 'Springfield',
                state: 'IL',
                zip: '62703',
                photoUrl: 'https://ui-avatars.com/api/?name=Maria+Santos&background=A78BFA',
            },
        }),
        // New Believers
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'David',
                lastName: 'Thompson',
                email: 'david.thompson@email.com',
                phone: '+1-555-0104',
                pathway: 'NEW_BELIEVER',
                currentStageId: newBelieverStages[0].id, // Decision Made
                assignedToId: users[0].id, // Pastor John
                createdById: users[0].id,
                gender: 'MALE',
                dateOfBirth: new Date('1990-07-30'),
                address: '321 Elm Street',
                city: 'Springfield',
                state: 'IL',
                zip: '62704',
                photoUrl: 'https://ui-avatars.com/api/?name=David+Thompson&background=34D399',
            },
        }),
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Lisa',
                lastName: 'Anderson',
                email: 'lisa.anderson@email.com',
                phone: '+1-555-0105',
                pathway: 'NEW_BELIEVER',
                currentStageId: newBelieverStages[2].id, // Baptized
                assignedToId: users[1].id,
                createdById: users[0].id,
                gender: 'FEMALE',
                dateOfBirth: new Date('1993-09-12'),
                maritalStatus: 'SINGLE',
                address: '654 Birch Lane',
                city: 'Springfield',
                state: 'IL',
                zip: '62705',
                photoUrl: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=FBBF24',
            },
        }),
        prisma.member.create({
            data: {
                tenantId: tenant.id,
                firstName: 'Robert',
                lastName: 'Williams',
                email: 'robert.williams@email.com',
                phone: '+1-555-0106',
                pathway: 'NEW_BELIEVER',
                currentStageId: newBelieverStages[3].id, // Foundations Course
                assignedToId: users[2].id,
                createdById: users[0].id,
                gender: 'MALE',
                dateOfBirth: new Date('1985-12-05'),
                maritalStatus: 'MARRIED',
                address: '987 Cedar Court',
                city: 'Springfield',
                state: 'IL',
                zip: '62706',
                photoUrl: 'https://ui-avatars.com/api/?name=Robert+Williams&background=F87171',
            },
        }),
    ]);

    console.log(`✅ Created ${members.length} members`);

    // Create tasks for members
    const tasks = await Promise.all([
        // Emily's tasks
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[0].id,
                description: 'Send welcome email with church information',
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
                priority: 'HIGH',
                assignedToId: users[1].id,
                createdById: users[0].id,
                createdByRule: true,
            },
        }),
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[0].id,
                description: 'Make welcome call to introduce yourself',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                priority: 'HIGH',
                assignedToId: users[1].id,
                createdById: users[0].id,
                createdByRule: true,
            },
        }),
        // James's tasks
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[1].id,
                description: 'Follow up on second visit experience',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: 'MEDIUM',
                assignedToId: users[2].id,
                createdById: users[0].id,
            },
        }),
        // David's tasks (New Believer)
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[3].id,
                description: 'Schedule one-on-one meeting to discuss next steps',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: 'HIGH',
                assignedToId: users[0].id,
                createdById: users[0].id,
                createdByRule: true,
            },
        }),
        // Lisa's tasks
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[4].id,
                description: 'Invite to foundations course starting next month',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                priority: 'MEDIUM',
                assignedToId: users[1].id,
                createdById: users[0].id,
            },
        }),
        // Completed task example
        prisma.task.create({
            data: {
                tenantId: tenant.id,
                memberId: members[4].id,
                description: 'Baptism preparation completed',
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Past
                priority: 'HIGH',
                assignedToId: users[0].id,
                createdById: users[0].id,
                completed: true,
                completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
        }),
    ]);

    console.log(`✅ Created ${tasks.length} tasks`);

    // Create notes for members
    const notes = await Promise.all([
        prisma.note.create({
            data: {
                memberId: members[0].id,
                content: '[System] Member added to NEWCOMER pathway',
                isSystem: true,
            },
        }),
        prisma.note.create({
            data: {
                memberId: members[0].id,
                content: 'Emily seemed very interested in our youth ministry programs. Has two teenagers.',
                createdById: users[1].id,
            },
        }),
        prisma.note.create({
            data: {
                memberId: members[1].id,
                content: 'James mentioned he\'s new to the area and looking to make connections. Interested in men\'s ministry.',
                createdById: users[2].id,
            },
        }),
        prisma.note.create({
            data: {
                memberId: members[3].id,
                content: 'David made his decision during the altar call last Sunday. Very excited about his new faith!',
                createdById: users[0].id,
            },
        }),
        prisma.note.create({
            data: {
                memberId: members[4].id,
                content: 'Lisa was baptized on Easter Sunday. Beautiful testimony!',
                createdById: users[0].id,
            },
        }),
    ]);

    console.log(`✅ Created ${notes.length} notes`);

    // Create tags for members
    const tags = await Promise.all([
        prisma.memberTag.create({
            data: {
                memberId: members[0].id,
                tag: 'Youth Parent',
            },
        }),
        prisma.memberTag.create({
            data: {
                memberId: members[0].id,
                tag: 'First Time Visitor',
            },
        }),
        prisma.memberTag.create({
            data: {
                memberId: members[1].id,
                tag: 'Men\'s Ministry',
            },
        }),
        prisma.memberTag.create({
            data: {
                memberId: members[2].id,
                tag: 'Connect Group Leader',
            },
        }),
        prisma.memberTag.create({
            data: {
                memberId: members[3].id,
                tag: 'New Convert',
            },
        }),
        prisma.memberTag.create({
            data: {
                memberId: members[4].id,
                tag: 'Recently Baptized',
            },
        }),
    ]);

    console.log(`✅ Created ${tags.length} tags`);

    // Create church settings
    const churchSettings = await prisma.churchSettings.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            name: tenant.name,
            address: '100 Church Street',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            phone: '+1-555-CHURCH',
            email: 'info@church.org',
            website: 'https://www.church.org',
            timezone: 'America/Chicago',
        },
    });

    console.log('✅ Created church settings');

    // Create service times
    const serviceTimes = await Promise.all([
        prisma.serviceTime.create({
            data: {
                churchSettingsId: churchSettings.id,
                day: 'SUNDAY',
                time: '09:00',
                name: 'Sunday Morning Service',
            },
        }),
        prisma.serviceTime.create({
            data: {
                churchSettingsId: churchSettings.id,
                day: 'SUNDAY',
                time: '11:00',
                name: 'Sunday Late Service',
            },
        }),
        prisma.serviceTime.create({
            data: {
                churchSettingsId: churchSettings.id,
                day: 'WEDNESDAY',
                time: '19:00',
                name: 'Wednesday Bible Study',
            },
        }),
    ]);

    console.log(`✅ Created ${serviceTimes.length} service times`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${users.length} team members`);
    console.log(`   - ${newcomerStages.length} NEWCOMER stages`);
    console.log(`   - ${newBelieverStages.length} NEW_BELIEVER stages`);
    console.log(`   - ${automationRules.length} automation rules`);
    console.log(`   - ${members.length} members`);
    console.log(`   - ${tasks.length} tasks`);
    console.log(`   - ${notes.length} notes`);
    console.log(`   - ${tags.length} tags`);
    console.log(`   - ${serviceTimes.length} service times`);
    console.log('\n✅ You can now login with:');
    console.log('   - pastor@church.org / password123 (ADMIN)');
    console.log('   - leader@church.org / password123 (TEAM_LEADER)');
    console.log('   - volunteer@church.org / password123 (VOLUNTEER)');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
