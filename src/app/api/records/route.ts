import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    
    const client = getSupabaseClient();
    
    // 查询总记录数
    const { count, error: countError } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    // 分批获取所有数据进行统计（每批1000条）
    const batchSize = 1000;
    const now = new Date();
    let totalInWarranty = 0;
    let totalOutOfWarranty = 0;
    const stationStats: Record<string, { total: number; inWarranty: number; outOfWarranty: number }> = {};
    
    const totalBatches = Math.ceil((count || 0) / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const { data: batchData } = await client
        .from('warranty_records')
        .select('station_name, warranty_end_date, warranty_status')
        .range(batch * batchSize, (batch + 1) * batchSize - 1);
      
      batchData?.forEach((record) => {
        const stationName = record.station_name || '未知站点';
        
        if (!stationStats[stationName]) {
          stationStats[stationName] = { total: 0, inWarranty: 0, outOfWarranty: 0 };
        }
        
        stationStats[stationName].total++;
        
        // 优先使用保修状态字段
        if (record.warranty_status === '保内' || record.warranty_status === '在保') {
          totalInWarranty++;
          stationStats[stationName].inWarranty++;
        } else if (record.warranty_status === '保外' || record.warranty_status === '过保') {
          totalOutOfWarranty++;
          stationStats[stationName].outOfWarranty++;
        } else if (record.warranty_end_date) {
          // 如果没有保修状态，根据日期判断
          const endDate = new Date(record.warranty_end_date);
          if (endDate >= now) {
            totalInWarranty++;
            stationStats[stationName].inWarranty++;
          } else {
            totalOutOfWarranty++;
            stationStats[stationName].outOfWarranty++;
          }
        }
      });
    }
    
    // 转换为数组并排序
    const stationStatsArray = Object.entries(stationStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 查询分页数据
    const { data, error } = await client
      .from('warranty_records')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: '查询失败' }, { status: 500 });
    }

    // 判断质保状态
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
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      stats: {
        total: count || 0,
        inWarranty: totalInWarranty,
        outOfWarranty: totalOutOfWarranty,
      },
      stationStats: stationStatsArray,
    });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
