import type { StockItem } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, ShoppingItem } from "@/lib/recipes/types";

type TodayDashboardProps = {
  cookCandidates: CookCandidate[];
  inventoryItems: StockItem[];
  mealSchedules: MealSchedule[];
  shoppingItems: ShoppingItem[];
};

function localDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntil(value: string) {
  const today = new Date(`${localDateValue()}T00:00:00`);
  const target = new Date(`${value}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function expiryLabel(item: StockItem) {
  const date = item.effective_expires_on ?? item.display_expires_on;
  if (!date) return "期限未設定";
  const diff = daysUntil(date);
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return "今日まで";
  return `あと${diff}日`;
}

function expiringItems(items: StockItem[]) {
  return items
    .filter((item) => {
      const date = item.effective_expires_on ?? item.display_expires_on;
      return date ? daysUntil(date) <= 7 : false;
    })
    .sort((a, b) => {
      const aDate = a.effective_expires_on ?? a.display_expires_on ?? "9999-12-31";
      const bDate = b.effective_expires_on ?? b.display_expires_on ?? "9999-12-31";
      return aDate.localeCompare(bDate);
    })
    .slice(0, 4);
}

export function TodayDashboard({ cookCandidates, inventoryItems, mealSchedules, shoppingItems }: TodayDashboardProps) {
  const today = localDateValue();
  const todaySchedules = mealSchedules.filter((item) => item.scheduled_on === today);
  const urgentItems = expiringItems(inventoryItems);
  const openShoppingItems = shoppingItems.filter((item) => item.status === "未購入").slice(0, 4);
  const activeCandidates = cookCandidates.filter((item) => item.status === "候補").slice(0, 3);

  return (
    <section className="today-dashboard" aria-labelledby="today-dashboard-heading">
      <div className="section-heading compact-section-heading">
        <p className="eyebrow">Today</p>
        <h2 id="today-dashboard-heading">今日の確認</h2>
      </div>

      <div className="today-grid">
        <DashboardCard count={todaySchedules.length} title="今日の献立">
          {todaySchedules.length === 0 ? (
            <p className="empty-list">今日の献立は未設定です。</p>
          ) : (
            todaySchedules.map((item) => (
              <div className="today-row" key={item.id}>
                <span>{item.meal_type}</span>
                <strong>{item.recipe_name || "レシピ名なし"}</strong>
                <small>{item.status}</small>
              </div>
            ))
          )}
        </DashboardCard>

        <DashboardCard count={urgentItems.length} title="期限が近い在庫">
          {urgentItems.length === 0 ? (
            <p className="empty-list">期限が近い在庫はありません。</p>
          ) : (
            urgentItems.map((item) => (
              <div className="today-row" key={item.id}>
                <span>{expiryLabel(item)}</span>
                <strong>{item.name}</strong>
                <small>{item.quantity}{item.unit} / {item.storage_location}</small>
              </div>
            ))
          )}
        </DashboardCard>

        <DashboardCard count={openShoppingItems.length} title="未購入の買い物">
          {openShoppingItems.length === 0 ? (
            <p className="empty-list">未購入の買い物はありません。</p>
          ) : (
            openShoppingItems.map((item) => (
              <div className="today-row" key={item.id}>
                <span>{item.source_type === "meal_schedule" ? "献立由来" : "手動"}</span>
                <strong>{item.name}</strong>
                <small>{item.required_quantity}{item.unit}</small>
              </div>
            ))
          )}
        </DashboardCard>

        <DashboardCard count={activeCandidates.length} title="作りたい候補">
          {activeCandidates.length === 0 ? (
            <p className="empty-list">作りたい候補はありません。</p>
          ) : (
            activeCandidates.map((item) => (
              <div className="today-row" key={item.id}>
                <span>{item.reasons[0] || "今日の候補"}</span>
                <strong>{item.recipe_name || "レシピ名なし"}</strong>
                <small>{item.reasons.slice(1, 3).join(" / ") || "理由追加できます"}</small>
              </div>
            ))
          )}
        </DashboardCard>
      </div>
    </section>
  );
}

function DashboardCard({ children, count, title }: { children: React.ReactNode; count: number; title: string }) {
  return (
    <section className="today-card">
      <div className="today-card-heading">
        <h3>{title}</h3>
        <strong>{count}件</strong>
      </div>
      <div className="today-card-body">{children}</div>
    </section>
  );
}
