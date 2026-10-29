import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, MapPin, X, ExternalLink, Plus, GripVertical } from 'lucide-react';
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { getCategories } from '@/connectAPI/callCategory';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from '@/connectAPI/axios';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CreatePost = () => {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '', category: '', description: '', location: '',
    province: '', district: '', subdistrict: '',
    lostDate: '', type: 'lost' as 'lost' | 'found',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [gpsPoints, setGpsPoints] = useState<string[]>(['']);
  const [showMap, setShowMap] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [selectedMapPosition, setSelectedMapPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        console.log("CATEGORIES =", data);
        setCategories(data);
      } catch (error) {
        console.error("LOAD CATEGORIES ERROR:", error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const res = await axios.get("/provinces");
      setProvinces(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!form.province) {
      setDistricts([]);
      return;
    }
    loadDistricts(form.province);
  }, [form.province]);

  const loadDistricts = async (provinceId: string) => {
    try {
      console.log("Province ID =", provinceId);
      const res = await axios.get(`/districts/province/${provinceId}`);
      console.log("Districts =", res.data);
      setDistricts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!form.district) {
      setSubdistricts([]);
      return;
    }
    loadSubdistricts(form.district);
  }, [form.district]);

  const loadSubdistricts = async (districtId: string) => {
    try {
      const res = await axios.get(`/subdistricts/district/${districtId}`);
      setSubdistricts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const isFormDirty = () => {
    return form.title || form.category || form.description || form.location ||
      form.province || form.district || form.subdistrict || form.lostDate ||
      gpsPoints.some(p => p.trim()) || image;
  };

  const handleBack = () => {
    if (isFormDirty()) {
      setShowLeaveConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const openGoogleMaps = () => {
      setShowMap(true);
    };

  const loadGoogleMap = async () => {
    if (!mapRef.current) return;
    setOptions({
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      v: 'weekly',
    });

    const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
    await importLibrary('places');
    const google = window.google;
    const defaultPosition = {
      lat: 13.7563,
      lng: 100.5018,
    };
    const map = new google.maps.Map(mapRef.current, {
      center: defaultPosition,
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    googleMapRef.current = map;
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setSelectedMapPosition({ lat, lng });

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
      });
      markerRef.current = marker;
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (!position) return;
        setSelectedMapPosition({
          lat: position.lat(),
          lng: position.lng(),
        });
      });
    });

    if (searchInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          fields: ['geometry', 'name', 'formatted_address'],
          componentRestrictions: {
            country: 'th',
          },
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) {
          toast({
            title: 'ไม่พบสถานที่',
            description: 'กรุณาลองค้นหาสถานที่อื่น',
            variant: 'destructive',
          });
          return;
        }
        const location = place.geometry.location;
        map.setCenter(location);
        map.setZoom(17);
        const lat = location.lat();
        const lng = location.lng();
        setSelectedMapPosition({
          lat,
          lng,
        });
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        const marker = new google.maps.Marker({
          position: location,
          map,
          draggable: true,
        });
        markerRef.current = marker;
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (!position) return;
          setSelectedMapPosition({
            lat: position.lat(),
            lng: position.lng(),
          });
        });
      });
    }
  };
  
  const confirmMapPosition = () => {
    if (!selectedMapPosition) {
      toast({
        title: 'กรุณาปักหมุดก่อน',
        description: 'คลิกบนแผนที่เพื่อเลือกตำแหน่ง',
        variant: 'destructive',
      });
      return;
    }

    const coords = `${selectedMapPosition.lat},${selectedMapPosition.lng}`;
    setGpsPoints(prev => {
      const emptyIndex = prev.findIndex(point => !point.trim());
      if (emptyIndex !== -1) {
        return prev.map((point, index) =>
          index === emptyIndex ? coords : point
        );
      }
      return [...prev, coords];
    });
    toast({
      title: 'เลือกตำแหน่งแล้ว',
      description: coords,
    });
    setShowMap(false);
  };
  useEffect(() => {
    if (showMap) {
      setTimeout(() => {
        loadGoogleMap();
      }, 100);
    }
  }, [showMap]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDate = form.lostDate
        ? new Date(`${form.lostDate}T00:00:00`)
        : null;

      if (selectedDate && selectedDate > today) {
        toast({
          title: 'วันที่ไม่ถูกต้อง',
          description: 'ไม่สามารถเลือกวันที่หายหรือวันที่พบในอนาคตได้',
          variant: 'destructive',
        });
        return;
      }

    if (!form.title || !form.category || !form.description || !form.location || !form.province || !form.district || !form.subdistrict || !form.lostDate) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
      return;
    }
    try { const formData = new FormData();
      const postStart = new Date();
      const postStartDate = postStart.toISOString().split("T")[0];
      const postStartTime = postStart.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const postClose = new Date(postStart);
      postClose.setDate(postClose.getDate() + 30);
      const postCloseDate = postClose.toISOString().split("T")[0];
      const postCloseTime = postStartTime;
      formData.append("Post_Start_Date", postStartDate);
      formData.append("Post_Start_Time", postStartTime);
      formData.append("Post_Close_Date", postCloseDate);
      formData.append("Post_Close_Time", postCloseTime);
      formData.append("Posting_Name", form.title);
      formData.append("Category_ID", form.category);
      formData.append("Category_Name", form.category);
      formData.append("About_Thing_Date", form.lostDate);
      formData.append("Post_State", "Working");
      formData.append("Place_Name", form.location);
      formData.append("Post_Detail", form.description);
      formData.append("Post_Type_ID", form.type === "lost" ? "1" : "2");
      formData.append("Subdistrict_ID", form.subdistrict);
      
      if (imageFile) {formData.append("Post_Image", imageFile);}
      const validGpsPoints = gpsPoints
        .filter((point) => point.trim() !== "")
        .map((point) => {
          const [latitude, longitude] = point
            .split(",")
            .map((value) => value.trim());
          return {
            latitude: Number(latitude),
            longitude: Number(longitude),
          };
        });
      formData.append(
        "gpsPoints",
        JSON.stringify(validGpsPoints)
      );
      console.log("GPS ทั้งหมดที่ส่ง:", validGpsPoints);
      const postResponse = await axios.post("/postings",formData,{headers: {"Content-Type": "multipart/form-data",},});
      console.log("สร้างโพสต์สำเร็จ:", postResponse.data);
      toast({
        title: "สร้างโพสต์สำเร็จ!",
      });
      navigate("/");
    } catch (err) {
      console.error("CREATE POST ERROR:", err);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };
  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const updateGpsPoint = (idx: number, val: string) => {
    setGpsPoints(prev => prev.map((p, i) => i === idx ? val : p));
  };

  const addGpsPoint = () => {
    setGpsPoints(prev => [...prev, '']);
  };

  const removeGpsPoint = (idx: number) => {
    if (gpsPoints.length <= 1) return;
    setGpsPoints(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const newPoints = [...gpsPoints];
    const [removed] = newPoints.splice(dragIndex, 1);
    newPoints.splice(idx, 0, removed);
    setGpsPoints(newPoints);
    setDragIndex(idx);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          กำลังตรวจสอบการเข้าสู่ระบบ...
        </p>
      </div>
    );
  }
  if (!isLoggedIn) {return <Navigate to="/login" replace />;}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        <div className="bg-card rounded-xl border border-border p-6">
          <h1 className="text-xl font-bold text-foreground mb-6">สร้างโพสต์ใหม่</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">ประเภท <span className="text-urgent">*</span></label>
              <div className="flex gap-3">
                {[{ v: 'lost', l: 'แจ้งสิ่งของสูญหาย' }, { v: 'found', l: 'แจ้งพบสิ่งของ' }].map(t => (
                  <label key={t.v} className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    form.type === t.v ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-secondary'
                  }`}>
                    <input type="radio" name="type" className="sr-only" onChange={() => update('type', t.v)} checked={form.type === t.v} />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">ชื่อสิ่งของ <span className="text-urgent">*</span></label>
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
                placeholder="เช่น กระเป๋าสตางค์สีน้ำตาล"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                หมวดหมู่ <span className="text-urgent">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">เลือกหมวดหมู่</option>
                 {categories.map((c: any) => (
                  <option key={c.Category_ID} value={c.Category_ID}>
                    {c.Category_Name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">รายละเอียด <span className="text-urgent">*</span></label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                placeholder="อธิบายลักษณะสิ่งของ..."
                className="w-full p-4 rounded-lg border border-input bg-background text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">สถานที่ <span className="text-urgent">*</span></label>
              <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)}
                placeholder="เช่น ห้างสยามพารากอน ชั้น 3"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-3" />
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">จังหวัด <span className="text-urgent">*</span></label>
                  <select value={form.province} onChange={(e) => { update('province', e.target.value); update('district', ''); update('subdistrict', ''); }}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map((p: any) => ( 
                      <option key={p.Province_ID} value={p.Province_ID} > {p.Province_Name} </option> ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">อำเภอ/เขต <span className="text-urgent">*</span></label>
                  <select value={form.district} onChange={(e) => { update('district', e.target.value); update('subdistrict', ''); }}
                    disabled={!form.province}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                    <option value="">เลือกอำเภอ/เขต</option>
                    {districts.map((d: any) => ( <option key={d.District_ID} value={d.District_ID} > {d.District_Name} </option> ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ตำบล/แขวง <span className="text-urgent">*</span></label>
                  <select value={form.subdistrict} onChange={(e) => update('subdistrict', e.target.value)}
                    disabled={!form.district}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                    <option value="">เลือกตำบล/แขวง</option>
                    {subdistricts.map((s: any) => ( <option key={s.Subdistrict_ID} value={s.Subdistrict_ID} > {s.Subdistrict_Name} </option> ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">ปักหมุด GPS</label>
              <p className="text-xs text-muted-foreground mb-3">กดเปิดแผนที่ → ค้นหาสถานที่หรือคลิกปักหมุด → ใช้ตำแหน่งนี้</p>
              <div className="space-y-2 mb-2">
                {gpsPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2"
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="text" value={point} onChange={(e) => updateGpsPoint(idx, e.target.value)}
                        placeholder="วางพิกัดที่นี่"
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    {gpsPoints.length > 1 && (
                      <button type="button" onClick={() => removeGpsPoint(idx)}
                        className="text-muted-foreground hover:text-urgent transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {showMap && (
                <div className="mt-4 border border-border rounded-xl overflow-hidden bg-background">
                  {/* Search */}
                  <div className="p-3 border-b border-border">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="ค้นหาสถานที่ เช่น สยามพารากอน"
                      value={mapSearch}
                      onChange={(e) => setMapSearch(e.target.value)}
                      className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {/* Map */}
                  <div
                    ref={mapRef}
                    className="w-full h-[400px]"
                  />
                  {/* Selected position */}
                  <div className="p-3 border-t border-border">
                    {selectedMapPosition ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        📍 พิกัดที่เลือก:{' '}
                        <span className="font-medium text-foreground">
                          {selectedMapPosition.lat.toFixed(6)},
                          {selectedMapPosition.lng.toFixed(6)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-3">
                        คลิกบนแผนที่เพื่อปักหมุด
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => { setShowMap(false); setSelectedMapPosition(null); }} >
                        <X className="w-4 h-4 mr-1" />
                        ปิดแผนที่
                      </Button>
                      <Button type="button" size="sm" onClick={confirmMapPosition} >
                        <MapPin className="w-4 h-4 mr-1" /> ใช้ตำแหน่งนี้ </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={addGpsPoint}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-4 h-4" /> เพิ่มจุดหมาย
                </button>
                <Button type="button" variant="outline" size="sm" className="ml-auto gap-1" onClick={openGoogleMaps}>
                  <ExternalLink className="w-3 h-3" /> เปิดแผนที่
                </Button>
              </div>
            </div>
            {/* Image Upload - single image only */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">รูปภาพ</label>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
              {image ? (
                <div className="relative w-full mb-3">
                  <img src={image} alt="" className="w-full max-h-48 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => setImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 bg-urgent text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดรูปภาพ (1 รูป)</p>
                </button>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {form.type === 'lost' ? 'วันที่หาย' : 'วันที่พบ'} <span className="text-urgent">*</span>
              </label>
              <input
                type="date"
                value={form.lostDate}
                max={new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000
                ).toISOString().split('T')[0]}
                onChange={(e) => update('lostDate', e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full h-11">สร้างโพสต์</Button>
          </form>
        </div>
      </main>
      {/* Leave confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ละทิ้งการสร้างโพสต์</AlertDialogTitle>
            <AlertDialogDescription>ข้อมูลที่กรอกจะหายไป คุณต้องการดำเนินการต่อหรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ดำเนินการต่อ</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(-1)}>ละทิ้ง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreatePost;