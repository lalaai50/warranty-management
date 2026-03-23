import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 获取最新上传的文件
    const { data: latestFile } = await client
      .from('warranty_records')
      .select('file_url')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!latestFile) {
      return NextResponse.json({ error: '没有文件' }, { status: 404 });
    }
    
    // 下载文件
    const response = await fetch(latestFile.file_url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 解析Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 获取工作表范围
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const totalRows = range.e.r - range.s.r + 1;
    
    // 转换为JSON查看实际数据行数
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // 找表头
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      if (jsonData[i]?.includes('售后编码')) {
        headerIndex = i;
        break;
      }
    }
    
    const dataRows = headerIndex >= 0 ? jsonData.length - headerIndex - 1 : 0;
    
    // 检查最后一行数据
    const lastRows = jsonData.slice(-5).map((row, idx) => ({
      index: jsonData.length - 5 + idx,
      firstCell: row?.[0],
      secondCell: row?.[1],
      length: row?.length,
    }));
    
    return NextResponse.json({
      success: true,
      excelInfo: {
        sheetName,
        range: worksheet['!ref'],
        totalRows,
        headerIndex,
        dataRows,
        actualDataRows: dataRows,
      },
      lastRows,
      conclusion: `Excel文件共有 ${totalRows} 行，其中数据行约 ${dataRows} 行。数据库中有 1000 条记录。`,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
