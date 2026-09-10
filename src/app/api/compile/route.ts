import { NextResponse } from 'next/server';
import { executeCCode } from '@/lib/compiler';

export async function POST(req: Request) {
  try {
    const { code, stdin } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        compilationError: 'No C code provided for compilation.'
      }, { status: 400 });
    }

    const result = await executeCCode(code, stdin || '');
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Execution error';
    return NextResponse.json({
      success: false,
      compilationError: `Compilation engine exception: ${message}`
    }, { status: 500 });
  }
}
