# RAMBO OS — しゅん思考クローン統合システム

## 🎯 当日デモ用 v0.2（最終納品物）
**`rambo-os-v0.2.jsx`** が当日デモ用の本納品物です。
claude.ai の React Artifact として動作します（HTML / Vercel / ローカルサーバー不要）。

### 共有手順（先輩用）
1. `rambo-os-v0.2.jsx` の全文を claude.ai の新規チャットに貼り、「これをartifactで開いて」と指示
2. 生成された artifact の共有リンクをコピー
3. しゅんに LINE で送る → しゅんが iPhone Claude アプリでタップ → 即起動
4. **しゅんの Max プラン枠で API 実行 → 追加課金ゼロ**

## v0.2 構成（単一 .jsx ファイル）
| # | モジュール | 種別 | 役割 |
|---|---|---|---|
| 0 | 統合ダッシュボード | UI | 6事業カード + シナジーマップ（SVG） |
| 1 | FIRSTCLASS | Claude API | 物語型営業AI（4セクション JSON出力） |
| 2 | **絆商会** ★ | UI + Claude API | 鉄の証券会社（3パネル：相場 / AI査定 / 海外マッチング） |
| 3 | 旬鮮四季いろは | Claude API | 接待シナリオコーチ（席戦略 / 料理順 / 話題 / 退店時 / 翌日FU） |
| 4 | FUCARS | Claude API | 体験設計（映えスポット / ドリンク / 演出 / SNS投稿） |
| 5 | K&S | Claude API | 結果コミット診断（セッション数 / 食事 / スーツ / 未来予測） |
| 6 | 北関東総合企画 | 計算ロジック | 利回り計算機（表面/実質/エリアスコア/10年後資産） |

## 業界実証データ（一字一句正確に埋め込み済み）
- **EVERSTEEL**: 88%精度 / 東京製鉄宇都宮工場・朝日工業・トピー工業豊橋製造所
- **JETRO Japan Street**: 海外バイヤー 7,200人以上 / 登録企業 約11,300社（2026年5月時点）
- **関東鉄源協同組合**: 応札権商社 17社 / 月1.5-2万トン
- **日本鉄スクラップ主要輸出先**: 韓国・ベトナム・台湾・バングラデシュ
- **銅建値の世界基準**: LME（ロンドン金属取引所）リアルタイム連動

## デザインシステム
- カラー: Crimson #DC143C + Gold #d4af37 + Cream #f5f3ee + DarkBrown #1a1410
- フォント: Playfair Display / Manrope / Noto Serif JP（`<style>` 内で @import）
- グレイン、クリムゾン発光ライン、staggered fade-up、card hover (translateY + gold glow)

## artifact 制約準拠（v0.2 検証済み）
- ✅ localStorage / sessionStorage 一切不使用
- ✅ `<form>` タグ不使用（`<div>` + onClick）
- ✅ 外部画像URL不使用（SVG / gradient のみ）
- ✅ `max_tokens: 1000` 統一
- ✅ JSON.parse は try-catch でラップ、raw フォールバック
- ✅ API キー注入不要（artifact ランタイムが処理）
- ✅ iPhone Safari ズーム防止（input font-size: 16px 強制）
- ✅ タップ領域 44px 以上

---

## v0.1（HTML プロトタイプ・参考用）
初版は HTML 単一ファイル方式で実装したが、納品形態の方針転換により v0.2 を作成。
HTML 版の最新はリポジトリルートの `index.html`（起動診断 UI 付き・Vercel 公開版）に一本化。
旧コピー（`rambo-os.html` / この階層の `index.html`）は重複のため削除済み（git 履歴には残る）。

案件全体の現状・戦略・次アクションは **`../RAMBO案件_マスター.md`** を参照。
