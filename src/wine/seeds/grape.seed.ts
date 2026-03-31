import { DataSource } from 'typeorm';
import { Grape } from '../entities/grape.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const GRAPES_DATA: { name: string; colors: string[] }[] = [
  // Rouge
  { name: 'Cabernet-Sauvignon', colors: ['rouge'] },
  { name: 'Merlot', colors: ['rouge'] },
  { name: 'Pinot Noir', colors: ['rouge'] },
  { name: 'Syrah', colors: ['rouge', 'rosé'] },
  { name: 'Grenache', colors: ['rouge', 'rosé'] },
  { name: 'Mourvèdre', colors: ['rouge', 'rosé'] },
  { name: 'Carignan', colors: ['rouge', 'rosé'] },
  { name: 'Cinsault', colors: ['rouge', 'rosé'] },
  { name: 'Gamay', colors: ['rouge'] },
  { name: 'Cabernet Franc', colors: ['rouge'] },
  { name: 'Malbec', colors: ['rouge'] },
  { name: 'Tannat', colors: ['rouge'] },
  { name: 'Négrette', colors: ['rouge'] },
  { name: 'Fer Servadou', colors: ['rouge'] },

  // Blanc
  { name: 'Chardonnay', colors: ['blanc'] },
  { name: 'Sauvignon Blanc', colors: ['blanc'] },
  { name: 'Chenin Blanc', colors: ['blanc', 'orange'] },
  { name: 'Riesling', colors: ['blanc'] },
  { name: 'Gewurztraminer', colors: ['blanc', 'orange'] },
  { name: 'Pinot Gris', colors: ['blanc', 'orange'] },
  { name: 'Viognier', colors: ['blanc'] },
  { name: 'Roussanne', colors: ['blanc'] },
  { name: 'Marsanne', colors: ['blanc'] },
  { name: 'Grenache Blanc', colors: ['blanc', 'orange'] },
  { name: 'Clairette', colors: ['blanc'] },
  { name: 'Picpoul', colors: ['blanc'] },
  { name: 'Muscadet', colors: ['blanc'] },
  { name: 'Aligoté', colors: ['blanc'] },
  { name: 'Pinot Blanc', colors: ['blanc'] },
  { name: 'Sylvaner', colors: ['blanc'] },

  // Jaune
  { name: 'Savagnin', colors: ['jaune'] },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Grape],
    synchronize: true,
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(Grape);

  for (const grape of GRAPES_DATA) {
    const exists = await repo.findOne({ where: { name: grape.name } });
    if (!exists) {
      await repo.save(repo.create(grape));
    } else {
      exists.colors = grape.colors;
      await repo.save(exists);
    }
  }

  console.log(`Seed terminé : ${GRAPES_DATA.length} cépages traités.`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur lors du seed :', err);
  process.exit(1);
});
