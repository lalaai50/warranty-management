import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 用不同方式统计
    const { count: exactCount } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    const { data: allData, error } = await client
      .from('warranty_records')
      .select('after_sales_code');
    
    return NextResponse.json({
      exactCount,
      actualDataLength: allData?.length,
      error,
      sample: allData?.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
