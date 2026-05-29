import { useState } from "react";
import { PageHeader, Empty, Tabs } from "../components/ui.jsx";

/* Phase 1 placeholder. Weekly/monthly/yearly aggregation lands in Phase 9. */
export default function Reports() {
  const [tab, setTab] = useState("week");

  const label = { week: "Weekly", month: "Monthly", year: "Yearly" }[tab];

  return (
    <div className="page">
      <PageHeader title="Reports" subtitle="Summaries over time" />

      <Tabs
        options={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Empty>{label} report coming in Phase 9.</Empty>
    </div>
  );
}
