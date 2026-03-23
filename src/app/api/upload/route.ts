import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 解析质保周期（格式：2023-07-31~2026-07-30）
function parseWarrantyPeriod(period: string): { start: string | null; end: string | null } {
  if (!period || typeof period !== 'string') {
    return { start: null, end: null };
  }
  
  const parts = period.split('~');
  if (parts.length === 2) {
    return { start: parts[0].trim(), end: parts[1].trim() };
  }
  return { start: null, end: null };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '缺少文件参数' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: '请上传 Excel 文件（.xlsx 或 .xls）' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: `warranty-files/${Date.now()}_${file.name}`,
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 生成文件访问 URL（有效期 7 天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7 天
    });

    // 使用 xlsx 库解析 Excel 文件
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // 获取第一个工作表
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为 JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: 'Excel 文件没有数据或格式不正确' },
        { status: 400 }
      );
    }
    
    // 找到表头行（包含"售后编码"的行）
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.includes('售后编码')) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      return NextResponse.json(
        { error: '未找到表头行，请检查 Excel 文件格式' },
        { status: 400 }
      );
    }
    
    // 提取表头
    const headers = jsonData[headerIndex] as string[];
    
    // 解析数据行
    const records: Array<Record<string, string>> = [];
    for (let i = headerIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          record[header.toString()] = row[index]?.toString() || '';
        }
      });
      
      // 验证关键字段：售后编码和场站名都必须存在
      const afterSalesCode = record['售后编码'];
      const stationName = record['所属场站'];
      
      // 只要售后编码和场站名都存在且非空，就认为是有效数据
      if (afterSalesCode && afterSalesCode.trim().length > 0 && 
          stationName && stationName.trim().length > 0) {
        records.push(record);
      }
    }
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: '未找到有效数据，请检查 Excel 文件格式' },
        { status: 400 }
      );
    }

    // 准备批量插入数据
    const dbRecords = records.map(record => {
      const warrantyPeriod = parseWarrantyPeriod(record['质保周期'] || '');
      return {
        file_name: file.name,
        file_url: fileUrl,
        after_sales_code: record['售后编码'] || null,
        warranty_status: record['保修状态'] || null,
        factory_date: record['出厂日期'] || null,
        factory_number: record['出厂机号'] || null,
        pile_number: record['电桩编号'] || null,
        product_code: record['品号'] || null,
        device_type: record['设备类型'] || null,
        device_name: record['设备名称'] || null,
        product_model: record['产品型号'] || null,
        manufacturer: record['设备厂商'] || null,
        station_name: record['所属场站'] || null,
        province: record['所属省份'] || null,
        city: record['所属城市'] || null,
        district: record['所属区县'] || null,
        station_address: record['场站地址'] || null,
        customer: record['所属客户'] || null,
        maintainer: record['所属运维商'] || null,
        warranty_period: record['质保周期'] || null,
        warranty_start_date: warrantyPeriod.start,
        warranty_end_date: warrantyPeriod.end,
      };
    });
    
    // 批量插入（分批处理，每批500条）
    const client = getSupabaseClient();
    const batchSize = 500;
    let insertedCount = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < dbRecords.length; i += batchSize) {
      const batch = dbRecords.slice(i, i + batchSize);
      const { data, error } = await client
        .from('warranty_records')
        .insert(batch)
        .select();
      
      if (error) {
        errors.push({ batch: Math.floor(i / batchSize) + 1, error: error.message });
      } else {
        insertedCount += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRows: jsonData.length - headerIndex - 1,
        validRecords: records.length,
        insertedRecords: insertedCount,
        errors: errors.length,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
