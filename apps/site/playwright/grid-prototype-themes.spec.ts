/**
 * Wave 7 prep — minimal smoke test for the throwaway grid-prototype
 * route. Just verifies the 3 theme variants mount without errors. Will
 * be deleted in a follow-up wave-7 PR when the prototype is absorbed
 * into the production editor.
 */
import { expect, test } from '@playwright/test';

const VARIANTS = ['A', 'B', 'C'] as const;

for (const variant of VARIANTS) {
  test(`Wave 7 prep — /grid-prototype?variant=${variant} mounts the React island without errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(`pageerror: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto(`/grid-prototype?variant=${variant}`);
    // The React island hydrates client:only; wait for the floating
    // switcher chip (rendered by every variant) to confirm hydration.
    await expect(
      page
        .getByRole('button', { name: 'Previous variant' })
        .or(page.getByRole('button', { name: 'Next variant' }))
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // No JS errors during hydration.
    expect(errors, `JS errors on variant=${variant}: ${errors.join('; ')}`).toHaveLength(0);
  });
}
