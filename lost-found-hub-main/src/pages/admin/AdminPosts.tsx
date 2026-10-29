import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import axios from '@/connectAPI/axios';

type AdminPost = {
  id: string;
  title: string;
  type: string;
  typeName: string;
  status: 'searching' | 'returned' | 'not_returned' | 'suspended';
  createdAt: string | null;
  postedTime: string | null;
  postState: string | null;
  suspendedDate: string | null;
  suspendedTime: string | null;
  memberId: string | number | null;
};

type PostType = {
  id: string;
  name: string;
};

const AdminPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  // Restore filters from navigation state
  const savedState = location.state as any;
  const [filterStatus, setFilterStatus] = useState(savedState?.filterStatus || 'all');
  const [filterType, setFilterType] = useState(savedState?.filterType || 'all');
  const [filterDate, setFilterDate] = useState<any>(
    savedState?.filterDate && typeof savedState.filterDate === 'object'
      ? savedState.filterDate
      : { mode: 'single', d: '', m: '', y: '', fm: '', fy: '', tm: '', ty: '' }
  );
  const setFD = (k: string, v: string) => setFilterDate((f: any) => ({ ...f, [k]: v }));
  const years = Array.from( new Set(posts.map(post => {if (!post.createdAt) return null;
    const date = new Date(post.createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.getFullYear().toString();
  }).filter(Boolean))).sort();
  const monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const matchDate = (createdAt: string | null) => {
    if (!createdAt) return false;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return false;
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const f = filterDate;
    if (f.mode === 'single') {
      if (f.d && d !== Number(f.d)) return false;
      if (f.m && m !== Number(f.m)) return false;
      if (f.y && y !== Number(f.y)) return false;
      return true;
    }
    const v = y * 12 + m;
    if (
      f.fy &&
      v < Number(f.fy) * 12 + (f.fm ? Number(f.fm) : 1)
    ) {
      return false;
    }
    if (
      f.ty &&
      v > Number(f.ty) * 12 + (f.tm ? Number(f.tm) : 12)
    ) {
      return false;
    }
    if (!f.fy && f.fm && m < Number(f.fm)) return false;
    if (!f.ty && f.tm && m > Number(f.tm)) return false;
    return true;
  };
  const sel = 'h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const MonthOpts = () => <>{monthNames.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</>;
  const YearOpts = () => <>{years.map(y => <option key={y} value={y}>{y}</option>)}</>;
  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || '');
  const [showSuspendConfirm, setShowSuspendConfirm] = useState<string | null>(null);
  const [showViewConfirm, setShowViewConfirm] = useState<string | null>(null);

   const filteredPosts = posts
    .filter(post => {
      if (
        filterStatus !== 'all' &&
        post.status !== filterStatus
      ) {
        return false;
      }

      if (
        filterType !== 'all' &&
        post.type !== filterType
      ) {
        return false;
      }

      if (!matchDate(post.createdAt)) {
        return false;
      }

      if (
        searchQuery &&
        !post.title
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const order = {
        searching: 0,
        returned: 1,
        not_returned: 2,
        suspended: 3,
      };

      const aStatus = order[a.status];
      const bStatus = order[b.status];

      if (aStatus !== bStatus) {
        return aStatus - bStatus;
      }

      const aDate = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const bDate = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return bDate - aDate;
    });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'searching': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">กำลังค้นหา</span>;
      case 'returned': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">ได้คืนแล้ว</span>;
      case 'not_returned': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">ไม่ได้รับคืน</span>;
      case 'suspended': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-urgent/10 text-urgent">ถูกระงับ</span>;
      default: return null;
    }
  };

  const typeBadge = (type: string) => {
    const isLost = type === '1';
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

  const canSuspend = (status: string) => {return status === 'searching'};

  // Navigate to post detail, preserving filter state
  const navigateToPost = (postId: string) => {
    navigate(`/post/${postId}`, {
      state: { from: '/admin/posts', filterStatus, filterType, filterDate, searchQuery }
    });
  };

  const handleSuspendPost = async () => {
    if (!showSuspendConfirm) return;

    try {
      const postId = showSuspendConfirm;

      // ดึงข้อมูล Admin ที่ Login อยู่
      const admin = JSON.parse(
        localStorage.getItem('admin') || '{}'
      );

      if (!admin.Admin_ID) {
        toast({
          title: 'ไม่พบข้อมูล Admin',
          description: 'กรุณาเข้าสู่ระบบ Admin ใหม่',
          variant: 'destructive',
        });
        return;
      }

      await axios.put(`/admin/posts/${postId}/suspend`, {
        adminId: admin.Admin_ID,
      });

      toast({
        title: 'ระงับโพสต์เรียบร้อย',
      });

      setShowSuspendConfirm(null);

      // โหลดข้อมูลใหม่จาก Database
      const response = await axios.get('/admin/posts');

      if (response.data?.success) {
        setPosts(response.data.data ?? []);
      }

    } catch (error: any) {
      console.error(
        'SUSPEND POST ERROR:',
        error?.response?.data || error
      );

      toast({
        title: 'ระงับโพสต์ไม่สำเร็จ',
        description:
          error?.response?.data?.message ||
          'เกิดข้อผิดพลาดในการระงับโพสต์',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
  const loadPosts = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/admin/posts');

      console.log('===== ADMIN POSTS =====');
      console.log(response.data);

      if (response.data?.success) {
        setPosts(response.data.data ?? []);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.error(
        'LOAD ADMIN POSTS ERROR:',
        error?.response?.data || error
      );

      setPosts([]);

      toast({
        title: 'โหลดโพสต์ไม่สำเร็จ',
        description: 'ไม่สามารถโหลดข้อมูลโพสต์จากฐานข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  loadPosts();
}, [toast]);

  useEffect(() => {
    const loadPostTypes = async () => {
      try {
        const response = await axios.get('/admin/posts/types');

        console.log('===== POST TYPES =====');
        console.log(response.data);

        if (response.data?.success) {
          setPostTypes(response.data.data ?? []);
        }
      } catch (error: any) {
        console.error(
          'LOAD POST TYPES ERROR:',
          error?.response?.data || error
        );
      }
    };

    loadPostTypes();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">จัดการโพสต์</h1>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ชื่อสิ่งของ..." className="pl-10 pr-4 h-9 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ประเภทของโพสต์</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">ทั้งหมด</option>
              {postTypes.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">สถานะ</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">ทั้งหมด</option>
              <option value="searching">กำลังค้นหา</option>
              <option value="returned">ได้รับคืน</option>
              <option value="not_returned">ไม่ได้รับคืน</option>
              <option value="suspended">ถูกระงับ</option>
            </select>
          </div>
           <div className="flex flex-wrap items-end gap-3">
          {filterDate.mode === 'single' ? (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">วันที่</label>
                <select value={filterDate.d} onChange={(e) => setFD('d', e.target.value)} className={sel}>
                  <option value="">ทั้งหมด</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">เดือน</label>
                <select value={filterDate.m} onChange={(e) => setFD('m', e.target.value)} className={sel}>
                  <option value="">ทั้งหมด</option><MonthOpts />
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ปี</label>
                <select value={filterDate.y} onChange={(e) => setFD('y', e.target.value)} className={sel}>
                  <option value="">ทั้งหมด</option><YearOpts />
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">จากเดือน / ปี</label>
                <div className="flex gap-1">
                  <select value={filterDate.fm} onChange={(e) => setFD('fm', e.target.value)} className={sel}>
                    <option value="">เดือน</option><MonthOpts />
                  </select>
                  <select value={filterDate.fy} onChange={(e) => setFD('fy', e.target.value)} className={sel}>
                    <option value="">ปี</option><YearOpts />
                  </select>
                </div>
              </div>
              <span className="pb-2 text-sm text-muted-foreground">ถึง</span>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ถึงเดือน / ปี</label>
                <div className="flex gap-1">
                  <select value={filterDate.tm} onChange={(e) => setFD('tm', e.target.value)} className={sel}>
                    <option value="">เดือน</option><MonthOpts />
                  </select>
                  <select value={filterDate.ty} onChange={(e) => setFD('ty', e.target.value)} className={sel}>
                    <option value="">ปี</option><YearOpts />
                  </select>
                </div>
              </div>
            </>
          )}
           </div>
           <label className="flex items-center gap-2 h-9 text-sm text-foreground whitespace-nowrap ml-auto">
             <span className={filterDate.mode === 'single' ? 'text-primary font-medium' : 'text-muted-foreground'}>วัน / เดือน / ปี</span>
             <Switch aria-label="รูปแบบวันที่" checked={filterDate.mode === 'range'} onCheckedChange={checked => setFD('mode', checked ? 'range' : 'single')} />
             <span className={filterDate.mode === 'range' ? 'text-primary font-medium' : 'text-muted-foreground'}>ช่วงเวลา</span>
           </label>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ชื่อ</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ประเภท</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">สถานะ</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">วันที่โพสต์</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-3 px-4 font-medium text-foreground">{post.title}</td>
                  <td className="py-3 px-4">{typeBadge(post.type)}</td>
                   <td className="py-3 px-4">{statusBadge(post.status)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-foreground" onClick={() => setShowViewConfirm(post.id)}>
                        ตรวจสอบ
                      </Button>
                       {canSuspend(post.status) && (
                        <Button variant="ghost" size="sm" className="text-urgent hover:text-urgent" onClick={() => setShowSuspendConfirm(post.id)}>
                           ระงับ
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">ไม่พบรายการ</div>
          )}
        </div>
      </div>

      {/* Suspend confirmation */}
      <AlertDialog open={!!showSuspendConfirm} onOpenChange={() => setShowSuspendConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ระงับโพสต์</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการระงับโพสต์นี้หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
             <AlertDialogAction onClick={handleSuspendPost}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View confirmation */}
      <AlertDialog open={!!showViewConfirm} onOpenChange={() => setShowViewConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ตรวจสอบโพสต์</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการดูรายละเอียดโพสต์นี้หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (showViewConfirm) navigateToPost(showViewConfirm); setShowViewConfirm(null); }}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPosts;