"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Starting database seed...\n");
    // ─── Cleanup ───────────────────────────────────
    await prisma.interventionAssignment.deleteMany();
    await prisma.intervention.deleteMany();
    await prisma.client.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    console.log("✓ Cleaned existing data");
    // ─── Users ─────────────────────────────────────
    const hashedAdmin = await bcryptjs_1.default.hash("Admin1234!", 10);
    const hashedManager = await bcryptjs_1.default.hash("Manager1234!", 10);
    const hashedTech = await bcryptjs_1.default.hash("Tech1234!", 10);
    const admin = await prisma.user.create({
        data: {
            email: "admin@gmao.fr",
            password: hashedAdmin,
            name: "Admin GMAO",
            role: client_1.Role.admin,
            phone: "0600000001",
        },
    });
    const manager1 = await prisma.user.create({
        data: {
            email: "manager@gmao.fr",
            password: hashedManager,
            name: "Sophie Martin",
            role: client_1.Role.manager,
            phone: "0600000002",
        },
    });
    const manager2 = await prisma.user.create({
        data: {
            email: "manager2@gmao.fr",
            password: hashedManager,
            name: "Pierre Dupont",
            role: client_1.Role.manager,
            phone: "0600000003",
        },
    });
    const tech1 = await prisma.user.create({
        data: {
            email: "tech1@gmao.fr",
            password: hashedTech,
            name: "Lucas Bernard",
            role: client_1.Role.technician,
            phone: "0611111001",
        },
    });
    const tech2 = await prisma.user.create({
        data: {
            email: "tech2@gmao.fr",
            password: hashedTech,
            name: "Emma Rousseau",
            role: client_1.Role.technician,
            phone: "0611111002",
        },
    });
    const tech3 = await prisma.user.create({
        data: {
            email: "tech3@gmao.fr",
            password: hashedTech,
            name: "Thomas Leroy",
            role: client_1.Role.technician,
            phone: "0611111003",
        },
    });
    const tech4 = await prisma.user.create({
        data: {
            email: "tech4@gmao.fr",
            password: hashedTech,
            name: "Chloé Petit",
            role: client_1.Role.technician,
            phone: "0611111004",
        },
    });
    const tech5 = await prisma.user.create({
        data: {
            email: "tech5@gmao.fr",
            password: hashedTech,
            name: "Maxime Moreau",
            role: client_1.Role.technician,
            phone: "0611111005",
        },
    });
    console.log(`✓ Created ${8} users`);
    // ─── Clients ────────────────────────────────────
    const clients = await Promise.all([
        prisma.client.create({
            data: {
                name: "Hôtel Lux & Spa",
                company: "Lux Group SAS",
                email: "contact@luxspa.fr",
                phone: "0140203040",
                address: "45 Avenue des Champs-Élysées",
                city: "Paris (75008)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Restaurant Le Délice",
                company: "Délice SAS",
                email: "manager@delice.fr",
                phone: "0491001122",
                address: "12 Rue de la République",
                city: "Marseille (13001)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Centre Commercial Riviera",
                company: "Riviera Mall SARL",
                email: "direction@rivieramall.fr",
                phone: "0493202030",
                address: "1 Avenue de la Victoire",
                city: "Nice (06000)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Clinique Saint-Louis",
                company: "Clinique SL SA",
                email: "technique@stlouis.fr",
                phone: "0321005060",
                address: "5 Rue du Professeur Laguesse",
                city: "Lille (59000)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Bureau Technopole Atlantis",
                company: "Atlantis Immobilier",
                email: "fm@atlantis-tech.fr",
                phone: "0240506070",
                address: "2 Rue de la Beaujoire",
                city: "Nantes (44300)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Supermarché FraîchePlus",
                company: "FraîchePlus SA",
                email: "maintenance@fraicheplus.fr",
                phone: "0567891011",
                address: "100 Route du Commerce",
                city: "Toulouse (31000)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Aéroport Régional Sud",
                company: "Aéroport Sud Exploitation",
                email: "maintenance@ars-airport.fr",
                phone: "0467001020",
                address: "Route de Fréjorgues",
                city: "Montpellier (34130)",
            },
        }),
        prisma.client.create({
            data: {
                name: "Université Lumière",
                company: "Université Lumière",
                email: "dsi@univ-lumiere.fr",
                phone: "0472000100",
                address: "86 Rue Pasteur",
                city: "Lyon (69007)",
            },
        }),
    ]);
    console.log(`✓ Created ${clients.length} clients`);
    // ─── Interventions ─────────────────────────────
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const daysAgo = (n) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
    };
    const daysFwd = (n) => {
        const d = new Date(today);
        d.setDate(d.getDate() + n);
        return d;
    };
    const interventionData = [
        { num: "INT-2026-001", type: "Dépannage Climatisation", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.high, client: clients[0], scheduledDate: daysAgo(10), techs: [tech1], duration: 120 },
        { num: "INT-2026-002", type: "Maintenance Préventive PAC", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.medium, client: clients[1], scheduledDate: daysAgo(9), techs: [tech2], duration: 90 },
        { num: "INT-2026-003", type: "Remplacement Filtre CTA", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.low, client: clients[2], scheduledDate: daysAgo(8), techs: [tech3], duration: 60 },
        { num: "INT-2026-004", type: "Fuite Réseau Hydraulique", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.urgent, client: clients[3], scheduledDate: daysAgo(7), techs: [tech1, tech2], duration: 180 },
        { num: "INT-2026-005", type: "Inspection Annuelle HVAC", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.medium, client: clients[4], scheduledDate: daysAgo(6), techs: [tech4], duration: 240 },
        { num: "INT-2026-006", type: "Panne Groupe Froid", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.urgent, client: clients[5], scheduledDate: daysAgo(5), techs: [tech5], duration: 150 },
        { num: "INT-2026-007", type: "Mise en service Split", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.medium, client: clients[6], scheduledDate: daysAgo(4), techs: [tech3], duration: 80 },
        { num: "INT-2026-008", type: "Vérification Alarme Incendie", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.high, client: clients[7], scheduledDate: daysAgo(3), techs: [tech2, tech4], duration: 100 },
        { num: "INT-2026-009", type: "Maintenance Ventilation VMC", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.low, client: clients[0], scheduledDate: daysAgo(2), techs: [tech1], duration: 75 },
        { num: "INT-2026-010", type: "Remplacement Pompe Circulaire", status: client_1.InterventionStatus.completed, priority: client_1.InterventionPriority.high, client: clients[1], scheduledDate: daysAgo(1), techs: [tech5], duration: 120 },
        // Today
        { num: "INT-2026-011", type: "Dépannage Climatisation Urgence", status: client_1.InterventionStatus.in_progress, priority: client_1.InterventionPriority.urgent, client: clients[2], scheduledDate: today, techs: [tech1], duration: 90 },
        { num: "INT-2026-012", type: "Maintenance Préventive Trimestrielle", status: client_1.InterventionStatus.assigned, priority: client_1.InterventionPriority.medium, client: clients[3], scheduledDate: today, techs: [tech2], duration: 120 },
        { num: "INT-2026-013", type: "Contrôle Détection Gaz", status: client_1.InterventionStatus.assigned, priority: client_1.InterventionPriority.high, client: clients[4], scheduledDate: today, techs: [tech3], duration: 60 },
        { num: "INT-2026-014", type: "Nettoyage Évaporateur", status: client_1.InterventionStatus.created, priority: client_1.InterventionPriority.low, client: clients[5], scheduledDate: today, techs: [], duration: 45 },
        // Future
        { num: "INT-2026-015", type: "Inspection Annuelle Chaudière", status: client_1.InterventionStatus.created, priority: client_1.InterventionPriority.medium, client: clients[6], scheduledDate: daysFwd(1), techs: [], duration: 120 },
        { num: "INT-2026-016", type: "Mise en service Pompe Chaleur", status: client_1.InterventionStatus.assigned, priority: client_1.InterventionPriority.high, client: clients[7], scheduledDate: daysFwd(2), techs: [tech4], duration: 180 },
        { num: "INT-2026-017", type: "Remplacement Vanne Thermostatique", status: client_1.InterventionStatus.created, priority: client_1.InterventionPriority.low, client: clients[0], scheduledDate: daysFwd(3), techs: [], duration: 60 },
        { num: "INT-2026-018", type: "Diagnostic Panne Frigorigène", status: client_1.InterventionStatus.assigned, priority: client_1.InterventionPriority.urgent, client: clients[1], scheduledDate: daysFwd(4), techs: [tech5], duration: 90 },
        { num: "INT-2026-019", type: "Maintenance Préventive Annuelle", status: client_1.InterventionStatus.created, priority: client_1.InterventionPriority.medium, client: clients[2], scheduledDate: daysFwd(7), techs: [], duration: 240 },
        { num: "INT-2026-020", type: "Révision Centrale Air", status: client_1.InterventionStatus.created, priority: client_1.InterventionPriority.medium, client: clients[3], scheduledDate: daysFwd(10), techs: [], duration: 180 },
        // Waiting / Cancelled
        { num: "INT-2026-021", type: "Réparation Compresseur", status: client_1.InterventionStatus.waiting, priority: client_1.InterventionPriority.high, client: clients[4], scheduledDate: daysAgo(3), techs: [tech1], duration: 0 },
        { num: "INT-2026-022", type: "Diagnostic Réseau Froid", status: client_1.InterventionStatus.cancelled, priority: client_1.InterventionPriority.medium, client: clients[5], scheduledDate: daysAgo(5), techs: [], duration: 0 },
    ];
    let counter = 0;
    for (const item of interventionData) {
        const intervention = await prisma.intervention.create({
            data: {
                number: item.num,
                type: item.type,
                description: `Intervention de type "${item.type}" chez ${item.client.name}.`,
                address: item.client.address || "",
                status: item.status,
                priority: item.priority,
                scheduledDate: item.scheduledDate,
                scheduledTime: `${(9 + (counter % 8)).toString().padStart(2, "0")}:00`,
                durationEstimated: item.duration,
                durationActual: item.status === client_1.InterventionStatus.completed ? item.duration + Math.floor(Math.random() * 30) - 15 : null,
                completedAt: item.status === client_1.InterventionStatus.completed ? item.scheduledDate : null,
                clientId: item.client.id,
                createdById: admin.id,
            },
        });
        for (const tech of item.techs) {
            await prisma.interventionAssignment.create({
                data: {
                    interventionId: intervention.id,
                    userId: tech.id,
                },
            });
        }
        counter++;
    }
    console.log(`✓ Created ${interventionData.length} interventions`);
    console.log("\n✅ Seed complete!");
    console.log("\nDemo accounts:");
    console.log("  admin@gmao.fr / Admin1234!   (Admin)");
    console.log("  manager@gmao.fr / Manager1234!  (Manager)");
    console.log("  tech1@gmao.fr / Tech1234!    (Technician)");
}
main()
    .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map