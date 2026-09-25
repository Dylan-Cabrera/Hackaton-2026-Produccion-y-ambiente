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

// Seed "de demo grande": 100 cuentas repartidas entre las 4 formas de uso reales de la
// plataforma (productores/emprendedores, instituciones, vecinos y el admin provincial),
// con productos típicos de la región, necesidades publicadas y varios miles de eventos de
// telemetría distribuidos en el tiempo, para que TODOS los gráficos (dashboard admin,
// demanda del productor, mapa de calor) tengan datos con los que mostrar algo desde el
// primer minuto de la demo, sin depender de que alguien navegue la app antes.
//
// A diferencia de seed-formosa.ts (24 cuentas, pensado para explorar el catálogo a mano),
// este script prioriza volumen y variedad para que las métricas agregadas (promedios,
// rankings, series de tiempo) no se vean vacías ni artificiales.
const DEMO_PASSWORD = 'Demo1234';
const passwordHasher = new BcryptPasswordHasher();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number): Date => new Date(Date.now() - days * MS_PER_DAY);
const randomDaysAgo = (maxDays: number): number => Math.random() * maxDays;
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const jitterPrice = (base: number): number => Math.round((base * (0.85 + Math.random() * 0.3)) / 10) * 10;

// Jitter de ±0.03° alrededor del centroide de la localidad: sin esto todas las cuentas de
// una misma localidad quedan apiladas en el mismo punto del mapa.
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
let adminPasswordHash: string;

async function createUser(input: RegisterInput, password: string = DEMO_PASSWORD): Promise<UserRecord> {
  const hash = password === DEMO_PASSWORD ? passwordHash : adminPasswordHash;
  return userRepository.create(UserMapper.toPersistence(input, hash));
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

// --- Catálogo de productos típicos de la región, por rubro (HU-02) ---

interface ProductTemplate {
  title: string;
  price: number;
  stockUnit: StockUnit;
}

const CATEGORY_PRODUCTS: Record<Category, ProductTemplate[]> = {
  'Frutas Frescas': [
    { title: 'Banana x kg', price: 720, stockUnit: 'kg' },
    { title: 'Pomelo x kg', price: 520, stockUnit: 'kg' },
    { title: 'Naranja x kg', price: 480, stockUnit: 'kg' },
    { title: 'Mandarina x kg', price: 500, stockUnit: 'kg' },
    { title: 'Mamón x kg', price: 450, stockUnit: 'kg' }
  ],
  'Verduras/Hortalizas': [
    { title: 'Zapallo x kg', price: 450, stockUnit: 'kg' },
    { title: 'Choclo x docena', price: 1200, stockUnit: 'docena' },
    { title: 'Poroto x kg', price: 800, stockUnit: 'kg' },
    { title: 'Tomate x kg', price: 700, stockUnit: 'kg' },
    { title: 'Zapallito x kg', price: 500, stockUnit: 'kg' }
  ],
  'Tubérculos/Raíces': [
    { title: 'Mandioca x kg', price: 690, stockUnit: 'kg' },
    { title: 'Batata x kg', price: 610, stockUnit: 'kg' },
    { title: 'Papa x kg', price: 620, stockUnit: 'kg' }
  ],
  'Dulces/Mermeladas': [
    { title: 'Dulce de Batata x frasco', price: 950, stockUnit: 'frasco' },
    { title: 'Dulce de Mamón x frasco', price: 980, stockUnit: 'frasco' },
    { title: 'Mermelada de Naranja x frasco', price: 1000, stockUnit: 'frasco' },
    { title: 'Dulce de Guayaba x frasco', price: 1020, stockUnit: 'frasco' }
  ],
  'Snacks/Frituras': [
    { title: 'Papas Fritas Artesanales x bolsa', price: 1200, stockUnit: 'unidad' },
    { title: 'Chips de Banana x bolsa', price: 1050, stockUnit: 'unidad' },
    { title: 'Chicharrones x kg', price: 3400, stockUnit: 'kg' }
  ],
  Apicultura: [
    { title: 'Miel Pura x frasco', price: 1900, stockUnit: 'frasco' },
    { title: 'Propóleo x frasco', price: 2300, stockUnit: 'frasco' },
    { title: 'Polen x frasco', price: 2100, stockUnit: 'frasco' },
    { title: 'Miel de Monte x frasco', price: 2000, stockUnit: 'frasco' }
  ],
  Aceites: [
    { title: 'Aceite de Girasol 900ml', price: 1550, stockUnit: 'unidad' },
    { title: 'Aceite de Maíz 900ml', price: 1600, stockUnit: 'unidad' }
  ],
  'Envases/Frascos': [
    { title: 'Frascos de Vidrio x12', price: 2500, stockUnit: 'caja' },
    { title: 'Tapas Metálicas x24', price: 1150, stockUnit: 'caja' },
    { title: 'Bolsas de Arpillera x50', price: 2100, stockUnit: 'caja' }
  ],
  'Lácteos/Quesos': [
    { title: 'Queso Cremoso x kg', price: 4300, stockUnit: 'kg' },
    { title: 'Leche Entera x litro', price: 920, stockUnit: 'litro' },
    { title: 'Dulce de Leche x frasco', price: 1600, stockUnit: 'frasco' },
    { title: 'Queso de Cabra x 500g', price: 4600, stockUnit: 'unidad' }
  ],
  'Carnes/Huevos': [
    { title: 'Huevos de Campo x docena', price: 2900, stockUnit: 'docena' },
    { title: 'Pollo Casero x kg', price: 3700, stockUnit: 'kg' },
    { title: 'Chorizo Casero x kg', price: 4100, stockUnit: 'kg' }
  ],
  Panificados: [
    { title: 'Chipa x docena', price: 1400, stockUnit: 'docena' },
    { title: 'Pan Casero x kg', price: 900, stockUnit: 'kg' },
    { title: 'Tortas Fritas x6', price: 1100, stockUnit: 'unidad' },
    { title: 'Empanadas de Mandioca x6', price: 1500, stockUnit: 'unidad' }
  ],
  'Artesanías/Textil': [
    { title: 'Hamaca Paraguaya Matrimonial', price: 18500, stockUnit: 'unidad' },
    { title: 'Tejido en Telar (mantel)', price: 6200, stockUnit: 'unidad' },
    { title: 'Cesto de Palma Mediano', price: 4200, stockUnit: 'unidad' },
    { title: 'Cerámica Artesanal (jarra)', price: 3800, stockUnit: 'unidad' },
    { title: 'Bolso Tejido en Chaguar', price: 5800, stockUnit: 'unidad' }
  ],
  Otros: [
    { title: 'Leña x bolsa', price: 1500, stockUnit: 'unidad' },
    { title: 'Plantines de Vivero x unidad', price: 350, stockUnit: 'unidad' },
    { title: 'Carbón x bolsa', price: 2200, stockUnit: 'unidad' }
  ]
};

const PAYMENT_SETS = [['Efectivo'], ['Efectivo', 'Transferencia'], ['Efectivo', 'Transferencia', 'Tarjeta']];
const DELIVERY_SETS = [
  ['Retiro en el local'],
  ['Retiro en el local', 'Envío a domicilio'],
  ['Envío a domicilio', 'Punto de encuentro'],
  ['Retiro en el local', 'Envío a domicilio', 'Punto de encuentro']
];

// --- 35 productores/emprendedores: nombre real de emprendimiento, rubro y localidad ---
// (incluye a Diego Britos, pedido explícitamente para la demo)

interface ProducerSpec {
  slug: string;
  name: string;
  businessName: string;
  category: Category;
  locality: string;
  phone: string;
  bio?: string;
}

const PRODUCERS: ProducerSpec[] = [
  // Formosa (capital)
  { slug: 'britos', name: 'Diego Britos', businessName: 'Dulces y Conservas Britos', category: 'Dulces/Mermeladas', locality: 'Formosa', phone: '5493704605163', bio: 'Dulces caseros de fruta de estación, receta de familia.' },
  { slug: 'espiga', name: 'Teresa Aquino', businessName: 'Panadería La Espiga', category: 'Panificados', locality: 'Formosa', phone: '5493704600002' },
  { slug: 'banado', name: 'Ricardo Paredes', businessName: 'Quesos del Bañado', category: 'Lácteos/Quesos', locality: 'Formosa', phone: '5493704600003' },
  { slug: 'vidrieria', name: 'Omar Sánchez', businessName: 'Vidriería Norte', category: 'Envases/Frascos', locality: 'Formosa', phone: '5493704600004' },
  { slug: 'granjafor', name: 'Claudia Benítez', businessName: 'Granja Doña Claudia', category: 'Carnes/Huevos', locality: 'Formosa', phone: '5493704600005' },

  // Clorinda (frontera con Paraguay)
  { slug: 'nandu', name: 'Fátima Ovelar', businessName: 'Textiles Ñandutí', category: 'Artesanías/Textil', locality: 'Clorinda', phone: '5493704600006' },
  { slug: 'pilcomayo', name: 'Nélida Domínguez', businessName: 'Cítricos del Pilcomayo', category: 'Frutas Frescas', locality: 'Clorinda', phone: '5493704600007' },
  { slug: 'encarnacion', name: 'Encarnación Duarte', businessName: 'Chipería Doña Encarnación', category: 'Panificados', locality: 'Clorinda', phone: '5493704600008' },
  { slug: 'apiarioclo', name: 'Juan Ramón Vera', businessName: 'Apiario Frontera', category: 'Apicultura', locality: 'Clorinda', phone: '5493704600009' },

  // Pirané
  { slug: 'sanisidro', name: 'Ezequiel Coronel', businessName: 'Chacra San Isidro', category: 'Tubérculos/Raíces', locality: 'Pirané', phone: '5493704600010' },
  { slug: 'elsurco', name: 'Herminia López', businessName: 'Verdulería El Surco', category: 'Verduras/Hortalizas', locality: 'Pirané', phone: '5493704600011' },
  { slug: 'dulcespirani', name: 'Adela Ferreyra', businessName: 'Dulces Piraní', category: 'Dulces/Mermeladas', locality: 'Pirané', phone: '5493704600012' },
  { slug: 'tambopirane', name: 'Ramona Ayala', businessName: 'Tambo Piraní', category: 'Lácteos/Quesos', locality: 'Pirané', phone: '5493704600013' },

  // El Colorado
  { slug: 'montedorado', name: 'Facundo Villagra', businessName: 'Apiario Monte Dorado', category: 'Apicultura', locality: 'El Colorado', phone: '5493704600014' },
  { slug: 'treshermanos', name: 'Zulma Aranda', businessName: 'Granja Los Tres Hermanos', category: 'Carnes/Huevos', locality: 'El Colorado', phone: '5493704600015' },
  { slug: 'elOasis', name: 'Cristian Núñez', businessName: 'Tambo El Oasis', category: 'Lácteos/Quesos', locality: 'El Colorado', phone: '5493704600016' },
  { slug: 'aceitecolorado', name: 'Beatriz Cabral', businessName: 'Aceites El Colorado', category: 'Aceites', locality: 'El Colorado', phone: '5493704600017' },

  // Ibarreta
  { slug: 'dulcesbanado', name: 'Mirta Godoy', businessName: 'Dulces del Bañado', category: 'Dulces/Mermeladas', locality: 'Ibarreta', phone: '5493704600018' },
  { slug: 'esperanzaibarreta', name: 'Bautista Ojeda', businessName: 'Huerta La Esperanza', category: 'Verduras/Hortalizas', locality: 'Ibarreta', phone: '5493704600019' },
  { slug: 'aceitesquebracho', name: 'Nicanor Ibáñez', businessName: 'Aceites del Quebracho', category: 'Aceites', locality: 'Ibarreta', phone: '5493704600020' },
  { slug: 'granjaibarreta', name: 'Corina Maidana', businessName: 'Granja Ibarreta', category: 'Carnes/Huevos', locality: 'Ibarreta', phone: '5493704600021' },

  // Las Lomitas
  { slug: 'granjamonte', name: 'Walter Miranda', businessName: 'Granja del Monte', category: 'Carnes/Huevos', locality: 'Las Lomitas', phone: '5493704600022' },
  { slug: 'wichirescate', name: 'Rosalía Segundo', businessName: 'Artesanías Wichí Rescate', category: 'Artesanías/Textil', locality: 'Las Lomitas', phone: '5493704600023' },
  { slug: 'palmares', name: 'Ceferino Palavecino', businessName: 'Chacra Los Palmares', category: 'Tubérculos/Raíces', locality: 'Las Lomitas', phone: '5493704600024' },
  { slug: 'dulceslomitas', name: 'Isabel Quintana', businessName: 'Dulces de Las Lomitas', category: 'Dulces/Mermeladas', locality: 'Las Lomitas', phone: '5493704600025' },

  // Laguna Blanca (capital bananera de Formosa)
  { slug: 'sanroque', name: 'Higinio Frutos', businessName: 'Bananera San Roque', category: 'Frutas Frescas', locality: 'Laguna Blanca', phone: '5493704600026', bio: 'Producción de banana de Laguna Blanca, la zona bananera más importante de Formosa.' },
  { slug: 'envasadoraeste', name: 'Silvina Montiel', businessName: 'Envasadora del Este', category: 'Envases/Frascos', locality: 'Laguna Blanca', phone: '5493704600027' },
  { slug: 'labananita', name: 'Osvaldo Cabrera', businessName: 'Snacks La Bananita', category: 'Snacks/Frituras', locality: 'Laguna Blanca', phone: '5493704600028' },
  { slug: 'quesolaguna', name: 'Marcelina Rojas', businessName: 'Quesería Laguna Blanca', category: 'Lácteos/Quesos', locality: 'Laguna Blanca', phone: '5493704600029' },

  // Ingeniero Juárez (oeste formoseño)
  { slug: 'pilagaoeste', name: 'Filomena Guzmán', businessName: 'Artesanías Pilagá del Oeste', category: 'Artesanías/Textil', locality: 'Ingeniero Juárez', phone: '5493704600030' },
  { slug: 'granjaoeste', name: 'Anselmo Vera', businessName: 'Granja del Oeste Formoseño', category: 'Carnes/Huevos', locality: 'Ingeniero Juárez', phone: '5493704600031' },
  { slug: 'colmenaroeste', name: 'Petrona Ríos', businessName: 'Colmenar del Oeste', category: 'Apicultura', locality: 'Ingeniero Juárez', phone: '5493704600032' },
  { slug: 'lenaoeste', name: 'Braulio Silva', businessName: 'Leñera del Monte', category: 'Otros', locality: 'Ingeniero Juárez', phone: '5493704600033' },
  { slug: 'viverooeste', name: 'Aurora Barrios', businessName: 'Vivero Monte Adentro', category: 'Otros', locality: 'Ingeniero Juárez', phone: '5493704600034' },
  { slug: 'mandiocaoeste', name: 'Rufino Alegre', businessName: 'Chacra del Oeste', category: 'Tubérculos/Raíces', locality: 'Ingeniero Juárez', phone: '5493704600035' }
];

// --- Instituciones (comedores, escuelas, ONGs, municipios, comercios) ---

interface InstitutionSpec {
  slug: string;
  name: string;
  organizationName: string;
  institutionType: InstitutionType;
  locality: string;
  phone: string;
}

const INSTITUTIONS: InstitutionSpec[] = [
  { slug: 'comedorhorneros', name: 'Marta Villalba', organizationName: 'Comedor Los Horneros', institutionType: 'Comedor', locality: 'Formosa', phone: '5493704700001' },
  { slug: 'escuela25', name: 'Director Escuela N.° 25', organizationName: 'Escuela N.° 25 de Clorinda', institutionType: 'Escuela', locality: 'Clorinda', phone: '5493704700002' },
  { slug: 'municipiopirane', name: 'Secretaría de Producción', organizationName: 'Municipalidad de Pirané', institutionType: 'Municipio', locality: 'Pirané', phone: '5493704700003' },
  { slug: 'ongmanos', name: 'Coordinación ONG', organizationName: 'ONG Manos Solidarias', institutionType: 'ONG', locality: 'El Colorado', phone: '5493704700004' },
  { slug: 'comedoribarreta', name: 'Rosa Benítez', organizationName: 'Comedor Comunitario Ibarreta', institutionType: 'Comedor', locality: 'Ibarreta', phone: '5493704700005' },
  { slug: 'escuelarural8', name: 'Director Escuela Rural N.° 8', organizationName: 'Escuela Rural N.° 8', institutionType: 'Escuela', locality: 'Las Lomitas', phone: '5493704700006' },
  { slug: 'comedorvirgen', name: 'Griselda Caballero', organizationName: 'Comedor Virgen del Carmen', institutionType: 'Comedor', locality: 'Laguna Blanca', phone: '5493704700007' },
  { slug: 'ongpilaga', name: 'Coordinación Pilagá', organizationName: 'ONG Rescate Pilagá', institutionType: 'ONG', locality: 'Ingeniero Juárez', phone: '5493704700008' },
  { slug: 'almacendonbeto', name: 'Alberto Ayala', organizationName: 'Almacén Don Beto', institutionType: 'Comercio', locality: 'Formosa', phone: '5493704700009' },
  { slug: 'municipioclorinda', name: 'Secretaría de Producción', organizationName: 'Municipalidad de Clorinda', institutionType: 'Municipio', locality: 'Clorinda', phone: '5493704700010' },
  { slug: 'municipiolomitas', name: 'Secretaría de Desarrollo Social', organizationName: 'Municipalidad de Las Lomitas', institutionType: 'Municipio', locality: 'Las Lomitas', phone: '5493704700011' },
  { slug: 'escuelaelcolorado', name: 'Directora Escuela N.° 14', organizationName: 'Escuela N.° 14 El Colorado', institutionType: 'Escuela', locality: 'El Colorado', phone: '5493704700012' },
  { slug: 'comedorlaguna', name: 'Norma Duarte', organizationName: 'Comedor Amanecer', institutionType: 'Comedor', locality: 'Laguna Blanca', phone: '5493704700013' },
  { slug: 'comerciojuarez', name: 'Sergio Ledesma', organizationName: 'Despensa Don Sergio', institutionType: 'Comercio', locality: 'Ingeniero Juárez', phone: '5493704700014' },
  { slug: 'ongibarreta', name: 'Coordinación ONG Ibarreta', organizationName: 'ONG Semillas del Norte', institutionType: 'ONG', locality: 'Ibarreta', phone: '5493704700015' }
];

// --- Personas: se generan a partir de dos listas de nombres (49 cuentas, ~6 por localidad) ---

const FIRST_NAMES = [
  'Marisa', 'Julián', 'Norma', 'Feliciano', 'Yolanda', 'Ramón', 'Griselda', 'Toribio',
  'Lucía', 'Ariel', 'Carla', 'Hugo', 'Mabel', 'Damián', 'Silvana', 'Emiliano',
  'Rosa', 'Gustavo', 'Patricia', 'Leandro', 'Verónica', 'Nicolás', 'Estela', 'Rodrigo',
  'Andrea', 'Pablo', 'Cintia', 'Fabián', 'Liliana', 'Sebastián', 'Marina', 'Alejandro',
  'Noelia', 'Martín', 'Viviana', 'Ezequiel', 'Cecilia', 'Gonzalo', 'Paola', 'Matías',
  'Sonia', 'Diego', 'Karina', 'Federico', 'Miriam', 'Ignacio', 'Daniela', 'Roberto',
  'Alicia', 'Esteban'
];
const LAST_NAMES = [
  'Cáceres', 'Portillo', 'Escobar', 'Cardozo', 'Miranda', 'Segovia', 'Caballero', 'Álvarez',
  'Fernández', 'Torres', 'Gómez', 'Sosa', 'Franco', 'Duarte', 'Acosta', 'Benítez',
  'Ríos', 'Sánchez', 'Villalba', 'Ferreira', 'Godoy', 'Núñez', 'Coronel', 'Aranda',
  'Domínguez', 'Ramírez', 'Cabral', 'Meza', 'Rojas', 'Silva', 'Alegre', 'Barrios',
  'Ayala', 'Vera', 'Ibáñez', 'Medina', 'Ojeda', 'Paredes', 'Maidana', 'Quintana',
  'Ledesma', 'Gauto', 'Bogado', 'Insaurralde', 'Zayas', 'Areco', 'Bareiro', 'Cabañas',
  'Fleitas', 'Giménez'
];

function personaName(index: number): string {
  return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length]}`;
}

interface ConsumerSpec {
  slug: string;
  name: string;
  locality: string;
  phone?: string;
}

const PERSONS: ConsumerSpec[] = Array.from({ length: 49 }, (_, i) => {
  const locality = LOCALITY_NAMES[i % LOCALITY_NAMES.length];
  return {
    slug: `vecino${i + 1}`,
    name: personaName(i),
    locality,
    // Un poco más de la mitad carga teléfono (para poder publicar necesidades)
    phone: i % 2 === 0 ? `54937047${String(1000 + i).slice(-4)}` : undefined
  };
});

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
  adminPasswordHash = await passwordHasher.hash('admin1234');

  // --- Admin ---
  await createUser({ role: 'ADMIN', name: 'Administrador Provincial', email: 'admin@gmail.com', password: 'admin1234' }, 'admin1234');
  console.log('1/100 · Admin creado (admin@gmail.com)');

  // --- Productores/emprendedores (35) ---
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
      paymentMethods: pick(PAYMENT_SETS),
      deliveryOptions: pick(DELIVERY_SETS),
      bio: spec.bio ?? null
    });
    producers.set(spec.slug, producer);

    // 2 o 3 productos del catálogo de su rubro (con precio propio, no todos iguales)
    const catalog = CATEGORY_PRODUCTS[spec.category];
    const count = Math.min(catalog.length, randomInt(2, 3));
    const chosen = [...catalog].sort(() => Math.random() - 0.5).slice(0, count);
    const created: ProductRecord[] = [];
    for (const [i, template] of chosen.entries()) {
      const isOffer = i === 0 && Math.random() < 0.4;
      const price = jitterPrice(template.price);
      created.push(
        await createProduct(
          producer.id,
          {
            title: template.title,
            price,
            stockUnit: template.stockUnit,
            ...(isOffer && { isOffer: true, offerPrice: Math.round((price * 0.8) / 10) * 10 })
          },
          spec.category
        )
      );
    }
    productsByProducer.set(spec.slug, created);
  }
  const totalProducts = [...productsByProducer.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(`${1 + PRODUCERS.length}/100 · 35 productores/emprendedores creados (${totalProducts} productos, incluye a Diego Britos)`);

  // --- Instituciones (15) ---
  const institutions = new Map<string, UserRecord>();
  for (const spec of INSTITUTIONS) {
    const institution = await createUser({
      role: 'CONSUMER',
      name: spec.name,
      email: `${spec.slug}@demo.local`,
      password: DEMO_PASSWORD,
      accountType: 'INSTITUCION',
      organizationName: spec.organizationName,
      institutionType: spec.institutionType,
      phone: spec.phone,
      locality: spec.locality,
      coordinates: jitteredCoordinates(spec.locality)
    });
    institutions.set(spec.slug, institution);
  }
  console.log(`${1 + PRODUCERS.length + INSTITUTIONS.length}/100 · 15 instituciones creadas`);

  // --- Personas (49) ---
  const persons = new Map<string, UserRecord>();
  for (const spec of PERSONS) {
    const person = await createUser({
      role: 'CONSUMER',
      name: spec.name,
      email: `${spec.slug}@demo.local`,
      password: DEMO_PASSWORD,
      accountType: 'PERSONA',
      phone: spec.phone,
      locality: spec.locality,
      coordinates: jitteredCoordinates(spec.locality)
    });
    persons.set(spec.slug, person);
  }
  console.log('100/100 · 49 vecinos creados. Todas las cuentas listas.');

  const consumers = new Map<string, UserRecord>([...institutions, ...persons]);

  // --- Necesidades: instituciones, vecinos con teléfono y algunos productores (patrón B2B) ---
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
    { authorSlug: 'comedorhorneros', title: 'Mandioca y batata para viandas', description: 'Tubérculos para las viandas semanales del barrio', category: 'Tubérculos/Raíces', quantity: 150, unit: 'kg', frequency: 'SEMANAL', radiusKm: 150 },
    { authorSlug: 'escuela25', title: 'Fruta fresca para el desayuno escolar', description: 'Banana o cítricos para 120 alumnos', category: 'Frutas Frescas', quantity: 60, unit: 'kg', frequency: 'SEMANAL', radiusKm: 150 },
    { authorSlug: 'municipiopirane', title: 'Miel para kit de merienda saludable', category: 'Apicultura', quantity: 30, unit: 'frasco', frequency: 'MENSUAL', radiusKm: 150 },
    { authorSlug: 'ongmanos', title: 'Huevos de campo para familias en emergencia', category: 'Carnes/Huevos', quantity: 50, unit: 'docena', frequency: 'QUINCENAL', radiusKm: 120 },
    { authorSlug: 'comedoribarreta', title: 'Verduras de estación para el comedor', category: 'Verduras/Hortalizas', quantity: 80, unit: 'kg', frequency: 'SEMANAL' },
    { authorSlug: 'escuelarural8', title: 'Pan casero para el recreo', category: 'Panificados', quantity: 40, unit: 'kg', frequency: 'SEMANAL' },
    { authorSlug: 'comedorvirgen', title: 'Banana para la merienda de los chicos', category: 'Frutas Frescas', quantity: 100, unit: 'kg', frequency: 'SEMANAL' },
    { authorSlug: 'ongpilaga', title: 'Insumos textiles para taller de artesanas', description: 'Lana o chaguar para el taller de tejido comunitario', category: 'Artesanías/Textil', quantity: 20, unit: 'kg', frequency: 'MENSUAL' },
    { authorSlug: 'almacendonbeto', title: 'Dulces regionales para reventa', category: 'Dulces/Mermeladas', quantity: 25, unit: 'frasco', frequency: 'MENSUAL', radiusKm: 150 },
    { authorSlug: 'municipioclorinda', title: 'Envases de vidrio para programa de conservas', category: 'Envases/Frascos', quantity: 200, unit: 'unidad', frequency: 'MENSUAL', radiusKm: 150 },
    { authorSlug: 'municipiolomitas', title: 'Carnes para merienda reforzada', category: 'Carnes/Huevos', quantity: 60, unit: 'kg', frequency: 'QUINCENAL' },
    { authorSlug: 'escuelaelcolorado', title: 'Leche para comedor escolar', category: 'Lácteos/Quesos', quantity: 50, unit: 'litro', frequency: 'SEMANAL' },
    { authorSlug: 'comedorlaguna', title: 'Aceite para cocinar en el comedor', category: 'Aceites', quantity: 20, unit: 'unidad', frequency: 'MENSUAL' },
    { authorSlug: 'comerciojuarez', title: 'Miel para reventa en el almacén', category: 'Apicultura', quantity: 15, unit: 'frasco', frequency: 'MENSUAL' },
    { authorSlug: 'ongibarreta', title: 'Verduras para huerta comunitaria', category: 'Verduras/Hortalizas', quantity: 40, unit: 'kg', frequency: 'QUINCENAL' },
    { authorSlug: 'vecino1', title: 'Queso de cabra para casa', category: 'Lácteos/Quesos', quantity: 2, unit: 'unidad', frequency: 'MENSUAL', radiusKm: 150 },
    { authorSlug: 'vecino3', title: 'Chipa para reunión familiar', category: 'Panificados', quantity: 5, unit: 'docena', frequency: 'UNICA' },
    { authorSlug: 'vecino5', title: 'Aceite de girasol para uso doméstico', category: 'Aceites', quantity: 5, unit: 'unidad', frequency: 'MENSUAL' },
    { authorSlug: 'vecino7', title: 'Zapallo y zapallito para la semana', category: 'Verduras/Hortalizas', quantity: 10, unit: 'kg', frequency: 'SEMANAL' },
    { authorSlug: 'vecino9', title: 'Cestería de palma para regalo', category: 'Artesanías/Textil', quantity: 3, unit: 'unidad', frequency: 'UNICA' },
    { authorSlug: 'vecino11', title: 'Banana para kiosco de barrio', category: 'Frutas Frescas', quantity: 40, unit: 'kg', frequency: 'SEMANAL' },
    { authorSlug: 'vecino13', title: 'Cerámica artesanal para vender en la ruta', category: 'Artesanías/Textil', quantity: 15, unit: 'unidad', frequency: 'MENSUAL' },
    { authorSlug: 'vecino15', title: 'Dulce de batata para el almacén', category: 'Dulces/Mermeladas', quantity: 15, unit: 'frasco', frequency: 'QUINCENAL' },
    { authorSlug: 'vecino17', title: 'Huevos de campo para casa', category: 'Carnes/Huevos', quantity: 3, unit: 'docena', frequency: 'SEMANAL' },
    { authorSlug: 'vecino19', title: 'Leña para el invierno', category: 'Otros', quantity: 10, unit: 'unidad', frequency: 'MENSUAL' },
    // Sin match a propósito: rubros/localidades donde no hay oferta cerca (mapa de vacíos, HU-08)
    { authorSlug: 'vecino21', title: 'Carbón para parrilla', category: 'Otros', quantity: 20, unit: 'unidad', frequency: 'MENSUAL' },
    { authorSlug: 'vecino23', title: 'Plantines para huerta propia', category: 'Otros', quantity: 30, unit: 'unidad', frequency: 'UNICA' },
    // Productores pidiendo insumos de otro rubro (patrón B2B, HU-05)
    { authorSlug: 'labananita', isProducer: true, title: 'Banana para elaborar chips', category: 'Frutas Frescas', quantity: 200, unit: 'kg', frequency: 'SEMANAL', radiusKm: 60 },
    { authorSlug: 'dulcesbanado', isProducer: true, title: 'Frascos de vidrio para dulces', category: 'Envases/Frascos', quantity: 300, unit: 'unidad', frequency: 'MENSUAL', radiusKm: 150 },
    { authorSlug: 'espiga', isProducer: true, title: 'Queso para relleno de empanadas', category: 'Lácteos/Quesos', quantity: 30, unit: 'kg', frequency: 'QUINCENAL', radiusKm: 60 },
    { authorSlug: 'treshermanos', isProducer: true, title: 'Miel para promoción de huevos + miel', category: 'Apicultura', quantity: 20, unit: 'frasco', frequency: 'MENSUAL', radiusKm: 60 }
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

  // --- Telemetría: simular meses de uso real de la plataforma (SEARCH_HIT/FAIL, PRODUCT_VIEW, WHATSAPP_CLICK) ---

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
    { term: 'chips de banana', category: 'Snacks/Frituras' },
    { term: 'leña', category: 'Otros' }
  ];

  // Búsquedas exitosas: distribuidas en las 8 localidades y los últimos 90 días.
  let searchHits = 0;
  for (const locality of LOCALITY_NAMES) {
    const count = randomInt(8, 16);
    for (let i = 0; i < count; i++) {
      const hit = pick(SEARCH_TERMS);
      await createEvent({
        eventType: 'SEARCH_HIT',
        queryTerm: hit.term,
        category: hit.category,
        locality,
        userId: Math.random() < 0.3 ? pick([...consumers.values()]).id : null,
        daysAgo: randomDaysAgo(90)
      });
      searchHits += 1;
    }
  }

  // Búsquedas fallidas: concentradas en combinaciones locality/categoría sin oferta real,
  // para alimentar el mapa de vacíos y las oportunidades de HU-08.
  const FAILED_COMBOS: Array<{ term: string; category: Category; locality: string; count: number }> = [
    { term: 'queso de cabra', category: 'Lácteos/Quesos', locality: 'Las Lomitas', count: 8 },
    { term: 'pan casero', category: 'Panificados', locality: 'Las Lomitas', count: 6 },
    { term: 'aceite de girasol', category: 'Aceites', locality: 'Clorinda', count: 6 },
    { term: 'aceite de girasol', category: 'Aceites', locality: 'Las Lomitas', count: 5 },
    { term: 'hamaca paraguaya', category: 'Artesanías/Textil', locality: 'El Colorado', count: 5 },
    { term: 'cerámica artesanal', category: 'Artesanías/Textil', locality: 'Formosa', count: 6 },
    { term: 'banana', category: 'Frutas Frescas', locality: 'Ingeniero Juárez', count: 7 },
    { term: 'miel', category: 'Apicultura', locality: 'Pirané', count: 5 },
    { term: 'leña', category: 'Otros', locality: 'Formosa', count: 4 },
    { term: 'carbón', category: 'Otros', locality: 'Formosa', count: 3 }
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

  // Visitas y clics de WhatsApp por producto: más peso a los que están en oferta, con
  // conversión realista visita→contacto (~15-35%) para que el dashboard del productor
  // (HU-07) tenga series y rankings con los que mostrar algo.
  let whatsappClicks = 0;
  let productViews = 0;
  for (const [slug, producer] of producers) {
    const products = productsByProducer.get(slug) ?? [];
    const spec = PRODUCERS.find((p) => p.slug === slug)!;
    for (const product of products) {
      const baseClicks = randomInt(0, 8);
      const bonus = product.isOffer ? randomInt(2, 6) : 0;
      const clicks = baseClicks + bonus;
      for (let i = 0; i < clicks; i++) {
        await createEvent({
          eventType: 'WHATSAPP_CLICK',
          category: spec.category,
          locality: spec.locality,
          productId: product.id,
          producerId: producer.id,
          userId: Math.random() < 0.4 ? pick([...consumers.values()]).id : null,
          daysAgo: randomDaysAgo(90)
        });
        whatsappClicks += 1;
      }

      const views = clicks * randomInt(3, 6) + randomInt(2, 10);
      for (let i = 0; i < views; i++) {
        await createEvent({
          eventType: 'PRODUCT_VIEW',
          category: spec.category,
          locality: Math.random() < 0.7 ? spec.locality : pick(LOCALITY_NAMES),
          productId: product.id,
          producerId: producer.id,
          userId: Math.random() < 0.3 ? pick([...consumers.values()]).id : null,
          daysAgo: randomDaysAgo(90)
        });
        productViews += 1;
      }
    }
  }

  console.log(
    `Telemetría: ${searchHits} SEARCH_HIT, ${searchFails} SEARCH_FAIL, ${productViews} PRODUCT_VIEW, ${whatsappClicks} WHATSAPP_CLICK`
  );

  // --- Historial dedicado de 2 vecinos para el motivo NOW_AVAILABLE (HU-10) ---
  const marisa = persons.get('vecino1')!;
  const griselda = institutions.get('comedorvirgen')!;

  await createEvent({ eventType: 'SEARCH_FAIL', queryTerm: 'queso de cabra', category: 'Lácteos/Quesos', locality: 'Formosa', userId: marisa.id, daysAgo: 25 });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Lácteos/Quesos',
    locality: 'Formosa',
    productId: productsByProducer.get('banado')![0].id,
    producerId: producers.get('banado')!.id,
    userId: marisa.id,
    daysAgo: 15
  });
  await createEvent({ eventType: 'SEARCH_FAIL', queryTerm: 'chips de banana', category: 'Snacks/Frituras', locality: 'Laguna Blanca', userId: griselda.id, daysAgo: 20 });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Frutas Frescas',
    locality: 'Laguna Blanca',
    productId: productsByProducer.get('sanroque')![0].id,
    producerId: producers.get('sanroque')!.id,
    userId: griselda.id,
    daysAgo: 12
  });

  await createProduct(producers.get('banado')!.id, { title: 'Queso de Cabra Artesanal x 500g', price: 4700, stockUnit: 'unidad' }, 'Lácteos/Quesos');
  console.log('Producto "Queso de Cabra Artesanal x 500g" creado después del historial (motivo NOW_AVAILABLE)');

  console.log('\nSeed de 100 cuentas completado.');
  console.log('Admin: admin@gmail.com / admin1234');
  console.log(`Resto de las cuentas (35 productores, 15 instituciones, 49 vecinos): password ${DEMO_PASSWORD}`);
  console.log('Productor de la demo: Diego Britos · britos@demo.local · tel. 54 9 3704 60-5163');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  });
