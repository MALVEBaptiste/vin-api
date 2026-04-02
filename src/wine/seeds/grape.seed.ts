import { DataSource } from 'typeorm';
import { Grape } from '../entities/grape.entity';
import * as dotenv from 'dotenv';

dotenv.config();


const GRAPES_DATA: Omit<Grape, 'id'>[] = [
  // 🔴 Rouges
  {
    name: 'Cabernet Sauvignon',
    color: 'rouge',
    regions: ['Bordeaux', 'Languedoc'],
    aromas: ['cassis', 'poivron', 'cèdre', 'épices'],
  },
  {
    name: 'Cabernet Franc',
    color: 'rouge',
    regions: ['Loire', 'Bordeaux'],
    aromas: ['framboise', 'poivron', 'herbes'],
  },
  {
    name: 'Merlot',
    color: 'rouge',
    regions: ['Bordeaux', 'Sud-Ouest'],
    aromas: ['prune', 'cerise', 'chocolat'],
  },
  {
    name: 'Malbec',
    synonyms: ['Côt'],
    color: 'rouge',
    regions: ['Sud-Ouest', 'Bordeaux'],
    aromas: ['mûre', 'violette', 'épices'],
  },
  {
    name: 'Petit Verdot',
    color: 'rouge',
    regions: ['Bordeaux'],
    aromas: ['violette', 'réglisse', 'épices'],
  },
  {
    name: 'Pinot Noir',
    color: 'rouge',
    regions: ['Bourgogne', 'Alsace'],
    aromas: ['cerise', 'fraise', 'sous-bois'],
  },
  {
    name: 'Gamay',
    color: 'rouge',
    regions: ['Beaujolais', 'Loire'],
    aromas: ['fruits rouges', 'banane', 'bonbon'],
  },
  {
    name: 'Syrah',
    color: 'rouge',
    regions: ['Rhône', 'Languedoc'],
    aromas: ['poivre', 'mûre', 'olive'],
  },
  {
    name: 'Grenache',
    color: 'rouge',
    regions: ['Rhône', 'Languedoc', 'Provence'],
    aromas: ['fraise', 'épices', 'garrigue'],
  },
  {
    name: 'Mourvèdre',
    color: 'rouge',
    regions: ['Provence', 'Rhône'],
    aromas: ['cuir', 'épices', 'fruits noirs'],
  },
  {
    name: 'Carignan',
    color: 'rouge',
    regions: ['Languedoc'],
    aromas: ['fruits noirs', 'épices'],
  },
  {
    name: 'Cinsault',
    color: 'rouge',
    regions: ['Provence', 'Languedoc'],
    aromas: ['fraise', 'floral'],
  },
  {
    name: 'Tannat',
    color: 'rouge',
    regions: ['Sud-Ouest'],
    aromas: ['cassis', 'réglisse', 'tanins puissants'],
  },
  {
    name: 'Négrette',
    color: 'rouge',
    regions: ['Sud-Ouest'],
    aromas: ['violette', 'poivre'],
  },
  {
    name: 'Fer Servadou',
    synonyms: ['Braucol'],
    color: 'rouge',
    regions: ['Sud-Ouest'],
    aromas: ['fruits rouges', 'épices'],
  },
  {
    name: 'Mondeuse',
    color: 'rouge',
    regions: ['Savoie'],
    aromas: ['poivre', 'fruits noirs'],
  },
  {
    name: 'Sciaccarellu',
    color: 'rouge',
    regions: ['Corse'],
    aromas: ['épices', 'fruits rouges'],
  },
  {
    name: 'Niellucciu',
    color: 'rouge',
    regions: ['Corse'],
    aromas: ['cerise', 'herbes'],
  },

  // ⚪ Blancs
  {
    name: 'Chardonnay',
    color: 'blanc',
    regions: ['Bourgogne', 'Champagne'],
    aromas: ['beurre', 'pomme', 'vanille'],
  },
  {
    name: 'Sauvignon Blanc',
    color: 'blanc',
    regions: ['Loire', 'Bordeaux'],
    aromas: ['agrumes', 'buis', 'fruit exotique'],
  },
  {
    name: 'Chenin Blanc',
    color: 'blanc',
    regions: ['Loire'],
    aromas: ['pomme', 'coing', 'miel'],
  },
  {
    name: 'Melon de Bourgogne',
    synonyms: ['Muscadet'],
    color: 'blanc',
    regions: ['Loire'],
    aromas: ['citron', 'iode', 'minéral'],
  },
  {
    name: 'Riesling',
    color: 'blanc',
    regions: ['Alsace'],
    aromas: ['citron', 'pétrole', 'minéral'],
  },
  {
    name: 'Gewurztraminer',
    color: 'blanc',
    regions: ['Alsace'],
    aromas: ['litchi', 'rose', 'épices'],
  },
  {
    name: 'Pinot Gris',
    color: 'blanc',
    regions: ['Alsace'],
    aromas: ['poire', 'fumé', 'miel'],
  },
  {
    name: 'Viognier',
    color: 'blanc',
    regions: ['Rhône'],
    aromas: ['abricot', 'fleurs', 'pêche'],
  },
  {
    name: 'Marsanne',
    color: 'blanc',
    regions: ['Rhône'],
    aromas: ['amande', 'poire'],
  },
  {
    name: 'Roussanne',
    color: 'blanc',
    regions: ['Rhône'],
    aromas: ['miel', 'herbes'],
  },
  {
    name: 'Ugni Blanc',
    color: 'blanc',
    regions: ['Sud-Ouest', 'Cognac'],
    aromas: ['neutre', 'acidité'],
  },
  {
    name: 'Colombard',
    color: 'blanc',
    regions: ['Sud-Ouest'],
    aromas: ['agrumes', 'fruit exotique'],
  },
  {
    name: 'Gros Manseng',
    color: 'blanc',
    regions: ['Sud-Ouest'],
    aromas: ['ananas', 'épices'],
  },
  {
    name: 'Petit Manseng',
    color: 'blanc',
    regions: ['Sud-Ouest'],
    aromas: ['miel', 'fruits confits'],
  },
  {
    name: 'Vermentino',
    synonyms: ['Rolle'],
    color: 'blanc',
    regions: ['Corse', 'Provence'],
    aromas: ['agrumes', 'herbes', 'amande'],
  },
  {
    name: 'Clairette',
    color: 'blanc',
    regions: ['Rhône', 'Languedoc'],
    aromas: ['pomme', 'fenouil'],
  },
  {
    name: 'Picpoul',
    color: 'blanc',
    regions: ['Languedoc'],
    aromas: ['citron', 'minéral'],
  },

  // 🟡 Spécifique
  {
    name: 'Savagnin',
    color: 'blanc',
    regions: ['Jura'],
    aromas: ['noix', 'curry', 'pomme'],
  },
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
      exists.color = grape.color;
      exists.synonyms = grape.synonyms;
      exists.regions = grape.regions;
      exists.aromas = grape.aromas;
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
