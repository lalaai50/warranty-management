'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, FileText, Calendar, Building2, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface WarrantyRecord {
  id: number;
  file_name: string;
  file_url: string;
  station_name: string;
  warranty_end_date: string;
  created_at: string;
  warranty_status: string;
  days_remaining: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [stationName, setStationName] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [searchStationName, setSearchStationName] = useState('');
  const [records, setRecords] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件上传
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !stationName || !warrantyEndDate) {
      setMessage({ type: 'error', text: '请填写所有必填项' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stationName', stationName);
      formData.append('warrantyEndDate', warrantyEndDate);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '上传成功！' });
        setFile(null);
        setStationName('');
        setWarrantyEndDate('');
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">设备质保管理系统</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">文件上传与质保查询</p>
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
              文件上传
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              质保查询
            </TabsTrigger>
          </TabsList>

          {/* 上传页面 */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>上传质保文件</CardTitle>
                <CardDescription>
                  上传设备质保文件并填写相关信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">文件 *</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-gray-500">已选择: {file.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stationName">场站名称 *</Label>
                    <Input
                      id="stationName"
                      type="text"
                      placeholder="请输入场站名称"
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyEndDate">质保终止日期 *</Label>
                    <Input
                      id="warrantyEndDate"
                      type="date"
                      value={warrantyEndDate}
                      onChange={(e) => setWarrantyEndDate(e.target.value)}
                    />
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

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? '上传中...' : '上传文件'}
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
                  输入场站名称进行模糊查询
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="请输入场站名称（支持模糊搜索）"
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
                      record.warranty_status === '在保' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* 状态标签 */}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={record.warranty_status === '在保' ? 'default' : 'destructive'}
                            className="text-sm"
                          >
                            {record.warranty_status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {record.days_remaining > 0 
                              ? `剩余 ${record.days_remaining} 天` 
                              : `已过期 ${Math.abs(record.days_remaining)} 天`}
                          </span>
                        </div>

                        {/* 信息列表 */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 mt-0.5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {record.station_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 mt-0.5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {record.file_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              质保截止: {new Date(record.warranty_end_date).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDownload(record.file_url, record.file_name)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载文件
                        </Button>
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
