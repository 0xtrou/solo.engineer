import { FeedDashboard } from "@/components/feed-dashboard";
import { getFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialFeed = await getFeed("all");
  return <FeedDashboard initialFeed={initialFeed} />;
}
