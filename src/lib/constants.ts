// src/lib/constants.ts

export const EVENT_TYPES = [
  { value: "boda", label: "Boda" },
  { value: "cumpleaños", label: "Cumpleaños" },
  { value: "serenata", label: "Serenata" },
  { value: "corporativo", label: "Corporativo" },
  { value: "otro", label: "Otro" },
];

export const EVENT_PLANS = [
    { value: "personalizado", label: "Personalizado / Otro", price: 0 },
    { value: "express", label: "Servicio Express (1-5 canciones)", price: 2500 },
    { value: "30_min", label: "Servicio 30 Minutos", price: 3500 },
    { value: "1_hora", label: "Servicio 1 Hora", price: 6000 },
    { value: "1_5_horas", label: "Servicio 1.5 Horas", price: 8500 },
    { value: "2_horas", label: "Servicio 2 Horas", price: 10000 },
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
