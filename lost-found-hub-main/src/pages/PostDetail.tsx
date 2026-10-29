import { useState, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Tag, ImageIcon, Send, Flag, CheckCircle, ArrowLeft, Trash2, Clock, EyeOff, ChevronRight, Upload, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import ReportDialog from '@/components/ReportDialog';
import type { Comment } from "@/types/post";
import axios from '@/connectAPI/axios';
import { getCommentsByPost, createComment, deleteComment } from '@/connectAPI/callComments';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const commentImageRef = useRef<HTMLInputElement>(null);
  const [commentLocation, setCommentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showCommentMap, setShowCommentMap] = useState(false);
  const commentMapRef = useRef<HTMLDivElement>(null);
  const commentGoogleMapRef = useRef<google.maps.Map | null>(null);
  const commentMarkerRef = useRef<google.maps.Marker | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnImage, setReturnImage] = useState<string | null>(null);
  const returnImageRef = useRef<HTMLInputElement>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverContact, setReceiverContact] = useState('');
  const [post, setPost] = useState<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<string | null>(null);
  const gpsPointsList = post?.gpsPoints || [];
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("th-TH");
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/postings/${id}`);
        console.table(res.data);
        setPost(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const loadComments = async () => {
      if (!post?.Post_ID) return;

      try {
        const data = await getCommentsByPost(Number(post.Post_ID));

        const mappedComments: Comment[] = data.map((item: any) => ({
          id: `${item.Post_ID}_${item.Member_ID}_${item.Comment_Start_Date}_${item.Comment_Start_Time}`,
          commentKey: {
            Comment_Start_Date: item.Comment_Start_Date,
            Comment_Start_Time: item.Comment_Start_Time,
            Post_ID: Number(item.Post_ID),
            Member_ID: Number(item.Member_ID),
          },
          authorId: String(item.Member_ID),
          authorName: `${item.First_Name || ''} ${item.Last_Name || ''}`.trim() || `สมาชิก ${item.Member_ID}`,
          replyToMemberId: item.Reply_To_Member_ID ? String(item.Reply_To_Member_ID) : undefined,
          text: item.Comment_Message || '',
          imageUrl: item.Comment_Image
            ? (String(item.Comment_Image).startsWith('http')
                ? item.Comment_Image
                : `http://localhost:3001/uploads/comments/${item.Comment_Image}`)
            : undefined,
          createdAt: `${item.Comment_Start_Date || ''} ${item.Comment_Start_Time || ''}`.trim(),
          gpsCoords:
            item.Comment_Latitude != null && item.Comment_Longitude != null
              ? `${item.Comment_Latitude},${item.Comment_Longitude}`
              : undefined,
        } as Comment));

        setComments(mappedComments);
      } catch (error) {
        console.error('LOAD COMMENTS ERROR =', error);
        setComments([]);
      }
    };

    loadComments();
  }, [post?.Post_ID]);

  useEffect(() => {
    if (!showCommentMap) return;

    const loadCommentMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          toast({
            title: 'ไม่พบ Google Maps API Key',
            description: 'ตรวจสอบ VITE_GOOGLE_MAPS_API_KEY ในไฟล์ .env',
            variant: 'destructive',
          });
          return;
        }

        setOptions({ key: apiKey, v: 'weekly' });

        const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
        const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;

        if (!commentMapRef.current) return;

        let defaultPosition = { lat: 13.7563, lng: 100.5018 };

        if (commentLocation) {
          defaultPosition = {
            lat: commentLocation.latitude,
            lng: commentLocation.longitude,
          };
        } else if (gpsPointsList.length > 0) {
          defaultPosition = {
            lat: Number(gpsPointsList[0].latitude),
            lng: Number(gpsPointsList[0].longitude),
          };
        }

        const map = new Map(commentMapRef.current, {
          center: defaultPosition,
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        commentGoogleMapRef.current = map;

        const marker = new Marker({
          map,
          position: defaultPosition,
          draggable: true,
        });

        commentMarkerRef.current = marker;

        const selectPosition = (lat: number, lng: number) => {
          marker.setPosition({ lat, lng });
          setCommentLocation({ latitude: lat, longitude: lng });
        };

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          selectPosition(event.latLng.lat(), event.latLng.lng());
        });

        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (!position) return;
          selectPosition(position.lat(), position.lng());
        });
      } catch (error) {
        console.error('LOAD COMMENT MAP ERROR =', error);
        toast({
          title: 'ไม่สามารถเปิดแผนที่ได้',
          description: 'ตรวจสอบ Google Maps API Key และการเปิด Maps JavaScript API',
          variant: 'destructive',
        });
      }
    };

    loadCommentMap();
  }, [showCommentMap]);

  // เปลี่ยนเช็กตรงนี้ป้องกันการพังล่วงหน้า
  if (!post) return <div className="min-h-screen bg-background"><Header /><div className="text-center py-20 text-muted-foreground">กำลังโหลดข้อมูล...</div></div>;

  const getDaysLeft = (createdDate: string) => {
    const start = new Date(createdDate);
    const today = new Date();

    // ตัดเวลาออก เหลือแค่วัน
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays =
      Math.floor(
        (today.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
      );

    const daysLeft = 30 - diffDays;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const daysLeft = getDaysLeft(post.Post_Start_Date);
  const isOwner = Number(user?.id) === Number(post.Member_ID);
  const isUrgent = daysLeft <= 7;
  const canViewSensitiveInfo = isLoggedIn;
  const isFinished = post.Post_State === "Returned" || post.Post_State === "End";

  const requireLogin = () => {
    if (isLoggedIn) return true;
    navigate('/login');
    return false;
  };

  const handleComment = async () => {
    if (!requireLogin()) return;

    if (!user?.id || !post?.Post_ID) return;
    if (!commentText.trim() && !commentImageFile && !commentLocation) return;

    try {
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, '0');
      const commentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const commentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const formData = new FormData();
      formData.append('Comment_Start_Date', commentDate);
      formData.append('Comment_Start_Time', commentTime);
      formData.append('Post_ID', String(post.Post_ID));
      formData.append('Comment_Message', commentText.trim());
      formData.append('Member_ID', String(user.id));

      if (isOwner && selectedConversation) {
        formData.append(
          'Reply_To_Member_ID',
          String(selectedConversation)
        );
      }

      if (commentImageFile) {
        formData.append('Comment_Image', commentImageFile);
      }

      if (commentLocation) {
        formData.append('Comment_Latitude', String(commentLocation.latitude));
        formData.append('Comment_Longitude', String(commentLocation.longitude));
      }

      const saved = await createComment(formData);

      const newComment: Comment = {
        id: saved.id
          ? String(saved.id)
          : `${post.Post_ID}_${user.id}_${commentDate}_${commentTime}`,

        commentKey: {
          Comment_Start_Date: commentDate,
          Comment_Start_Time: commentTime,
          Post_ID: Number(post.Post_ID),
          Member_ID: Number(user.id),
        },

        authorId: String(user.id),
        authorName: user.name,

        replyToMemberId:
          isOwner && selectedConversation
            ? String(selectedConversation)
            : undefined,

        text: commentText.trim(),

        imageUrl: saved.imageUrl
          ? `http://localhost:3001/uploads/comments/${saved.imageUrl}`
          : commentImage || undefined,

        createdAt: `${commentDate} ${commentTime}`,

        gpsCoords: commentLocation
          ? `${commentLocation.latitude},${commentLocation.longitude}`
          : undefined,
      } as Comment;

      setComments(prev => [...prev, newComment]);

      setCommentText('');
      setCommentImage(null);
      setCommentImageFile(null);
      setCommentLocation(null);

      if (commentImageRef.current) {
        commentImageRef.current.value = '';
      }

      toast({ title: 'ส่งข้อความเรียบร้อย' });
    } catch (error: any) {
      console.error('CREATE COMMENT ERROR =', error);
      toast({
        title: 'ไม่สามารถส่งข้อความได้',
        description: error?.response?.data?.error || 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    }
  };

  const handleOwnerGpsReply = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!selectedConversation) return;

    setShowCommentMap(true);
  };


  const handleDeleteComment = (commentId: string) => {
    setShowDeleteConfirm(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!showDeleteConfirm) return;

    const comment = comments.find((c) => c.id === showDeleteConfirm) as any;

    try {
      if (comment?.commentKey) {
        await deleteComment(comment.commentKey);
      }

      setComments(prev => prev.filter(c => c.id !== showDeleteConfirm));
      toast({ title: 'ลบความคิดเห็นแล้ว' });
    } catch (error: any) {
      console.error('DELETE COMMENT ERROR =', error);
      toast({
        title: 'ไม่สามารถลบข้อความได้',
        description: error?.response?.data?.error || 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    return user.id === comment.authorId || isOwner || isAdmin;
  };

  const handleCommentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCommentImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReturn = () => {
    setShowReturnDialog(true);
  };

  const handleReturnImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReturnImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const confirmReturn = async () => {
    try {
      const res = await axios.patch(
        `/postings/${post.Post_ID}/receive`
      );

      setPost((prev: any) => ({
        ...prev,
        Recrive_Date: res.data.Recrive_Date,
        Receive_Time: res.data.Receive_Time,
        Post_State: "End",
      }));

      setShowReturnDialog(false);
      toast({
        title: "ยืนยันรับคืนสำเร็จ",
        description: `วันที่ ${res.data.Recrive_Date} เวลา ${res.data.Receive_Time}`,
      });
    } catch (error: any) {
      console.error("CONFIRM RECEIVE ERROR:", error);
      toast({
        title: "ยืนยันรับคืนไม่สำเร็จ",
        description:
          error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const openMapForCoords = (coords: string) => {
    setSelectedCoords(coords);
  };

  const MaskedInfo = ({ children }: { children: React.ReactNode }) => {
    if (canViewSensitiveInfo) {
      return <>{children}</>;
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">****</span>
        <button
          onClick={() => navigate('/login')}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="เข้าสู่ระบบเพื่อดูข้อมูล"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Group comments by author for owner view
  const commentsByAuthor = comments.reduce((acc, c) => {
    const conversationId =
      c.replyToMemberId &&
      String(c.replyToMemberId) !== String(c.authorId)
        ? String(c.replyToMemberId)
        : String(c.authorId);

    if (!acc[conversationId]) {
      acc[conversationId] = {
        name: c.authorName,
        comments: [],
      };
    }

    acc[conversationId].comments.push(c);

    return acc;
  }, {} as Record<string, { name: string; comments: Comment[] }>);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Image */}
          <div className="relative aspect-video bg-secondary flex items-center justify-center">
            {post.Post_Image ? (
              <img
                src={`http://localhost:3001/uploads/${post.Post_Image}`}
                alt={post.Posting_Name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            )}
            {post.Post_State === 'Returned' ? (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-sm font-semibold bg-success text-primary-foreground">
                ได้รับของคืน
              </div>
            ) : post.Post_State === 'End' ? (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-sm font-semibold bg-urgent text-primary-foreground">
                ปิดประกาศแล้ว
              </div>
            ) : (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                isUrgent ? 'bg-urgent text-primary-foreground' : 'bg-card/90 text-foreground backdrop-blur-sm'
              }`}>
                {daysLeft} วัน
              </div>
            )}
            <div
              className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium ${
                post.Post_Type_ID == 1 ? 'bg-urgent/90 text-primary-foreground' : 'bg-success/90 text-primary-foreground' }`}
            >
              {post.Post_Type_ID == 1 ? 'แจ้งสิ่งของสูญหาย' : 'แจ้งพบสิ่งของ'}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{post.Posting_Name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">หมวดหมู่</p>
                  <p className="text-sm font-medium text-foreground">{post.Category_Name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{post.Post_Type_ID == 1 ? 'วันที่หาย' : 'วันที่พบ'}</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(post.About_Thing_Date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">สถานที่</p>
                  <MaskedInfo>
                    <p className="text-sm font-medium text-foreground">{post.Place_Name}</p>
                    <p className="text-xs text-muted-foreground">ตำบล{post.Subdistrict_Name}, อำเภอ{post.District_Name}, จังหวัด{post.Province_Name}</p>
                  </MaskedInfo>
                  <MaskedInfo>
                    {gpsPointsList.length > 0 ? (
                      <div className="mt-3 space-y-1">
                        {gpsPointsList.map((coords: { latitude: number; longitude: number }, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!isLoggedIn) {
                                navigate('/login');
                                return;
                              }
                              openMapForCoords(`${coords.latitude},${coords.longitude}`);
                            }}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <span className="w-2 shrink-0 text-center">•</span>
                            <span>
                              ตำแหน่งที่ {idx + 1} :{' '}
                              {coords.latitude}, {coords.longitude}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : canViewSensitiveInfo ? (
                      <p className="text-xs text-muted-foreground">ไม่มีพิกัด GPS</p>
                    ) : null}
                  </MaskedInfo>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">วันที่โพสต์</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(post.Post_Start_Date)} เวลา{" "}{post.Post_Start_Time} น.</p>
                </div>
              </div>
            </div>
            {post.Post_State === 'Returned' && post.returnDate && (
              <div className="bg-success/10 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-success">✅ ได้รับคืนแล้ว</p>
                <p className="text-xs text-muted-foreground">ยืนยันเมื่อ {post.returnDate} เวลา {post.returnTime} น.</p>
                {post.receiverName && (
                  <p className="text-xs text-muted-foreground">ชื่อผู้รับ: {post.receiverName}</p>
                )}
                {post.receiverContact && (
                  <p className="text-xs text-muted-foreground">ช่องทางติดต่อ: {post.receiverContact}</p>
                )}
              </div>
            )}
            {/* Return image */}
            {post.Post_State === 'Returned' && post.returnImage && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">ภาพถ่ายตอนรับคืน</p>
                <img
                  src={post.returnImage}
                  alt="return"
                  className="max-h-48 rounded-lg border border-border"
                />
              </div>
            )}
            {/* รายละเอียด */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">รายละเอียด</p>
              <MaskedInfo>
                <p className="text-sm text-foreground leading-relaxed">{post.Post_Detail}</p>
              </MaskedInfo>
            </div>
            {/* Action buttons */}
            {!isFinished && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {!isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!requireLogin()) return;
                      setShowReport(true);
                    }}
                  >
                    <Flag className="w-4 h-4" /> รายงาน
                  </Button>
                )}
                {isOwner && post.Post_State === 'Working' && (
                  <Button size="sm" onClick={handleReturn} className="bg-success hover:bg-success/90 text-primary-foreground">
                    <CheckCircle className="w-4 h-4" /> ยืนยันรับคืน
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* Comments / Messages */}
          {!isFinished && (
            <div className="border-t border-border p-6">
              {isOwner ? (
                <>
                  <h2 className="font-semibold text-foreground mb-4">
                    ข้อความ ({Object.entries(commentsByAuthor).filter(([authorId]) => String(authorId) !== String(user?.id)).length} คน)
                  </h2>

                  {!selectedConversation ? (
                    /* เจ้าของโพสต์: ยังไม่ได้เลือกคน → แสดงเฉพาะรายชื่อ */
                    <div className="space-y-2">
                      {Object.entries(commentsByAuthor)
                        .filter(([authorId]) => String(authorId) !== String(user?.id))
                        .map(([authorId, data]) => {
                          const lastComment =
                            data.comments[data.comments.length - 1];

                          return (
                            <button
                              key={authorId}
                              onClick={() => setSelectedConversation(authorId)}
                              className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-foreground">
                                  {data.name}
                                </p>

                                <span className="text-xs text-muted-foreground">
                                  {data.comments.length} ข้อความ
                                </span>
                              </div>

                              {lastComment && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {lastComment.text || (lastComment.gpsCoords ? '📍 แชร์ตำแหน่ง' : lastComment.imageUrl ? '📷 ส่งรูปภาพ' : '')}
                                </p>
                              )}
                            </button>
                          );
                        })}

                      {Object.entries(commentsByAuthor)
                        .filter(([authorId]) => String(authorId) !== String(user?.id))
                        .length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          ยังไม่มีข้อความ
                        </p>
                      )}
                    </div>
                  ) : (
                    /* เจ้าของโพสต์: เลือกคนแล้ว → แสดงบทสนทนา + ช่องตอบกลับ */
                    <div>
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                      </button>

                      <h3 className="font-semibold text-foreground mb-4">
                        {commentsByAuthor[selectedConversation]?.name || 'บทสนทนา'}
                      </h3>

                      <div className="space-y-4 mb-6">
                        {comments
                          .filter((c) =>
                            String(c.authorId) === String(selectedConversation) ||
                            (
                              String(c.authorId) === String(user?.id) &&
                              String(c.replyToMemberId) === String(selectedConversation)
                            )
                          )
                          .map((c) => {
                            const isMine = String(c.authorId) === String(user?.id);

                            return (
                              <div
                                key={c.id}
                                className={`flex gap-3 ${isMine ? 'justify-end' : ''}`}
                              >
                                {!isMine && (
                                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {c.authorName?.[0] || '?'}
                                    </span>
                                  </div>
                                )}

                                <div className={`flex-1 max-w-[85%] ${isMine ? 'text-right' : ''}`}>
                                  <div className={`flex items-center gap-2 ${isMine ? 'justify-end' : ''}`}>
                                    <span className="text-sm font-medium text-foreground">
                                      {c.authorName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {c.createdAt}
                                    </span>
                                    {canDeleteComment(c) && (
                                      <button
                                        onClick={() => handleDeleteComment(c.id)}
                                        className={isMine ? 'text-muted-foreground hover:text-urgent transition-colors' : 'ml-auto text-muted-foreground hover:text-urgent transition-colors'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {c.text && (
                                    <p className="text-sm text-foreground mt-0.5">
                                      {c.text}
                                    </p>
                                  )}

                                  {c.imageUrl && (
                                    <img
                                      src={c.imageUrl}
                                      alt="comment"
                                      className={`mt-2 max-w-xs rounded-lg border border-border ${isMine ? 'ml-auto' : ''}`}
                                    />
                                  )}

                                  {c.gpsCoords && (
                                    <a
                                      href={`https://www.google.com/maps?q=${c.gpsCoords}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      ดูตำแหน่ง
                                    </a>
                                  )}
                                </div>

                                {isMine && (
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-xs font-medium text-primary">
                                      {c.authorName?.[0] || '?'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        {comments.filter((c) =>
                          String(c.authorId) === String(selectedConversation) ||
                          String(c.authorId) === String(user?.id)
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            ไม่พบข้อความ
                          </p>
                        )}
                      </div>

                      {/* ตำแหน่งที่เลือกสำหรับข้อความตอบกลับ */}
                      {commentLocation && (
                        <div className="mb-3 flex items-center justify-between rounded-lg bg-secondary p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>
                              ตำแหน่งที่เลือก: {commentLocation.latitude.toFixed(6)}, {commentLocation.longitude.toFixed(6)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCommentLocation(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* ช่องตอบกลับ: แสดงเฉพาะเมื่อเลือกบทสนทนาแล้ว */}
                      <div className="border-t border-border pt-4">
                        {commentImage && (
                          <div className="relative inline-block mb-3">
                            <img
                              src={commentImage}
                              alt="comment preview"
                              className="w-24 h-24 object-cover rounded-lg border border-border"
                            />

                            <button
                              type="button"
                              onClick={() => { setCommentImage(null); setCommentImageFile(null); if (commentImageRef.current) commentImageRef.current.value = ''; }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-urgent text-white flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => {
                              if (!isLoggedIn) {
                                navigate('/login');
                                return;
                              }
                              setCommentText(e.target.value);
                            }}
                            onClick={() => {
                              if (!requireLogin()) return;
                            }}
                            onFocus={() => {
                              if (!requireLogin()) return;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleComment();
                            }}
                            placeholder="พิมพ์ข้อความตอบกลับ..."
                            className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />

                          <input
                            type="file"
                            ref={commentImageRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleCommentImage}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="แนบรูปภาพ"
                            onClick={() => {
                              if (!isLoggedIn) {
                                navigate('/login');
                                return;
                              }
                              commentImageRef.current?.click();
                            }}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="แชร์ตำแหน่ง"
                            onClick={() => {
                              if (!isLoggedIn) {
                                navigate('/login');
                                return;
                              }
                              handleOwnerGpsReply();
                            }}
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            onClick={handleComment}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* คนที่ไม่ใช่เจ้าของโพสต์ */
                <>
                  <h2 className="font-semibold text-foreground mb-4">
                    ส่งข้อความ
                  </h2>

                  <div className="space-y-4 mb-6">
                    {comments
                      .filter((c) =>
                        isLoggedIn && (
                          String(c.authorId) === String(user?.id) ||
                          (
                            String(c.authorId) === String(post.Member_ID) &&
                            String(c.replyToMemberId) === String(user?.id)
                          )
                        )
                      )
                      .map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {c.authorName?.[0] || '?'}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {c.authorName}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                {c.createdAt}
                              </span>

                              {canDeleteComment(c) && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="ml-auto text-muted-foreground hover:text-urgent transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <p className="text-sm text-foreground mt-0.5">
                              {c.text}
                            </p>

                            {c.imageUrl && (
                              <img
                                src={c.imageUrl}
                                alt="comment"
                                className="mt-2 max-w-xs rounded-lg border border-border"
                              />
                            )}

                            {c.gpsCoords && (
                              <a
                                href={`https://www.google.com/maps?q=${c.gpsCoords}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                              >
                                <MapPin className="w-3 h-3" />
                                ดูตำแหน่ง
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                    {comments.filter((c) => String(c.authorId) === String(user?.id)).length === 0 &&
                      user && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          ยังไม่มีข้อความ
                        </p>
                      )}

                  </div>

                  {/* Preview รูป */}
                  {commentImage && (
                    <div className="relative inline-block mb-3">
                      <img
                        src={commentImage}
                        alt="comment preview"
                        className="w-24 h-24 object-cover rounded-lg border border-border"
                      />

                      <button
                        type="button"
                        onClick={() => { setCommentImage(null); setCommentImageFile(null); if (commentImageRef.current) commentImageRef.current.value = ''; }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-urgent text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {commentLocation && (
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-secondary p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>
                          ตำแหน่งที่เลือก: {commentLocation.latitude.toFixed(6)}, {commentLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCommentLocation(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!isLoggedIn && (
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      เข้าสู่ระบบเพื่อส่งข้อความ
                    </p>
                  )}

                  {/* ช่องส่งข้อความ */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      readOnly={!isLoggedIn}
                      onChange={(e) => {
                        if (!requireLogin()) return;
                        setCommentText(e.target.value);
                      }}
                      onClick={() => {
                        if (!requireLogin()) return;
                      }}
                      onFocus={() => {
                        if (!requireLogin()) return;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (!isLoggedIn) {
                            navigate('/login');
                            return;
                          }
                          handleComment();
                        }
                      }}
                      placeholder="ส่งข้อความ..."
                      className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    <input
                      type="file"
                      ref={commentImageRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleCommentImage}
                    />
                    <Button type="button" variant="ghost" size="icon" title="แนบรูปภาพ" onClick={() => {
                        if (!isLoggedIn) {
                          navigate('/login');
                          return;
                        }

                        commentImageRef.current?.click();
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>

                    <Button type="button" variant="ghost" size="icon" title="แชร์ตำแหน่ง" onClick={() => {
                        if (!isLoggedIn) {
                          navigate('/login');
                          return;
                        }
                        setShowCommentMap(true);
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>

                    <Button type="button" size="icon" onClick={() => {
                        if (!isLoggedIn) {
                          navigate('/login');
                          return;
                        }
                        handleComment();
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {showCommentMap && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowCommentMap(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background border border-border text-lg"
            >
              ✕
            </button>
            <div ref={commentMapRef} className="w-full h-full" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
                {commentLocation
                  ? `ตำแหน่ง: ${commentLocation.latitude.toFixed(6)}, ${commentLocation.longitude.toFixed(6)}`
                  : 'คลิกบนแผนที่หรือลากหมุดเพื่อเลือก 1 ตำแหน่ง'}
              </div>

              <Button type="button" disabled={!commentLocation} onClick={() => setShowCommentMap(false)}>
                ยืนยันตำแหน่ง
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedCoords && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden relative">
            {/* ปุ่มปิด */}
            <button
              onClick={() => setSelectedCoords(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background border border-border text-lg">
              ✕
            </button>
            {/* Google Maps */}
            <iframe title="Google Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" 
              src={`https://www.google.com/maps?q=${selectedCoords}&output=embed`}/>
          </div>
        </div>
      )}
      {showReport && isLoggedIn && <ReportDialog postId={String(post.Post_ID)} onClose={() => setShowReport(false)} />}

      {/* Delete comment confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบข้อความ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบข้อความนี้หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComment}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Return confirmation with image upload */}
      <AlertDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันรับคืน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณยืนยันว่ารับคืนสิ่งของเรียบร้อยแล้วใช่ไหม?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReturn}>
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default PostDetail;