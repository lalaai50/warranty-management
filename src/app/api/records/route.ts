import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    
    const client = getSupabaseClient();
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 查询总记录数
    const { count, error: countError } = await client
      .from('warranty_records')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('查询总数失败:', countError);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }
    
    // 查询分页数据
    const { data, error } = await client
      .from('warranty_records')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

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

    // 计算统计信息
    const stats = {
      total: count || 0,
      inWarranty: recordsWithStatus.filter(r => r.warranty_status_display === '在保').length,
      outOfWarranty: recordsWithStatus.filter(r => r.warranty_status_display === '过保').length,
    };

    return NextResponse.json({
      success: true,
      data: recordsWithStatus,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      stats,
    });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
