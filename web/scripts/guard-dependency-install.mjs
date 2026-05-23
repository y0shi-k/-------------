const allowInstall = process.env.STOCK_MASTER_ALLOW_DEP_INSTALL === "1";
const isAutomation = process.env.CI === "true" || process.env.VERCEL === "1";
const userAgent = process.env.npm_config_user_agent || "";

const lines = [
  "Stock Master dependency install guard",
  "",
  "外部ライブラリのインストールは許可制です。",
  "実行前に .agents/rules/dependency-security.md を確認し、ユーザー許可とセキュリティ確認を残してください。",
  "",
  "続行する場合:",
  "  STOCK_MASTER_ALLOW_DEP_INSTALL=1 npm install",
  "  STOCK_MASTER_ALLOW_DEP_INSTALL=1 npm ci",
  "",
  `npm user agent: ${userAgent || "unknown"}`,
];

console.error(lines.join("\n"));

if (!allowInstall && !isAutomation) {
  console.error("");
  console.error("停止しました: STOCK_MASTER_ALLOW_DEP_INSTALL=1 が未設定です。");
  process.exit(1);
}

if (isAutomation && !allowInstall) {
  console.error("");
  console.error("CI/Vercel環境のため停止せず続行します。依存関係はlockfileで固定してください。");
}
