export interface MuscleGroup {
  label: string;
  color: string;
  asset: string;
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: { label: 'грудные', color: '#C6F542', asset: '/icons/muscles/chest.svg' },
  back: { label: 'спина', color: '#72B7FF', asset: '/icons/muscles/body.svg' },
  shoulders: { label: 'плечи', color: '#F0B849', asset: '/icons/muscles/shoulder.svg' },
  biceps: { label: 'бицепс', color: '#D18CFF', asset: '/icons/muscles/arm.svg' },
  triceps: { label: 'трицепс', color: '#7FE0C0', asset: '/icons/muscles/arm.svg' },
  core: { label: 'пресс', color: '#FF8A6B', asset: '/icons/muscles/abs.svg' },
  legs: { label: 'ноги', color: '#7CA7FF', asset: '/icons/muscles/legs.svg' },
  calves: { label: 'икры', color: '#65D6D6', asset: '/icons/muscles/legs.svg' },
  traps: { label: 'трапеции', color: '#B0BCC7', asset: '/icons/muscles/body.svg' },
  full: { label: 'всё тело', color: '#B6C0C9', asset: '/icons/muscles/body.svg' },
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
