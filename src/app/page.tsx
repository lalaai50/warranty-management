'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, FileText, MapPin, AlertCircle, CheckCircle, Download, Calendar, Building2, Zap, Factory, Database, Trash2 } from 'lucide-react';

interface WarrantyRecord {
  id: number;
  file_name: string;
  file_url: string;
  after_sales_code: string;
  warranty_status: string;
  factory_date: string;
  factory_number: string;
  pile_number: string;
  product_code: string;
  device_type: string;
  device_name: string;
  product_model: string;
  manufacturer: string;
  station_name: string;
  province: string;
  city: string;
  district: string;
  station_address: string;
  customer: string;
  maintainer: string;
  warranty_period: string;
  warranty_start_date: string;
  warranty_end_date: string;
  created_at: string;
  warranty_status_display: string;
  days_remaining: number;
}

interface Stats {
  total: number;
  inWarranty: number;
  outOfWarranty: number;
}

interface StationStat {
  name: string;
  total: number;
  inWarranty: number;
  outOfWarranty: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [file, setFile] = useState<File | null>(null);
  const [searchStationName, setSearchStationName] = useState('');
  const [searchResults, setSearchResults] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadStats, setUploadStats] = useState<{ total: number; inserted: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 统计
  const [stats, setStats] = useState<Stats>({ total: 0, inWarranty: 0, outOfWarranty: 0 });
  const [stationStats, setStationStats] = useState<StationStat[]>([]);
  
  // 已上传文件列表
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileName: string;
    fileUrl: string;
    count: number;
    createdAt: string;
  }>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  
  // 清空所有数据
  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/clear-all', { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowClearAllConfirm(false);
        loadStats();
        loadUploadedFiles();
      } else {
        setMessage({ type: 'error', text: result.error || '清空失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '清空失败' });
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      const result = await response.json();

      if (result.total !== undefined) {
        setStats({ 
          total: result.total, 
          inWarranty: result.inWarranty, 
          outOfWarranty: result.outOfWarranty 
        });
        setStationStats(result.stations || []);
      } else {
        setMessage({ type: 'error', text: '加载失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '加载数据失败' });
    } finally {
      setLoading(false);
    }
  };
  
  // 加载已上传文件列表
  const loadUploadedFiles = async () => {
    try {
      const response = await fetch('/api/delete');
      const result = await response.json();
      if (result.success) {
        setUploadedFiles(result.files);
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  };
  
  // 删除文件
  const handleDeleteFile = async (fileUrl: string) => {
    try {
      const response = await fetch(`/api/delete?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowDeleteConfirm(null);
        loadUploadedFiles();
        loadStats();
      } else {
        setMessage({ type: 'error', text: result.error || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // 页面加载时获取统计数据
  useEffect(() => {
    if (activeTab === 'all') {
      loadStats();
    }
    if (activeTab === 'upload') {
      loadUploadedFiles();
    }
  }, [activeTab]);

  // 文件上传
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: 'error', text: '请选择要上传的文件' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setUploadStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStats({
          total: result.data.totalRecords,
          inserted: result.data.insertedRecords,
        });
        setMessage({ type: 'success', text: `成功上传并解析 ${result.data.insertedRecords} 条记录！` });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 刷新数据
        loadStats();
        loadUploadedFiles();
      } else {
        setMessage({ type: 'error', text: result.error || '上传失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 查询质保记录
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchStationName.trim()) {
      setMessage({ type: 'error', text: '请输入场站名' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/query?stationName=${encodeURIComponent(searchStationName)}`);
      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
        if (result.data.length === 0) {
          setMessage({ type: 'error', text: '未找到相关记录' });
        }
      } else {
        setMessage({ type: 'error', text: result.error || '查询失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '查询失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 下载文件
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setMessage({ type: 'error', text: '下载失败' });
    }
  };

  // 渲染记录卡片
  const renderRecordCard = (record: WarrantyRecord) => (
    <Card key={record.id} className="overflow-hidden">
      <div className={`h-1 ${
        record.warranty_status_display === '在保' ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 状态标签 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={record.warranty_status_display === '在保' ? 'default' : 'destructive'}
                className="text-base px-3 py-1"
              >
                {record.warranty_status_display}
              </Badge>
              {record.warranty_status && (
                <span className="text-sm text-gray-500">
                  原始状态：{record.warranty_status}
                </span>
              )}
            </div>
            <span className={`text-sm font-medium ${
              record.warranty_status_display === '在保' ? 'text-green-600' : 'text-red-600'
            }`}>
              {record.days_remaining > 0 
                ? `剩余 ${record.days_remaining} 天` 
                : `已过期 ${Math.abs(record.days_remaining)} 天`}
            </span>
          </div>

          {/* 场站信息 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <Building2 className="w-4 h-4 mt-0.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {record.station_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {[record.province, record.city, record.district].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            {record.station_address && (
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {record.station_address}
                </p>
              </div>
            )}
          </div>

          {/* 设备信息 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">设备名称：</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {record.device_name || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">设备类型：</span>
              <span className="text-gray-900 dark:text-white">
                {record.device_type || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">产品型号：</span>
              <span className="text-gray-900 dark:text-white">
                {record.product_model || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">设备厂商：</span>
              <span className="text-gray-900 dark:text-white">
                {record.manufacturer || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">电桩编号：</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">
                {record.pile_number || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">售后编码：</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">
                {record.after_sales_code || '-'}
              </span>
            </div>
          </div>

          {/* 质保信息 */}
          <div className="border-t pt-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  质保周期：{record.warranty_period || '-'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  所属客户：{record.customer || '-'} | 运维商：{record.maintainer || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleDownload(record.file_url, record.file_name)}
            >
              <Download className="w-4 h-4 mr-2" />
              下载源文件
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-8">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">设备维保管理系统</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">充电桩设备质保查询</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              全部数据
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              上传 Excel
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              查询质保
            </TabsTrigger>
          </TabsList>

          {/* 全部数据页面 */}
          <TabsContent value="all">
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    <p className="text-sm text-gray-500">总记录数</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.inWarranty}</p>
                    <p className="text-sm text-gray-500">在保设备</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{stats.outOfWarranty}</p>
                    <p className="text-sm text-gray-500">过保设备</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 数据管理 */}
            <div className="flex items-center justify-between mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>数据校验：</strong>在保设备 + 过保设备 = {stats.inWarranty + stats.outOfWarranty} 条
                {stats.total !== stats.inWarranty + stats.outOfWarranty && (
                  <span className="ml-2 text-orange-600">（与总记录数不符，可能有部分数据质保日期为空）</span>
                )}
              </div>
              
              {showClearAllConfirm ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    确认清空
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearAllConfirm(false)}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => setShowClearAllConfirm(true)}
                >
                  清空所有数据
                </Button>
              )}
            </div>

            {/* 站点统计 */}
            {stationStats.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>站点统计</CardTitle>
                  <CardDescription>各站点的设备数量及质保状态分布（共 {stationStats.length} 个站点）</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-white">站点名称</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-900 dark:text-white">总设备数</th>
                          <th className="text-center py-3 px-2 font-medium text-green-600">在保</th>
                          <th className="text-center py-3 px-2 font-medium text-red-600">过保</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-500">在保率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationStats.map((station, index) => {
                          const warrantyRate = station.total > 0 
                            ? ((station.inWarranty / station.total) * 100).toFixed(1)
                            : '0.0';
                          
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-2 text-gray-900 dark:text-white">
                                {station.name}
                              </td>
                              <td className="py-3 px-2 text-center font-medium text-gray-900 dark:text-white">
                                {station.total}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {station.inWarranty}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  {station.outOfWarranty}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400">
                                {warrantyRate}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.total === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">暂无数据，请先上传 Excel 文件</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 上传页面 */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>上传设备维保表</CardTitle>
                <CardDescription>
                  上传 Excel 文件（.xlsx 或 .xls），系统将自动解析并导入设备数据
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">选择文件 *</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-gray-500">已选择: {file.name}</p>
                    )}
                  </div>

                  {message && activeTab === 'upload' && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      message.type === 'success' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {message.text}
                    </div>
                  )}

                  {uploadStats && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        解析统计：共 {uploadStats.total} 条记录，成功导入 {uploadStats.inserted} 条
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? '上传中...' : '上传并解析'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* 已上传文件列表 */}
            {uploadedFiles.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>已上传文件 ({uploadedFiles.length} 次)</CardTitle>
                  <CardDescription>
                    点击删除按钮可删除该次上传及其所有数据
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.fileName}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {file.count} 条记录 · {new Date(file.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        
                        {showDeleteConfirm === file.fileUrl ? (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFile(file.fileUrl)}
                            >
                              确认删除
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(null)}
                            >
                              取消
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowDeleteConfirm(file.fileUrl)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 查询页面 */}
          <TabsContent value="query">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>查询质保记录</CardTitle>
                <CardDescription>
                  输入场站名称进行模糊查询（支持部分匹配）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="请输入场站名称（如：湖北省人防办充电站）"
                      value={searchStationName}
                      onChange={(e) => setSearchStationName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? '查询中...' : '查询'}
                  </Button>
                </form>
                
                {message && activeTab === 'query' && message.type === 'error' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 mt-4">
                    <AlertCircle className="w-5 h-5" />
                    {message.text}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 查询结果 */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                {/* 站点状态汇总 */}
                {(() => {
                  const inWarrantyRecords = searchResults.filter(r => r.warranty_status_display === '在保');
                  const outOfWarrantyRecords = searchResults.filter(r => r.warranty_status_display === '过保');
                  const inWarrantyCount = inWarrantyRecords.length;
                  const outOfWarrantyCount = outOfWarrantyRecords.length;
                  
                  return (
                    <>
                      {/* 整站状态提示 */}
                      {inWarrantyCount === searchResults.length && (
                        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="text-lg font-bold text-green-700 dark:text-green-400">整站在保</p>
                                <p className="text-sm text-green-600 dark:text-green-300">
                                  该站点所有 {searchResults.length} 台设备均在保修期内
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {outOfWarrantyCount === searchResults.length && (
                        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-8 h-8 text-red-600" />
                              <div>
                                <p className="text-lg font-bold text-red-700 dark:text-red-400">整站过保</p>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                  该站点所有 {searchResults.length} 台设备均已过保修期，需要续保后维修
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {inWarrantyCount > 0 && outOfWarrantyCount > 0 && (
                        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-4">
                              <AlertCircle className="w-8 h-8 text-orange-600" />
                              <div>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">部分过保</p>
                                <p className="text-sm text-orange-600 dark:text-orange-300">
                                  该站点共 {searchResults.length} 台设备，其中 {inWarrantyCount} 台在保，{outOfWarrantyCount} 台过保
                                </p>
                              </div>
                            </div>
                            
                            {/* 设备分类列表 */}
                            <div className="space-y-3">
                              {/* 在保设备 */}
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                  ✓ 在保设备 ({inWarrantyCount} 台)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {inWarrantyRecords.map((r, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      {r.device_name || r.pile_number || r.after_sales_code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 过保设备 */}
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                                  ✗ 过保设备 ({outOfWarrantyCount} 台)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {outOfWarrantyRecords.map((r, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                      {r.device_name || r.pile_number || r.after_sales_code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
                
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    设备明细 ({searchResults.length} 条)
                  </h3>
                </div>
                
                {searchResults.map(renderRecordCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
