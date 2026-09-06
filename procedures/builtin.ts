import type { Procedure } from '@/types/procedure';

const BUILTIN_UPDATED_AT = '2026-09-01T00:00:00.000Z';

export const BUILTIN_CVP_ID = 'builtin-cateterismo-venoso-periferico';
export const BUILTIN_SNG_ID = 'builtin-sondagem-nasogastrica';

export const builtinProcedures: Procedure[] = [
  {
    id: BUILTIN_CVP_ID,
    title: 'Cateterismo venoso periférico',
    source: 'builtin',
    updatedAt: BUILTIN_UPDATED_AT,
    materials: [
      'Luvas',
      'Compressas',
      'Antisséptico (protocolo local)',
      'Garrote',
      'Cateter de calibre adequado',
      'Penso',
      'Extensão/tampão',
      'Contentor de cortantes',
      'Flush segundo protocolo',
    ],
    steps: [
      'Identificar o doente',
      'Higiene das mãos',
      'Preparar o material',
      'Escolher o sítio e o calibre',
      'Aplicar o garrote',
      'Antissepsia e tempo de contacto',
      'Punção asséptica',
      'Confirmar retorno',
      'Avançar o cateter',
      'Soltar o garrote',
      'Mandril para o contentor (nunca reintroduzir)',
      'Fixar',
      'Flush segundo protocolo',
      'Documentar',
    ],
    attention: [
      'Vigiar sinais de flebite e extravasamento',
      'Respeitar o número máximo de tentativas da instituição',
      'Validar sempre com o protocolo da instituição',
    ],
  },
  {
    id: BUILTIN_SNG_ID,
    title: 'Sondagem nasogástrica',
    source: 'builtin',
    updatedAt: BUILTIN_UPDATED_AT,
    materials: [
      'Luvas',
      'Compressas',
      'Sonda nasogástrica de calibre adequado',
      'Lubrificante hidrossolúvel',
      'Seringa',
      'Copo com água (se o doente puder colaborar)',
      'Adesivo',
      'Contentor de desperdícios',
    ],
    steps: [
      'Identificar o doente',
      'Explicar o procedimento',
      'Higiene das mãos',
      'Preparar o material',
      'Posicionar o doente',
      'Medir o comprimento da sonda',
      'Lubrificar a ponta',
      'Introduzir com técnica asséptica',
      'Pedir para deglutir se o doente estiver consciente',
      'Verificar o posicionamento segundo o protocolo da instituição',
      'Fixar',
      'Documentar',
    ],
    attention: [
      'Nunca avançar contra resistência',
      'Confirmar o posicionamento com o método aceite pela instituição (pH do aspirado / RX quando indicado), nunca por auscultação',
      'Ter presente o risco de broncoaspiração',
      'Validar sempre com o protocolo da instituição',
    ],
  },
];
