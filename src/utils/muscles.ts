export interface MuscleGroup {
  label: string;
  color: string;
  paths: string[];
}

const torso = [
  'M12 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  'M8 6c-2 1-3 3-3 6v4h3v8h8v-8h3v-4c0-3-1-5-3-6-1.5 1-5.5 1-8 0Z',
];
const arm = [
  'M7 4v6.5a6 6 0 0 0 8 5.5l2-1V4h-2v6.5a4 4 0 0 1-4 0V4Z',
  'M7 4c0 1.5 1.5 2.5 3 2.5S13 5.5 13 4M9 16l-2 5M15 16l2 5',
];
const legs = [
  'M7 3h10M9 3v6l-2 12M15 3v6l2 12M7 21h4M13 21h4',
];

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: {
    label: 'грудные',
    color: '#C6F542',
    paths: [...torso, 'M7 11c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5'],
  },
  back: {
    label: 'спина',
    color: '#72B7FF',
    paths: [...torso, 'M12 7v12M9 10h6'],
  },
  shoulders: {
    label: 'плечи',
    color: '#F0B849',
    paths: [...torso, 'M6 10c1.5 1 3 1.5 6 1.5S16.5 11 18 10'],
  },
  biceps: {
    label: 'бицепс',
    color: '#D18CFF',
    paths: arm,
  },
  triceps: {
    label: 'трицепс',
    color: '#7FE0C0',
    paths: arm,
  },
  core: {
    label: 'пресс',
    color: '#FF8A6B',
    paths: [...torso, 'M8 11h8M12 11v10M9 15h6'],
  },
  legs: {
    label: 'ноги',
    color: '#7CA7FF',
    paths: legs,
  },
  calves: {
    label: 'икры',
    color: '#65D6D6',
    paths: [...legs, 'M8 11c1 2 2 2 3 0M14 11c-1 2-2 2-3 0'],
  },
  traps: {
    label: 'трапеции',
    color: '#B0BCC7',
    paths: [...torso, 'M8 6l4 3 4-3M9 10h6'],
  },
  full: {
    label: 'всё тело',
    color: '#B6C0C9',
    paths: [
      'M12 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
      'M8 6v5l-3 5M16 6v5l3 5M12 11v10M8 11h8',
    ],
  },
};

const rules: Array<[RegExp, string]> = [
  [/пресс|скруч|корпус|ab coaster/i, 'core'],
  [/трапец|шраг/i, 'traps'],
  [/трицепс|разгиб|француз|узким хватом/i, 'triceps'],
  [/плеч|дельт|махи|протяжка|из-за ног|перед собой/i, 'shoulders'],
  [/икр|носк/i, 'calves'],
  [/присед|румынск|выпад|ног|бедр|платформ/i, 'legs'],
  [/бицепс|сгибан\w* рук|сгибан\w* на блоке|молотков|супинац/i, 'biceps'],
  [/спин|тяга|подтяг|хаммер|блок|гиперэкстенз/i, 'back'],
  [/груд|жим|развод|сведен|отжим|pect/i, 'chest'],
];

export function inferMuscle(name: string): MuscleGroup {
  const key = rules.find(([pattern]) => pattern.test(name))?.[1] ?? 'full';
  return MUSCLE_GROUPS[key];
}
