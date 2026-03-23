import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const stationName = formData.get('stationName') as string;
    const warrantyEndDate = formData.get('warrantyEndDate') as string;

    if (!file || !stationName || !warrantyEndDate) {
      return NextResponse.json(
        { error: '缺少必要参数：file, stationName, warrantyEndDate' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: `warranty-files/${Date.now()}_${file.name}`,
      contentType: file.type,
    });

    // 生成文件访问 URL（有效期 7 天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7 天
    });

    // 保存记录到数据库
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('warranty_records')
      .insert({
        file_name: file.name,
        file_url: fileUrl,
        station_name: stationName,
        warranty_end_date: warrantyEndDate,
      })
      .select()
      .single();

    if (error) {
      console.error('数据库插入失败:', error);
      return NextResponse.json(
        { error: '保存记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    );
  }
}
