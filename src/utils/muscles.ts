export interface MuscleGroup {
  label: string;
  color: string;
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: { label: 'грудные', color: '#C6F542' },
  back: { label: 'спина', color: '#72B7FF' },
  shoulders: { label: 'плечи', color: '#F0B849' },
  biceps: { label: 'бицепс', color: '#D18CFF' },
  triceps: { label: 'трицепс', color: '#7FE0C0' },
  core: { label: 'пресс', color: '#FF8A6B' },
  legs: { label: 'ноги', color: '#7CA7FF' },
  calves: { label: 'икры', color: '#65D6D6' },
  traps: { label: 'трапеции', color: '#B0BCC7' },
  full: { label: 'всё тело', color: '#B6C0C9' },
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
