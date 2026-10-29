import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { getPostings } from '@/connectAPI/callPosting';
import { getCategories } from "@/connectAPI/callCategory";
import { getPostTypes } from "@/connectAPI/callPost_Types";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [postTypes, setPostTypes] = useState([]);

  useEffect(() => {
    loadPosts();
    loadCategories();
    loadPostTypes();
  }, []);

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
    const diffTime =
      closeDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysLeft);
  };

  const loadPosts = async () => {
    try {
      const data = await getPostings();
      data.forEach((item) => {
      });
      const formatData = data.map((item) => ({
        id: item.Post_ID,
        title: item.Posting_Name || "",
        description: item.Post_Detail || "",
        category: item.Category_Name || "",
        location: item.Place_Name || "",
        Post_Type_ID: String(item.Post_Type_ID),
        type: item.Post_Type_ID === 1 ? "lost" : "found",
        lostDate: item.About_Thing_Date || "",
        createdAt: item.createdAt || "",
        postedTime: item.postedTime || "",
        daysLeft: getDaysLeft(item.Post_Start_Date, item.Post_Start_Time),
        status: item.Post_State === "Working" ? "searching" : "closed",
        images: item.Post_Image
          ? [`http://localhost:3001/uploads/${item.Post_Image}`]
          : [],
      }));

      setPosts(formatData);
    } catch (err) {
      console.log(err);
    }
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const loadPostTypes = async () => {
    try {
      const data = await getPostTypes();
      console.log("POST TYPES =", data);
      setPostTypes(data);
    } catch (err) {
      console.error("LOAD POST TYPES ERROR:", err);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        if (post.status !== 'searching') return false;
        if (post.daysLeft <= 0) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!post.title.toLowerCase().includes(q) &&
              !post.description.toLowerCase().includes(q) &&
              !post.location.toLowerCase().includes(q)) return false;
        }
        if (selectedCategory && post.category !== selectedCategory) return false;
        if (selectedType && post.Post_Type_ID !== selectedType) return false;
        return true;
      })
      .sort((a, b) => b.daysLeft - a.daysLeft);
  }, [posts, searchQuery, selectedCategory, selectedType]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Search Bar */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาสิ่งของ เช่น กระเป๋า, โทรศัพท์, กุญแจ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-12 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
          >
            <option value="">หมวดหมู่</option>
            {categories.map((cat: any) => (
              <option key={cat.Category_ID} value={cat.Category_Name} > {cat.Category_Name} </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-12 px-4 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
          >
            <option value="">ประเภทของโพสต์</option>
            {postTypes.map((type: any) => (
              <option
                key={type.Post_Type_ID}
                value={String(type.Post_Type_ID)}
                >
                  {type.Post_Type_Name}</option>
                ))}
          </select>
          <button
            onClick={() => {}}
            className="h-12 px-5 rounded-lg bg-blue-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            ค้นหา
          </button>
        </div>
      </section>

      {/* Posts */}
      <main className="flex-1 container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">ประกาศล่าสุด</h2>
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground mb-4">
            พบ {filteredPosts.length} รายการ
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">ไม่พบรายการที่ค้นหา</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;