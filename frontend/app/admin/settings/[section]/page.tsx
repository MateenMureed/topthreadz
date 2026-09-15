import SettingsPage from '../page';
import type { SettingsSection } from '../../components/types';

const VALID_SECTIONS: SettingsSection[] = [
  'store',
  'shipping',
  'appearance',
  'banner',
  'branding',
  'categories',
  'accounts',
  'policies',
];

/**
 * /admin/settings/[section] — deep-linkable settings sections.
 * Renders the same SettingsPage implementation and scrolls to the
 * requested section (store, shipping, appearance, banner, branding,
 * categories, accounts, policies).
 */
export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const initialSection = VALID_SECTIONS.includes(section as SettingsSection)
    ? (section as SettingsSection)
    : null;

  return <SettingsPage initialSection={initialSection} />;
}
