import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
  Blacklist,
  CatalogCategory,
  CatalogItem,
  Comment,
  CommentLike,
  ContentPage,
  FriendLink,
  Like,
  Media,
  MusicPlaylist,
  MusicTrack,
  Post,
  SiteSetting,
  UploadIntent,
  User,
  sequelize,
} from "../models";

dotenv.config();

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo123456";
const now = () => new Date();

async function findOrCreateBy<T extends { id: string }>(
  model: any,
  where: Record<string, unknown>,
  defaults: Record<string, unknown>,
  transaction: any
): Promise<T> {
  const existing = await model.findOne({ where, transaction });
  if (existing) return existing as T;
  return (await model.create(defaults, { transaction })) as T;
}

async function seedDemo() {
  await sequelize.authenticate();

  await sequelize.transaction(async (transaction) => {
    const admin = await User.findOne({ where: { role: "admin" }, transaction });
    if (!admin) throw new Error("找不到管理员，请先运行 pnpm db:init");

    const [demoUser] = await User.findOrCreate({
      where: { email: DEMO_EMAIL },
      defaults: {
        email: DEMO_EMAIL,
        username: "demo_user",
        nickname: "演示访客",
        avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Demo",
        cover: "https://picsum.photos/seed/demo-cover/1200/600",
        bio: "用于本地开发预览的演示用户",
        website: "https://example.com",
        password: await bcrypt.hash(DEMO_PASSWORD, 10),
        role: "visitor",
      },
      transaction,
    });

    const post1 = await findOrCreateBy<Post>(
      Post,
      { shortId: "demo001" },
      {
        shortId: "demo001",
        userId: admin.id,
        type: "moment",
        title: "",
        excerpt: "这是第一条本地演示动态，用来查看图片、地点和评论的展示效果。",
        content: "欢迎来到本地开发环境。你可以在后台继续编辑、置顶或删除这条演示动态。",
        images: [
          "https://picsum.photos/seed/demo-moment-1/800/600",
          "https://picsum.photos/seed/demo-moment-2/800/600",
        ],
        location: { name: "西湖边", city: "杭州", address: "浙江省杭州市西湖区" },
        music: null,
        linkCard: null,
        video: null,
        douban: null,
        pinned: true,
        isAd: false,
        adAvatar: "",
        adNickname: "",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "original",
        repostUrl: "",
        viewCount: 12,
        status: "published",
      },
      transaction
    );

    const post2 = await findOrCreateBy<Post>(
      Post,
      { shortId: "demo002" },
      {
        shortId: "demo002",
        userId: admin.id,
        type: "article",
        title: "本地开发预览文章",
        excerpt: "文章卡片、封面和正文布局的演示数据。",
        cover: "https://picsum.photos/seed/demo-article/1200/700",
        category: "开发记录",
        tags: ["开发记录", "AI前沿"],
        content: "## 这是演示文章\n\n这里用于查看文章列表、详情页、目录和评论区域。",
        images: [],
        location: null,
        music: null,
        linkCard: { url: "https://nextjs.org", title: "Next.js", description: "React 应用开发框架", image: "https://picsum.photos/seed/demo-link/400/240", siteName: "nextjs.org" },
        video: null,
        douban: { title: "演示书目", cover: "https://picsum.photos/seed/demo-book/300/420", link: "https://book.douban.com", rating: 8.8, intro: "用于演示豆瓣卡片", status: "想读", statusLabel: "想读" },
        pinned: false,
        isAd: false,
        adAvatar: "",
        adNickname: "",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "original",
        repostUrl: "",
        viewCount: 34,
        status: "published",
      },
      transaction
    );
    if (!Array.isArray(post2.tags) || post2.tags.length === 0) {
      await post2.update({ tags: ["开发记录", "AI前沿"] }, { transaction });
    }

    const post3 = await findOrCreateBy<Post>(
      Post,
      { shortId: "demo003" },
      {
        shortId: "demo003",
        userId: admin.id,
        type: "moment",
        title: "",
        excerpt: "带有视频链接的演示动态。",
        content: "视频、链接卡片等媒体类型可以在后台继续替换为自己的素材。",
        images: [],
        location: null,
        music: { name: "Demo Track", artist: "Local Preview", cover: "https://picsum.photos/seed/demo-music/500/500", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73452.mp3", source: "upload", lrc: "[00:00.00] Demo Track", autoplay: false },
        linkCard: null,
        video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "演示视频", platform: "url", source: "url", playback: "source-page" },
        douban: null,
        pinned: false,
        isAd: false,
        adAvatar: "",
        adNickname: "",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "ai",
        repostUrl: "",
        viewCount: 8,
        status: "published",
      },
      transaction
    );

    await findOrCreateBy<Post>(
      Post,
      { shortId: "demo004" },
      {
        shortId: "demo004",
        userId: admin.id,
        type: "article",
        title: "本地羊毛信息整理",
        excerpt: "整理近期值得关注的优惠和实用信息。",
        cover: "https://picsum.photos/seed/demo-wool/1200/700",
        category: "生活记录",
        content: "## 本地羊毛信息整理\n\n这是一篇用于验证标签筛选的演示文章。",
        images: [],
        location: null,
        music: null,
        linkCard: null,
        video: null,
        douban: null,
        pinned: false,
        isAd: false,
        adAvatar: "",
        adNickname: "",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "original",
        repostUrl: "",
        viewCount: 6,
        status: "published",
        tags: ["羊毛", "效率"],
      },
      transaction
    );

    await findOrCreateBy<Post>(
      Post,
      { shortId: "demo005" },
      {
        shortId: "demo005",
        userId: admin.id,
        type: "article",
        title: "AI 前沿工具试用记录",
        excerpt: "记录最近体验过的 AI 工具和使用心得。",
        cover: "https://picsum.photos/seed/demo-ai-frontier/1200/700",
        category: "开发记录",
        content: "## AI 前沿工具试用记录\n\n这是一篇用于验证多个标签筛选结果的演示文章。",
        images: [],
        location: null,
        music: null,
        linkCard: null,
        video: null,
        douban: null,
        pinned: false,
        isAd: false,
        adAvatar: "",
        adNickname: "",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "ai",
        repostUrl: "",
        viewCount: 9,
        status: "published",
        tags: ["AI前沿", "开发记录"],
      },
      transaction
    );

    await findOrCreateBy<Post>(
      Post,
      { shortId: "demo-ad1" },
      {
        shortId: "demo-ad1",
        userId: admin.id,
        type: "moment",
        title: "",
        excerpt: "演示广告位",
        content: "这是一条仅用于查看广告组件的本地演示数据。",
        images: [],
        location: null,
        music: null,
        linkCard: { url: "https://example.com", title: "本地演示服务", description: "广告卡片预览", image: "https://picsum.photos/seed/demo-ad/600/300", siteName: "example.com" },
        video: null,
        douban: null,
        pinned: false,
        isAd: true,
        adAvatar: "https://api.dicebear.com/9.x/initials/svg?seed=Ad",
        adNickname: "演示广告",
        likesDisabled: false,
        commentsDisabled: false,
        ip: "127.0.0.1",
        region: "本地",
        articleType: "original",
        repostUrl: "",
        viewCount: 0,
        status: "published",
      },
      transaction
    );

    const comment1 = await findOrCreateBy<Comment>(
      Comment,
      { postId: post1.id, authorName: "演示访客", content: "这条动态的卡片效果很清楚。" },
      { postId: post1.id, pageId: null, authorName: "演示访客", email: DEMO_EMAIL, website: "https://example.com", content: "这条动态的卡片效果很清楚。", ip: "127.0.0.2", region: "本地" },
      transaction
    );
    const comment2 = await findOrCreateBy<Comment>(
      Comment,
      { postId: post1.id, authorName: "小林", content: "文章页也可以继续扩展。" },
      { postId: post1.id, pageId: null, authorName: "小林", email: "xiaolin@example.com", content: "文章页也可以继续扩展。", ip: "127.0.0.3", region: "上海" },
      transaction
    );
    await findOrCreateBy<Comment>(
      Comment,
      { postId: post1.id, authorName: "演示访客", content: "我也准备开始改造这个项目。" },
      { postId: post1.id, pageId: null, authorName: "演示访客", email: DEMO_EMAIL, replyTo: "小林", replyToEmail: "xiaolin@example.com", replyToId: comment2.id, content: "我也准备开始改造这个项目。", ip: "127.0.0.2", region: "本地" },
      transaction
    );

    await findOrCreateBy<Like>(Like, { postId: post1.id, userId: demoUser.id }, { postId: post1.id, name: demoUser.nickname, userId: demoUser.id, status: "like" }, transaction);
    await findOrCreateBy<Like>(Like, { postId: post2.id, userId: demoUser.id }, { postId: post2.id, name: demoUser.nickname, userId: demoUser.id, status: "like" }, transaction);
    await findOrCreateBy<Like>(Like, { postId: post3.id, email: "reader@example.com" }, { postId: post3.id, name: "读者", email: "reader@example.com", status: "like" }, transaction);
    await findOrCreateBy<CommentLike>(CommentLike, { commentId: comment1.id, userId: demoUser.id }, { commentId: comment1.id, name: demoUser.nickname, userId: demoUser.id, status: "like" }, transaction);
    await findOrCreateBy<CommentLike>(CommentLike, { commentId: comment2.id, email: "reader@example.com" }, { commentId: comment2.id, name: "读者", email: "reader@example.com", status: "like" }, transaction);

    await findOrCreateBy<FriendLink>(FriendLink, { name: "Next.js", url: "https://nextjs.org" }, { name: "Next.js", url: "https://nextjs.org", desc: "React 应用框架", email: "", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Next", sort: 1 }, transaction);
    await findOrCreateBy<FriendLink>(FriendLink, { name: "TypeScript", url: "https://www.typescriptlang.org" }, { name: "TypeScript", url: "https://www.typescriptlang.org", desc: "类型安全的 JavaScript", email: "", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=TS", sort: 2 }, transaction);
    await findOrCreateBy<Blacklist>(Blacklist, { type: "email", value: "blocked-demo@example.com" }, { type: "email", value: "blocked-demo@example.com", reason: "本地演示黑名单" }, transaction);
    await findOrCreateBy<Blacklist>(Blacklist, { type: "ip", value: "192.0.2.10" }, { type: "ip", value: "192.0.2.10", reason: "本地演示 IP" }, transaction);

    const stamp = now();
    const imageMedia = await findOrCreateBy<Media>(Media, { filename: "demo-cover.jpg" }, { filename: "demo-cover.jpg", url: "https://picsum.photos/seed/demo-media/1200/800", storageType: "r2", mimeType: "image/jpeg", kind: "image", size: 245760, uploaderId: admin.id, livePhotoVideo: null, livePhotoImage: null, createdAt: stamp, updatedAt: stamp }, transaction);
    const audioMedia = await findOrCreateBy<Media>(Media, { filename: "demo-track.mp3" }, { filename: "demo-track.mp3", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73452.mp3", storageType: "r2", mimeType: "audio/mpeg", kind: "audio", size: 5242880, uploaderId: admin.id, livePhotoVideo: null, livePhotoImage: null, createdAt: stamp, updatedAt: stamp }, transaction);
    const lyricMedia = await findOrCreateBy<Media>(Media, { filename: "demo-track.lrc" }, { filename: "demo-track.lrc", url: "https://example.com/demo-track.lrc", storageType: "r2", mimeType: "text/plain", kind: "lyric", size: 256, uploaderId: admin.id, livePhotoVideo: null, livePhotoImage: null, createdAt: stamp, updatedAt: stamp }, transaction);
    const [playlist] = await MusicPlaylist.findOrCreate({ where: { slug: "demo-playlist" }, defaults: { slug: "demo-playlist", name: "演示歌单", createdAt: stamp, updatedAt: stamp }, transaction });
    await findOrCreateBy<MusicTrack>(MusicTrack, { playlistId: playlist.id, sortOrder: 1 }, { playlistId: playlist.id, audioMediaId: audioMedia.id, coverMediaId: imageMedia.id, lyricMediaId: lyricMedia.id, title: "Demo Track", artist: "Local Preview", lrc: "[00:00.00] Demo Track", sortOrder: 1, createdAt: stamp, updatedAt: stamp }, transaction);
    const [defaultPlaylist] = await MusicPlaylist.findOrCreate({
      where: { slug: "site-default" },
      defaults: { slug: "site-default", name: "演示歌单", createdAt: stamp, updatedAt: stamp },
      transaction,
    });
    if (defaultPlaylist.name === "网站歌单") {
      await defaultPlaylist.update({ name: "演示歌单" }, { transaction });
    }
    const defaultTrack = await MusicTrack.findOne({ where: { playlistId: defaultPlaylist.id, audioMediaId: audioMedia.id }, transaction });
    if (!defaultTrack) {
      const maxOrder = await MusicTrack.max("sortOrder", { where: { playlistId: defaultPlaylist.id }, transaction });
      const sortOrder = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) + 1 : 0;
      await MusicTrack.create({
        playlistId: defaultPlaylist.id,
        audioMediaId: audioMedia.id,
        coverMediaId: imageMedia.id,
        lyricMediaId: lyricMedia.id,
        title: "Demo Track",
        artist: "Local Preview",
        lrc: "[00:00.00] Demo Track",
        sortOrder,
        createdAt: stamp,
        updatedAt: stamp,
      }, { transaction });
    }
    await findOrCreateBy<UploadIntent>(UploadIntent, { stagingKey: "demo/staging/demo-cover.jpg" }, { uploaderId: admin.id, kind: "image", filename: "demo-cover.jpg", mimeType: "image/jpeg", maxSize: 10485760, stagingKey: "demo/staging/demo-cover.jpg", finalKey: "demo/media/demo-cover.jpg", status: "confirmed", expiresAt: new Date(Date.now() + 86400000), confirmedAt: stamp, createdAt: stamp, updatedAt: stamp }, transaction);

    await findOrCreateBy<ContentPage>(ContentPage, { slug: "demo-guide" }, { slug: "demo-guide", authorId: admin.id, content: "这是本地演示内容页，可用于查看富文本页面和评论区域。", createdAt: stamp, updatedAt: stamp }, transaction);
    const equipment = await findOrCreateBy<CatalogCategory>(CatalogCategory, { collection: "equipment", name: "演示设备" }, { collection: "equipment", name: "演示设备", intro: "用于查看装备目录布局。", sortOrder: 1, createdAt: stamp, updatedAt: stamp }, transaction);
    const labs = await findOrCreateBy<CatalogCategory>(CatalogCategory, { collection: "labs", name: "演示实验" }, { collection: "labs", name: "演示实验", intro: "用于查看 Labs 目录布局。", sortOrder: 1, createdAt: stamp, updatedAt: stamp }, transaction);
    await findOrCreateBy<CatalogItem>(CatalogItem, { categoryId: equipment.id, title: "开发主机" }, { categoryId: equipment.id, title: "开发主机", configuration: "16GB / 1TB SSD", description: "本地开发演示条目。", imageMediaId: imageMedia.id, imageUrl: imageMedia.url, linkUrl: "https://example.com", sortOrder: 1, createdAt: stamp, updatedAt: stamp }, transaction);
    await findOrCreateBy<CatalogItem>(CatalogItem, { categoryId: labs.id, title: "首页改造实验" }, { categoryId: labs.id, title: "首页改造实验", configuration: "Next.js + Express", description: "用于记录改造方向的实验条目。", imageMediaId: imageMedia.id, imageUrl: imageMedia.url, linkUrl: "", sortOrder: 1, createdAt: stamp, updatedAt: stamp }, transaction);

    const settings = await SiteSetting.findByPk(1, { transaction });
    if (settings && settings.backgroundImages === "[]") {
      await settings.update({
        backgroundImages: JSON.stringify([
          "https://picsum.photos/seed/demo-bg-1/1200/600",
          "https://picsum.photos/seed/demo-bg-2/1200/600",
        ]),
        socialLinks: JSON.stringify([{ name: "GitHub", url: "https://github.com" }]),
      }, { transaction });
    }
    if (settings && !settings.doubanId && !settings.doubanCache) {
      const syncedAt = stamp.toISOString();
      const demoDoubanItem = (item: {
        title: string;
        cover: string;
        link: string;
        rating: number;
        intro: string;
        status: "collect" | "do" | "wish";
        statusLabel: string;
      }) => ({ ...item, date: "2026-10-31", comment: "本地演示条目" });
      await settings.update({
        doubanId: "demo-local",
        doubanCache: JSON.stringify({
          movies: [demoDoubanItem({ title: "演示电影：星际穿越", cover: "https://picsum.photos/seed/demo-movie/300/420", link: "https://movie.douban.com", rating: 9.0, intro: "用于查看电影收藏卡片布局。", status: "collect", statusLabel: "看过" })],
          books: [demoDoubanItem({ title: "演示图书：百年孤独", cover: "https://picsum.photos/seed/demo-book-list/300/420", link: "https://book.douban.com", rating: 8.8, intro: "用于查看图书收藏卡片布局。", status: "wish", statusLabel: "想读" })],
          music: [demoDoubanItem({ title: "演示专辑：Local Preview", cover: "https://picsum.photos/seed/demo-album/300/300", link: "https://music.douban.com", rating: 8.5, intro: "用于查看音乐收藏卡片布局。", status: "do", statusLabel: "在听" })],
          syncedAt,
          doubanId: "demo-local",
          syncStatus: "success",
          dataState: "ready",
          categorySync: {
            movie: { complete: true, syncStatus: "success", syncedAt },
            book: { complete: true, syncStatus: "success", syncedAt },
            music: { complete: true, syncStatus: "success", syncedAt },
          },
        }),
        doubanSyncStatus: "success",
        doubanSyncedAt: stamp,
        doubanLastError: null,
      }, { transaction });
    }
  });

  console.log("Demo data seeded successfully.");
  console.log(`Demo visitor: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seedDemo()
  .catch((error) => {
    console.error("Demo data seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
