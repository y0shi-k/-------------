import type { ShoppingItem } from "@/lib/recipes/types";

export function shoppingSourceLabel(item: ShoppingItem) {
  if (item.source_type === "meal_schedule") return item.linked_recipe_name ? `献立: ${item.linked_recipe_name}` : "献立由来";
  if (item.source_type === "recipe_detail") return item.linked_recipe_name ? `レシピ詳細: ${item.linked_recipe_name}` : "レシピ詳細";
  return "手動追加";
}

export function ShoppingListSection({
  emptyText,
  items,
  onMarkPurchased,
  onSelect,
  selectedIds,
  title
}: {
  emptyText: string;
  items: ShoppingItem[];
  onMarkPurchased?: (item: ShoppingItem) => void;
  onSelect: (id: string) => void;
  selectedIds: string[];
  title: string;
}) {
  return (
    <section className="shopping-list-section" aria-label={title}>
      <div className="shopping-list-title">
        <span>{title}</span>
        <strong>{items.length}件</strong>
      </div>
      {items.length === 0 ? (
        <p className="empty-list">{emptyText}</p>
      ) : (
        <div className="stock-list">
          {items.map((item) => (
            <article className="stock-item compact-stock-item shopping-item" key={item.id}>
              <label className="select-row">
                <input checked={selectedIds.includes(item.id)} onChange={() => onSelect(item.id)} type="checkbox" />
                選択
              </label>
              <div className="item-main">
                <span>{shoppingSourceLabel(item)}</span>
                <h4>{item.name}</h4>
                <p>{item.required_quantity}{item.unit} / {item.status}</p>
              </div>
              {onMarkPurchased ? (
                <button className="secondary-button compact-button" type="button" onClick={() => onMarkPurchased(item)}>
                  購入済み
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
