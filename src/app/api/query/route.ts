import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stationName = searchParams.get('stationName');

    if (!stationName) {
      return NextResponse.json(
        { error: '缺少查询参数：stationName' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 模糊搜索场站名
    const { data, error } = await client
      .from('warranty_records')
      .select('*')
      .ilike('station_name', `%${stationName}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查询失败:', error);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    // 判断质保状态
    const now = new Date();
    const recordsWithStatus = data?.map((record) => {
      let isWarrantyValid = false;
      let daysRemaining = 0;
      
      if (record.warranty_end_date) {
        const endDate = new Date(record.warranty_end_date);
        isWarrantyValid = endDate >= now;
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...record,
        warranty_status_display: isWarrantyValid ? '在保' : '过保',
        days_remaining: daysRemaining,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: recordsWithStatus,
      total: recordsWithStatus.length,
    });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
