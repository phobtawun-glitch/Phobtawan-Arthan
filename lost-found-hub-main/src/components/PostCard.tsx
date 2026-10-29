import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ImageIcon } from 'lucide-react';
import type { Post } from '@/data/mockData';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();

  const getDaysLeft = (createdDate: string) => {
    const start = new Date(createdDate);
    const today = new Date();

    // ตัดเวลาออก เหลือแค่วัน
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysLeft = 30 - diffDays;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const daysLeft = getDaysLeft(post.createdAt);
  const isUrgent = daysLeft <= 7;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH');
  };

  // ผู้ใช้ทั่วไปสามารถเปิดดูรายละเอียดโพสต์ได้
  // การซ่อนสถานที่/GPS และการป้องกันการส่งข้อความให้จัดการใน PostDetail
  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      className="bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary flex items-center justify-center">
        {post.images.length > 0 ? (
          <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
        )}

        {/* Days left badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-sm font-semibold ${
          isUrgent
            ? 'bg-urgent text-primary-foreground'
            : 'bg-primary text-primary-foreground'
        }`}>
          {daysLeft}วัน
        </div>

        {/* Type badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium ${
          post.type === 'lost'
            ? 'bg-urgent/90 text-primary-foreground'
            : 'bg-primary/90 text-primary-foreground'
        }`}>
          {post.type === 'lost' ? 'แจ้งสิ่งของสูญหาย' : 'แจ้งพบสิ่งของ'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {post.title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">สถานที่: {post.location}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{post.type === 'lost' ? 'หายเมื่อ:' : 'พบเมื่อ:'} {formatDate(post.lostDate)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>โพสต์เมื่อ {formatDate(post.createdAt)} เวลา {post.postedTime} น.</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
