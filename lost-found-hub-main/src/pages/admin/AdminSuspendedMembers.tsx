import { useState } from 'react';
import { Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminSuspendedMembers, setMemberUnsuspended, } from '@/hooks/useAdminMembers';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';

const selectCls = 'h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const AdminSuspendedMembers = () => {
  const members = useAdminSuspendedMembers();
  const { toast } = useToast();
  const [gender, setGender] = useState('all');
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const q = query.trim().toLowerCase();
  const list = members.filter((member) =>
    !q ||
    member.name.toLowerCase().includes(q) ||
    member.email.toLowerCase().includes(q)
  );

  const genders = Array.from(
    new Set(members.map((m) => m.gender).filter((g) => g && g !== '-'))
  );

  const selected = members.find((member) => member.id === confirmId);
  const openDialog = (memberId: string) => {
    setReason('');
    setConfirmId(memberId);
  };

  const closeDialog = () => {
    if (isSubmitting) return;

    setConfirmId(null);
    setReason('');
  };

  const handleUnsuspend = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (!selected || isSubmitting) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: 'กรุณาระบุเหตุผล',
        description: 'ต้องกรอกเหตุผลก่อนปลดระงับสมาชิก',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await setMemberUnsuspended(selected.id, trimmedReason);
      toast({
        title: `ปลดระงับ ${selected.name} เรียบร้อย`,
        description: 'บันทึกเหตุผลและข้อมูลการปลดระงับแล้ว',
      });
      setConfirmId(null);
      setReason('');
      // โหลดรายชื่อใหม่ สมาชิกที่เปลี่ยนเป็น Active
      // จะไม่ปรากฏในหน้ารายชื่อสมาชิกที่ถูกระงับ
      window.location.reload();
    } catch (error: any) {
      console.error(
        'UNSUSPEND MEMBER ERROR:',
        error?.response?.data || error
      );
      toast({
        title: 'ปลดระงับไม่สำเร็จ',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'ไม่สามารถปลดระงับสมาชิกได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">จัดการสมาชิกที่ถูกระงับ</h1>
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
              {list.map((member) => (
                <tr key={member.id} className="border-b border-border">
                  <td className="py-3 px-4 font-medium">{member.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{member.email}</td>
                  <td className="py-3 px-4">{member.gender}</td>
                  <td className="py-3 px-4">{member.postCount}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-urgent/10 text-urgent">ถูกระงับ</span>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" className="text-success hover:text-success" onClick={() => openDialog(member.id)}>
                      ปลดระงับ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">ไม่มีสมาชิกที่ถูกระงับ</div>
          )}
        </div>
      </div>
      <AlertDialog open={confirmId !== null} onOpenChange={(open) => {if (!open) closeDialog();}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ปลดระงับสมาชิก</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการปลดระงับบัญชีของ {selected?.name} หรือไม่?
              กรุณาระบุเหตุผลก่อนยืนยัน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="unsuspend-reason" className="text-sm font-medium">
              เหตุผลในการปลดระงับ{' '}<span className="text-red-500">*</span>
            </label>

            <textarea id="unsuspend-reason" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลในการปลดระงับสมาชิก..." maxLength={99} rows={3} disabled={isSubmitting}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"/>
            <p className="text-xs text-muted-foreground">{reason.length}/99 ตัวอักษร</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? 'กำลังปลดระงับ...' : 'ยืนยันปลดระงับ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSuspendedMembers;