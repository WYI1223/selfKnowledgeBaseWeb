/**
 * THROWAWAY — root component for the grid UI prototype.
 *
 * Renders one of 3 variants based on ?variant= URL param + the floating
 * switcher bar.
 *
 * Plan: "3 radically different visual mental models for the 12-col grid
 * baseplate, switchable via ?variant= on /grid-prototype, sharing the
 * same engine.ts logic and SAMPLE_BLOCKS data."
 */
import { useEffect, useState } from 'react';
import { getCurrentVariant, PrototypeSwitcher, type VariantKey } from './PrototypeSwitcher';
import { VariantA } from './variants/VariantA';
import { VariantB } from './variants/VariantB';
import { VariantC } from './variants/VariantC';

export function GridPrototype(): React.JSX.Element {
  const [variant, setVariantState] = useState<VariantKey>('A');
  useEffect(() => {
    setVariantState(getCurrentVariant());
  }, []);
  return (
    <>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher current={variant} />
    </>
  );
}
