import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from '@/connectAPI/axios';
import { useEffect, useState } from 'react';

const AdminSuspended = () => {
  const navigate = useNavigate();
  const [showViewConfirm, setShowViewConfirm] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [suspendedPosts, setSuspendedPosts] = useState<any[]>([]);

  const typeBadge = (typeName: string) => {
    const isLost =
      typeName?.includes('สูญหาย') ||
      typeName?.toLowerCase().includes('lost');

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          isLost
            ? 'bg-urgent/10 text-urgent'
            : 'bg-success/10 text-success'
        }`}
      >
        {isLost
          ? 'แจ้งสิ่งของสูญหาย'
          : 'แจ้งพบสิ่งของ'}
      </span>
    );
  };

  const loadSuspendedPosts = async () => {
    try {
      const response = await axios.get('/admin/suspended');

      console.log(
        'SUSPENDED POSTS:',
        response.data
      );

      if (response.data?.success) {
        setSuspendedPosts(
          response.data.data ?? []
        );
      }

    } catch (error: any) {
      console.error(
        'LOAD SUSPENDED POSTS ERROR:',
        error?.response?.data || error
      );
    }
  };

  const filteredPosts = suspendedPosts.filter((post) => {
    const searchText = query.trim().toLowerCase();

    const matchType =
      type === 'all' ||
      String(post.Post_Type_ID) === type;

    const matchSearch =
      !searchText ||
      String(post.Posting_Name || '')
        .toLowerCase()
        .includes(searchText) ||
      String(post.Author_Name || '')
        .toLowerCase()
        .includes(searchText);

    return matchType && matchSearch;
  });

  useEffect(() => {
    loadSuspendedPosts();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">จัดการโพสต์ที่ถูกระงับ</h1>

        <div className="bg-card rounded-lg shadow-card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ชื่อสิ่งของ หรือ ผู้โพสต์..."
                className="pl-10 pr-4 h-9 w-64 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ประเภทของโพสต์</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">ทั้งหมด</option>
              <option value="1">แจ้งสิ่งของสูญหาย</option>
              <option value="2">แจ้งพบสิ่งของ</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                 {['ชื่อ', 'ประเภท', 'เหตุผล', 'ผู้โพสต์', 'วันที่ถูกระงับ', 'จัดการ'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post.Post_ID} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-3 px-4 font-medium text-foreground">{post.Posting_Name}</td>
                  <td className="py-3 px-4">{typeBadge(post.Post_Type_Name)}</td>
                   <td className="py-3 px-4 text-muted-foreground">{post.Reason || 'ไม่ระบุเหตุผล'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{post.Author_Name || '-'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{post.Post_Suspended_Date}{' '}{post.Post_Suspended_Time}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" className="text-foreground" onClick={() => setShowViewConfirm(String(post.Post_ID))}>
                      ตรวจสอบ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suspendedPosts.length === 0 && <div className="text-center py-8 text-muted-foreground">ไม่มีโพสต์ที่ถูกระงับ</div>}
        </div>
      </div>

      <AlertDialog open={!!showViewConfirm} onOpenChange={() => setShowViewConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ตรวจสอบโพสต์</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการดูรายละเอียดโพสต์นี้หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { navigate(`/post/${showViewConfirm}`); setShowViewConfirm(null); }}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSuspended;