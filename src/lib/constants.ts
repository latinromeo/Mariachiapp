// src/lib/constants.ts

export const EVENT_TYPES = [
  { value: "boda", label: "Boda" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "serenata", label: "Serenata" },
  { value: "corporativo", label: "Corporativo" },
  { value: "otro", label: "Otro" },
];

export const EVENT_PLANS = [
    { value: "serenata_basica", label: "Serenata Básica (5 canciones)" },
    { value: "hora_completa", label: "Hora Completa" },
    { value: "evento_premium", label: "Evento Premium (2 horas + equipo)" },
    { value: "personalizado", label: "Personalizado" },
];

export const EVENT_DURATIONS = [
  { value: "30_min", label: "30 Minutos" },
  { value: "1_hora", label: "1 Hora" },
  { value: "2_horas", label: "2 Horas" },
  { value: "3_horas", label: "3 Horas" },
  { value: "otro", label: "Personalizada" },
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

export const FINANCE_CATEGORIES = [
  { value: "instrumentos", label: "Instrumentos" },
  { value: "transporte", label: "Transporte" },
  { value: "uniformes", label: "Uniformes" },
  { value: "servicios", label: "Servicios" },
  { value: "propinas", label: "Propinas" },
  { value: "otro", label: "Otro" },
];
