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
    { value: "bank_deposit", label: "Depósito Bancario" },
    { value: "cash", label: "Efectivo" },
    { value: "remittance", label: "Remesas" },
    { value: "other", label: "Otro" },
];

export const SONG_CATEGORIES = [
  'Cumpleaños',
  'Serenatas',
  'Corridos',
  'Sones',
  'Rancheras',
  'Para Madres y Padres'
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

export const MUSICIAN_EXPENSE_CATEGORIES = [
  { value: "casa", label: "Casa (Alquiler/Hipoteca, Mantenimiento)" },
  { value: "lavanderia", label: "Lavandería (Personal y de Trajes)" },
  { value: "telefono", label: "Teléfono / Comunicación Personal" },
  { value: "transporte_personal", label: "Transporte Personal (Fuera de eventos)" },
  { value: "alimentacion_personal", label: "Alimentación Personal (Fuera de eventos)" },
  { value: "ocio", label: "Entretenimiento y Ocio" },
  { value: "salud", label: "Salud (Seguro, Medicamentos, Consultas)" },
  { value: "educacion", label: "Educación Personal / Cursos" },
  { value: "vestuario_personal", label: "Vestuario Personal (No de mariachi)" },
  { value: "ahorros", label: "Ahorros / Inversiones Personales" },
  { value: "deudas", label: "Deudas Personales (Préstamos, Tarjetas)" },
  { value: "regalos", label: "Regalos / Donaciones Personales" },
  { value: "otro", label: "Otro Gasto Personal" },
];

export const EXTERNAL_CONTACTS = [
  { value: "mariachi_aguila_nerio", label: "Mariachi Aguila (Nerio) Tel:8293868745" },
  { value: "mariachi_monterrey_jorge_luis", label: "Mariachi Monterrey (Jorge Luis) Tel: 8098556036" },
  { value: "mariachi_arcoiris_leidy", label: "Mariachi Arcoiris (leidy) Tel: 8092122023" },
  { value: "otro", label: "Otro (especificar)" },
];
