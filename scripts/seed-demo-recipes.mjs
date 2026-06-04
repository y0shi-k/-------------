#!/usr/bin/env node

const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const authToken = getRequiredEnv("SUPABASE_AUTH_TOKEN");

const recipeSeeds = [
  {
    name: "鶏もも炒め",
    source: "demo-seed",
    genre: ["中華", "和"],
    prep_steps: ["鶏もも肉を一口大に切る", "野菜を食べやすい大きさに切る"],
    steps: ["鶏もも肉を焼き色がつくまで炒める", "野菜を加えて火を通す", "醤油とみりんで照りよく仕上げる"],
    cook_count: 2,
    cooked_on_history: ["2026-06-01"],
    ingredients: [
      { item_type: "食材", name: "鶏もも肉", amount: 250, unit: "g" },
      { item_type: "食材", name: "キャベツ", amount: 120, unit: "g" },
      { item_type: "食材", name: "にんじん", amount: 0.5, unit: "本" },
      { item_type: "調味料", name: "醤油", amount: 1, unit: "大さじ" },
      { item_type: "調味料", name: "みりん", amount: 1, unit: "大さじ" }
    ]
  },
  {
    name: "肉じゃが",
    source: "demo-seed",
    genre: ["和食"],
    prep_steps: ["じゃがいもとにんじんを大きめに切る", "玉ねぎをくし切りにする"],
    steps: ["牛肉と野菜を軽く炒める", "だしと調味料を加えて煮る", "じゃがいもが柔らかくなるまで煮含める"],
    cook_count: 3,
    cooked_on_history: ["2026-05-28", "2026-06-02"],
    ingredients: [
      { item_type: "食材", name: "牛こま肉", amount: 180, unit: "g" },
      { item_type: "食材", name: "じゃがいも", amount: 3, unit: "個" },
      { item_type: "食材", name: "にんじん", amount: 1, unit: "本" },
      { item_type: "食材", name: "玉ねぎ", amount: 1, unit: "個" },
      { item_type: "調味料", name: "醤油", amount: 2, unit: "大さじ" }
    ]
  },
  {
    name: "ハンバーグ",
    source: "demo-seed",
    genre: ["洋食"],
    prep_steps: ["玉ねぎをみじん切りにする", "ひき肉と材料を混ぜて成形する"],
    steps: ["両面に焼き色をつける", "ふたをして中まで火を通す", "ソースをからめて仕上げる"],
    cook_count: 1,
    cooked_on_history: ["2026-05-30"],
    ingredients: [
      { item_type: "食材", name: "合いびき肉", amount: 250, unit: "g" },
      { item_type: "食材", name: "玉ねぎ", amount: 0.5, unit: "個" },
      { item_type: "食材", name: "卵", amount: 1, unit: "個" },
      { item_type: "調味料", name: "パン粉", amount: 30, unit: "g" },
      { item_type: "調味料", name: "デミグラスソース", amount: 80, unit: "g" }
    ]
  },
  {
    name: "麻婆豆腐",
    source: "demo-seed",
    genre: ["中華"],
    prep_steps: ["豆腐を角切りにする", "長ねぎを刻む"],
    steps: ["ひき肉を炒める", "調味料と豆腐を加えて煮る", "水溶き片栗粉でとろみをつける"],
    cook_count: 2,
    cooked_on_history: ["2026-06-03"],
    ingredients: [
      { item_type: "食材", name: "豆腐", amount: 1, unit: "丁" },
      { item_type: "食材", name: "豚ひき肉", amount: 150, unit: "g" },
      { item_type: "食材", name: "長ねぎ", amount: 0.5, unit: "本" },
      { item_type: "調味料", name: "豆板醤", amount: 1, unit: "小さじ" },
      { item_type: "調味料", name: "片栗粉", amount: 1, unit: "小さじ" }
    ]
  },
  {
    name: "鮭の塩焼き",
    source: "demo-seed",
    genre: ["和食"],
    prep_steps: ["鮭に軽く塩をふる", "大根おろしを用意する"],
    steps: ["鮭をグリルで焼く", "皮目が香ばしくなったら取り出す", "大根おろしを添える"],
    cook_count: 1,
    cooked_on_history: ["2026-05-31"],
    ingredients: [
      { item_type: "食材", name: "鮭", amount: 2, unit: "切れ" },
      { item_type: "食材", name: "大根", amount: 80, unit: "g" },
      { item_type: "調味料", name: "塩", amount: 1, unit: "少々" }
    ]
  },
  {
    name: "カレーライス",
    source: "demo-seed",
    genre: ["洋食"],
    prep_steps: ["肉と野菜を食べやすい大きさに切る"],
    steps: ["具材を炒める", "水を加えて煮込む", "カレールーを溶かしてとろみが出るまで煮る"],
    cook_count: 2,
    cooked_on_history: ["2026-05-29"],
    ingredients: [
      { item_type: "食材", name: "豚こま肉", amount: 200, unit: "g" },
      { item_type: "食材", name: "じゃがいも", amount: 2, unit: "個" },
      { item_type: "食材", name: "にんじん", amount: 1, unit: "本" },
      { item_type: "食材", name: "玉ねぎ", amount: 1, unit: "個" },
      { item_type: "調味料", name: "カレールー", amount: 4, unit: "皿分" }
    ]
  }
];

const inventorySeeds = [
  { category: "食材", name: "鶏もも肉", quantity: 1, unit: "枚", storage_location: "冷蔵", status_note: "デモ用" },
  { category: "食材", name: "じゃがいも", quantity: 4, unit: "個", storage_location: "常温", status_note: "デモ用" },
  { category: "食材", name: "にんじん", quantity: 3, unit: "本", storage_location: "冷蔵", status_note: "デモ用" },
  { category: "食材", name: "豆腐", quantity: 1, unit: "丁", storage_location: "冷蔵", status_note: "デモ用" },
  { category: "食材", name: "鮭", quantity: 2, unit: "切れ", storage_location: "冷凍", status_note: "デモ用" },
  { category: "調味料", name: "醤油", quantity: 1, unit: "本", storage_location: "常温", status_note: "デモ用" },
  { category: "調味料", name: "カレールー", quantity: 1, unit: "箱", storage_location: "常温", status_note: "デモ用" }
];

const user = await requestJson("/auth/v1/user");
if (!user?.id) {
  throw new Error("ログイン済みユーザーを確認できませんでした。SUPABASE_AUTH_TOKEN を確認してください。");
}

const existingRecipes = await requestJson(`/rest/v1/recipes?select=name&user_id=eq.${encodeURIComponent(user.id)}`);
const existingRecipeNames = new Set((existingRecipes ?? []).map((recipe) => recipe.name));
let recipeInsertCount = 0;
let ingredientInsertCount = 0;

for (const recipe of recipeSeeds) {
  if (existingRecipeNames.has(recipe.name)) {
    continue;
  }

  const insertedRecipes = await requestJson("/rest/v1/recipes?select=id,name", {
    method: "POST",
    body: JSON.stringify({
      user_id: user.id,
      name: recipe.name,
      source: recipe.source,
      genre: recipe.genre,
      prep_steps: recipe.prep_steps,
      steps: recipe.steps,
      cook_count: recipe.cook_count,
      cooked_on_history: recipe.cooked_on_history
    }),
    headers: { Prefer: "return=representation" }
  });
  const insertedRecipe = insertedRecipes?.[0];
  if (!insertedRecipe?.id) {
    throw new Error(`${recipe.name} の追加結果を確認できませんでした。`);
  }

  const ingredientRows = recipe.ingredients.map((ingredient, index) => ({
    ...ingredient,
    user_id: user.id,
    recipe_id: insertedRecipe.id,
    sort_order: index
  }));
  await requestJson("/rest/v1/recipe_ingredients", {
    method: "POST",
    body: JSON.stringify(ingredientRows)
  });

  recipeInsertCount += 1;
  ingredientInsertCount += ingredientRows.length;
}

const existingInventory = await requestJson(
  `/rest/v1/inventory_items?select=name,category&user_id=eq.${encodeURIComponent(user.id)}&source=eq.demo-seed`
);
const existingInventoryKeys = new Set((existingInventory ?? []).map((item) => `${item.category}:${item.name}`));
const inventoryRows = inventorySeeds
  .filter((item) => !existingInventoryKeys.has(`${item.category}:${item.name}`))
  .map((item) => ({
    ...item,
    user_id: user.id,
    source: "demo-seed"
  }));

if (inventoryRows.length > 0) {
  await requestJson("/rest/v1/inventory_items", {
    method: "POST",
    body: JSON.stringify(inventoryRows)
  });
}

writeLine(`Demo seed completed for user ${user.id}`);
writeLine(`recipes added: ${recipeInsertCount}`);
writeLine(`recipe ingredients added: ${ingredientInsertCount}`);
writeLine(`inventory items added: ${inventoryRows.length}`);

async function requestJson(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function writeLine(message) {
  process.stdout.write(`${message}\n`);
}
