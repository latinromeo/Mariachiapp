// src/lib/constants.ts

export const EVENT_TYPES = [
  { value: "boda", label: "Boda" },
  { value: "cumpleaños", label: "Cumpleaños" },
  { value: "serenata", label: "Serenata" },
  { value: "corporativo", label: "Corporativo" },
  { value: "otro", label: "Otro" },
];

export const EVENT_PLANS = [
    { value: "personalizado", label: "Personalizado / Otro", price: 0, musicianPay: 0 },
    { value: "express", label: "Servicio Express (1-5 canciones)", price: 7500, musicianPay: 4000 },
    { value: "30_min", label: "Servicio 30 Minutos", price: 8500, musicianPay: 4800 },
    { value: "1_hora", label: "Servicio 1 Hora", price: 15500, musicianPay: 8000 },
    { value: "1_5_horas", label: "Servicio 1.5 Horas", price: 8500, musicianPay: 0 },
    { value: "2_horas", label: "Servicio 2 Horas", price: 10000, musicianPay: 0 },
];

export const PAYMENT_METHODS = [
    { value: "cash", label: "Efectivo" },
    { value: "transfer", label: "Transferencia" },
    { value: "card", label: "Tarjeta" },
    { value: "pending", label: "Pendiente" },
];

export const SONG_CATEGORIES = [
  'Románticas',
  'Cumpleaños',
  'Serenatas',
  'Dolor',
  'Rancheras',
  'Corridos',
  'Cumbias',
  'Sones',
  'Pop en Mariachi',
  'Infantiles',
  'Clásicos Mexicanos',
  'Huapangos'
];

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
];


export const FINANCE_CATEGORIES = [
  { value: "instrumentos", label: "Instrumentos" },
  { value: "transporte", label: "Transporte" },
  { value: "uniformes", label: "Uniformes" },
  { value: "servicios", label: "Servicios" },
  { value: "propinas", label: "Propinas" },
  { value: "otro", label: "Otro" },
];

export const EXTERNAL_CONTACTS = [
  { value: "mariachi_sol_quisqueya", label: "Mariachi Sol de Quisqueya (Mariachi Sol) - 809-555-1212" },
  { value: "mariachi_nuevo_amanecer", label: "Mariachi Nuevo Amanecer (Amanecer) - 829-444-3322" },
  { value: "juan_valdez", label: "Juan Valdéz (Trompetista) (Solista) - 849-111-0000" },
  { value: "otro", label: "Otro (especificar abajo)" },
];
