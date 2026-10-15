import { handleTreeVault } from '@/lib/treevault/api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
type Context = { params: { action?: string[] } };
export function GET(request: Request, { params }: Context) { return handleTreeVault(request, params.action ?? []); }
export function PUT(request: Request, { params }: Context) { return handleTreeVault(request, params.action ?? []); }
