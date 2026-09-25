import 'dotenv/config';
import '../models/index.js'; // Registra las asociaciones antes de sincronizar la base
import sequelize from '../config/database.js';
import { DemandMetric } from '../models/index.js';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.js';
import { userRepository, productRepository, needRepository } from '../config/container.js';
import { UserMapper } from '../mappers/user.mapper.js';
import { ProductMapper } from '../mappers/product.mapper.js';
import { NeedMapper } from '../mappers/need.mapper.js';
import { WGS84_SRID, Category, StockUnit } from '../constants/catalog.constants.js';
import { localityCentroid } from '../utils/geo.js';
import { RegisterInput } from '../interfaces/user.types.js';
import { CreateProductInput } from '../interfaces/product.types.js';
import { CreateNeedInput } from '../interfaces/need.types.js';
import { EventType } from '../constants/telemetry.constants.js';
import { UserRecord } from '../interfaces/user.types.js';

// Datos de demostración para HU-01 a HU-11: una única contraseña para todas las cuentas,
// documentada al final del script (y en la respuesta del comando `npm run seed`).
const DEMO_PASSWORD = 'Demo1234';
const passwordHasher = new BcryptPasswordHasher();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): Date => new Date(Date.now() - days * MS_PER_DAY);
const randomDaysAgo = (maxDays: number): number => Math.random() * maxDays;

// Centroide de la localidad + ruido de ±0.02° (plan HU-09), para que los eventos de
// telemetría no queden todos apilados en el mismo punto exacto.
const jitteredPoint = (locality: string): [number, number] => {
  const centroid = localityCentroid(locality);
  if (!centroid) {
    throw new Error(`Localidad desconocida en el seed: ${locality}`);
  }
  const jitter = () => (Math.random() * 0.04 - 0.02);
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

async function createProduct(producerId: number, input: CreateProductInput, category: Category) {
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
    coordinates: toGeoJSON(jitteredPoint(params.locality)),
    productId: params.productId ?? null,
    producerId: params.producerId ?? null,
    userId: params.userId ?? null,
    timestamp: daysAgo(params.daysAgo)
  } as any);
}

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

  // --- Admin ---
  await createUser({
    role: 'ADMIN',
    name: 'Admin Demo',
    email: 'admin@demo.local',
    password: DEMO_PASSWORD
  });
  console.log('Admin creado');

  // --- Productores (10, repartidos entre localidades y rubros) ---
  const elCrocante = await createUser({
    role: 'PRODUCER',
    name: 'Marcos Ibarra',
    email: 'crocante@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400001',
    locality: 'Formosa',
    businessName: 'El Crocante',
    category: 'Snacks/Frituras',
    deliveryOptions: ['Retiro en fábrica', 'Envío a domicilio']
  });

  const chacraLosAlamos = await createUser({
    role: 'PRODUCER',
    name: 'Juan Gómez',
    email: 'chacraalamos@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400002',
    locality: 'Formosa',
    businessName: 'Chacra Los Álamos',
    category: 'Tubérculos/Raíces',
    deliveryOptions: ['Retiro en chacra']
  });

  const huertaDonaRosa = await createUser({
    role: 'PRODUCER',
    name: 'Rosa Benítez',
    email: 'donarosa@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400003',
    locality: 'Pirané',
    businessName: 'Huerta Doña Rosa',
    category: 'Tubérculos/Raíces',
    paymentMethods: ['Efectivo', 'Transferencia'],
    deliveryOptions: ['Retiro en chacra', 'Envío a domicilio']
  });

  const fincaElQuebracho = await createUser({
    role: 'PRODUCER',
    name: 'Delia Ramírez',
    email: 'quebracho@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400004',
    locality: 'Ingeniero Juárez', // Deliberadamente lejos: queda fuera del radio por defecto (30 km)
    businessName: 'Finca El Quebracho',
    category: 'Tubérculos/Raíces'
  });

  const aceitesDelMonte = await createUser({
    role: 'PRODUCER',
    name: 'Hugo Sosa',
    email: 'aceitesdelmonte@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400005',
    locality: 'Clorinda',
    businessName: 'Aceites del Monte',
    category: 'Aceites'
  });

  const apiarioLaColmena = await createUser({
    role: 'PRODUCER',
    name: 'Norma Duarte',
    email: 'lacolmena@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400006',
    locality: 'El Colorado',
    businessName: 'Apiario La Colmena Formoseña',
    category: 'Apicultura'
  });

  const dulcesDeLaAbuela = await createUser({
    role: 'PRODUCER',
    name: 'Elsa Franco',
    email: 'dulcesabuela@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400007',
    locality: 'Ibarreta',
    businessName: 'Dulces de la Abuela',
    category: 'Dulces/Mermeladas'
  });

  const envasesDelNorte = await createUser({
    role: 'PRODUCER',
    name: 'Raúl Medina',
    email: 'envasesnorte@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400008',
    locality: 'Laguna Blanca',
    businessName: 'Envases del Norte',
    category: 'Envases/Frascos'
  });

  const tamboLaEsperanza = await createUser({
    role: 'PRODUCER',
    name: 'Marta Villalba',
    email: 'laesperanza@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400009',
    locality: 'Formosa',
    businessName: 'Tambo La Esperanza',
    category: 'Lácteos/Quesos'
  });

  const granjaElNido = await createUser({
    role: 'PRODUCER',
    name: 'Ceferino Acosta',
    email: 'elnido@demo.local',
    password: DEMO_PASSWORD,
    phone: '5493704400010',
    locality: 'Las Lomitas',
    businessName: 'Granja El Nido',
    category: 'Carnes/Huevos'
  });
  console.log('10 productores creados');

  // --- Productos (20 + 1 agregado luego para el escenario NOW_AVAILABLE de HU-10) ---
  const papasFritas = await createProduct(
    elCrocante.id,
    { title: 'Papas Fritas Artesanales 200g', price: 1200, stockUnit: 'unidad' },
    'Snacks/Frituras'
  );
  await createProduct(
    elCrocante.id,
    { title: 'Papas Fritas Pack x3 - Oferta', price: 3200, offerPrice: 2700, isOffer: true, stockUnit: 'unidad' },
    'Snacks/Frituras'
  );

  const papaAlamos = await createProduct(
    chacraLosAlamos.id,
    { title: 'Papa x kg', price: 650, offerPrice: 550, isOffer: true, stockUnit: 'kg' },
    'Tubérculos/Raíces'
  );
  const mandiocaAlamos = await createProduct(
    chacraLosAlamos.id,
    { title: 'Mandioca x kg', price: 700, stockUnit: 'kg' },
    'Tubérculos/Raíces'
  );

  const mandiocaDonaRosa = await createProduct(
    huertaDonaRosa.id,
    { title: 'Mandioca x kg', price: 680, stockUnit: 'kg' },
    'Tubérculos/Raíces'
  );
  await createProduct(
    huertaDonaRosa.id,
    { title: 'Batata x kg', price: 600, offerPrice: 480, isOffer: true, stockUnit: 'kg' },
    'Tubérculos/Raíces'
  );

  await createProduct(fincaElQuebracho.id, { title: 'Papa x kg', price: 620, stockUnit: 'kg' }, 'Tubérculos/Raíces');
  await createProduct(
    fincaElQuebracho.id,
    { title: 'Mandioca x kg', price: 650, stockUnit: 'kg' },
    'Tubérculos/Raíces'
  );

  await createProduct(
    aceitesDelMonte.id,
    { title: 'Aceite de Girasol 900ml', price: 1500, offerPrice: 1250, isOffer: true, stockUnit: 'unidad' },
    'Aceites'
  );
  await createProduct(
    aceitesDelMonte.id,
    { title: 'Aceite de Oliva 500ml', price: 3200, stockUnit: 'unidad' },
    'Aceites'
  );

  const mielPura = await createProduct(
    apiarioLaColmena.id,
    { title: 'Miel Pura x frasco', price: 1800, stockUnit: 'frasco' },
    'Apicultura'
  );
  await createProduct(apiarioLaColmena.id, { title: 'Polen x frasco', price: 2100, stockUnit: 'frasco' }, 'Apicultura');

  await createProduct(
    dulcesDeLaAbuela.id,
    { title: 'Dulce de Batata x frasco', price: 900, offerPrice: 750, isOffer: true, stockUnit: 'frasco' },
    'Dulces/Mermeladas'
  );
  await createProduct(
    dulcesDeLaAbuela.id,
    { title: 'Mermelada de Naranja x frasco', price: 950, stockUnit: 'frasco' },
    'Dulces/Mermeladas'
  );

  await createProduct(
    envasesDelNorte.id,
    { title: 'Frascos de Vidrio x12', price: 2400, stockUnit: 'caja' },
    'Envases/Frascos'
  );
  await createProduct(
    envasesDelNorte.id,
    { title: 'Tapas Metálicas x24', price: 1100, stockUnit: 'caja' },
    'Envases/Frascos'
  );

  await createProduct(
    tamboLaEsperanza.id,
    { title: 'Queso Cremoso x kg', price: 4200, stockUnit: 'kg' },
    'Lácteos/Quesos'
  );
  await createProduct(
    tamboLaEsperanza.id,
    { title: 'Leche Entera x litro', price: 900, offerPrice: 780, isOffer: true, stockUnit: 'litro' },
    'Lácteos/Quesos'
  );

  await createProduct(
    granjaElNido.id,
    { title: 'Huevos de Campo x docena', price: 2800, offerPrice: 2400, isOffer: true, stockUnit: 'docena' },
    'Carnes/Huevos'
  );
  await createProduct(granjaElNido.id, { title: 'Pollo Casero x kg', price: 3600, stockUnit: 'kg' }, 'Carnes/Huevos');

  console.log('20 productos creados (7 en oferta)');

  // --- Consumidores (HU-10) ---
  const consumidorDemo = await createUser({
    role: 'CONSUMER',
    name: 'Lucía Fernández',
    email: 'consumidor@demo.local',
    password: DEMO_PASSWORD,
    accountType: 'PERSONA',
    locality: 'Formosa'
  });

  const comedorSanJose = await createUser({
    role: 'CONSUMER',
    name: 'Comedor San José',
    email: 'comedor@demo.local',
    password: DEMO_PASSWORD,
    accountType: 'INSTITUCION',
    organizationName: 'Comedor San José',
    institutionType: 'Comedor',
    phone: '5493704500001',
    locality: 'Formosa'
  });

  const escuelaLasLomitas = await createUser({
    role: 'CONSUMER',
    name: 'Escuela N.° 12',
    email: 'escuela.lomitas@demo.local',
    password: DEMO_PASSWORD,
    accountType: 'INSTITUCION',
    organizationName: 'Escuela N.° 12 Las Lomitas',
    institutionType: 'Escuela',
    phone: '5493704500002',
    locality: 'Las Lomitas'
  });

  await createUser({
    role: 'CONSUMER',
    name: 'Familia Pérez',
    email: 'familia.perez@demo.local',
    password: DEMO_PASSWORD,
    accountType: 'PERSONA',
    locality: 'Clorinda'
  });

  const vecinoPirane = await createUser({
    role: 'CONSUMER',
    name: 'Ariel Torres',
    email: 'vecino.pirane@demo.local',
    password: DEMO_PASSWORD,
    accountType: 'PERSONA',
    phone: '5493704500004',
    locality: 'Pirané'
  });
  console.log('5 consumidores creados (comedor y escuela con teléfono para publicar necesidades)');

  // --- Necesidades (HU-11) ---
  // Caso central: el comedor pide mandioca; matchea con Chacra Los Álamos (Formosa) y
  // Huerta Doña Rosa (Pirané). radiusKm se amplía a 120 para cubrir esa distancia real
  // entre localidades; Finca El Quebracho (mucho más lejos) queda igual fuera de rango.
  await createNeed(comedorSanJose, {
    title: 'Mandioca para el comedor',
    description: 'Necesitamos mandioca para la merienda escolar de los chicos del barrio',
    category: 'Tubérculos/Raíces',
    quantity: 100,
    unit: 'kg',
    frequency: 'SEMANAL',
    radiusKm: 120
  });

  // Sin matches a propósito: no hay productor de lácteos cerca de Las Lomitas.
  // Aparece en el mapa de vacíos de HU-08.
  await createNeed(escuelaLasLomitas, {
    title: 'Leche para merienda escolar',
    description: 'Leche entera para la merienda de 40 alumnos',
    category: 'Lácteos/Quesos',
    quantity: 40,
    unit: 'litro',
    frequency: 'SEMANAL'
  });

  // Necesidad publicada por un productor (El Crocante necesita aceite para freír)
  await createNeed(elCrocante, {
    title: 'Aceite para freír',
    description: 'Aceite de girasol para la producción de papas fritas',
    category: 'Aceites',
    quantity: 50,
    unit: 'litro',
    frequency: 'MENSUAL',
    radiusKm: 150
  });

  await createNeed(consumidorDemo, {
    title: 'Miel para regalos de fin de año',
    category: 'Apicultura',
    quantity: 2,
    unit: 'kg',
    frequency: 'UNICA',
    radiusKm: 150
  });

  await createNeed(vecinoPirane, {
    title: 'Dulce de batata para el kiosco',
    category: 'Dulces/Mermeladas',
    quantity: 20,
    unit: 'unidad',
    frequency: 'MENSUAL',
    radiusKm: 150
  });
  console.log('5 necesidades creadas (1 sin matches, a propósito)');

  // --- Telemetría (60+ eventos en los últimos 30 días) ---

  // Búsquedas fallidas concentradas en localidades con poca/nula oferta del rubro buscado
  for (let i = 0; i < 5; i++) {
    await createEvent({
      eventType: 'SEARCH_FAIL',
      queryTerm: 'queso de cabra',
      category: 'Lácteos/Quesos',
      locality: 'Las Lomitas',
      daysAgo: randomDaysAgo(30)
    });
  }
  for (let i = 0; i < 5; i++) {
    await createEvent({
      eventType: 'SEARCH_FAIL',
      queryTerm: 'huevos de campo',
      category: 'Carnes/Huevos',
      locality: 'Clorinda',
      daysAgo: randomDaysAgo(30)
    });
  }

  // Historial propio de consumidor@demo.local: búsquedas fallidas hace 20-25 días, antes
  // de que existiera el producto "Queso de Cabra" (se crea después, más abajo) — motivo
  // NOW_AVAILABLE en HU-10. También clics en Apicultura para la afinidad por categoría.
  await createEvent({
    eventType: 'SEARCH_FAIL',
    queryTerm: 'miel',
    category: 'Apicultura',
    locality: 'Formosa',
    userId: consumidorDemo.id,
    daysAgo: 22
  });
  await createEvent({
    eventType: 'SEARCH_FAIL',
    queryTerm: 'queso de cabra',
    category: 'Lácteos/Quesos',
    locality: 'Formosa',
    userId: consumidorDemo.id,
    daysAgo: 20
  });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Apicultura',
    locality: 'Formosa',
    productId: mielPura.id,
    producerId: apiarioLaColmena.id,
    userId: consumidorDemo.id,
    daysAgo: 18
  });
  await createEvent({
    eventType: 'WHATSAPP_CLICK',
    category: 'Apicultura',
    locality: 'Formosa',
    productId: mielPura.id,
    producerId: apiarioLaColmena.id,
    userId: consumidorDemo.id,
    daysAgo: 10
  });

  // WHATSAPP_CLICK sobre el elaborador de papas fritas y los dos paperos cercanos
  const clickTargets: Array<{ productId: number; producerId: number; locality: string; count: number }> = [
    { productId: papasFritas.id, producerId: elCrocante.id, locality: 'Formosa', count: 8 },
    { productId: papaAlamos.id, producerId: chacraLosAlamos.id, locality: 'Formosa', count: 5 },
    { productId: mandiocaAlamos.id, producerId: chacraLosAlamos.id, locality: 'Formosa', count: 3 },
    { productId: mandiocaDonaRosa.id, producerId: huertaDonaRosa.id, locality: 'Pirané', count: 5 }
  ];
  for (const target of clickTargets) {
    for (let i = 0; i < target.count; i++) {
      await createEvent({
        eventType: 'WHATSAPP_CLICK',
        category: 'Tubérculos/Raíces',
        locality: target.locality,
        productId: target.productId,
        producerId: target.producerId,
        daysAgo: randomDaysAgo(30)
      });
    }
  }

  // Búsquedas exitosas distribuidas (dan volumen a topTerms/topCategories)
  const searchHits: Array<{ term: string; category: Category; locality: string }> = [
    { term: 'papa', category: 'Tubérculos/Raíces', locality: 'Formosa' },
    { term: 'papa', category: 'Tubérculos/Raíces', locality: 'Pirané' },
    { term: 'mandioca', category: 'Tubérculos/Raíces', locality: 'Formosa' },
    { term: 'mandioca', category: 'Tubérculos/Raíces', locality: 'Pirané' },
    { term: 'aceite', category: 'Aceites', locality: 'Clorinda' },
    { term: 'miel', category: 'Apicultura', locality: 'El Colorado' },
    { term: 'dulce de batata', category: 'Dulces/Mermeladas', locality: 'Ibarreta' },
    { term: 'queso cremoso', category: 'Lácteos/Quesos', locality: 'Formosa' },
    { term: 'pollo casero', category: 'Carnes/Huevos', locality: 'Las Lomitas' },
    { term: 'papas fritas', category: 'Snacks/Frituras', locality: 'Formosa' },
    { term: 'papas fritas', category: 'Snacks/Frituras', locality: 'Clorinda' },
    { term: 'frascos', category: 'Envases/Frascos', locality: 'Laguna Blanca' },
    { term: 'batata', category: 'Tubérculos/Raíces', locality: 'Formosa' },
    { term: 'huevos', category: 'Carnes/Huevos', locality: 'Las Lomitas' },
    { term: 'leche', category: 'Lácteos/Quesos', locality: 'Formosa' }
  ];
  for (const hit of searchHits) {
    await createEvent({
      eventType: 'SEARCH_HIT',
      queryTerm: hit.term,
      category: hit.category,
      locality: hit.locality,
      userId: Math.random() < 0.3 ? consumidorDemo.id : null,
      daysAgo: randomDaysAgo(30)
    });
  }

  console.log('60 eventos de telemetría creados');

  // --- Producto agregado después de la telemetría: motivo NOW_AVAILABLE en HU-10 ---
  await createProduct(
    tamboLaEsperanza.id,
    { title: 'Queso de Cabra x 500g', price: 4500, stockUnit: 'unidad' },
    'Lácteos/Quesos'
  );
  console.log('Producto "Queso de Cabra x 500g" creado (después del historial de búsquedas fallidas)');

  console.log('\nSeed completado.');
  console.log(`Contraseña para todas las cuentas de demo: ${DEMO_PASSWORD}`);
  console.log('Cuentas: admin@demo.local, crocante@demo.local, chacraalamos@demo.local, donarosa@demo.local,');
  console.log('         quebracho@demo.local, aceitesdelmonte@demo.local, lacolmena@demo.local, dulcesabuela@demo.local,');
  console.log('         envasesnorte@demo.local, laesperanza@demo.local, elnido@demo.local,');
  console.log('         consumidor@demo.local, comedor@demo.local, escuela.lomitas@demo.local,');
  console.log('         familia.perez@demo.local, vecino.pirane@demo.local');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  });
