import { prisma } from "../lib/prisma";
import { ChannelType } from "@prisma/client";

async function seedAdminChannels() {
  try {
    console.log("🛡️ Seeding admin-specific messaging channels...");

    // Get the first admin user to be the creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
    });

    if (!adminUser) {
      console.log("❌ No admin user found. Please create an admin user first.");
      return;
    }

    // Get all users for admin oversight
    const allUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [
            "TEAM_MEMBER",
            "PROJECT_MANAGER",
            "ADMIN",
            "SUPER_ADMIN",
            "CLIENT",
          ],
        },
      },
    });

    // Create admin coordination channel
    const adminChannel = await prisma.channel.upsert({
      where: {
        id: "admin-coordination-channel",
      },
      create: {
        id: "admin-coordination-channel",
        name: "admin-coordination",
        description: "Admin team coordination and oversight",
        type: "ADMIN" as any,
        isPrivate: true,
        createdById: adminUser.id,
        members: {
          connect: allUsers
            .filter((user) => ["ADMIN", "SUPER_ADMIN"].includes(user.role))
            .map((user) => ({ id: user.id })),
        },
      },
      update: {},
      include: {
        members: true,
      },
    });

    const adminMembers = allUsers.filter((user) =>
      ["ADMIN", "SUPER_ADMIN"].includes(user.role)
    );
    console.log(
      `✅ Created admin coordination channel with ${adminMembers.length} members`
    );

    // Create client escalations channel
    const escalationChannel = await prisma.channel.upsert({
      where: {
        id: "client-escalations-channel",
      },
      create: {
        id: "client-escalations-channel",
        name: "client-escalations",
        description: "Client escalation and support issues",
        type: "CLIENT" as any,
        isPrivate: true,
        createdById: adminUser.id,
        members: {
          connect: allUsers
            .filter((user) =>
              ["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(user.role)
            )
            .map((user) => ({ id: user.id })),
        },
      },
      update: {},
      include: {
        members: true,
      },
    });

    const escalationMembers = allUsers.filter((user) =>
      ["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(user.role)
    );
    console.log(
      `✅ Created client escalations channel with ${escalationMembers.length} members`
    );

    // Create some initial messages
    const welcomeMessages = [
      {
        content:
          "Welcome to the admin coordination channel! This is for administrative team coordination.",
        channelId: adminChannel.id,
        senderId: adminUser.id,
      },
      {
        content:
          "Please use this channel for client escalation issues that need admin attention.",
        channelId: escalationChannel.id,
        senderId: adminUser.id,
      },
    ];

    for (const messageData of welcomeMessages) {
      await prisma.message.create({
        data: {
          content: messageData.content,
          senderId: messageData.senderId,
          channelId: messageData.channelId,
          messageType: "BROADCAST",
        },
      });
    }

    console.log("✅ Created welcome messages");
    console.log("🎉 Admin messaging channels seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding admin channels:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminChannels();
