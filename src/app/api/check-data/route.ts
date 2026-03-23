import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 获取总记录数
    const { count } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    // 获取按file_url分组的记录数
    const { data: files } = await client
      .from('warranty_records')
      .select('file_url, file_name, created_at');
    
    const fileGroups: Record<string, { count: number; fileName: string; latestTime: string }> = {};
    
    files?.forEach(r => {
      if (!fileGroups[r.file_url]) {
        fileGroups[r.file_url] = { count: 0, fileName: r.file_name, latestTime: r.created_at };
      }
      fileGroups[r.file_url].count++;
      if (r.created_at > fileGroups[r.file_url].latestTime) {
        fileGroups[r.file_url].latestTime = r.created_at;
      }
    });
    
    // 获取最近5条记录的时间
    const { data: recentRecords } = await client
      .from('warranty_records')
      .select('after_sales_code, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      totalRecords: count,
      fileGroups: Object.entries(fileGroups).map(([url, info]) => ({
        fileName: info.fileName,
        count: info.count,
        latestTime: info.latestTime,
      })),
      recentRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
