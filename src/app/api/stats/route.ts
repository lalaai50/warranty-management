import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 查询总记录数
    const { count } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    // 分批获取所有数据进行统计
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
        
        // 优先按质保结束日期判断，没有日期时才用保修状态字段
        if (record.warranty_end_date) {
          const endDate = new Date(record.warranty_end_date);
          if (endDate >= now) {
            totalInWarranty++;
            stationStats[stationName].inWarranty++;
          } else {
            totalOutOfWarranty++;
            stationStats[stationName].outOfWarranty++;
          }
        } else if (record.warranty_status === '保内' || record.warranty_status === '在保') {
          totalInWarranty++;
          stationStats[stationName].inWarranty++;
        } else if (record.warranty_status === '保外' || record.warranty_status === '过保') {
          totalOutOfWarranty++;
          stationStats[stationName].outOfWarranty++;
        }
      });
    }
    
    return NextResponse.json({
      total: count,
      inWarranty: totalInWarranty,
      outOfWarranty: totalOutOfWarranty,
      stationCount: Object.keys(stationStats).length,
      stations: Object.entries(stationStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
