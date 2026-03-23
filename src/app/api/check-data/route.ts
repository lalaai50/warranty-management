import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 获取最新上传的文件URL
    const { data: latestFile, error: fileError } = await client
      .from('warranty_records')
      .select('file_url, file_name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fileError || !latestFile) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 404 });
    }
    
    // 统计数据库中唯一售后编码数量
    const { data: allCodes } = await client
      .from('warranty_records')
      .select('after_sales_code');
    
    const uniqueCodes = new Set(allCodes?.map(r => r.after_sales_code));
    
    return NextResponse.json({
      success: true,
      fileInfo: {
        fileName: latestFile.file_name,
        fileUrl: latestFile.file_url.substring(0, 100) + '...',
      },
      dbStats: {
        totalRecords: allCodes?.length || 0,
        uniqueAfterSalesCodes: uniqueCodes.size,
      },
      note: '请将您的Excel文件发送给我，我可以帮您检查实际有多少行数据。或者您可以在Excel中查看最后一行的行号来确认。',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
