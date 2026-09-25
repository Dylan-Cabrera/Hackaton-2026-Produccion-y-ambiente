import 'dotenv/config';
import '../models/index.js'; // Registra las asociaciones antes de sincronizar la base
import sequelize from '../config/database.js';
import { DemandMetric } from '../models/index.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import { userRepository, productRepository, needRepository } from '../config/container.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { ProductMapper } from '../mappers/product.mapper.js';
import { NeedMapper } from '../mappers/need.mapper.js';
import { WGS84_SRID, Category, StockUnit, NeedFrequency, InstitutionType } from '../constants/catalog.constants.js';
import { LOCALITY_NAMES } from '../constants/localities.constants.js';
import { localityCentroid } from '../utils/geo.js';
import { RegisterInput, UserRecord } from '../interfaces/user.types.js';
import { CreateProductInput, ProductRecord } from '../interfaces/product.types.js';
import { CreateNeedInput } from '../interfaces/need.types.js';
import { EventType } from '../constants/telemetry.constants.js';

// Seed "grande" con datos representativos de TODA la provincia de Formosa (las 8 localidades
// del catálogo): muchas cuentas de cada tipo, productos que realmente se producen en la
// región (mandioca/batata, banana de Laguna Blanca, cítricos y chipa de la zona de frontera
// con Paraguay en Clorinda, apicultura, tambos chicos, artesanías qom/wichí/pilagá, etc.),
// necesidades variadas y varios cientos de eventos de telemetría distribuidos en el tiempo
// para simular uso real de la plataforma (no solo el puñado de cuentas de humo de seed-all.ts).
const DEMO_PASSWORD = 'Demo1234';
const passwordHasher = new BcryptPasswordHasher();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number): Date => new Date(Date.now() - days * MS_PER_DAY);
const randomDaysAgo = (maxDays: number): number => Math.random() * maxDays;
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Jitter de ±0.03° alrededor del centroide de la localidad, para que las cuentas de una
// misma localidad no queden todas apiladas en el mismo punto del mapa.
const jitteredCoordinates = (locality: string): [number, number] => {
  const centroid = localityCentroid(locality);
  if (!centroid) throw new Error(`Localidad desconocida en el seed: ${locality}`);
  const jitter = () => Math.random() * 0.06 - 0.03;
  return [centroid.lng + jitter(), centroid.lat + jitter()];
};

const toGeoJSON = (coordinates: [number, number]) => ({
  type: 'Point' as const,
  coordinates,
  crs: { type: 'name', properties: { name: `EPSG:${WGS84_SRID}` } }
});

let passwordHash: string;

async function createUser(input: RegisterInput): Promise<UserRecord> {
  return userRepository.create(UserMapper.toPersistence(input, passwordHash));
}

async function createProduct(producerId: number, input: CreateProductInput, category: Category): Promise<ProductRecord> {
  return productRepository.create(ProductMapper.toCreatePersistence(producerId, input, category));
}

async function createNeed(author: UserRecord, input: CreateNeedInput) {
  return needRepository.create(
    NeedMapper.toCreatePersistence(author.id, input, { locality: author.locality, coordinates: author.coordinates })
  );
}

async function createEvent(params: {
  eventType: EventType;
  queryTerm?: string;
  category?: Category;
  locality: string;
  productId?: number;
  producerId?: number;
  userId?: number | null;
  daysAgo: number;
}) {
  await DemandMetric.create({
    eventType: params.eventType,
    queryTerm: params.queryTerm ? params.queryTerm.trim().toLowerCase() : null,
    category: params.category ?? null,
    locality: params.locality,
    coordinates: toGeoJSON(jitteredCoordinates(params.locality)),
    productId: params.productId ?? null,
    producerId: params.producerId ?? null,
    userId: params.userId ?? null,
    timestamp: daysAgo(params.daysAgo)
  } as any);
}

// --- Datos: productores por localidad, con rubros y productos reales de la zona ---

interface ProductSpec {
  title: string;
  price: number;
  stockUnit: StockUnit;
  offerPrice?: number;
  isOffer?: boolean;
  description?: string;
}

interface ProducerSpec {
  slug: string;
  name: string;
  phone: string;
  locality: string;
  businessName: string;
  category: Category;
  paymentMethods?: string[];
  deliveryOptions?: string[];
  bio?: string;
  products: ProductSpec[];
}

const PAYMENT_SETS = [
  ['Efectivo'],
  ['Efectivo', 'Transferencia'],
  ['Efectivo', 'Transferencia', 'Tarjeta']
];
const DELIVERY_SETS = [
  ['Retiro en el local'],
  ['Retiro en el local', 'Envío a domicilio'],
  ['Envío a domicilio', 'Punto de encuentro'],
  ['Retiro en el local', 'Envío a domicilio', 'Punto de encuentro']
];

const PRODUCERS: ProducerSpec[] = [
  // --- Formosa (capital) ---
  {
    slug: 'espiga',
    name: 'Teresa Aquino',
    phone: '5493704600001',
    locality: 'Formosa',
    businessName: 'Panadería La Espiga',
    category: 'Panificados',
    bio: 'Panadería de barrio, horneado a leña.',
    products: [
      { title: 'Chipa x docena', price: 1400, stockUnit: 'docena' },
      { title: 'Tortas Fritas x6', price: 1100, stockUnit: 'unidad' },
      { title: 'Pan Casero x kg', price: 900, offerPrice: 750, isOffer: true, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'banado',
    name: 'Ricardo Paredes',
    phone: '5493704600002',
    locality: 'Formosa',
    businessName: 'Quesos del Bañado',
    category: 'Lácteos/Quesos',
    products: [
      { title: 'Queso Cremoso x kg', price: 4300, stockUnit: 'kg' },
      { title: 'Dulce de Leche x frasco', price: 1600, offerPrice: 1350, isOffer: true, stockUnit: 'frasco' }
    ]
  },
  {
    slug: 'vidrieria',
    name: 'Omar Sánchez',
    phone: '5493704600003',
    locality: 'Formosa',
    businessName: 'Vidriería Norte',
    category: 'Envases/Frascos',
    products: [
      { title: 'Frascos de Vidrio x12', price: 2500, stockUnit: 'caja' },
      { title: 'Tapas Metálicas x24', price: 1150, stockUnit: 'caja' }
    ]
  },

  // --- Clorinda (frontera con Paraguay, fuerte influencia guaraní) ---
  {
    slug: 'nandu',
    name: 'Fátima Ovelar',
    phone: '5493704600004',
    locality: 'Clorinda',
    businessName: 'Textiles Ñandutí',
    category: 'Artesanías/Textil',
    bio: 'Hamacas paraguayas y tejido en telar criollo, técnica heredada de mi abuela.',
    products: [
      { title: 'Hamaca Paraguaya Matrimonial', price: 18500, stockUnit: 'unidad' },
      { title: 'Tejido en Telar (mantel)', price: 6200, stockUnit: 'unidad' }
    ]
  },
  {
    slug: 'pilcomayo',
    name: 'Nélida Domínguez',
    phone: '5493704600005',
    locality: 'Clorinda',
    businessName: 'Cítricos del Pilcomayo',
    category: 'Frutas Frescas',
    products: [
      { title: 'Pomelo x kg', price: 520, stockUnit: 'kg' },
      { title: 'Naranja x kg', price: 480, offerPrice: 400, isOffer: true, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'encarnacion',
    name: 'Encarnación Duarte',
    phone: '5493704600006',
    locality: 'Clorinda',
    businessName: 'Chipería Doña Encarnación',
    category: 'Panificados',
    products: [
      { title: 'Chipa x docena', price: 1350, stockUnit: 'docena' },
      { title: 'Empanadas de Mandioca x6', price: 1500, stockUnit: 'unidad' }
    ]
  },

  // --- Pirané ---
  {
    slug: 'sanisidro',
    name: 'Ezequiel Coronel',
    phone: '5493704600007',
    locality: 'Pirané',
    businessName: 'Chacra San Isidro',
    category: 'Tubérculos/Raíces',
    products: [
      { title: 'Mandioca x kg', price: 690, stockUnit: 'kg' },
      { title: 'Batata x kg', price: 610, offerPrice: 500, isOffer: true, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'elsurco',
    name: 'Herminia López',
    phone: '5493704600008',
    locality: 'Pirané',
    businessName: 'Verdulería El Surco',
    category: 'Verduras/Hortalizas',
    products: [
      { title: 'Zapallo x kg', price: 450, stockUnit: 'kg' },
      { title: 'Choclo x docena', price: 1200, stockUnit: 'docena' },
      { title: 'Poroto x kg', price: 800, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'dulcespirani',
    name: 'Adela Ferreyra',
    phone: '5493704600009',
    locality: 'Pirané',
    businessName: 'Dulces Piraní',
    category: 'Dulces/Mermeladas',
    products: [
      { title: 'Dulce de Batata x frasco', price: 950, stockUnit: 'frasco' },
      { title: 'Mermelada de Naranja x frasco', price: 1000, offerPrice: 850, isOffer: true, stockUnit: 'frasco' }
    ]
  },

  // --- El Colorado ---
  {
    slug: 'montedorado',
    name: 'Facundo Villagra',
    phone: '5493704600010',
    locality: 'El Colorado',
    businessName: 'Apiario Monte Dorado',
    category: 'Apicultura',
    products: [
      { title: 'Miel Pura x frasco', price: 1900, stockUnit: 'frasco' },
      { title: 'Propóleo x frasco', price: 2300, stockUnit: 'frasco' }
    ]
  },
  {
    slug: 'treshermanos',
    name: 'Zulma Aranda',
    phone: '5493704600011',
    locality: 'El Colorado',
    businessName: 'Granja Los Tres Hermanos',
    category: 'Carnes/Huevos',
    products: [
      { title: 'Huevos de Campo x docena', price: 2900, offerPrice: 2450, isOffer: true, stockUnit: 'docena' },
      { title: 'Pollo Casero x kg', price: 3700, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'elOasis',
    name: 'Cristian Núñez',
    phone: '5493704600012',
    locality: 'El Colorado',
    businessName: 'Tambo El Oasis',
    category: 'Lácteos/Quesos',
    products: [
      { title: 'Leche Entera x litro', price: 920, stockUnit: 'litro' },
      { title: 'Queso de Cabra x 500g', price: 4600, stockUnit: 'unidad' }
    ]
  },

  // --- Ibarreta ---
  {
    slug: 'dulcesbanado',
    name: 'Mirta Godoy',
    phone: '5493704600013',
    locality: 'Ibarreta',
    businessName: 'Dulces del Bañado',
    category: 'Dulces/Mermeladas',
    products: [
      { title: 'Dulce de Mamón x frasco', price: 980, stockUnit: 'frasco' },
      { title: 'Dulce de Guayaba x frasco', price: 1020, stockUnit: 'frasco' }
    ]
  },
  {
    slug: 'esperanzaibarreta',
    name: 'Bautista Ojeda',
    phone: '5493704600014',
    locality: 'Ibarreta',
    businessName: 'Huerta La Esperanza',
    category: 'Verduras/Hortalizas',
    products: [
      { title: 'Tomate x kg', price: 700, offerPrice: 580, isOffer: true, stockUnit: 'kg' },
      { title: 'Zapallito x kg', price: 500, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'aceitesquebracho',
    name: 'Nicanor Ibáñez',
    phone: '5493704600015',
    locality: 'Ibarreta',
    businessName: 'Aceites del Quebracho',
    category: 'Aceites',
    products: [
      { title: 'Aceite de Girasol 900ml', price: 1550, stockUnit: 'unidad' },
      { title: 'Aceite de Maíz 900ml', price: 1600, stockUnit: 'unidad' }
    ]
  },

  // --- Las Lomitas ---
  {
    slug: 'granjamonte',
    name: 'Walter Miranda',
    phone: '5493704600016',
    locality: 'Las Lomitas',
    businessName: 'Granja del Monte',
    category: 'Carnes/Huevos',
    products: [
      { title: 'Pollo Casero x kg', price: 3650, stockUnit: 'kg' },
      { title: 'Huevos de Campo x docena', price: 2850, stockUnit: 'docena' }
    ]
  },
  {
    slug: 'wichirescate',
    name: 'Rosalía Segundo',
    phone: '5493704600017',
    locality: 'Las Lomitas',
    businessName: 'Artesanías Wichí Rescate',
    category: 'Artesanías/Textil',
    bio: 'Cestería de palma y tejido de chaguar, trabajo comunitario de mujeres wichí.',
    products: [
      { title: 'Cesto de Palma Mediano', price: 4200, stockUnit: 'unidad' },
      { title: 'Bolso Tejido en Chaguar', price: 5800, stockUnit: 'unidad' }
    ]
  },
  {
    slug: 'palmares',
    name: 'Ceferino Palavecino',
    phone: '5493704600018',
    locality: 'Las Lomitas',
    businessName: 'Chacra Los Palmares',
    category: 'Tubérculos/Raíces',
    products: [
      { title: 'Mandioca x kg', price: 660, stockUnit: 'kg' },
      { title: 'Batata x kg', price: 630, stockUnit: 'kg' }
    ]
  },

  // --- Laguna Blanca (la "capital bananera" de Formosa) ---
  {
    slug: 'sanroque',
    name: 'Higinio Frutos',
    phone: '5493704600019',
    locality: 'Laguna Blanca',
    businessName: 'Bananera San Roque',
    category: 'Frutas Frescas',
    bio: 'Producción de banana de Laguna Blanca, la zona bananera más importante de Formosa.',
    products: [
      { title: 'Banana x kg', price: 720, stockUnit: 'kg' },
      { title: 'Banana x kg - Oferta por cosecha', price: 720, offerPrice: 580, isOffer: true, stockUnit: 'kg' }
    ]
  },
  {
    slug: 'envasadoraeste',
    name: 'Silvina Montiel',
    phone: '5493704600020',
    locality: 'Laguna Blanca',
    businessName: 'Envasadora del Este',
    category: 'Envases/Frascos',
    products: [
      { title: 'Bolsas de Arpillera x50', price: 2100, stockUnit: 'caja' },
      { title: 'Frascos de Vidrio x12', price: 2450, stockUnit: 'caja' }
    ]
  },
  {
    slug: 'labananita',
    name: 'Osvaldo Cabrera',
    phone: '5493704600021',
    locality: 'Laguna Blanca',
    businessName: 'Snacks La Bananita',
    category: 'Snacks/Frituras',
    products: [
      { title: 'Chips de Banana x bolsa', price: 1050, stockUnit: 'unidad' },
      { title: 'Chicharrones x kg', price: 3400, stockUnit: 'kg' }
    ]
  },

  // --- Ingeniero Juárez (oeste formoseño, comunidades pilagá/wichí) ---
  {
    slug: 'pilagaoeste',
    name: 'Filomena Guzmán',
    phone: '5493704600022',
    locality: 'Ingeniero Juárez',
    businessName: 'Artesanías Pilagá del Oeste',
    category: 'Artesanías/Textil',
    products: [
      { title: 'Cerámica Artesanal (jarra)', price: 3800, stockUnit: 'unidad' },
      { title: 'Cesto de Palma Chico', price: 2600, stockUnit: 'unidad' }
    ]
  },
  {
    slug: 'granjaoeste',
    name: 'Anselmo Vera',
    phone: '5493704600023',
    locality: 'Ingeniero Juárez',
    businessName: 'Granja del Oeste Formoseño',
    category: 'Carnes/Huevos',
    products: [
      { title: 'Chorizo Casero x kg', price: 4100, stockUnit: 'kg' },
      { title: 'Huevos de Campo x docena', price: 2750, stockUnit: 'docena' }
    ]
  },
  {
    slug: 'colmenaroeste',
    name: 'Petrona Ríos',
    phone: '5493704600024',
    locality: 'Ingeniero Juárez',
    businessName: 'Colmenar del Oeste',
    category: 'Apicultura',
    products: [
      { title: 'Miel de Monte x frasco', price: 2000, offerPrice: 1700, isOffer: true, stockUnit: 'frasco' }
    ]
  }
];

interface ConsumerSpec {
  slug: string;
  name: string;
  locality: string;
  accountType: 'PERSONA' | 'INSTITUCION';
  organizationName?: string;
  institutionType?: InstitutionType;
  phone?: string;
}

const CONSUMERS: ConsumerSpec[] = [
  // --- Personas (una por localidad) ---
  { slug: 'marisa', name: 'Marisa Cáceres', locality: 'Formosa', accountType: 'PERSONA', phone: '5493704700001' },
  { slug: 'julian', name: 'Julián Portillo', locality: 'Clorinda', accountType: 'PERSONA', phone: '5493704700002' },
  { slug: 'norma', name: 'Norma Escobar', locality: 'Pirané', accountType: 'PERSONA' },
  { slug: 'feliciano', name: 'Feliciano Cardozo', locality: 'El Colorado', accountType: 'PERSONA', phone: '5493704700004' },
  { slug: 'yolanda', name: 'Yolanda Miranda', locality: 'Ibarreta', accountType: 'PERSONA' },
  { slug: 'ramon', name: 'Ramón Segovia', locality: 'Las Lomitas', accountType: 'PERSONA', phone: '5493704700006' },
  { slug: 'griselda', name: 'Griselda Caballero', locality: 'Laguna Blanca', accountType: 'PERSONA' },
  { slug: 'toribio', name: 'Toribio Álvarez', locality: 'Ingeniero Juárez', accountType: 'PERSONA', phone: '5493704700008' },

  // --- Instituciones (comedores, escuelas, ONGs, municipios, comercios) ---
  {
    slug: 'comedorhorneros',
    name: 'Comedor Los Horneros',
    locality: 'Formosa',
    accountType: 'INSTITUCION',
    organizationName: 'Comedor Los Horneros',
    institutionType: 'Comedor',
    phone: '5493704700009'
  },
  {
    slug: 'escuela25',
    name: 'Escuela N.° 25',
    locality: 'Clorinda',
    accountType: 'INSTITUCION',
    organizationName: 'Escuela N.° 25 de Clorinda',
    institutionType: 'Escuela',
    phone: '5493704700010'
  },
  {
    slug: 'municipiopirane',
    name: 'Municipalidad de Pirané',
    locality: 'Pirané',
    accountType: 'INSTITUCION',
    organizationName: 'Municipalidad de Pirané',
    institutionType: 'Municipio',
    phone: '5493704700011'
  },
  {
    slug: 'ongmanos',
    name: 'ONG Manos Solidarias',
    locality: 'El Colorado',
    accountType: 'INSTITUCION',
    organizationName: 'ONG Manos Solidarias',
    institutionType: 'ONG',
    phone: '5493704700012'
  },
  {
    slug: 'comedoribarreta',
    name: 'Comedor Comunitario Ibarreta',
    locality: 'Ibarreta',
    accountType: 'INSTITUCION',
    organizationName: 'Comedor Comunitario Ibarreta',
    institutionType: 'Comedor',
    phone: '5493704700013'
  },
  {
    slug: 'escuelarural8',
    name: 'Escuela Rural N.° 8',
    locality: 'Las Lomitas',
    accountType: 'INSTITUCION',
    organizationName: 'Escuela Rural N.° 8',
    institutionType: 'Escuela',
    phone: '5493704700014'
  },
  {
    slug: 'comedorvirgen',
    name: 'Comedor Virgen del Carmen',
    locality: 'Laguna Blanca',
    accountType: 'INSTITUCION',
    organizationName: 'Comedor Virgen del Carmen',
    institutionType: 'Comedor',
    phone: '5493704700015'
  },
  {
    slug: 'ongpilaga',
    name: 'ONG Rescate Pilagá',
    locality: 'Ingeniero Juárez',
    accountType: 'INSTITUCION',
    organizationName: 'ONG Rescate Pilagá',
    institutionType: 'ONG',
    phone: '5493704700016'
  },
  {
    slug: 'almacendonbeto',
    name: 'Alberto Ayala',
    locality: 'Formosa',
    accountType: 'INSTITUCION',
    organizationName: 'Almacén Don Beto',
    institutionType: 'Comercio',
    phone: '5493704700017'
  },
  {
    slug: 'municipioclorinda',
    name: 'Municipalidad de Clorinda',
    locality: 'Clorinda',
    accountType: 'INSTITUCION',
    organizationName: 'Municipalidad de Clorinda',
    institutionType: 'Municipio',
    phone: '5493704700018'
  }
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed abortado: NODE_ENV=production (este script borra todas las tablas)');
    process.exit(1);
  }

  console.log('Conectando y recreando el esquema...');
  await sequelize.authenticate();
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
  await sequelize.sync({ force: true });

  passwordHash = await passwordHasher.hash(DEMO_PASSWORD);

  await createUser({ role: 'ADMIN', name: 'Admin Demo', email: 'admin@demo.local', password: DEMO_PASSWORD });
  console.log('Admin creado');

  // --- Productores + productos ---
  const producers = new Map<string, UserRecord>();
  const productsByProducer = new Map<string, ProductRecord[]>();

  for (const [index, spec] of PRODUCERS.entries()) {
    const producer = await createUser({
      role: 'PRODUCER',
      name: spec.name,
      email: `${spec.slug}@demo.local`,
      password: DEMO_PASSWORD,
      phone: spec.phone,
      locality: spec.locality,
      coordinates: jitteredCoordinates(spec.locality),
      businessName: spec.businessName,
      category: spec.category,
      paymentMethods: spec.paymentMethods ?? pick(PAYMENT_SETS),
      deliveryOptions: spec.deliveryOptions ?? pick(DELIVERY_SETS),
      bio: spec.bio ?? null
    });
    producers.set(spec.slug, producer);

    const created: ProductRecord[] = [];
    for (const product of spec.products) {
      created.push(await createProduct(producer.id, product, spec.category));
    }
    productsByProducer.set(spec.slug, created);

    if ((index + 1) % 6 === 0) console.log(`  ${index + 1}/${PRODUCERS.length} productores creados...`);
  }
  const totalProducts = [...productsByProducer.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(`${PRODUCERS.length} productores y ${totalProducts} productos creados`);

  // --- Consumidores (personas e instituciones) ---
  const consumers = new Map<string, UserRecord>();
  for (const spec of CONSUMERS) {
    const consumer = await createUser({
      role: 'CONSUMER',
      name: spec.name,
      email: `${spec.slug}@demo.local`,
      password: DEMO_PASSWORD,
      accountType: spec.accountType,
      organizationName: spec.organizationName,
      institutionType: spec.institutionType,
      phone: spec.phone,
      locality: spec.locality,
      coordinates: jitteredCoordinates(spec.locality)
    });
    consumers.set(spec.slug, consumer);
  }
  console.log(`${CONSUMERS.length} consumidores creados (${CONSUMERS.filter((c) => c.accountType === 'INSTITUCION').length} instituciones)`);

  // --- Necesidades: instituciones y personas pidiendo lo típico de la zona, algunos ---
  // productores también piden insumos de otro rubro (mismo patrón que HU-05).
  // Se dejan 4 necesidades sin match a propósito para alimentar el mapa de vacíos (HU-08).
  interface NeedSpec {
    authorSlug: string;
    isProducer?: boolean;
    title: string;
    description?: string;
    category: Category;
    quantity: number;
    unit: StockUnit;
    frequency: NeedFrequency;
    radiusKm?: number;
  }

  const NEEDS: NeedSpec[] = [
    {
      authorSlug: 'comedorhorneros',
      title: 'Mandioca y batata para viandas',
      description: 'Necesitamos tubérculos para las viandas semanales del barrio',
      category: 'Tubérculos/Raíces',
      quantity: 150,
      unit: 'kg',
      frequency: 'SEMANAL',
      radiusKm: 150
    },
    {
      authorSlug: 'escuela25',
      title: 'Fruta fresca para el desayuno escolar',
      description: 'Banana o cítricos para 120 alumnos',
      category: 'Frutas Frescas',
      quantity: 60,
      unit: 'kg',
      frequency: 'SEMANAL',
      radiusKm: 150
    },
    {
      authorSlug: 'municipiopirane',
      title: 'Miel para kit de merienda saludable',
      category: 'Apicultura',
      quantity: 30,
      unit: 'frasco',
      frequency: 'MENSUAL',
      radiusKm: 150
    },
    {
      authorSlug: 'ongmanos',
      title: 'Huevos de campo para familias en emergencia',
      category: 'Carnes/Huevos',
      quantity: 50,
      unit: 'docena',
      frequency: 'QUINCENAL',
      radiusKm: 120
    },
    {
      authorSlug: 'comedoribarreta',
      title: 'Verduras de estación para el comedor',
      category: 'Verduras/Hortalizas',
      quantity: 80,
      unit: 'kg',
      frequency: 'SEMANAL'
    },
    // Sin match a propósito: no hay productor de Panificados registrado cerca de Las Lomitas.
    {
      authorSlug: 'escuelarural8',
      title: 'Pan casero para el recreo',
      category: 'Panificados',
      quantity: 40,
      unit: 'kg',
      frequency: 'SEMANAL'
    },
    {
      authorSlug: 'comedorvirgen',
      title: 'Banana para la merienda de los chicos',
      category: 'Frutas Frescas',
      quantity: 100,
      unit: 'kg',
      frequency: 'SEMANAL'
    },
    {
      authorSlug: 'ongpilaga',
      title: 'Insumos textiles para taller de artesanas',
      description: 'Lana o chaguar para el taller de tejido comunitario',
      category: 'Artesanías/Textil',
      quantity: 20,
      unit: 'kg',
      frequency: 'MENSUAL'
    },
    {
      authorSlug: 'almacendonbeto',
      title: 'Dulces regionales para reventa',
      category: 'Dulces/Mermeladas',
      quantity: 25,
      unit: 'frasco',
      frequency: 'MENSUAL',
      radiusKm: 150
    },
    {
      authorSlug: 'municipioclorinda',
      title: 'Envases de vidrio para programa de conservas',
      category: 'Envases/Frascos',
      quantity: 200,
      unit: 'unidad',
      frequency: 'MENSUAL',
      radiusKm: 150
    },
    {
      authorSlug: 'marisa',
      title: 'Queso de cabra para casa',
      category: 'Lácteos/Quesos',
      quantity: 2,
      unit: 'unidad',
      frequency: 'MENSUAL',
      radiusKm: 150
    },
    {
      authorSlug: 'julian',
      title: 'Chipa para reunión familiar',
      category: 'Panificados',
      quantity: 5,
      unit: 'docena',
      frequency: 'UNICA'
    },
    // Sin match a propósito: no hay apicultor cerca de El Colorado con excedente ya vendido
    // (el único productor de la zona es el mismo pedido, se deja intencionalmente aislado).
    {
      authorSlug: 'feliciano',
      title: 'Aceite de girasol para uso doméstico',
      category: 'Aceites',
      quantity: 5,
      unit: 'unidad',
      frequency: 'MENSUAL'
    },
    {
      authorSlug: 'yolanda',
      title: 'Zapallo y zapallito para la semana',
      category: 'Verduras/Hortalizas',
      quantity: 10,
      unit: 'kg',
      frequency: 'SEMANAL'
    },
    {
      authorSlug: 'ramon',
      title: 'Cestería de palma para regalo',
      category: 'Artesanías/Textil',
      quantity: 3,
      unit: 'unidad',
      frequency: 'UNICA'
    },
    {
      authorSlug: 'griselda',
      title: 'Banana para kiosco de barrio',
      category: 'Frutas Frescas',
      quantity: 40,
      unit: 'kg',
      frequency: 'SEMANAL'
    },
    // Sin match a propósito: no hay productor de Otros/artesanías cerámicas cerca registrado
    // con excedente (demanda insatisfecha real del oeste formoseño).
    {
      authorSlug: 'toribio',
      title: 'Cerámica artesanal para vender en la ruta',
      category: 'Artesanías/Textil',
      quantity: 15,
      unit: 'unidad',
      frequency: 'MENSUAL'
    },
    {
      authorSlug: 'norma',
      title: 'Dulce de batata para el almacén',
      category: 'Dulces/Mermeladas',
      quantity: 15,
      unit: 'frasco',
      frequency: 'QUINCENAL'
    },
    // Productores pidiendo insumos de otro rubro (patrón B2B, HU-05/HU-11)
    {
      authorSlug: 'labananita',
      isProducer: true,
      title: 'Banana para elaborar chips',
      category: 'Frutas Frescas',
      quantity: 200,
      unit: 'kg',
      frequency: 'SEMANAL',
      radiusKm: 60
    },
    {
      authorSlug: 'dulcesbanado',
      isProducer: true,
      title: 'Frascos de vidrio para dulces',
      category: 'Envases/Frascos',
      quantity: 300,
      unit: 'unidad',
      frequency: 'MENSUAL',
      radiusKm: 150
    },
    {
      authorSlug: 'espiga',
      isProducer: true,
      title: 'Queso para relleno de empanadas',
      category: 'Lácteos/Quesos',
      quantity: 30,
      unit: 'kg',
      frequency: 'QUINCENAL',
      radiusKm: 60
    },
    {
      authorSlug: 'treshermanos',
      isProducer: true,
      title: 'Miel para promoción de huevos + miel',
      category: 'Apicultura',
      quantity: 20,
      unit: 'frasco',
      frequency: 'MENSUAL',
      radiusKm: 60
    }
  ];

  let needsCreated = 0;
  for (const spec of NEEDS) {
    const author = spec.isProducer ? producers.get(spec.authorSlug) : consumers.get(spec.authorSlug);
    if (!author) throw new Error(`Autor de necesidad no encontrado: ${spec.authorSlug}`);
    await createNeed(author, {
      title: spec.title,
      description: spec.description ?? null,
      category: spec.category,
      quantity: spec.quantity,
      unit: spec.unit,
      frequency: spec.frequency,
      radiusKm: spec.radiusKm
    });
    needsCreated += 1;
  }
  console.log(`${needsCreated} necesidades creadas`);

  // --- Telemetría: simular varios meses de uso normal de la plataforma ---
  // Términos de búsqueda típicos por rubro, usados tanto para SEARCH_HIT (con oferta real
  // cerca) como para SEARCH_FAIL (concentrados en localidades sin ese rubro disponible).
  const SEARCH_TERMS: Array<{ term: string; category: Category }> = [
    { term: 'mandioca', category: 'Tubérculos/Raíces' },
    { term: 'batata', category: 'Tubérculos/Raíces' },
    { term: 'banana', category: 'Frutas Frescas' },
    { term: 'pomelo', category: 'Frutas Frescas' },
    { term: 'zapallo', category: 'Verduras/Hortalizas' },
    { term: 'choclo', category: 'Verduras/Hortalizas' },
    { term: 'miel', category: 'Apicultura' },
    { term: 'dulce de batata', category: 'Dulces/Mermeladas' },
    { term: 'dulce de mamón', category: 'Dulces/Mermeladas' },
    { term: 'aceite de girasol', category: 'Aceites' },
    { term: 'frascos de vidrio', category: 'Envases/Frascos' },
    { term: 'queso cremoso', category: 'Lácteos/Quesos' },
    { term: 'queso de cabra', category: 'Lácteos/Quesos' },
    { term: 'huevos de campo', category: 'Carnes/Huevos' },
    { term: 'pollo casero', category: 'Carnes/Huevos' },
    { term: 'chipa', category: 'Panificados' },
    { term: 'pan casero', category: 'Panificados' },
    { term: 'cestería de palma', category: 'Artesanías/Textil' },
    { term: 'hamaca paraguaya', category: 'Artesanías/Textil' },
    { term: 'chips de banana', category: 'Snacks/Frituras' }
  ];

  // Búsquedas exitosas: distribuidas en las 8 localidades y los últimos ~90 días.
  let searchHits = 0;
  for (const locality of LOCALITY_NAMES) {
    const count = randomInt(4, 8);
    for (let i = 0; i < count; i++) {
      const hit = pick(SEARCH_TERMS);
      await createEvent({
        eventType: 'SEARCH_HIT',
        queryTerm: hit.term,
        category: hit.category,
        locality,
        userId: Math.random() < 0.25 ? pick([...consumers.values()]).id : null,
        daysAgo: randomDaysAgo(90)
      });
      searchHits += 1;
    }
  }

  // Búsquedas fallidas: concentradas en combinaciones locality/categoría sin oferta real,
  // para alimentar el mapa de vacíos y las oportunidades de HU-08.
  const FAILED_COMBOS: Array<{ term: string; category: Category; locality: string; count: number }> = [
    { term: 'queso de cabra', category: 'Lácteos/Quesos', locality: 'Las Lomitas', count: 6 },
    { term: 'pan casero', category: 'Panificados', locality: 'Las Lomitas', count: 5 },
    { term: 'aceite de girasol', category: 'Aceites', locality: 'El Colorado', count: 5 },
    { term: 'aceite de girasol', category: 'Aceites', locality: 'Ingeniero Juárez', count: 4 },
    { term: 'hamaca paraguaya', category: 'Artesanías/Textil', locality: 'El Colorado', count: 4 },
    { term: 'cerámica artesanal', category: 'Artesanías/Textil', locality: 'Formosa', count: 5 },
    { term: 'banana', category: 'Frutas Frescas', locality: 'Ingeniero Juárez', count: 6 },
    { term: 'miel', category: 'Apicultura', locality: 'Pirané', count: 4 }
  ];
  let searchFails = 0;
  for (const combo of FAILED_COMBOS) {
    for (let i = 0; i < combo.count; i++) {
      await createEvent({
        eventType: 'SEARCH_FAIL',
        queryTerm: combo.term,
        category: combo.category,
        locality: combo.locality,
        daysAgo: randomDaysAgo(60)
      });
      searchFails += 1;
    }
  }

  // Clics de WhatsApp: cada producto recibe entre 0 y 12 clics, con más peso en los que
  // están en oferta (comportamiento real: la oferta relámpago atrae más contactos).
  let whatsappClicks = 0;
  for (const [slug, producer] of producers) {
    const products = productsByProducer.get(slug) ?? [];
    const producerSpec = PRODUCERS.find((p) => p.slug === slug)!;
    for (const product of products) {
      const base = randomInt(0, 8);
      const bonus = product.isOffer ? randomInt(2, 6) : 0;
      const clicks = base + bonus;
      for (let i = 0; i < clicks; i++) {
        await createEvent({
          eventType: 'WHATSAPP_CLICK',
          category: producerSpec.category,
          locality: producerSpec.locality,
          productId: product.id,
          producerId: producer.id,
          userId: Math.random() < 0.4 ? pick([...consumers.values()]).id : null,
          daysAgo: randomDaysAgo(90)
        });
        whatsappClicks += 1;
      }
    }
  }

  console.log(`Telemetría: ${searchHits} SEARCH_HIT, ${searchFails} SEARCH_FAIL, ${whatsappClicks} WHATSAPP_CLICK`);

  // --- Historial dedicado de 2 consumidores para el motivo NOW_AVAILABLE (HU-10): buscan
  // algo que todavía no existe, y recién después se publica el producto que lo resuelve. ---
  const marisa = consumers.get('marisa')!;
  const griselda = consumers.get('griselda')!;

  await createEvent({
    eventType: 'SEARCH_FAIL',
    queryTerm: 'queso de cabra',
    category: 'Lácteos/Quesos',
    locality: 'Formosa',
    userId: marisa.id,
    daysAgo: 25
  });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Lácteos/Quesos',
    locality: 'Formosa',
    productId: productsByProducer.get('banado')![0].id,
    producerId: producers.get('banado')!.id,
    userId: marisa.id,
    daysAgo: 15
  });

  await createEvent({
    eventType: 'SEARCH_FAIL',
    queryTerm: 'chips de banana',
    category: 'Snacks/Frituras',
    locality: 'Laguna Blanca',
    userId: griselda.id,
    daysAgo: 20
  });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Frutas Frescas',
    locality: 'Laguna Blanca',
    productId: productsByProducer.get('sanroque')![0].id,
    producerId: producers.get('sanroque')!.id,
    userId: griselda.id,
    daysAgo: 12
  });

  // Producto agregado después del historial de búsquedas fallidas: dispara NOW_AVAILABLE
  // para quien buscó "queso de cabra" en Formosa y no encontraba nada por acá.
  await createProduct(
    producers.get('banado')!.id,
    { title: 'Queso de Cabra Artesanal x 500g', price: 4700, stockUnit: 'unidad' },
    'Lácteos/Quesos'
  );
  console.log('Producto "Queso de Cabra Artesanal x 500g" creado después del historial (motivo NOW_AVAILABLE)');

  console.log('\nSeed de Formosa completado.');
  console.log(`Contraseña para todas las cuentas: ${DEMO_PASSWORD}`);
  console.log(`Admin: admin@demo.local`);
  console.log(`Productores (24): ${PRODUCERS.map((p) => `${p.slug}@demo.local`).join(', ')}`);
  console.log(`Consumidores (${CONSUMERS.length}): ${CONSUMERS.map((c) => `${c.slug}@demo.local`).join(', ')}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  });
