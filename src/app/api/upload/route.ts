import { NextRequest, NextResponse } from 'next/server';
import { S3Storage, FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
  if (!period || period === '质保周期') {
    return { start: null, end: null };
  }
  
  const parts = period.split('~');
  if (parts.length === 2) {
    return { start: parts[0].trim(), end: parts[1].trim() };
  }
  return { start: null, end: null };
}

// 解析 Excel 文本内容为数据行
function parseExcelContent(text: string): Array<Record<string, string>> {
  const lines = text.split('\n');
  const records: Array<Record<string, string>> = [];
  
  // 找到表头行（包含"售后编码"的行）
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('售后编码')) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    return [];
  }
  
  // 提取表头
  const headerLine = lines[headerIndex];
  const headers = headerLine.split('|').filter(h => h.trim());
  
  // 解析数据行
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('|---') || !line.includes('|')) {
      continue;
    }
    
    const values = line.split('|').filter(v => v.trim());
    if (values.length >= 18) {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          record[header.trim()] = values[index].trim();
        }
      });
      
      // 验证关键字段：售后编码必须存在且格式正确（以ZH开头）
      const afterSalesCode = record['售后编码'];
      if (afterSalesCode && afterSalesCode.startsWith('ZH') && afterSalesCode.length > 5) {
        records.push(record);
      }
    }
  }
  
  return records;
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

    // 使用 FetchClient 解析 Excel 文件
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const fetchClient = new FetchClient(config, customHeaders);
    
    const response = await fetchClient.fetch(fileUrl);
    
    if (response.status_code !== 0) {
      return NextResponse.json(
        { error: '解析 Excel 文件失败' },
        { status: 500 }
      );
    }

    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // 解析数据行
    const records = parseExcelContent(textContent);
    
    if (records.length === 0) {
      return NextResponse.json(
        { error: '未找到有效数据，请检查 Excel 文件格式' },
        { status: 400 }
      );
    }

    // 保存到数据库
    const client = getSupabaseClient();
    const insertedRecords = [];
    
    for (const record of records) {
      const warrantyPeriod = parseWarrantyPeriod(record['质保周期'] || '');
      
      const dbRecord = {
        file_name: file.name,
        file_url: fileUrl,
        after_sales_code: record['售后编码'],
        warranty_status: record['保修状态'],
        factory_date: record['出厂日期'],
        factory_number: record['出厂机号'],
        pile_number: record['电桩编号'],
        product_code: record['品号'],
        device_type: record['设备类型'],
        device_name: record['设备名称'],
        product_model: record['产品型号'],
        manufacturer: record['设备厂商'],
        station_name: record['所属场站'],
        province: record['所属省份'],
        city: record['所属城市'],
        district: record['所属区县'],
        station_address: record['场站地址'],
        customer: record['所属客户'],
        maintainer: record['所属运维商'],
        warranty_period: record['质保周期'],
        warranty_start_date: warrantyPeriod.start,
        warranty_end_date: warrantyPeriod.end,
      };
      
      const { data, error } = await client
        .from('warranty_records')
        .insert(dbRecord)
        .select()
        .single();
      
      if (!error && data) {
        insertedRecords.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRecords: records.length,
        insertedRecords: insertedRecords.length,
        records: insertedRecords,
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
