import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 删除所有数据
    const { data, error } = await client
      .from('warranty_records')
      .delete()
      .neq('id', 0) // 删除所有记录
      .select('id');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已删除全部 ${data?.length || 0} 条记录` 
    });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    const { count, error } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ 
      success: true, 
      totalRecords: count || 0,
      message: count === 0 
        ? '数据库已清空，可以重新上传' 
        : `当前有 ${count} 条记录，点击清空按钮将删除所有数据`
    });
  } catch (error) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
