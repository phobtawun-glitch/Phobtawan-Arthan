import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminMembers, setMemberSuspended, } from '@/hooks/useAdminMembers';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';

const selectCls = 'h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const AdminMembers = () => {
  const { toast } = useToast();
  const members = useAdminMembers();
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('all');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const genders = Array.from(
    new Set(members.map((m) => m.gender).filter((g) => g && g !== '-'))
  );

  const q = query.trim().toLowerCase();
  const list = members.filter((m) => {
    if (m.suspended) return false;
    if (
      q &&
      !m.name.toLowerCase().includes(q) &&
      !m.email.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (gender !== 'all' && m.gender !== gender) {
      return false;
    }
    return true;
  });

  const openSuspendDialog = (member: { id: string; name: string }) => {
    setReason('');
    setConfirm(member);
  };

  const closeSuspendDialog = () => {
    if (isSubmitting) return;
    setConfirm(null);
    setReason('');
  };

  const handleSuspend = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (!confirm || isSubmitting) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: 'กรุณาระบุเหตุผล',
        description: 'ต้องกรอกเหตุผลก่อนระงับสมาชิก',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // ต้องส่ง memberId, adminId และ reason ไปยัง Backend
      await setMemberSuspended(confirm.id, trimmedReason);
      toast({
        title: 'ระงับบัญชีเรียบร้อย',
        description: `ระงับบัญชี ${confirm.name} เรียบร้อยแล้ว`,
      });
      setConfirm(null);
      setReason('');
      // โหลดข้อมูลสมาชิกใหม่จาก Backend
      // สมาชิกที่ถูกระงับจะหายจากรายการเมื่อ GET API กรองข้อมูลถูกต้อง
      window.location.reload();
    } catch (error: any) {
      console.error(
        'SUSPEND MEMBER ERROR:',
        error?.response?.data || error
      );
      toast({
        title: 'ระงับบัญชีไม่สำเร็จ',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'เกิดข้อผิดพลาดในการระงับบัญชี',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">จัดการสมาชิก</h1>
        <div className="bg-card rounded-lg shadow-card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ชื่อ หรือ อีเมล..."
                className="pl-10 pr-4 h-9 w-64 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">เพศ</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls}>
              <option value="all">ทั้งหมด</option>
              {genders.map((g) => (<option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['ชื่อ - นามสกุล', 'อีเมลหรือไอดีไลน์', 'เพศ', 'โพสต์', 'สถานะ', 'จัดการ',].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.email}</td>
                  <td className="py-3 px-4">{m.gender}</td>
                  <td className="py-3 px-4">{m.postCount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${m.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {m.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" onClick={() => openSuspendDialog({ id: m.id, name: m.name })}>
                      <span className="text-urgent">ระงับ</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">ไม่พบสมาชิก</div>)}
        </div>
      </div>
      <AlertDialog open={!!confirm} onOpenChange={(open) => {if (!open) closeSuspendDialog();}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ระงับบัญชีสมาชิก</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการระงับบัญชีของ {confirm?.name} หรือไม่?
              กรุณาระบุเหตุผลก่อนยืนยัน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="suspend-reason" className="text-sm font-medium">
              เหตุผลในการระงับ <span className="text-red-500">*</span>
            </label>
            <textarea id="suspend-reason" value={reason}
              onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผลที่ต้องการระงับสมาชิก..." maxLength={99} rows={3} disabled={isSubmitting}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"/>
            <p className="text-xs text-muted-foreground">{reason.length}/99 ตัวอักษร </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? 'กำลังระงับ...' : 'ยืนยันระงับ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMembers;