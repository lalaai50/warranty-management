'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, FileText, MapPin, AlertCircle, CheckCircle, Download, Calendar, Building2, Zap, Factory } from 'lucide-react';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [searchStationName, setSearchStationName] = useState('');
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadStats, setUploadStats] = useState<{ total: number; inserted: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setRecords(result.data);
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
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              上传 Excel
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              查询质保
            </TabsTrigger>
          </TabsList>

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
            {records.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    查询结果 ({records.length} 条)
                  </h3>
                </div>
                
                {records.map((record) => (
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
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
