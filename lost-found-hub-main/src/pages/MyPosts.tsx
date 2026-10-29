import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Tag, MapPin, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/connectAPI/axios';

const MyPosts = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'searching' | 'returned' | 'expired' | 'suspended'>('all');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setLoadingPosts(true);
        const res = await axios.get('/postings/my-posts');
        console.log('MY POSTS =', res.data);
        setMyPosts(res.data);
      } catch (err) {
        console.error('GET MY POSTS ERROR:', err);
      } finally {
        setLoadingPosts(false);
      }
    };
    if (isLoggedIn) {
      fetchMyPosts();
    }
  }, [isLoggedIn]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </p>
      </div>
    );
  }
  if (!isLoggedIn) { return <Navigate to="/login" replace />; }
  const hasValue = (value: unknown) =>
    value !== null &&
    value !== undefined &&
    String(value).trim() !== '' &&
    String(value).trim().toLowerCase() !== 'null';

  const getStatus = (post: any) => {
    if (post.Post_State === 'Working') {
      return 'searching';
    }

    if (post.Post_State !== 'End') {
      return '';
    }

    const received =
      hasValue(post.Receive_Date) ||
      hasValue(post.Receive_Time);

    const suspended =
      hasValue(post.Post_Suspended_Date) ||
      hasValue(post.Post_Suspended_Time);

    if (suspended) return 'suspended';
    if (received) return 'returned';

    return 'expired';
  };

  const filtered =
    filter === 'all'
      ? myPosts
      : myPosts.filter(post => getStatus(post) === filter);
  const statusBadge = (status: string) => {
    switch (status) {
      case 'searching': return { text: 'กำลังค้นหา', cls: 'border border-border text-foreground' };
      case 'returned': return { text: 'ได้รับของคืน', cls: 'bg-success/10 text-success' };
      case 'expired': return { text: 'ไม่ได้รับของคืน', cls: 'bg-urgent/10 text-urgent' };
      case 'suspended': return { text: 'ถูกระงับ', cls: 'bg-urgent/10 text-urgent' };
      default: return { text: status, cls: 'bg-muted text-muted-foreground' };
    }
  };
  const getDaysLeft = (
    postStartDate: string,
    postStartTime: string
  ) => {
    if (!postStartDate) return 0;
    const startDate = new Date(
      `${postStartDate.split('T')[0]}T${postStartTime || '00:00:00'}`
    );
    const closeDate = new Date(startDate);
    closeDate.setDate(closeDate.getDate() + 30);
    const now = new Date();
    const diffTime = closeDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysLeft);
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">สวัสดี, {user?.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการโพสต์และประกาศของคุณ</p>
        </div>

        {/* Single Create Post Button */}
        <div className="mb-8">
          <button onClick={() => navigate('/create-post')}
            className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors text-left w-full md:w-auto">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">สร้างโพสต์</p>
              <p className="text-sm text-muted-foreground">สร้างโพสต์แจ้งของหายหรือพบของพร้อมปักหมุด GPS</p>
            </div>
          </button>
        </div>

        {/* Posts List */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-foreground">รายการโพสต์ของฉัน</h2>
          <div className="flex flex-wrap gap-1 bg-secondary rounded-lg p-1">
            {([
              ['all', 'ทั้งหมด'],
              ['searching', 'กำลังค้นหา'],
              ['returned', 'ได้รับของคืน'],
              ['expired', 'ไม่ได้รับของคืน'],
              ['suspended', 'ถูกระงับ'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium
                  transition-colors ${
                    filter === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadingPosts ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">กำลังโหลดโพสต์...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">ไม่มีโพสต์</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(post => {
              const status = getStatus(post);
              const st = statusBadge(status);
              const daysLeft = getDaysLeft(
                post.Post_Start_Date,
                post.Post_Start_Time
              );
              return (
                <button key={post.Post_ID} onClick={() => navigate(`/post/${post.Post_ID}`)}
                  className="bg-card rounded-xl border border-border p-5 text-left hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                      String(post.Post_Type_ID) === '1' ? 'bg-urgent/90 text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      {String(post.Post_Type_ID) === '1' ? 'แจ้งสิ่งของสูญหาย' : 'แจ้งพบสิ่งของ'}
                    </span>
                    <div className="flex items-center gap-2">
                      {status === 'searching' && daysLeft > 0 && <span className="text-sm text-muted-foreground">เหลือ {daysLeft} วัน</span>}
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.text}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{post.Posting_Name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.Post_Detail}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{post.Category_Name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.Place_Name}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.About_Thing_Date)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyPosts;