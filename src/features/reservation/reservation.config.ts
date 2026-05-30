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
    priceFor: (date: Date, h: number) => {
      const wd = date.getDay();
      const weekend = wd === 0 || wd === 6;
      if (weekend) return 220;
      return h >= 16 ? 220 : 160;
    },
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
