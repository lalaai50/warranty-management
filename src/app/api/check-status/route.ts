import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 检查所有不同的保修状态值
    const { data: statusValues } = await client
      .from('warranty_records')
      .select('warranty_status, after_sales_code');
    
    const statusCounts: Record<string, number> = {};
    statusValues?.forEach(r => {
      const status = r.warranty_status || '(空)';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // 找出保修状态为空或异常的记录
    const noStatusRecords = statusValues?.filter(r => 
      !r.warranty_status || 
      (r.warranty_status !== '保内' && 
       r.warranty_status !== '保外' && 
       r.warranty_status !== '在保' && 
       r.warranty_status !== '过保')
    ).slice(0, 10);
    
    return NextResponse.json({
      statusCounts,
      noStatusRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
