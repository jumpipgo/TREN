export interface MuscleGroup {
  label: string;
  color: string;
  paths: string[];
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: {
    label: 'грудные',
    color: '#C6F542',
    paths: [
      'M6 4C4 4 3 5.5 3 8v3.5C3 14 4.5 15 7 15l1 5h8l1-5c2.5 0 4-1 4-3.5V8c0-2.5-1-4-3-4-1.8 0-3.7 1-6 3-2.3-2-4.2-3-6-3Z',
      'M7 10h10',
    ],
  },
  back: {
    label: 'спина',
    color: '#72B7FF',
    paths: [
      'M6 4c-2 0-3 1.5-3 4v3c0 2 1.5 3 3.5 3L8 20h8l1.5-6c2 0 3.5-1 3.5-3V8c0-2.5-1-4-3-4-1.8 0-3.7 1-6 3-2.3-2-4.2-3-6-3Z',
      'M12 7v12M9 10h6',
    ],
  },
  shoulders: {
    label: 'плечи',
    color: '#F0B849',
    paths: ['M5 8l4-3 3 3 3-3 4 3-2 7-4-1-1 4h-4l-1-4-4 1-2-7Z', 'M9 5l3 3 3-3'],
  },
  biceps: {
    label: 'бицепс',
    color: '#D18CFF',
    paths: ['M8 4v5a6 6 0 1 0 8 5V4', 'M8 4c0 2 2 3 4 3s4-1 4-3M8 15l-2 5M16 15l2 5'],
  },
  triceps: {
    label: 'трицепс',
    color: '#7FE0C0',
    paths: ['M8 3v8a5 5 0 0 0 5 5h3', 'M13 4l3 3 3-3M13 20l3-3 3 3', 'M8 3h4'],
  },
  core: {
    label: 'пресс',
    color: '#FF8A6B',
    paths: ['M7 4h10v5l-1 11H8L7 9V4Z', 'M8 9h8M12 9v10M9 14h6'],
  },
  legs: {
    label: 'ноги',
    color: '#7CA7FF',
    paths: ['M6 3h12M9 3v6l-2 12M15 3v6l2 12M7 21h4M13 21h4'],
  },
  calves: {
    label: 'икры',
    color: '#65D6D6',
    paths: ['M7 3h10M9 3v5l-3 13M15 3v5l3 13M7 21h4M13 21h4', 'M8 11c1 2 2 2 3 0M14 11c-1 2-2 2-3 0'],
  },
  traps: {
    label: 'трапеции',
    color: '#B0BCC7',
    paths: ['M8 3l4 4 4-4M5 8c2 0 3 1 4 3M19 8c-2 0-3 1-4 3M9 11l3 4 3-4M12 15v6'],
  },
  full: {
    label: 'всё тело',
    color: '#B6C0C9',
    paths: ['M12 5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', 'M12 8v6M8 10l4-2 4 2M9 21l3-7 3 7'],
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
