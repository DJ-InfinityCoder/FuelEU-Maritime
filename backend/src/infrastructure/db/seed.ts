// src/infrastructure/db/seed.ts
import { db } from './connection.js';
import { routes } from './schema.js';
import { exit } from 'process';

/**
 * Seed the database with the KPIs dataset from the assignment
 */
async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // Clear existing routes
        await db.delete(routes).execute();

        // Insert seed data
        await db.insert(routes).values([
            {
                route_id: 'R001',
                vessel_type: 'Container',
                fuel_type: 'HFO',
                year: 2024,
                ghg_intensity: '91.0',
                fuel_consumption: '5000',
                distance: '12000',
                total_emissions: '4500',
                is_baseline: true, // Set R001 as baseline
            },
            {
                route_id: 'R002',
                vessel_type: 'BulkCarrier',
                fuel_type: 'LNG',
                year: 2024,
                ghg_intensity: '88.0',
                fuel_consumption: '4800',
                distance: '11500',
                total_emissions: '4200',
                is_baseline: false,
            },
            {
                route_id: 'R003',
                vessel_type: 'Tanker',
                fuel_type: 'MGO',
                year: 2024,
                ghg_intensity: '93.5',
                fuel_consumption: '5100',
                distance: '12500',
                total_emissions: '4700',
                is_baseline: false,
            },
            {
                route_id: 'R004',
                vessel_type: 'RoRo',
                fuel_type: 'HFO',
                year: 2025,
                ghg_intensity: '89.2',
                fuel_consumption: '4900',
                distance: '11800',
                total_emissions: '4300',
                is_baseline: false,
            },
            {
                route_id: 'R004',
                vessel_type: 'RoRo',
                fuel_type: 'HFO',
                year: 2026,
                ghg_intensity: '100',
                fuel_consumption: '6000',
                distance: '11800',
                total_emissions: '5000',
                is_baseline: false,
            },
            {
                route_id: 'R005',
                vessel_type: 'Container',
                fuel_type: 'LNG',
                year: 2025,
                ghg_intensity: '90.5',
                fuel_consumption: '4950',
                distance: '11900',
                total_emissions: '4400',
                is_baseline: false,
            },
        ]).execute();

        console.log('✅ Seed data inserted successfully!');
        console.log('   - 6 routes added');
        console.log('   - R001 set as baseline');
        
        // Display the seeded data
        const seededRoutes = await db.select().from(routes);
        console.log('\n📊 Seeded Routes:');
        console.table(seededRoutes);

        return seededRoutes;

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run seed function immediately
seed()
    .then(() => {
        console.log('\n✨ Seeding complete!');
        exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        exit(1);
    });

export { seed };