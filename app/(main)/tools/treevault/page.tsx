import type { Metadata } from 'next';
import { TreeVault } from '@/components/tools/treevault/TreeVault';
export const metadata: Metadata = { title: 'TreeVault | A living outline', description: 'A nested Markdown workspace with Git revisions, faithful history and structural comparisons.', robots: { index: false, follow: false } };
export default function TreeVaultPage() { return <TreeVault />; }
