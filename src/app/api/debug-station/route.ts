import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const stationName = request.nextUrl.searchParams.get('station') || '武汉菱角湖万达广场';
    
    // 分批获取该站点的所有数据
    const batchSize = 1000;
    const { count } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true })
      .ilike('station_name', `%${stationName}%`);
    
    const totalBatches = Math.ceil((count || 0) / batchSize);
    const allRecords: any[] = [];
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const { data } = await client
        .from('warranty_records')
        .select('station_name, warranty_status, warranty_end_date, device_name, after_sales_code')
        .ilike('station_name', `%${stationName}%`)
        .range(batch * batchSize, (batch + 1) * batchSize - 1);
      
      if (data) allRecords.push(...data);
    }
    
    // 统计
    const now = new Date();
    let inWarranty = 0;
    let outOfWarranty = 0;
    
    const details = allRecords.map(r => {
      let status = '未知';
      
      if (r.warranty_status === '保内' || r.warranty_status === '在保') {
        status = '在保';
        inWarranty++;
      } else if (r.warranty_status === '保外' || r.warranty_status === '过保') {
        status = '过保';
        outOfWarranty++;
      } else if (r.warranty_end_date) {
        const endDate = new Date(r.warranty_end_date);
        if (endDate >= now) {
          status = '在保(按日期)';
          inWarranty++;
        } else {
          status = '过保(按日期)';
          outOfWarranty++;
        }
      }
      
      return {
        station: r.station_name,
        device: r.device_name,
        code: r.after_sales_code,
        warranty_status: r.warranty_status,
        warranty_end_date: r.warranty_end_date,
        calculated: status
      };
    });
    
    return NextResponse.json({
      station: stationName,
      total: allRecords.length,
      inWarranty,
      outOfWarranty,
      records: details
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
