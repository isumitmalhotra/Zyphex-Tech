"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const bcryptjs_2 = __importDefault(require("bcryptjs"));
const permissions_1 = require("../lib/auth/permissions");
const prisma = new client_1.PrismaClient();
const DEFAULT_PASSWORD = 'admin123';
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const prisma = new client_1.PrismaClient();
    // Hash password for all usersasync function main() {
    const hashedPassword = await (0, bcryptjs_1.hash)(DEFAULT_PASSWORD, 12);
    console.log('🌱 Starting database seeding...'); // Default password for all test users
    console.log('👥 Creating users...');
    const DEFAULT_PASSWORD = "password123";
    // Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@zyphextech.com' },
        update: {}, const: hashedPassword = await bcryptjs_2.default.hash('admin123', 12), function: main()
    }, {
        create: {
            email: 'admin@zyphextech.com', console, : .log("🌱 Starting RBAC seed..."),
            name: 'System Administrator',
            password: hashedPassword, const: superAdmin = await prisma.user.upsert({
                role: 'SUPER_ADMIN',
                emailVerified: new Date(), where: { email: 'admin@zyphextech.com' }, // Create all permissions in the database
                isActive: true,
                phone: '+1-555-0001', update: {}, console, : .log("📝 Creating permissions..."),
                timezone: 'America/New_York',
                experienceLevel: 'SENIOR', create: { const: permissionPromises = Object.values(permissions_1.Permission).map(async (permission) => {
                    })
                }
            }), email: 'admin@zyphextech.com', return: prisma.permission.upsert({
                // Create Project Manager      name: 'System Administrator',      where: { name: permission },
                const: projectManager = await prisma.user.upsert({
                    where: { email: 'manager@zyphextech.com' }, password: hashedPassword, update: {},
                    update: {},
                    create: { role: 'SUPER_ADMIN', create: {
                            email: 'manager@zyphextech.com',
                            name: 'Sarah Johnson', skills: JSON.stringify(['System Administration', 'Project Management', 'Database Design']), name: permission,
                            password: hashedPassword,
                            role: 'PROJECT_MANAGER', hourlyRate: 150.0, description: permissions_1.PermissionDescriptions[permission] || `Permission: ${permission}`,
                            emailVerified: new Date(),
                            isActive: true, timezone: 'America/New_York', category: getPermissionCategory(permission),
                            phone: '+1-555-0002',
                            skills: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Team Leadership']), phone: '+1-555-0001',
                        },
                        hourlyRate: 125.0,
                        timezone: 'America/New_York', availability: 'FULL_TIME', }
                }),
                experienceLevel: 'SENIOR'
            }, experienceLevel, 'SENIOR')
        }
    });
}
// Create Team Members
const developer1 = await prisma.user.upsert({});
const createdPermissions = await Promise.all(permissionPromises);
where: {
    email: 'developer1@zyphextech.com';
}
update: { }
console.log(`✅ Created ${createdPermissions.length} permissions`);
create: {
    email: 'developer1@zyphextech.com', // Create team members  
        name;
    'Michael Chen',
        password;
    hashedPassword, ;
    const projectManager = await prisma.user.upsert({
        role: 'TEAM_MEMBER',
        emailVerified: new Date(), where: { email: 'manager@zyphextech.com' }, console, : .log("🔐 Creating role-permission mappings..."),
        isActive: true,
        skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']), update: {}, for(, [role, permissions], of, Object) { }, : .entries(permissions_1.DefaultRolePermissions)
    }), { hourlyRate: , 95.0: , timezone: , 'America/Los_Angeles': , create: { const: rolePermissionPromises = permissions.map(async (permission) => {
        phone: '+1-555-0003',
            availability;
        'FULL_TIME', email;
        'manager@zyphextech.com', ;
        const permissionRecord = await prisma.permission.findUnique({
            experienceLevel: 'SENIOR'
        }, name, 'Sarah Johnson', where, { name: permission });
    }), password: hashedPassword, }, const: developer2 = await prisma.user.upsert({
        where: { email: 'developer2@zyphextech.com' }, role: 'PROJECT_MANAGER',
        update: {},
        create: { skills: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Team Leadership']), if(permissionRecord) {
                email: 'developer2@zyphextech.com',
                    name;
                'Emily Rodriguez', hourlyRate;
                125.0, ;
                return prisma.rolePermission.upsert({
                    password: hashedPassword,
                    role: 'TEAM_MEMBER', timezone: 'America/New_York', where: {
                        emailVerified: new Date(),
                        isActive: true, phone: '+1-555-0002', role_permissionId: {
                            skills: JSON.stringify(['Vue.js', 'Python', 'Django', 'MongoDB', 'Docker']),
                            hourlyRate: 85.0, availability: 'FULL_TIME', role: role,
                            timezone: 'America/Chicago',
                            phone: '+1-555-0004', experienceLevel: 'SENIOR', permissionId: permissionRecord.id,
                            availability: 'FULL_TIME',
                            experienceLevel: 'INTERMEDIATE'
                        }
                    }
                });
            } }
    }) };
}
const designer = await prisma.user.upsert({ update: {},
    where: { email: 'designer@zyphextech.com' },
    update: {}, const: teamMember1 = await prisma.user.upsert({ create: {
            create: {
                email: 'designer@zyphextech.com', where: { email: 'developer1@zyphextech.com' }, role: role,
                name: 'Alex Morgan',
                password: hashedPassword, update: {}, permissionId: permissionRecord.id,
                role: 'TEAM_MEMBER',
                emailVerified: new Date(), create: {},
                isActive: true,
                skills: JSON.stringify(['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']), email: 'developer1@zyphextech.com',
            }
        } }),
    hourlyRate: 75.0,
    timezone: 'America/New_York', name: 'Michael Chen', }, phone, '+1-555-0005', availability, 'FULL_TIME', password, hashedPassword);
experienceLevel: 'INTERMEDIATE';
role: 'TEAM_MEMBER',
;
skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']), await Promise.all(rolePermissionPromises);
console.log('✅ Created users');
hourlyRate: 95.0, console.log(`✅ Assigned ${permissions.length} permissions to ${role}`);
console.log('🏢 Creating clients...');
timezone: 'America/Los_Angeles', ;
// Create Clients
const techCorp = await prisma.client.upsert({ phone: '+1-555-0003',
    where: { email: 'contact@techcorp.com' },
    update: {}, availability: 'FULL_TIME', // Create comprehensive test users for all roles
    create: {
        name: 'TechCorp Solutions', experienceLevel: 'SENIOR', console, : .log("� Creating test users for all roles..."),
        email: 'contact@techcorp.com',
        phone: '+1-555-0123',
    },
    address: '123 Tech Street, Silicon Valley, CA 94000',
    company: 'TechCorp Solutions Inc.', }); // Super Admin Users
website: 'https://techcorp.com',
    timezone;
'America/New_York', ;
const superAdminUsers = [
    industry, 'Technology'
];
const teamMember2 = await prisma.user.upsert({}, {});
where: {
    email: 'developer2@zyphextech.com';
}
email: "superadmin@zyphextech.com",
;
const retailPlus = await prisma.client.upsert({
    where: { email: 'info@retailplus.com' }, update: {}, name: "Alex Thompson",
    update: {},
    create: { create: { role: "SUPER_ADMIN",
            name: 'RetailPlus Inc',
            email: 'info@retailplus.com', email: 'developer2@zyphextech.com', },
        phone: '+1-555-0456',
        address: '456 Commerce Ave, Business District, NY 10001', name: 'Emily Rodriguez', }
}, {
    company: 'RetailPlus Corporation',
    website: 'https://retailplus.com', password: hashedPassword, email: "admin@zyphextech.com",
    timezone: 'America/Los_Angeles',
    industry: 'Retail', role: 'TEAM_MEMBER', name: "System Administrator",
});
skills: JSON.stringify(['Vue.js', 'Python', 'Django', 'Docker', 'GraphQL']), role;
"SUPER_ADMIN";
const healthFirst = await prisma.client.upsert({ hourlyRate: 85.0, }, where, { email: 'contact@healthfirst.com' }, update, {}, timezone, 'America/Chicago', create, {
    name: 'HealthFirst Medical', phone: '+1-555-0004',
    email: 'contact@healthfirst.com',
    phone: '+1-555-0789', availability: 'FULL_TIME', // Admin Users  
    address: '789 Medical Center Dr, Healthcare City, TX 73301',
    company: 'HealthFirst Medical Group', experienceLevel: 'INTERMEDIATE', const: adminUsers = [
        website, 'https://healthfirst.com',
        timezone, 'America/Chicago',
    ]
}, {
    industry: 'Healthcare'
});
email: "sarah.admin@zyphextech.com",
;
name: "Sarah Wilson",
;
const eduTech = await prisma.client.upsert({
    where: { email: 'hello@edutech.com' }, const: designer = await prisma.user.upsert({ role: "ADMIN",
        update: {},
        create: { where: { email: 'designer@zyphextech.com' }, },
        name: 'EduTech Innovations',
        email: 'hello@edutech.com', update: {}, }, {
        phone: '+1-555-0321',
        address: '321 Education Blvd, Learning District, CO 80202', create: { email: "mike.admin@zyphextech.com",
            company: 'EduTech Innovations LLC',
            website: 'https://edutech.com', email: 'designer@zyphextech.com', name: "Mike Rodriguez",
            timezone: 'America/Denver',
            industry: 'Education', name: 'Alex Morgan', role: "ADMIN"
        }
    }), password: hashedPassword,
}, console.log('✅ Created clients'), role, 'TEAM_MEMBER', console.log('🚀 Creating projects...'), skills, JSON.stringify(['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping']));
// Create Projects with realistic data      hourlyRate: 75.0,  // Project Manager Users
const ecommerceProject = await prisma.project.upsert({
    where: { name: 'E-commerce Platform Development' }, timezone: 'America/New_York', const: projectManagers = [
        update, {},
        create, { phone: '+1-555-0005', }, {
            name: 'E-commerce Platform Development',
            description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.', availability: 'PART_TIME', email: "pm.john@zyphextech.com",
            clientId: techCorp.id,
            managerId: projectManager.id, experienceLevel: 'INTERMEDIATE', name: "John Mitchell",
            status: 'IN_PROGRESS',
            priority: 'HIGH',
        }, role, "PROJECT_MANAGER",
        methodology, 'AGILE',
        budget, 85000,
    ]
});
budgetUsed: 32000,
    hourlyRate;
125, {
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-02-28'), console, : .log('✅ Created team members'), email: "pm.emily@zyphextech.com",
    estimatedHours: 680,
    actualHours: 256, name: "Emily Chen",
    completionRate: 38,
    users: {
        connect: [
            { id: developer1.id },
        ], const: techCorp = await prisma.client.upsert({}, { id: developer2.id }, { id: designer.id }, where, { email: 'contact@techcorp.com' }, {}, update, {}, email, "pm.david@zyphextech.com")
    }
};
create: {
    name: "David Park",
    ;
    const mobileAppProject = await prisma.project.upsert({ name: 'TechCorp Solutions', role: "PROJECT_MANAGER",
        where: { name: 'Mobile App for Retail Management' },
        update: {}, email: 'contact@techcorp.com', }, create, {
        name: 'Mobile App for Retail Management', phone: '+1-555-0123',
        description: 'Cross-platform mobile application for inventory management, sales tracking, and customer analytics.',
        clientId: retailPlus.id, address: '123 Business Ave, Tech City, TC 12345',
        managerId: projectManager.id,
        status: 'PLANNING', company: 'TechCorp Solutions Inc.', // Team Member Users
        priority: 'MEDIUM',
        methodology: 'SCRUM', website: 'https://techcorp.com', const: teamMembers = [
            budget, 45000,
            budgetUsed, 8500, timezone, 'America/New_York', {
                hourlyRate: 110,
                startDate: new Date('2024-11-01'), industry: 'Technology', email: "dev.alice@zyphextech.com",
                endDate: new Date('2025-04-30'),
                estimatedHours: 520,
            }, name, "Alice Johnson",
            actualHours, 72,
            completionRate, 14,
        ]
    }), role, as;
    const users, { id: developer1, id }, { id: designer, id };
    const retailPlus = await prisma.client.upsert({}, {});
}
where: {
    email: 'info@retailplus.com';
}
email: "dev.bob@zyphextech.com",
;
update: { }
name: "Bob Smith",
;
const healthPortalProject = await prisma.project.upsert({ create: { role: "TEAM_MEMBER",
        where: { name: 'Patient Portal System' },
        update: {}, name: 'RetailPlus Inc', },
    create: {
        name: 'Patient Portal System', email: 'info@retailplus.com',
    } }, {
    description: 'HIPAA-compliant patient portal with appointment scheduling, medical records access, prescription management, and telemedicine capabilities.',
    clientId: healthFirst.id, phone: '+1-555-0124', email: "dev.carol@zyphextech.com",
    managerId: projectManager.id,
    status: 'COMPLETED', address: '456 Commerce St, Retail City, RC 67890', name: "Carol Davis",
    priority: 'HIGH',
    methodology: 'WATERFALL', company: 'RetailPlus Incorporated', role: "TEAM_MEMBER",
    budget: 120000,
    budgetUsed: 118500, website: 'https://retailplus.com',
}, hourlyRate, 140, startDate, new Date('2024-03-01'), timezone, 'America/Los_Angeles', {
    endDate: new Date('2024-09-15'),
    estimatedHours: 850, industry: 'Retail', email: "designer.lisa@zyphextech.com",
    actualHours: 846,
    completionRate: 100,
}, name, "Lisa Brown", users, {
    connect: []
}), role, as;
const { id: developer2, id };
const healthFirst = await prisma.client.upsert({}, {});
where: {
    email: 'contact@healthfirst.com';
}
email: "qa.tom@zyphextech.com",
;
const lmsProject = await prisma.project.upsert({
    where: { name: 'Learning Management System' }, update: {}, name: "Tom Wilson",
    update: {},
    create: { create: { role: "TEAM_MEMBER",
            name: 'Learning Management System',
            description: 'Comprehensive LMS with course creation, student enrollment, progress tracking, assessments, and analytics dashboard.', name: 'HealthFirst Medical', },
        clientId: eduTech.id,
        managerId: projectManager.id, email: 'contact@healthfirst.com',
        status: 'ON_HOLD',
        priority: 'LOW', phone: '+1-555-0125',
        methodology: 'AGILE',
        budget: 65000, address: '789 Medical Plaza, Health City, HC 54321', // Client Users
        budgetUsed: 15000,
        hourlyRate: 100, company: 'HealthFirst Medical Group', const: clientUsers = [
            startDate, new Date('2024-12-01'),
            endDate, new Date('2025-08-31'), website, 'https://healthfirst.com', {
                estimatedHours: 650,
                actualHours: 150, timezone: 'America/Chicago', email: "client.acme@zyphextech.com",
                completionRate: 23,
                users: { industry: 'Healthcare', name: "Rachel Green",
                    connect: [
                        { id: developer2.id },
                    ] }, role: "CLIENT"
            },
            { id: designer.id }
        ] }
});
{
}
const eduTech = await prisma.client.upsert({ email: "client.techcorp@zyphextech.com",
    console, : .log('✅ Created projects'),
    where: { email: 'hello@edutech.com' }, name: "James Morrison",
    // Print summary
    const: counts = { update: {}, role: "CLIENT",
        users: await prisma.user.count(),
        clients: await prisma.client.count(), create: {},
        projects: await prisma.project.count() }, name: 'EduTech Innovations', }, {
    console, : .log('\n📊 Database Seed Summary:'), email: 'hello@edutech.com', email: "client.startup@zyphextech.com",
    console, : .log(`   👥 Users: ${counts.users}`),
    console, : .log(`   🏢 Clients: ${counts.clients}`), phone: '+1-555-0126', name: "Maria Garcia",
    console, : .log(`   🚀 Projects: ${counts.projects}`),
    address: '321 Learning Blvd, Education City, EC 98765', role: "CLIENT",
    console, : .log('\n🔐 Login Credentials for Testing:'),
    console, : .log('   🔑 Super Admin: admin@zyphextech.com / admin123'), company: 'EduTech Innovations LLC',
}, console.log('   🔑 Project Manager: manager@zyphextech.com / admin123'), console.log('   🔑 Developer 1: developer1@zyphextech.com / admin123'), website, 'https://edutech.com', console.log('   🔑 Developer 2: developer2@zyphextech.com / admin123'), console.log('   🔑 Designer: designer@zyphextech.com / admin123'), timezone, 'America/Denver', console.log('\n🎉 Database seeding completed successfully!'), industry, 'Education'); // Regular Users
const regularUsers = [
    main()
        .catch((e) => { }), {
        console, : .error('❌ Error during seeding:', e),
        process, : .exit(1), email: "user.demo@zyphextech.com",
    },
        .finally(async () => {
        console.log('✅ Created clients');
        name: "Demo User",
            await prisma.$disconnect();
    }), role, "USER"
];
// Create sample projects with proper relationships    },
const ecommerceProject = await prisma.project.upsert({}, {
    where: { name: 'E-commerce Platform Development' }, email: "user.guest@zyphextech.com",
    update: {}, name: "Guest User",
    create: { role: "USER",
        name: 'E-commerce Platform Development', },
    description: 'Full-stack e-commerce solution with React, Node.js, and PostgreSQL. Features include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.',
    clientId: techCorp.id,
    managerId: projectManager.id, // Create all user types with passwords
    status: 'IN_PROGRESS', const: allUsers = [
        priority, 'HIGH', ...superAdminUsers,
        methodology, 'AGILE', ...adminUsers,
        budget, 85000, ...projectManagers,
        budgetUsed, 32000, ...teamMembers,
        hourlyRate, 125, ...clientUsers,
        startDate, new Date('2024-09-01'), ...regularUsers,
        endDate, new Date('2025-02-28'),
    ],
    estimatedHours: 680,
    actualHours: 256, console, : .log("🔐 Hashing passwords for test users..."),
    completionRate: 38, const: hashedPassword = await (0, bcryptjs_1.hash)(DEFAULT_PASSWORD, 12),
    users: {
        connect: [], for(, userData, of, allUsers) {
            {
                id: teamMember1.id;
            }
            const user = await prisma.user.upsert({}, { id: teamMember2.id }, where, { email: userData.email }, { id: designer.id }, update, {});
        }
    }
});
create: {
}
email: userData.email,
;
name: userData.name,
;
role: userData.role,
    password;
hashedPassword,
; // Add password for testing
const mobileAppProject = await prisma.project.upsert({ emailVerified: new Date() // Mark as verified for testing
    , // Mark as verified for testing
    where: { name: 'Mobile App for Retail Management' }, }, update, {});
create: {
    console.log(`✅ Created ${userData.role} user: ${user.email}`);
    name: 'Mobile App for Retail Management', ;
}
description: 'React Native mobile application for inventory management, sales tracking, and customer engagement. Includes barcode scanning, real-time sync, and offline capabilities.',
    clientId;
retailPlus.id, // Create sample clients with more detail
    managerId;
projectManager.id, console.log("📊 Creating sample clients...");
status: 'PLANNING', ;
const sampleClients = [
    priority, 'MEDIUM', {
        methodology: 'SCRUM', name: "Acme Corporation",
        budget: 65000, email: "client.acme@zyphextech.com",
        budgetUsed: 8500, phone: "+1-555-0123",
        hourlyRate: 110, address: "123 Business Ave, Tech City, TC 12345",
        startDate: new Date('2024-11-01'), company: "Acme Corp",
        endDate: new Date('2025-04-30'), website: "https://acme-corp.com",
        estimatedHours: 520,
    },
    actualHours, 72, {
        completionRate: 15, name: "TechCorp Solutions",
        users: { email: "client.techcorp@zyphextech.com",
            connect: [phone, "+1-555-0456",
                { id: teamMember1.id }, address, "456 Innovation Blvd, Startup Valley, SV 67890",
                { id: designer.id }, company, "TechCorp Inc",
            ], website: "https://techcorp-solutions.com"
        }
    },
];
{
}
name: "StartupXYZ",
    email;
"client.startup@zyphextech.com",
;
const healthPortalProject = await prisma.project.upsert({ phone: "+1-555-0789",
    where: { name: 'Patient Portal System' }, address: "789 Venture St, Enterprise Park, EP 54321",
    update: {}, company: "StartupXYZ Ltd",
    create: { website: "https://startupxyz.io",
        name: 'Patient Portal System', },
    description: 'HIPAA-compliant patient portal with appointment scheduling, medical records access, prescription management, and telemedicine capabilities.',
    clientId: healthFirst.id,
    managerId: projectManager.id, const: createdClients = [],
    status: 'COMPLETED', for(, clientData, of, sampleClients) {
        priority: 'HIGH', ;
        const client = await prisma.client.upsert({
            methodology: 'WATERFALL', where: { email: clientData.email },
            budget: 120000, update: {},
            budgetUsed: 118500, create: clientData,
            hourlyRate: 140,
        });
        startDate: new Date('2024-03-01'), createdClients.push(client);
        endDate: new Date('2024-08-31'), console.log(`✅ Created client: ${client.name}`);
        estimatedHours: 850, ;
    },
    actualHours: 846,
    completionRate: 100, // Create sample projects
    users: { console, : .log("🚀 Creating sample projects..."),
        connect: [], const: sampleProjects = [
            { id: teamMember1.id }, {},
            { id: teamMember2.id }, name, "E-commerce Platform Redesign",
        ], description: "Complete redesign of Acme's e-commerce platform with modern UI/UX",
    }, status: "IN_PROGRESS",
}, budget, 50000);
hourlyRate: 85.0,
    startDate;
new Date('2024-01-15'),
;
const lmsProject = await prisma.project.upsert({ endDate: new Date('2024-06-15'),
    where: { name: 'Learning Management System' }, clientId: createdClients[0].id,
    update: {}, }, create, {}, {
    name: 'Learning Management System', name: "Mobile App Development",
    description: 'Modern LMS with course creation tools, student progress tracking, interactive assessments, video streaming, and analytics dashboard.', description: "Native iOS and Android app for TechCorp's business platform",
    clientId: eduTech.id, status: "PLANNING",
    managerId: projectManager.id, budget: 75000,
    status: 'REVIEW', hourlyRate: 95.0,
    priority: 'MEDIUM', startDate: new Date('2024-02-01'),
    methodology: 'AGILE', endDate: new Date('2024-08-01'),
    budget: 95000, clientId: createdClients[1].id,
    budgetUsed: 87200,
}, hourlyRate, 115, {
    startDate: new Date('2024-06-01'), name: "Data Analytics Dashboard",
    endDate: new Date('2024-12-15'), description: "Real-time analytics dashboard for StartupXYZ's financial platform",
    estimatedHours: 760, status: "IN_PROGRESS",
    actualHours: 720, budget: 35000,
    completionRate: 92, hourlyRate: 75.0,
    users: { startDate: new Date('2024-01-01'),
        connect: [endDate, new Date('2024-05-01'),
            { id: teamMember2.id }, clientId, createdClients[2].id,
            { id: designer.id }] },
});
{
}
name: "Website Optimization",
;
description: "Performance optimization and SEO improvements for Acme website",
;
status: "COMPLETED",
    budget;
15000,
    console.log('✅ Created projects');
hourlyRate: 65.0,
    startDate;
new Date('2023-10-01'),
;
// Summary      endDate: new Date('2023-12-15'),
const counts = { clientId: createdClients[0].id,
    users: await prisma.user.count(), };
clients: await prisma.client.count(), ;
projects: await prisma.project.count();
const createdProjects = [];
for (const projectData of sampleProjects) {
    console.log('\n🎉 Database seeding completed successfully!'); // Check if project already exists
    console.log('📊 Summary:');
    const existingProject = await prisma.project.findFirst({
        console, : .log(`   Users: ${counts.users}`), where: { name: projectData.name },
        console, : .log(`   Clients: ${counts.clients}`)
    });
    console.log(`   Projects: ${counts.projects}`);
    if (!existingProject) {
        console.log('\n🔐 Login Credentials:');
        const project = await prisma.project.create({
            console, : .log('   Super Admin: admin@zyphextech.com / admin123'), data: projectData,
            console, : .log('   Project Manager: manager@zyphextech.com / admin123')
        });
        console.log('   Developer 1: developer1@zyphextech.com / admin123');
        createdProjects.push(project);
        console.log('   Developer 2: developer2@zyphextech.com / admin123');
        console.log(`✅ Created project: ${project.name}`);
        console.log('   Designer: designer@zyphextech.com / admin123');
    }
    else {
    }
    createdProjects.push(existingProject);
    console.log(`ℹ️ Project already exists: ${existingProject.name}`);
    main();
}
try { }
catch () { }
(e) => { };
console.error('❌ Error during seeding:', e);
console.log("🎉 Seed completed successfully!");
process.exit(1);
try { }
finally { }
(async () => {
    function getPermissionCategory(permission) {
        await prisma.$disconnect();
        if (permission.includes('system') || permission.includes('audit') || permission.includes('backup')) {
        }
        return 'system';
    }
    if (permission.includes('user')) {
        return 'users';
    }
    if (permission.includes('client')) {
        return 'clients';
    }
    if (permission.includes('project')) {
        return 'projects';
    }
    if (permission.includes('task')) {
        return 'tasks';
    }
    if (permission.includes('time')) {
        return 'time';
    }
    if (permission.includes('financial') || permission.includes('invoice') || permission.includes('revenue') || permission.includes('billing')) {
        return 'financial';
    }
    if (permission.includes('team')) {
        return 'teams';
    }
    if (permission.includes('document')) {
        return 'documents';
    }
    if (permission.includes('report') || permission.includes('analytics') || permission.includes('dashboard')) {
        return 'reports';
    }
    if (permission.includes('message')) {
        return 'communication';
    }
    if (permission.includes('settings') || permission.includes('company') || permission.includes('integration')) {
        return 'settings';
    }
    return 'other';
});
main()
    .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
