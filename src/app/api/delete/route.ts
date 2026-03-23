import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fileName = searchParams.get('fileName');

    const client = getSupabaseClient();

    if (id) {
      // 删除单条记录
      const { error } = await client
        .from('warranty_records')
        .delete()
        .eq('id', parseInt(id));

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '记录已删除' });
    } else if (fileName) {
      // 删除该文件的所有记录
      const { data, error } = await client
        .from('warranty_records')
        .delete()
        .eq('file_name', fileName)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `已删除 ${data?.length || 0} 条记录` 
      });
    } else {
      return NextResponse.json({ error: '缺少删除参数' }, { status: 400 });
    }
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

// 获取已上传的文件列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 按文件名分组统计
    const { data, error } = await client
      .from('warranty_records')
      .select('file_name, file_url, created_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 统计每个文件的记录数
    const fileStats: Record<string, { 
      fileName: string; 
      fileUrl: string; 
      count: number; 
      createdAt: string;
    }> = {};

    data?.forEach((record) => {
      if (!fileStats[record.file_name]) {
        fileStats[record.file_name] = {
          fileName: record.file_name,
          fileUrl: record.file_url,
          count: 0,
          createdAt: record.created_at,
        };
      }
      fileStats[record.file_name].count++;
    });

    const files = Object.values(fileStats).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
