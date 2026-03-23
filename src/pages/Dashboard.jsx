import TranscriptFeed from "../components/transcription/TranscriptFeed";
import IntentCard from "../components/intent/IntentCard";
import SubscriberCard from "../components/subscriber/SubscriberCard";
import PaymentHistoryCard from "../components/subscriber/PaymentHistoryCard";
import "./Dashboard.css";
import PackUpgradeCard from "../components/subscriber/PackageUpgradeCard";
import WatchoPlansCard from "../components/subscriber/WatchoPlansCard";
import WorkflowStatusPanel from "../components/subscriber/WorkflowStatusPanel";

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Left column: subscriber strip + AI Assist (pack upgrade) */}
      <div className="dashboard-left">
        <WorkflowStatusPanel />
        <SubscriberCard />
        <PackUpgradeCard />
        <WatchoPlansCard />
        <PaymentHistoryCard />
      </div>

      {/* Right column: live transcript + AI Insights */}
      <div className="dashboard-right">
        <TranscriptFeed />
        <IntentCard />
      </div>
    </div>
  );
}
