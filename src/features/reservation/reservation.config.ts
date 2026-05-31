export type ReservationModeKey = 'tenis' | 'gym';

type ReservationModeConfig = {
  court: string;
  courtShort: string;
  unit: string;
  priceFor: (date: Date, h: number) => number;
  capacity: number | null;
};

export const MODES: Record<ReservationModeKey, ReservationModeConfig> = {
  tenis: {
    court: 'Kurt 1 · antuka',
    courtShort: 'Kurt 1',
    unit: 'kurtu',
    priceFor: () => 100,
    capacity: null,
  },
  gym: {
    court: 'Posilovna · vstup',
    courtShort: 'Posilovna',
    unit: 'vstupu',
    priceFor: () => 100,
    capacity: 15,
  },
};
