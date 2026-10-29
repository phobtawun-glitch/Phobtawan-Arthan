import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from '@/connectAPI/axios';

const AdminReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
   const [reports, setReports] = useState<any[]>([]);
   const [confirm, setConfirm] = useState<{ action: 'view' | 'suspend' | 'review'; postId: string; reportId: string; reason: string } | null>(null);
   const pendingReports = reports;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">รอตรวจสอบ</span>;
      case 'reviewed': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">ตรวจสอบแล้ว</span>;
      case 'suspended': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-urgent/10 text-urgent">ระงับแล้ว</span>;
      default: return null;
    }
  };

  const loadReports = async () => {
    try {const response = await axios.get('/admin/reports');
      if (response.data?.success) {setReports(response.data.data ?? []);}
    } catch (error: any) {console.error('LOAD REPORTS ERROR:', error?.response?.data || error);
      toast({
        title: 'โหลดรายงานไม่สำเร็จ',
        description: error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลรายงานได้',
        variant: 'destructive',
      });
    }
  };
  useEffect(() => {
    loadReports();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">จัดการรายงาน</h1>
        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">โพสต์</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ผู้รายงาน</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">เหตุผล</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">สถานะ</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">วันที่รายงาน</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.map(report => (
                <tr key={report.Report_Title_ID} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-3 px-4 font-medium text-foreground">{report.Posting_Name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{report.Reporter_Name || '-'}</td>
                  <td className="py-3 px-4 text-foreground">{report.Reason || 'ไม่ระบุเหตุผล'}</td>
                  <td className="py-3 px-4">{statusBadge('pending')}</td>
                  <td className="py-3 px-4 text-muted-foreground">{report.Post_Report_Date ? `${report.Post_Report_Date} ${report.Post_Report_Time || '' }` : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                       <Button variant="ghost" size="sm" className="text-foreground" onClick={() => setConfirm({ action: 'view', postId: String(report.Post_ID), reportId: String(report.Report_Title_ID), reason: report.Reason, })}>
                         ตรวจสอบ
                      </Button>
                       <Button variant="ghost" size="sm" className="text-urgent hover:text-urgent" onClick={() => setConfirm({ action: 'suspend', postId: String(report.Post_ID), reportId: String(report.Report_Title_ID), reason: report.Reason, })}>
                        ระงับ
                      </Button>
                       <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => setConfirm({ action: 'review', postId: String(report.Post_ID), reportId: String(report.Report_Title_ID), reason: report.Reason, })}>
                        ตรวจสอบเสร็จสิ้น
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">ไม่มีรายงานที่รอตรวจสอบ</div>
          )}
        </div>
      </div>
      <AlertDialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.action === 'view' ? 'ตรวจสอบโพสต์' : confirm?.action === 'suspend' ? 'ระงับโพสต์' : 'ยืนยันการตรวจสอบ'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'view' ? 'คุณต้องการดูรายละเอียดโพสต์นี้หรือไม่?' : confirm?.action === 'suspend' ? 'คุณต้องการระงับโพสต์นี้หรือไม่?' : 'คุณต้องการทำเครื่องหมายว่าตรวจสอบแล้วหรือไม่?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
                if (!confirm) return;
                try {
                  if (confirm.action === 'view') {
                    navigate(`/post/${confirm.postId}`);
                    setConfirm(null);
                    return;
                  }
                  const admin = JSON.parse(localStorage.getItem('admin') || '{}' );
                  if (!admin?.Admin_ID) {
                    toast({
                      title: 'ไม่พบข้อมูล Admin',
                      description: 'กรุณาเข้าสู่ระบบ Admin ใหม่',
                      variant: 'destructive',
                    });
                    setConfirm(null);
                    return;
                  }
                  if (confirm.action === 'suspend') {
                    await axios.put(
                      `/admin/reports/${confirm.reportId}/suspend`,
                      {
                        adminId: admin.Admin_ID,
                      }
                    );
                    toast({
                      title: 'ระงับโพสต์เรียบร้อย',
                    });
                  }
                  if (confirm.action === 'review') {
                    await axios.put(
                      `/admin/reports/${confirm.reportId}/complete`,
                      {
                        adminId: admin.Admin_ID,
                      }
                    );
                    toast({
                      title: 'ตรวจสอบเรียบร้อย',
                    });
                  }
                  await loadReports();
                } catch (error: any) {
                  console.error('ADMIN REPORT ACTION ERROR:', error?.response?.data || error);
                  toast({
                    title: 'ดำเนินการไม่สำเร็จ',
                    description: error?.response?.data?.message || 'เกิดข้อผิดพลาด',
                    variant: 'destructive',
                  });
                }
                setConfirm(null);
              }}
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReports;